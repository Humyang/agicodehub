/**
 * POST /api/lead  —— 接收落地页（/service）的需求表单
 * GET  /api/lead?token=xxx&limit=50 —— 查看最近提交（需要 ADMIN_TOKEN）
 *
 * 存储优先级：D1（结构化、可查询、可导出）> KV（无 schema，兜底）
 * 两个绑定都在 Cloudflare Pages 项目的 Settings → Bindings 里配置。
 *
 * 部署方式：functions/ 放在项目根目录，`wrangler pages deploy dist` 会自动编译。
 * 详见 docs/leads-setup.md
 */

/* ---------- 最小类型声明 ----------
   不引 @cloudflare/workers-types，避免为本仓库增加依赖；
   这些结构只在本文件内使用，Cloudflare 构建时不会做类型检查。 */
interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: { changes?: number };
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}
interface KVNamespace {
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  get(key: string): Promise<string | null>;
  list(options?: {
    limit?: number;
    prefix?: string;
    cursor?: string;
  }): Promise<{ keys: { name: string }[]; cursor?: string; list_complete: boolean }>;
}
interface Env {
  /** D1 数据库绑定 */
  DB?: D1Database;
  /** KV 命名空间绑定（没配 D1 时兜底） */
  LEADS?: KVNamespace;
  /** 查看线索的口令（建议用 `wrangler pages secret put ADMIN_TOKEN` 设置） */
  ADMIN_TOKEN?: string;
  /** 可选：新线索推送到的 webhook（按域名自动识别渠道） */
  NOTIFY_WEBHOOK?: string;
  /** 可选：强制指定渠道 wecom / feishu / serverchan / pushplus / custom */
  NOTIFY_PROVIDER?: string;
  /** 可选：PushPlus 的 token（只有 pushplus 渠道需要） */
  NOTIFY_TOKEN?: string;
  /** 可选：设为任意非空值，推送内容里的联系方式打码，完整号码只留在 D1 */
  NOTIFY_MASK?: string;
  /** 可选：IP 哈希盐，不设则不加盐 */
  IP_SALT?: string;
}
interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string>;
  waitUntil(promise: Promise<unknown>): void;
}
type PagesFunction<E> = (context: EventContext<E>) => Response | Promise<Response>;

/* ---------- 工具 ---------- */
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** 字段清洗：只接受字符串，去首尾空白并截断，防止超长写入 */
function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

/** 定长比较，避免口令逐字符比对造成的时序差异 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface Lead {
  id: string;
  created_at: string;
  contact: string;
  system: string;
  client: string;
  engine: string;
  issue: string;
  page: string;
  country: string;
  ua: string;
  ip_hash: string;
}

/* ---------- 存储层 ---------- */
async function saveLead(env: Env, lead: Lead): Promise<void> {
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO leads (id, created_at, contact, system, client, engine, issue, page, country, ua, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        lead.id,
        lead.created_at,
        lead.contact,
        lead.system,
        lead.client,
        lead.engine,
        lead.issue,
        lead.page,
        lead.country,
        lead.ua,
        lead.ip_hash,
      )
      .run();
    return;
  }

  if (env.LEADS) {
    // 键名带时间戳，便于按时间排序取最近记录
    await env.LEADS.put(`lead:${lead.created_at}:${lead.id}`, JSON.stringify(lead));
    return;
  }

  throw new Error('no_binding');
}

/* ---------- 新线索通知 ----------
   按 webhook 域名自动识别推送渠道；也可用 NOTIFY_PROVIDER 强制指定。

   各渠道接收端差异：
     企业微信群机器人  qyapi.weixin.qq.com        需要企业微信 App 才能收
     Server酱          sctapi.ftqq.com / *.ft07.com  个人微信直接收（服务号推送）
     PushPlus          pushplus.plus              个人微信直接收（公众号推送，需 NOTIFY_TOKEN）
     飞书              open.feishu.cn             飞书 App
     其它              按通用格式发送（text/content/lead 三个字段都带上）
*/
type NotifyProvider = 'wecom' | 'feishu' | 'serverchan' | 'pushplus' | 'custom';

function detectProvider(url: string, override?: string): NotifyProvider {
  const forced = (override ?? '').trim().toLowerCase();
  if (forced === 'wecom' || forced === 'feishu' || forced === 'serverchan' || forced === 'pushplus' || forced === 'custom') {
    return forced;
  }
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return 'custom';
  }
  if (host === 'qyapi.weixin.qq.com') return 'wecom';
  if (host.endsWith('feishu.cn') || host.endsWith('larksuite.com')) return 'feishu';
  if (host.endsWith('ftqq.com') || host.endsWith('ft07.com')) return 'serverchan';
  if (host === 'pushplus.plus' || host.endsWith('.pushplus.plus')) return 'pushplus';
  return 'custom';
}

/** 通知里对联系方式打码，避免号码散落到第三方推送服务与聊天记录 */
function maskContactValue(v: string): string {
  const t = v.trim();
  if (t.length <= 4) return t;
  if (t.length <= 8) return `${t.slice(0, 2)}***`;
  return `${t.slice(0, 3)}***${t.slice(-2)}`;
}

/** 可选的即时通知：不阻塞响应，失败也不影响线索入库 */
async function notify(env: Env, lead: Lead): Promise<void> {
  const url = env.NOTIFY_WEBHOOK;
  if (!url) return;

  const provider = detectProvider(url, env.NOTIFY_PROVIDER);

  if (provider === 'pushplus' && !env.NOTIFY_TOKEN) {
    console.error('notify skipped: pushplus 需要同时设置 NOTIFY_TOKEN');
    return;
  }

  const contact = env.NOTIFY_MASK ? maskContactValue(lead.contact) : lead.contact;
  // 通用渠道会把整个 lead 一起发出去，打码时必须同步处理，否则号码仍会泄露
  const leadForPush = {
    id: lead.id,
    created_at: lead.created_at,
    contact,
    system: lead.system,
    client: lead.client,
    engine: lead.engine,
    issue: lead.issue,
    page: lead.page,
    country: lead.country,
  };
  const text = [
    '【新的安装需求】',
    `联系方式：${contact}`,
    `系统：${lead.system}`,
    `客户端：${lead.client || '未定'}`,
    `引擎：${lead.engine || '未定'}`,
    `卡点：${lead.issue || '（未填）'}`,
    `地区：${lead.country || '-'}`,
    `时间：${lead.created_at}`,
  ].join('\n');
  const title = `新的安装需求 · ${lead.system}`;

  let payload: unknown;
  let contentType = 'application/json';
  let bodyStr = '';

  switch (provider) {
    case 'wecom':
      payload = { msgtype: 'text', text: { content: text } };
      bodyStr = JSON.stringify(payload);
      break;
    case 'feishu':
      payload = { msg_type: 'text', content: { text } };
      bodyStr = JSON.stringify(payload);
      break;
    case 'serverchan':
      // Server酱官方示例用的是表单编码（-d title= -d desp=），这里跟着官方走。
      // desp 走 Markdown，单个换行会被吞掉，所以用双换行。
      contentType = 'application/x-www-form-urlencoded';
      bodyStr = new URLSearchParams({
        title,
        desp: text.replace(/\n/g, '\n\n'),
      }).toString();
      break;
    case 'pushplus':
      payload = { token: env.NOTIFY_TOKEN, title, content: text.replace(/\n/g, '<br/>'), template: 'html' };
      bodyStr = JSON.stringify(payload);
      break;
    default:
      // 自定义端点：常见字段都带上，另附结构化 lead（不含 ip_hash）
      payload = { title, text, content: text, msgtype: 'text', text_content: text, lead: leadForPush };
      bodyStr = JSON.stringify(payload);
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: bodyStr,
    });
    const raw = await res.text().catch(() => '');

    if (!res.ok) {
      // 必须把渠道返回的错误打出来：否则推送失败是完全静默的，很难发现
      console.error(`notify failed [${provider}] HTTP ${res.status}: ${raw.slice(0, 300)}`);
      return;
    }

    // 这几个渠道在失败时同样返回 HTTP 200，只是 body 里带错误码，
    // 所以不能只看 res.ok，还得按各家的成功码判断一次。
    // 注意 PushPlus 的成功码是 200 而不是 0，不能统一按 0 处理。
    let body: Record<string, unknown> | null = null;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return; // 非 JSON 响应，无从判断，按成功处理
    }
    if (!body || typeof body !== 'object') return;

    const pick = (k: string): number | null => {
      const v = body?.[k];
      return typeof v === 'number' ? v : null;
    };

    let okCode: number | null = null;
    let actual: number | null = null;
    switch (provider) {
      case 'wecom':
        okCode = 0;
        actual = pick('errcode');
        break;
      case 'feishu':
        okCode = 0;
        actual = pick('code');
        break;
      case 'serverchan':
        okCode = 0;
        actual = pick('code');
        break;
      case 'pushplus':
        okCode = 200;
        actual = pick('code');
        break;
      default:
        return; // 自定义端点不做假设
    }

    if (actual !== null && okCode !== null && actual !== okCode) {
      console.error(`notify rejected [${provider}] code=${actual}: ${raw.slice(0, 300)}`);
    }
  } catch (err) {
    console.error(`notify failed [${provider}]`, err);
  }
}

/* ---------- 简易限流 ----------
   优先用 D1 直接统计最近一分钟的提交数（不需要额外绑定）；
   没绑 D1 时才退到 KV 计数器。 */
const RATE_LIMIT_PER_MIN = 5;

async function rateLimited(env: Env, ipHash: string): Promise<boolean> {
  if (!ipHash) return false;

  if (env.DB) {
    const since = new Date(Date.now() - 60_000).toISOString();
    const row = await env.DB.prepare(
      'SELECT count(*) AS c FROM leads WHERE ip_hash = ? AND created_at > ?',
    )
      .bind(ipHash, since)
      .first<{ c: number }>();
    return (row?.c ?? 0) >= RATE_LIMIT_PER_MIN;
  }

  if (env.LEADS) {
    const bucket = Math.floor(Date.now() / 60_000);
    const key = `rl:${ipHash}:${bucket}`;
    const current = Number((await env.LEADS.get(key)) ?? '0');
    if (current >= RATE_LIMIT_PER_MIN) return true;
    await env.LEADS.put(key, String(current + 1), { expirationTtl: 120 });
    return false;
  }

  return false;
}

/* ---------- POST：接收表单 ---------- */
export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  // 同源校验：浏览器跨站提交会被挡掉，减少无脑刷接口
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: 'bad_origin' }, 403);
    } catch {
      return json({ ok: false, error: 'bad_origin' }, 403);
    }
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return json({ ok: false, error: 'bad_content_type' }, 415);

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return json({ ok: false, error: 'too_large' }, 413);
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'bad_json' }, 400);

  // 蜜罐：真人看不见这个字段，填了就当作机器人，静默丢弃
  if (clean(body._hp, 40)) return json({ ok: true, id: null });

  const contact = clean(body.contact, 120);
  const system = clean(body.system, 80);
  if (!contact) return json({ ok: false, error: 'contact_required' }, 422);
  if (contact.length < 3) return json({ ok: false, error: 'contact_too_short' }, 422);
  if (!system) return json({ ok: false, error: 'system_required' }, 422);

  if (!env.DB && !env.LEADS) {
    console.error('缺少 DB 或 LEADS 绑定，线索无法入库');
    return json({ ok: false, error: 'storage_not_configured' }, 500);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const ipHash = ip ? (await sha256Hex(`${ip}|${env.IP_SALT ?? ''}`)).slice(0, 32) : '';

  if (ipHash && (await rateLimited(env, ipHash))) {
    return json({ ok: false, error: 'too_many_requests' }, 429);
  }

  const lead: Lead = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    contact,
    system,
    client: clean(body.client, 60),
    engine: clean(body.engine, 60),
    issue: clean(body.issue, 2000),
    page: clean(body.page, 500),
    country: request.headers.get('cf-ipcountry') ?? '',
    ua: clean(request.headers.get('user-agent'), 200),
    ip_hash: ipHash,
  };

  try {
    await saveLead(env, lead);
  } catch (err) {
    console.error('save lead failed', err);
    const reason = err instanceof Error && err.message === 'no_binding' ? 'storage_not_configured' : 'save_failed';
    return json({ ok: false, error: reason }, 500);
  }

  waitUntil(notify(env, lead));

  return json({ ok: true, id: lead.id });
};

/* ---------- GET：查看线索（需要口令） ---------- */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = env.ADMIN_TOKEN;
  if (!token) {
    return json({ ok: false, error: 'admin_token_not_configured' }, 503);
  }
  const provided = new URL(request.url).searchParams.get('token') ?? '';
  if (!safeEqual(provided, token)) return json({ ok: false, error: 'unauthorized' }, 401);

  const limitRaw = Number(new URL(request.url).searchParams.get('limit') ?? '50');
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 50, 1), 200);

  if (env.DB) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM leads ORDER BY created_at DESC LIMIT ?',
    )
      .bind(limit)
      .all<Lead>();
    return json({ ok: true, storage: 'd1', count: results?.length ?? 0, leads: results ?? [] });
  }

  if (env.LEADS) {
    // KV 只能按前缀列举，取全部后按时间倒序截断
    const all: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await env.LEADS.list({ prefix: 'lead:', limit: 1000, cursor });
      all.push(...page.keys.map((k) => k.name));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    const latest = all.sort().reverse().slice(0, limit);
    const leads: Lead[] = [];
    for (const key of latest) {
      const value = await env.LEADS.get(key);
      if (value) leads.push(JSON.parse(value) as Lead);
    }
    return json({ ok: true, storage: 'kv', count: leads.length, leads });
  }

  return json({ ok: false, error: 'storage_not_configured' }, 500);
};

/* ---------- OPTIONS ----------
   注意：不要在这里导出 onRequest。Pages Functions 里 onRequest 会和
   onRequestPost / onRequestGet 争夺优先级，容易让 POST 误入兜底分支。 */
export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204 });
