<script setup lang="ts">
import { useHead } from '@vueuse/head';
import { computed, reactive, ref } from 'vue';

useHead({ title: 'REA 环境远程安装服务 - AGI Code Hub' });

/* ============================================================
   ★ 要改的内容，只改这里 ★
   ============================================================ */
const CONFIG = {
  // 联系方式：留空则不显示微信入口（页面不放二维码，靠表单收集需求）
  wxId: '',

  // 价格：留空 =「价格咨询」模式；填数字字符串（如 '199'）则显示 ¥199 / 次
  price: '',
  priceNote: '按系统与客户端复杂度报价 · 含完整交付流程 + 7 天环境答疑',

  supportDays: '7',
  maxMinutes: '90',
  responseTime: '10 分钟内',
  payMethod: '装通后付款。装不通全额退款。',
  brandDomain: 'agicodehub.com',

  /* ---- 表单提交（至少配一样，否则访客填了也收不到）----
     优先级：formEndpoint（自建）> formProvider（第三方）> contactEmail（邮件兜底）

     ① 最省事：web3forms.com 填邮箱拿 access_key（免费、无需注册）
        formProvider: 'web3forms', formKey: '你的 access_key'
     ② 或者 formspree.io 建表单拿 ID
        formProvider: 'formspree', formKey: 'xyzabcd'
     ③ 或者你自己的接口（收 POST JSON）
        formEndpoint: 'https://你的域名/api/lead'
     ④ 兜底：要求访客本机装了邮件客户端
        contactEmail: 'you@example.com'
  */
  formProvider: '',
  formKey: '',
  formEndpoint: '/api/lead',
  contactEmail: '',

  /* ---- 客户评价：只放真实评价。数组为空时整个区块自动隐藏 ----
     { q: '客户原话（可精简，别改意思）', who: '陈先生', tag: '接手老项目' }
  */
  reviews: [] as { q: string; who: string; tag?: string }[],
};

const hasWx = computed(() => !!CONFIG.wxId.trim());
const isConsult = computed(() => !String(CONFIG.price).trim());
const mbarPrice = computed(() => (isConsult.value ? '价格咨询' : `¥${CONFIG.price}`));
const reviews = computed(() => CONFIG.reviews);
const footContact = computed(() => {
  if (hasWx.value) return `微信：${CONFIG.wxId}`;
  if (CONFIG.contactEmail) return `邮箱：${CONFIG.contactEmail}`;
  return '联系方式见页面下方表单';
});

/* ---------- 页内锚点滚动（SPA 里不用 hash，避免污染路由） ---------- */
function go(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- 复制文本：带超时竞速，绝不阻塞主流程 ----------
   navigator.clipboard 在非 https / 无权限环境下可能既不 resolve 也不 reject，
   直接 await 会把提交流程卡死、按钮永远停在「提交中…」。
   这里封成「最多等 900ms 必定返回」。 */
function copyText(text: string, timeoutMs = 900): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (v: boolean) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    setTimeout(() => finish(false), timeoutMs);

    const legacy = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        finish(!!ok);
      } catch {
        finish(false);
      }
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => finish(true), legacy);
        return;
      }
    } catch {
      /* 落到兜底 */
    }
    legacy();
  });
}

/* ---------- 复制微信号 ---------- */
const wxCopied = ref(false);
async function copyWx() {
  const ok = await copyText(CONFIG.wxId);
  wxCopied.value = ok;
  setTimeout(() => (wxCopied.value = false), 2200);
}

/* ---------- 需求表单 ---------- */
const form = reactive({
  contact: '',
  system: '',
  client: '',
  engine: '',
  issue: '',
  _hp: '',
});
const errMsg = ref('');
const errField = ref<'' | 'contact' | 'system'>('');
const okMsg = ref('');
const okVisible = ref(false);
const submitting = ref(false);

const badClass = (f: 'contact' | 'system') => (errField.value === f ? 'bad' : '');

function clearErr() {
  errMsg.value = '';
  errField.value = '';
}

async function onSubmit() {
  clearErr();
  okVisible.value = false;

  // 蜜罐：机器人填了就静默丢弃，假装成功
  if (form._hp) {
    okVisible.value = true;
    okMsg.value = '已收到，我会尽快回复你。';
    return;
  }

  const contact = form.contact.trim();
  const system = form.system.trim();

  if (!contact) {
    errMsg.value = '请填写联系方式，否则我无法回复你。';
    errField.value = 'contact';
    return;
  }
  if (contact.length < 3) {
    errMsg.value = '联系方式看起来不完整，请再检查一下。';
    errField.value = 'contact';
    return;
  }
  if (!system) {
    errMsg.value = '请填写系统版本（例如 macOS 15 / Win 11）。';
    errField.value = 'system';
    return;
  }

  submitting.value = true;

  // 联系方式打码：屏幕上只显示打码版，完整号码只随请求发送 / 复制到剪贴板，
  // 避免手机号被旁人看到或截图外流。
  const maskContact = (v: string): string => {
    const t = v.trim();
    if (t.length <= 4) return t;
    if (t.length <= 8) return `${t.slice(0, 2)}***`;
    return `${t.slice(0, 3)}***${t.slice(-2)}`;
  };

  const buildSummary = (c: string): string =>
    [
      `系统：${system}`,
      `客户端：${form.client || '未定'}`,
      `引擎：${form.engine || '未定'}`,
      `联系方式：${c}`,
      `卡点：${form.issue || '（未填）'}`,
    ].join('\n');

  const summary = buildSummary(contact); // 发送给后端 / 复制到剪贴板：完整
  const summaryShown = buildSummary(maskContact(contact)); // 屏幕上展示：打码

  const provider = CONFIG.formProvider.trim().toLowerCase();
  let target = '';
  let payload: Record<string, string> | null = null;

  if (CONFIG.formEndpoint) {
    target = CONFIG.formEndpoint;
    payload = {
      contact,
      system,
      client: form.client,
      engine: form.engine,
      issue: form.issue,
      page: location.href,
      ts: new Date().toISOString(),
    };
  } else if (provider === 'web3forms' && CONFIG.formKey) {
    target = 'https://api.web3forms.com/submit';
    payload = {
      access_key: CONFIG.formKey,
      subject: `REA 安装需求 · ${system}`,
      from_name: 'AGI Code Hub',
      联系方式: contact,
      系统版本: system,
      'Agent 客户端': form.client || '未定',
      反编译引擎: form.engine || '未定',
      卡在哪一步: form.issue || '（未填）',
      来源页面: location.href,
    };
  } else if (provider === 'formspree' && CONFIG.formKey) {
    target = `https://formspree.io/f/${CONFIG.formKey}`;
    payload = {
      _subject: `REA 安装需求 · ${system}`,
      contact,
      system,
      client: form.client || '未定',
      engine: form.engine || '未定',
      issue: form.issue || '（未填）',
      page: location.href,
    };
  }

  let mode: 'endpoint' | 'endpoint-fail' | 'mail' | 'manual' = 'manual';

  if (target && payload) {
    try {
      const res = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      mode = res.ok ? 'endpoint' : 'endpoint-fail';
    } catch {
      mode = 'endpoint-fail';
    }
  }

  if ((mode === 'manual' || mode === 'endpoint-fail') && CONFIG.contactEmail) {
    const body = `${summary}\n页面：${location.href}`;
    location.href =
      `mailto:${CONFIG.contactEmail}` +
      `?subject=${encodeURIComponent(`REA 安装需求 - ${system}`)}` +
      `&body=${encodeURIComponent(body)}`;
    mode = 'mail';
  }

  let copied = false;
  if (mode === 'manual') {
    copied = await copyText(summary);
  }

  submitting.value = false;
  okVisible.value = true;

  if (mode === 'endpoint') {
    okMsg.value = `✅ 需求已提交，我会在 ${CONFIG.responseTime}回复你并给出报价。`;
  } else if (mode === 'endpoint-fail') {
    okMsg.value = `⚠️ 提交没成功（网络或接口问题）。请把下面的内容发到 ${
      CONFIG.contactEmail || '页面上的联系方式'
    }，或稍后重试。`;
  } else if (mode === 'mail') {
    okMsg.value = `✅ 已打开你的邮件客户端，点发送即可。没弹出的话，手动发到 ${CONFIG.contactEmail}。`;
  } else {
    okMsg.value = `✅ 需求内容${copied ? '已复制到剪贴板' : '如下'}，请发送到 ${
      CONFIG.contactEmail || CONFIG.wxId || '页面联系方式'
    }，我会尽快回复报价。`;
  }

  // 回落提示里展示打码版，避免号码直接打在屏幕上
  if (mode === 'endpoint-fail' || mode === 'manual') {
    okMsg.value += `\n${summaryShown}`;
  }
  // 表单重置，但保留提示
  form.contact = '';
  form.system = '';
  form.client = '';
  form.engine = '';
  form.issue = '';
  form._hp = '';
}
</script>

<template>
  <div class="lp">
    <!-- ========== 顶部导航 ========== -->
    <header class="lp-nav">
      <div class="lp-wrap lp-nav__in">
        <a class="lp-brand" href="/">
          <span class="lp-brand__mark">A</span>
          <span>
            AGI Code Hub
            <span class="lp-brand__sub">REA 环境搭建服务</span>
          </span>
        </a>
        <nav class="lp-nav__links">
          <a @click.prevent="go('pain')">你卡在哪</a>
          <a @click.prevent="go('service')">服务内容</a>
          <a @click.prevent="go('price')">价格保障</a>
          <a @click.prevent="go('faq')">常见问题</a>
        </nav>
        <a class="lp-nav__cta" @click.prevent="go('order')">填写需求 →</a>
      </div>
    </header>

    <!-- ========== Hero ========== -->
    <section class="lp-hero">
      <div class="lp-wrap lp-hero__grid">
        <div>
          <span class="lp-eyebrow lp-eyebrow--dark">🔧 远程一对一 · 装不通全额退款</span>
          <h1>
            你在 AGI Code Hub 用工具很快，<br />
            <span class="lp-hl">可 REA 的环境，三天都没装起来？</span>
          </h1>
          <p class="lp-hero__lead">
            Node 版本、环境变量、MCP 注册、反编译引擎对接……<b>一个不对就全链路断</b>。
            远程一对一，<b>20-40 分钟装到能跑</b>，当着你的面拿真实目标出结果，并教你怎么提问、怎么看证据。
          </p>
          <div class="lp-hero__cta">
            <a class="lp-btn lp-btn--primary lp-btn--lg" @click.prevent="go('order')">填写需求，获取报价 →</a>
            <a class="lp-btn lp-btn--ghost lp-btn--lg" @click.prevent="go('service')">先看装什么</a>
          </div>
          <div class="lp-trust">
            <span><i>✓</i> 装不通全额退款</span>
            <span><i>✓</i> 20-40 分钟交付</span>
            <span><i>✓</i> 一对一远程协助</span>
            <span><i>✓</i> 交付后 <b>{{ CONFIG.supportDays }}</b> 天答疑</span>
          </div>
        </div>

        <div class="lp-term" aria-hidden="true">
          <div class="lp-term__bar">
            <span class="lp-term__dot" /><span class="lp-term__dot" /><span class="lp-term__dot" />
            <span class="lp-term__title">装好之后 · 你看到的画面</span>
          </div>
          <div class="lp-term__body">
<span class="c-dim">$</span> <span class="c-cmd">npx rea-agents setup</span>
<span class="c-dim">· 注册 MCP 服务器 ............</span> <span class="c-ok">done</span>
<span class="c-dim">· 安装工作流指令 (skill) ......</span> <span class="c-ok">done</span>
<span class="c-dim">· 备份现有配置文件 ...........</span> <span class="c-ok">done</span>

<span class="c-dim">$</span> <span class="c-cmd">agent --mcp rea</span>
<span class="c-key">→ rea.search_strings</span>  <span class="c-dim">命中 3 处字符串引用</span>
<span class="c-key">→ rea.get_xrefs</span>       <span class="c-dim">定位调用方 · 追溯调用链</span>
<span class="c-key">→ rea.decompile</span>       <span class="c-dim">产出伪代码 + 地址</span>
<span class="c-key">→ rea.report</span>          <span class="c-ok">带证据的结论，可回放</span>

<span class="c-dim">引擎：Ghidra / Hopper / IDA · 状态</span> <span class="c-ok">READY</span><span class="lp-term__cursor" />
          </div>
          <div class="lp-term__foot">✓ 环境已就绪，可以开始分析了</div>
        </div>
      </div>
    </section>

    <!-- ========== 信任条 ========== -->
    <div class="lp-wrap">
      <div class="lp-stats">
        <div class="lp-stat">
          <div class="lp-stat__n">20-40<em> 分钟</em></div>
          <div class="lp-stat__l">一次远程交付</div>
        </div>
        <div class="lp-stat">
          <div class="lp-stat__n">6 <em>步</em></div>
          <div class="lp-stat__l">从零到能跑通</div>
        </div>
        <div class="lp-stat">
          <div class="lp-stat__n">1 <em>对 1</em></div>
          <div class="lp-stat__l">远程屏幕协助</div>
        </div>
        <div class="lp-stat">
          <div class="lp-stat__n">全退</div>
          <div class="lp-stat__l">装不通不收钱</div>
        </div>
      </div>
    </div>

    <!-- ========== 痛点 ========== -->
    <section id="pain" class="lp-sec">
      <div class="lp-wrap">
        <div class="lp-center lp-mb34">
          <span class="lp-eyebrow">😵 不是你不行，是这东西压根没打算给新手用</span>
          <h2 class="lp-h2">你大概率卡在这 6 步里的某一处</h2>
          <p class="lp-sub">工具用得再熟，这一步照样卡人。看看中了几条。</p>
        </div>
        <div class="lp-grid3">
          <div class="lp-pain">
            <div class="lp-pain__i">1</div>
            <div>
              <div class="lp-pain__t">教程第一句就是「先确认 Node.js 版本」</div>
              <div class="lp-pain__d">你连 Node.js 是什么、版本怎么查都不知道，第一步就停住了。</div>
            </div>
          </div>
          <div class="lp-pain">
            <div class="lp-pain__i">2</div>
            <div>
              <div class="lp-pain__t">命令行跳出一屏红色报错</div>
              <div class="lp-pain__d">看不懂就算了，更麻烦的是不知道怎么搜——关键词都提取不出来。</div>
            </div>
          </div>
          <div class="lp-pain">
            <div class="lp-pain__i">3</div>
            <div>
              <div class="lp-pain__t">MCP、Bridge、Provider、PATH 一堆新词</div>
              <div class="lp-pain__d">每个词都要单独查，查完还是串不起来，不知道哪个环节在起作用。</div>
            </div>
          </div>
          <div class="lp-pain">
            <div class="lp-pain__i">4</div>
            <div>
              <div class="lp-pain__t">MCP 注册上了，Agent 里却找不到工具</div>
              <div class="lp-pain__d">配置看起来没错，但客户端就是调不到 REA，报错还互不相同。</div>
            </div>
          </div>
          <div class="lp-pain">
            <div class="lp-pain__i">5</div>
            <div>
              <div class="lp-pain__t">Ghidra / Hopper / IDA 还要各自装一遍</div>
              <div class="lp-pain__d">单独安装、单独授权、单独配路径，其中任何一个不对，全链路就断。</div>
            </div>
          </div>
          <div class="lp-pain">
            <div class="lp-pain__i">6</div>
            <div>
              <div class="lp-pain__t">面对一堆配置文件，没人能帮你看一眼</div>
              <div class="lp-pain__d">不知道哪一行错了，也没人能确认到底配对没有，只能反复试。</div>
            </div>
          </div>
        </div>
        <div class="lp-center lp-mt36">
          <p class="lp-punch">
            三天过去了。教程翻了几十遍，截图存了一屏幕——<span class="lp-red">REA 一次都没真正跑起来。</span>
          </p>
        </div>
      </div>
    </section>

    <!-- ========== 对比 ========== -->
    <section class="lp-sec lp-surface">
      <div class="lp-wrap">
        <div class="lp-center lp-mb34">
          <span class="lp-eyebrow">🧮 先算一笔账</span>
          <h2 class="lp-h2">你花的那两三个晚上，值多少钱？</h2>
          <p class="lp-sub">把时间成本折算一下，这笔账不用我多说。</p>
        </div>
        <div class="lp-cmp">
          <div class="lp-cmp__col lp-cmp__col--bad">
            <div class="lp-cmp__hd">🙃 自己折腾 <span class="lp-cmp__badge">路线 A</span></div>
            <div class="lp-cmp__row"><i>✕</i><span>时间：保守 2-3 个晚上</span></div>
            <div class="lp-cmp__row"><i>✕</i><span>结果：还不一定成</span></div>
            <div class="lp-cmp__row"><i>✕</i><span>过程：环境装乱、旧配置被覆盖</span></div>
            <div class="lp-cmp__row"><i>✕</i><span>心情：兴奋 → 烦躁 → 自我怀疑 → 关掉页面</span></div>
            <div class="lp-cmp__row"><i>✕</i><span>求助：论坛发帖没人回，报错也没人能看</span></div>
            <div class="lp-cmp__concl">三天后可能还是：装不上</div>
          </div>
          <div class="lp-cmp__col lp-cmp__col--good">
            <div class="lp-cmp__hd">✅ 远程帮你装 <span class="lp-cmp__badge">路线 B</span></div>
            <div class="lp-cmp__row"><i>✓</i><span>时间：一次远程，平均 20-40 分钟</span></div>
            <div class="lp-cmp__row"><i>✓</i><span>结果：亲眼看到跑通，真实目标出结果</span></div>
            <div class="lp-cmp__row"><i>✓</i><span>过程：改动前备份，装错当场回滚</span></div>
            <div class="lp-cmp__row"><i>✓</i><span>心情：一次搞定，剩下时间用来干活</span></div>
            <div class="lp-cmp__row"><i>✓</i><span>求助：我知道每一步为什么这么配，报错当场解</span></div>
            <div class="lp-cmp__concl">一次到位：环境就绪 + 会用 + 有人问</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 服务内容 ========== -->
    <section id="service" class="lp-sec">
      <div class="lp-wrap">
        <div class="lp-center lp-mb34">
          <span class="lp-eyebrow">🛠 服务内容</span>
          <h2 class="lp-h2">不是甩个安装包就走，是从零到能跑通</h2>
          <p class="lp-sub">下面是完整交付流程，每一步都当着你面做。</p>
        </div>
        <div class="lp-steps">
          <div class="lp-step">
            <div class="lp-step__n">01</div>
            <div>
              <div class="lp-step__t">环境体检与安装</div>
              <div class="lp-step__d">
                Node.js、包管理器、命令行环境，按你的系统（Windows / macOS）一步步装好，<b>该装什么版本就装什么版本，不留坑</b>。
              </div>
            </div>
          </div>
          <div class="lp-step">
            <div class="lp-step__n">02</div>
            <div>
              <div class="lp-step__t">REA 本体与 MCP 注册 <span class="lp-step__tag">核心</span></div>
              <div class="lp-step__d">
                把 REA 装到位、注册 MCP 服务器、安装工作流指令，<b>并备份你原有的配置文件——不动你已有的东西</b>。
              </div>
            </div>
          </div>
          <div class="lp-step">
            <div class="lp-step__n">03</div>
            <div>
              <div class="lp-step__t">Agent 客户端打通</div>
              <div class="lp-step__d">
                Claude Code / Codex / Cursor / Gemini CLI 之类，<b>你习惯用哪个就用哪个</b>，把 REA 接进你已有的工作流，确认能真实调用。
              </div>
            </div>
          </div>
          <div class="lp-step">
            <div class="lp-step__n">04</div>
            <div>
              <div class="lp-step__t">反编译引擎对接</div>
              <div class="lp-step__d">
                按你的需要配 Ghidra / Hopper / IDA 里的一个，<b>路径、启动参数、超时全部调通</b>。
              </div>
            </div>
          </div>
          <div class="lp-step">
            <div class="lp-step__n">05</div>
            <div>
              <div class="lp-step__t">实测跑通 + 教你用 <span class="lp-step__tag">当面验证</span></div>
              <div class="lp-step__d">
                拿一个真实目标跑一遍完整链路：搜索 → 追调用 → 反编译 → 出带证据的结论。<b>当着你的面跑，不是口头说「装好了」</b>。
              </div>
            </div>
          </div>
          <div class="lp-step">
            <div class="lp-step__n">06</div>
            <div>
              <div class="lp-step__t">基础用法讲解 + 交付清单</div>
              <div class="lp-step__d">
                教你怎么提问、怎么看证据、常见的坑在哪，交付一份简版操作清单。<b>目的是让你以后自己会用，不是我每次都来</b>。
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 适合谁 ========== -->
    <section class="lp-sec lp-surface">
      <div class="lp-wrap">
        <div class="lp-center lp-mb34">
          <span class="lp-eyebrow">🎯 先说清楚</span>
          <h2 class="lp-h2">我不做「谁来都接」的生意</h2>
          <p class="lp-sub">把适合和不适合的分开讲明白，省得浪费彼此时间。</p>
        </div>
        <div class="lp-grid2">
          <div class="lp-fit lp-fit--yes">
            <div class="lp-fit__hd"><span class="lp-dot">✓</span>适合你，如果你</div>
            <ul>
              <li>有明确的分析需求：接手的老项目、要搞懂的协议、想学习的二进制分析</li>
              <li>时间紧，不想把晚上花在折腾环境上</li>
              <li>完全不懂命令行，或者懂一点但卡在 MCP 这一层</li>
              <li>愿意在远程时看着，愿意学一点基本用法</li>
            </ul>
          </div>
          <div class="lp-fit lp-fit--no">
            <div class="lp-fit__hd"><span class="lp-dot">✕</span>别找我，如果你</div>
            <ul>
              <li>想让我帮你破解软件、去 DRM、扒别人家的商业产品 —— 这我不做，也别问</li>
              <li>只想白嫖一份配置文件（这个网上有，自己搜更快）</li>
              <li>连一台能装环境的电脑都腾不出来</li>
              <li>希望装完就能自动分析任何目标，不需要自己判断和动手</li>
            </ul>
          </div>
        </div>
        <div class="lp-redline">
          <b>红线说明：</b>我只提供<b>环境安装、配置打通与基础使用教学</b>。分析什么目标、用来做什么，由你自行判断并负责。
          REA 官方也明确要求：仅用于合法研究、教育、互操作性与软件保存，分析你自己拥有或被授权检查的软件。这条红线我会在服务开始前讲清楚，你认可了再付费。
        </div>
      </div>
    </section>

    <!-- ========== 价格 ========== -->
    <section id="price" class="lp-sec">
      <div class="lp-wrap">
        <div class="lp-center lp-mb38">
          <span class="lp-eyebrow">💰 价格与保障</span>
          <h2 class="lp-h2">按你的实际环境报价，装到能跑通为止</h2>
          <p class="lp-sub">填一份需求，我给出明确报价和时长；能做的才接，做不了直接说。</p>
        </div>
        <div class="lp-price-wrap">
          <div class="lp-price-card">
            <span class="lp-price-card__tag">装不通 · 全额退款</span>
            <div class="lp-price-card__label">远程一对一安装服务</div>
            <div class="lp-price-card__amt" :class="{ 'is-ask': isConsult }">
              <template v-if="isConsult">
                <span class="lp-price-card__ask">
                  价格咨询
                  <small>填需求 → 我回复报价</small>
                </span>
              </template>
              <template v-else>
                <span class="cur">¥</span><span class="num">{{ CONFIG.price }}</span><span class="unit">/ 次</span>
              </template>
            </div>
            <div class="lp-price-card__note">{{ CONFIG.priceNote }}</div>
            <ul class="lp-price-card__list">
              <li>环境体检与安装（Node.js 等）</li>
              <li>REA 本体 + MCP 服务器注册</li>
              <li>Agent 客户端打通（Claude Code / Codex / Cursor 等）</li>
              <li>反编译引擎对接（Ghidra / Hopper / IDA 任选其一）</li>
              <li>真实目标实测跑通</li>
              <li>基础用法讲解 + 简版操作清单</li>
              <li>交付后 {{ CONFIG.supportDays }} 天环境类问题免费答疑</li>
            </ul>
            <a class="lp-btn lp-btn--primary lp-btn--block lp-btn--lg" @click.prevent="go('order')">填写需求，获取报价</a>
            <div class="lp-guarantee">
              <div class="lp-guarantee__i">✓</div>
              <div>
                <div class="lp-guarantee__t">装不通，全额退款</div>
                <div class="lp-guarantee__d">约定时间内没装到能跑通，全额退款。不解释、不扯皮、不问原因。</div>
              </div>
            </div>
          </div>

          <div>
            <ul class="lp-price-side">
              <li><span class="k">报价方式</span><span>按<b>系统类型、客户端数量、引擎数量</b>报价；单引擎单客户端是基础价</span></li>
              <li><span class="k">交付方式</span><span>腾讯会议 / 微信语音<b>远程屏幕协助</b>，你全程能看着</span></li>
              <li><span class="k">服务时长</span><span>一般 <b>20-40 分钟</b>；多引擎 + 多客户端的复杂环境最长 <b>{{ CONFIG.maxMinutes }}</b> 分钟</span></li>
              <li><span class="k">响应时间</span><span>提交需求后 <b>{{ CONFIG.responseTime }}</b>回复报价，当天可约（视档期）</span></li>
              <li><span class="k">付款方式</span><span>{{ CONFIG.payMethod }}</span></li>
              <li><span class="k">不包含</span><span>软件破解、DRM 绕过、他人商业产品的功能提取</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 证据 ========== -->
    <section class="lp-sec lp-surface">
      <div class="lp-wrap">
        <div class="lp-center lp-mb34">
          <span class="lp-eyebrow">📊 为什么值得装</span>
          <h2 class="lp-h2">这套工具链已经跑出过什么结果</h2>
          <p class="lp-sub">以下为 REA 官方与社区公开案例数据。</p>
        </div>
        <div class="lp-proof">
          <div class="lp-proof__c">
            <div class="lp-proof__k">3205 / 3205</div>
            <div class="lp-proof__t">1996 年老游戏声音算法字节级还原</div>
            <div class="lp-proof__d">
              从 x86 二进制里恢复左右声道定位函数，用 C 重写后跑通全部 3205 个原始测试用例，63 个编译字节与原版完全一致。
            </div>
            <div class="lp-proof__src">来源：REA 官方 showcase（DX-Ball）</div>
          </div>
          <div class="lp-proof__c">
            <div class="lp-proof__k">99% / 83%</div>
            <div class="lp-proof__t">十几个 Agent 并行还原商业射击游戏</div>
            <div class="lp-proof__d">
              99% 的函数被还原为 C++，其中 83% 编译后与原程序逐字节一致，证明了 Agent 并行逆向的可行性。
            </div>
            <div class="lp-proof__src">来源：Hex-Rays 官方 MCP 社区案例</div>
          </div>
          <div class="lp-proof__c">
            <div class="lp-proof__k">&lt; 12 小时</div>
            <div class="lp-proof__t">普通开发者搞定自家设备</div>
            <div class="lp-proof__d">
              社区开发者不到 12 小时逆向自家家居 IoT 软件实现电脑控制；也有开发者逆向自家电视、体脂秤并开源面板。
            </div>
            <div class="lp-proof__src">来源：社区公开案例（YuriRDev / greco / BrOrlandi）</div>
          </div>
        </div>

        <!-- 客户评价：reviews 为空时整块不渲染 -->
        <div v-if="reviews.length" class="lp-reviews-block">
          <div class="lp-reviews-head">客户怎么说 <span class="n">{{ reviews.length }} 条</span></div>
          <div class="lp-reviews">
            <div v-for="(r, i) in reviews" :key="i" class="lp-review">
              <div class="lp-review__q">{{ r.q }}</div>
              <div class="lp-review__who">
                <b>{{ r.who }}</b><template v-if="r.tag"> · {{ r.tag }}</template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== FAQ ========== -->
    <section id="faq" class="lp-sec">
      <div class="lp-wrap">
        <div class="lp-center lp-mb34">
          <span class="lp-eyebrow">❓ 常见问题</span>
          <h2 class="lp-h2">下单前，你大概会担心这几件事</h2>
        </div>
        <div class="lp-faq">
          <details class="lp-qa" open>
            <summary><span class="q">Q</span><span>远程安装会不会装坏我的电脑？</span><span class="arw">▾</span></summary>
            <div class="lp-qa__body">
              不会。每一步都当面做、当面讲，改动前先备份配置文件，装错当场回滚。全程你能看到我在做什么，不是黑箱操作。
            </div>
          </details>
          <details class="lp-qa">
            <summary><span class="q">Q</span><span>我电脑基础很差，全程需要自己操作吗？</span><span class="arw">▾</span></summary>
            <div class="lp-qa__body">
              不需要。我远程协助你，你看着就行。过程中我会解释在做什么、为什么这么配，你想学就学，不想学也可以纯交付。
            </div>
          </details>
          <details class="lp-qa">
            <summary><span class="q">Q</span><span>远程之后我的电脑文件会被看到吗？</span><span class="arw">▾</span></summary>
            <div class="lp-qa__body">
              不会。只在协助会话内、只处理装 REA 相关的事，不翻你其它文件，不装任何与本次服务无关的东西。会话结束后你可以随时改密码、撤销任何授权。
            </div>
          </details>
          <details class="lp-qa">
            <summary><span class="q">Q</span><span>装完我真的会用吗？</span><span class="arw">▾</span></summary>
            <div class="lp-qa__body">
              会。我会用真实目标带你跑一遍完整流程（搜索 → 追调用 → 反编译 → 出结论），并交付一份简版操作清单。看不懂随时问，交付后 {{ CONFIG.supportDays }} 天内环境类问题免费答疑。
            </div>
          </details>
          <details class="lp-qa">
            <summary><span class="q">Q</span><span>能不能顺便帮我破解某个软件？</span><span class="arw">▾</span></summary>
            <div class="lp-qa__body">
              不能，也不做。<b>我只提供环境安装、配置打通与基础使用教学</b>。破解、去 DRM、提取他人商业产品功能不在服务范围。REA 官方也明确要求仅用于合法研究、教育、互操作性与软件保存，分析你自己拥有或被授权检查的软件。
            </div>
          </details>
          <details class="lp-qa">
            <summary><span class="q">Q</span><span>装不通真的全额退款吗？怎么操作？</span><span class="arw">▾</span></summary>
            <div class="lp-qa__body">
              是。约定时间内没装到能跑通，全额退款，不解释、不扯皮、不问原因。另外默认是<b>装通后付款</b>，所以你实际上基本不会走到退款这一步。
            </div>
          </details>
          <details class="lp-qa">
            <summary><span class="q">Q</span><span>我的系统比较特殊 / 想配两个引擎，可以吗？</span><span class="arw">▾</span></summary>
            <div class="lp-qa__body">
              可以。Windows 和 macOS 都支持。多引擎（Ghidra + Hopper）或多客户端的情况需要更长时长，<b>在表单里选上对应选项说明一下</b>，我确认能做再接单；做不了的会直接告诉你，不接转手单。
            </div>
          </details>
        </div>
      </div>
    </section>

    <!-- ========== 最终 CTA / 需求表单 ========== -->
    <section id="order" class="lp-sec lp-cta">
      <div class="lp-wrap lp-cta__grid">
        <div>
          <span class="lp-eyebrow lp-eyebrow--dark">🚀 填写需求 · 获取报价</span>
          <h2 class="lp-cta__h2">如果你已经卡了两天以上，<br />别硬扛了。</h2>
          <p class="lp-cta__p">配置环境这件事，有经验和没经验，差的是三天和一小时。</p>
          <ul class="lp-cta__list">
            <li><i>①</i><span>填右侧表单：系统版本 / 卡在哪一步 / 用哪个 Agent 客户端 / 怎么联系你</span></li>
            <li><i>②</i><span>我 <b>{{ CONFIG.responseTime }}</b>回你：能不能做、报价多少、需要多久</span></li>
            <li><i>③</i><span>能做的约时间，<b>20-40 分钟</b>装到跑通，当面验证，然后教你怎么用</span></li>
            <li><i>④</i><span>装不通不收钱。你没有任何风险。</span></li>
          </ul>
        </div>

        <div class="lp-card-cta">
          <div class="lp-card-cta__hd">填写安装需求</div>
          <div class="lp-card-cta__sub">填完提交，我按你的实际情况给你明确报价</div>

          <form class="lp-form" novalidate @submit.prevent="onSubmit">
            <div class="lp-form__row">
              <div>
                <label for="f-contact">联系方式 <span class="req">*</span></label>
                <input
                  id="f-contact"
                  v-model="form.contact"
                  :class="badClass('contact')"
                  name="contact"
                  type="text"
                  placeholder="微信号 / 手机号 / 邮箱"
                  autocomplete="off"
                  @input="clearErr"
                />
              </div>
              <div>
                <label for="f-system">系统版本 <span class="req">*</span></label>
                <input
                  id="f-system"
                  v-model="form.system"
                  :class="badClass('system')"
                  name="system"
                  type="text"
                  placeholder="macOS 15 / Win 11"
                  autocomplete="off"
                  @input="clearErr"
                />
              </div>
            </div>
            <div class="lp-form__row">
              <div>
                <label for="f-client">Agent 客户端</label>
                <select id="f-client" v-model="form.client" name="client">
                  <option value="">还没定 / 请选择</option>
                  <option value="Claude Code">Claude Code</option>
                  <option value="Codex">Codex</option>
                  <option value="Cursor">Cursor</option>
                  <option value="Gemini CLI">Gemini CLI</option>
                  <option value="其他客户端">其他客户端</option>
                </select>
              </div>
              <div>
                <label for="f-engine">反编译引擎</label>
                <select id="f-engine" v-model="form.engine" name="engine">
                  <option value="">还没定 / 请选择</option>
                  <option value="Ghidra">Ghidra</option>
                  <option value="Hopper">Hopper</option>
                  <option value="IDA">IDA</option>
                  <option value="需要多个引擎">需要多个引擎</option>
                </select>
              </div>
            </div>
            <div class="lp-form__row lp-form__row--1">
              <div>
                <label for="f-issue">现在卡在哪一步</label>
                <textarea
                  id="f-issue"
                  v-model="form.issue"
                  name="issue"
                  placeholder="有报错就贴一下；不确定就写「装不上」，我远程看"
                />
              </div>
            </div>
            <input
              v-model="form._hp"
              type="text"
              name="_hp"
              tabindex="-1"
              autocomplete="off"
              aria-hidden="true"
              class="lp-hp"
            />
            <button class="lp-btn lp-btn--primary lp-btn--block lp-btn--lg" type="submit" :disabled="submitting">
              {{ submitting ? '提交中…' : '提交需求，获取报价' }}
            </button>
            <div v-if="errMsg" class="lp-form__err">{{ errMsg }}</div>
            <div v-if="okVisible" class="lp-form__ok">{{ okMsg }}</div>
            <div class="lp-form__note">只用于本次服务沟通，不会用于其他用途，也不会泄露给第三方。</div>
          </form>

          <!-- 微信兜底入口：wxId 为空则自动隐藏 -->
          <div v-if="hasWx" class="lp-wxid">
            <span class="lp-wxid__k">或加微信</span>
            <span class="lp-wxid__v">{{ CONFIG.wxId }}</span>
            <button class="lp-wxid__btn" :class="{ done: wxCopied }" type="button" @click="copyWx">
              {{ wxCopied ? '已复制 ✓' : '复制' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 页脚 ========== -->
    <footer class="lp-foot">
      <div class="lp-wrap">
        <div class="lp-foot__row">
          <div>REA 环境服务 · <span>{{ CONFIG.brandDomain }}</span></div>
          <div>{{ footContact }}</div>
        </div>
        <div class="lp-foot__note">
          <b>免责声明：</b>本站仅提供软件环境的安装、配置与基础使用教学服务，不提供任何形式的软件破解、激活绕过、DRM 规避服务，也不对使用者后续的分析目标与用途承担责任。
          REA（Reverse Engineer Anything）为第三方开源项目，本站与其作者无隶属或代理关系。请仅将相关工具用于合法研究、教育、互操作性与软件保存，并确保你拥有或已获授权检查所分析的目标。
        </div>
        <div class="lp-foot__note">
          AGI Code Hub 基于开源项目 it-tools（GPLv3）构建，源代码遵循同一许可。
          <a href="/">返回工具箱首页 →</a>
        </div>
      </div>
    </footer>

    <!-- ========== 移动端固定 CTA ========== -->
    <div class="lp-mbar">
      <div class="lp-mbar__in">
        <div class="lp-mbar__price">
          <b>{{ mbarPrice }}</b>
          <span>装不通全额退款</span>
        </div>
        <a class="lp-btn lp-btn--primary" @click.prevent="go('order')">填写需求</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   落地页样式：全部自包含，不依赖 naive-ui / unocss 主题，
   避免站点切换深色主题时把这块内容弄成不可读。
   ============================================================ */
.lp {
  --lp-accent: #07c160;
  --lp-accent-dark: #059669;
  --lp-accent-soft: #eafaf1;
  --lp-text: #161a23;
  --lp-text2: #4a5262;
  --lp-muted: #7c859a;
  --lp-line: #e6e9f0;
  --lp-surface: #f7f9fc;
  --lp-red: #e5484d;
  --lp-radius: 16px;
  --lp-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 24, 40, 0.06);
  --lp-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  background: #fff;
  color: var(--lp-text);
  font-size: 15px;
  line-height: 1.7;
  min-height: 100vh;
}

.lp-wrap { max-width: 1120px; margin: 0 auto; padding: 0 20px; }
.lp-center { text-align: center; }
.lp-mb34 { margin-bottom: 34px; }
.lp-mb38 { margin-bottom: 38px; }
.lp-mt36 { margin-top: 36px; }
.lp-red { color: var(--lp-red); }
.lp-hl { color: #8ff0bb; }

/* ---------- 顶部导航 ---------- */
.lp-nav {
  position: sticky; top: 0; z-index: 40;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--lp-line);
}
.lp-nav__in { display: flex; align-items: center; gap: 22px; height: 62px; }
.lp-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; color: var(--lp-text); text-decoration: none; }
.lp-brand__mark {
  width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
  background: var(--lp-accent); color: #04180d; font-size: 15px; font-weight: 900; flex: 0 0 auto;
}
.lp-brand__sub { display: block; color: var(--lp-muted); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; }
.lp-nav__links { display: flex; gap: 20px; margin-left: auto; }
.lp-nav__links a { color: var(--lp-text2); font-size: 14px; font-weight: 600; cursor: pointer; }
.lp-nav__links a:hover { color: var(--lp-accent-dark); }
.lp-nav__cta {
  padding: 8px 15px; border-radius: 9px; background: var(--lp-accent); color: #04180d;
  font-size: 13.5px; font-weight: 800; cursor: pointer; white-space: nowrap;
}
.lp-nav__cta:hover { background: var(--lp-accent-dark); color: #fff; }

/* ---------- 通用按钮 ---------- */
.lp-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 12px 24px; border-radius: 11px; font-weight: 800; font-size: 15px;
  cursor: pointer; border: 1px solid transparent; text-decoration: none;
  transition: transform 0.16s, background 0.16s, box-shadow 0.16s;
}
.lp-btn--primary { background: var(--lp-accent); color: #04180d; box-shadow: 0 8px 20px rgba(7, 193, 96, 0.3); }
.lp-btn--primary:hover { background: var(--lp-accent-dark); color: #fff; transform: translateY(-1px); }
.lp-btn--ghost { background: transparent; color: #cfe9dc; border-color: rgba(255, 255, 255, 0.25); }
.lp-btn--ghost:hover { border-color: rgba(255, 255, 255, 0.5); background: rgba(255, 255, 255, 0.06); }
.lp-btn--lg { padding: 14px 28px; font-size: 15.5px; }
.lp-btn--block { width: 100%; }
.lp-btn:disabled { opacity: 0.6; cursor: default; transform: none; }

/* ---------- Hero ---------- */
.lp-hero {
  color: #fff;
  padding: 58px 0 64px;
  background:
    radial-gradient(820px 420px at 78% 0%, rgba(7, 193, 96, 0.22), transparent 62%),
    linear-gradient(168deg, #0a1024, #0b1226 55%, #080d1c);
}
.lp-hero__grid { display: grid; grid-template-columns: 1.08fr 0.92fr; gap: 46px; align-items: center; }
.lp-eyebrow {
  display: inline-block; padding: 6px 13px; border-radius: 999px;
  background: var(--lp-accent-soft); color: var(--lp-accent-dark);
  font-size: 12.5px; font-weight: 800;
}
.lp-eyebrow--dark { background: rgba(7, 193, 96, 0.16); color: #8ff0bb; }
.lp-hero h1 { margin: 18px 0 16px; font-size: 38px; line-height: 1.28; font-weight: 900; letter-spacing: -0.02em; }
.lp-hero__lead { color: #b9c2d6; font-size: 16px; line-height: 1.8; }
.lp-hero__lead b { color: #fff; }
.lp-hero__cta { display: flex; flex-wrap: wrap; gap: 12px; margin: 26px 0 20px; }
.lp-trust { display: flex; flex-wrap: wrap; gap: 8px 18px; color: #9aa4bb; font-size: 13px; }
.lp-trust i { color: var(--lp-accent); font-style: normal; font-weight: 900; margin-right: 4px; }
.lp-trust b { color: #8ff0bb; }

/* 终端演示 */
.lp-term {
  border-radius: 14px; overflow: hidden;
  background: #0c1322; border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}
.lp-term__bar {
  display: flex; align-items: center; gap: 6px; padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.lp-term__dot { width: 9px; height: 9px; border-radius: 50%; background: #3a4152; }
.lp-term__title { margin-left: 8px; color: #6f7a90; font-size: 11.5px; font-weight: 700; }
.lp-term__body {
  padding: 16px; font-family: var(--lp-mono); font-size: 12.2px; line-height: 1.85;
  color: #c3cad9; white-space: pre-wrap; word-break: break-word;
}
.lp-term__foot {
  padding: 10px 16px; background: rgba(7, 193, 96, 0.1);
  border-top: 1px solid rgba(7, 193, 96, 0.22); color: #8ff0bb; font-size: 12px; font-weight: 700;
}
.lp-term__cursor {
  display: inline-block; width: 7px; height: 13px; margin-left: 3px;
  background: var(--lp-accent); vertical-align: -2px; animation: lp-blink 1.1s steps(2) infinite;
}
@keyframes lp-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
.c-dim { color: #6f7a90; }
.c-cmd { color: #fff; font-weight: 700; }
.c-ok { color: var(--lp-accent); font-weight: 700; }
.c-key { color: #7cc4ff; }

/* ---------- 信任条 ---------- */
.lp-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
  margin: -30px 0 0; padding: 22px 20px; position: relative; z-index: 2;
  background: #fff; border: 1px solid var(--lp-line); border-radius: var(--lp-radius);
  box-shadow: var(--lp-shadow);
}
.lp-stat { text-align: center; }
.lp-stat__n { font-size: 24px; font-weight: 900; color: var(--lp-text); letter-spacing: -0.02em; }
.lp-stat__n em { font-style: normal; font-size: 13px; color: var(--lp-muted); font-weight: 700; }
.lp-stat__l { color: var(--lp-muted); font-size: 12.5px; margin-top: 2px; }

/* ---------- 区块通用 ---------- */
.lp-sec { padding: 74px 0; }
.lp-surface { background: var(--lp-surface); }
.lp-h2 { font-size: 29px; font-weight: 900; margin: 12px 0 10px; letter-spacing: -0.02em; line-height: 1.32; }
.lp-sub { color: var(--lp-muted); font-size: 15px; }
.lp-punch { font-weight: 800; color: var(--lp-text); font-size: 17.5px; }

/* ---------- 痛点 ---------- */
.lp-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.lp-pain {
  display: flex; gap: 13px; padding: 20px;
  background: #fff; border: 1px solid var(--lp-line); border-radius: var(--lp-radius);
  box-shadow: var(--lp-shadow);
}
.lp-pain__i {
  flex: 0 0 26px; width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center;
  background: #fff1f1; color: var(--lp-red); font-size: 12.5px; font-weight: 900;
}
.lp-pain__t { font-weight: 800; font-size: 15px; margin-bottom: 5px; }
.lp-pain__d { color: var(--lp-muted); font-size: 13.4px; line-height: 1.7; }

/* ---------- 对比 ---------- */
.lp-cmp { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.lp-cmp__col { padding: 22px; border-radius: var(--lp-radius); border: 1px solid var(--lp-line); background: #fff; }
.lp-cmp__col--bad { border-color: #f2d5d5; background: #fffafa; }
.lp-cmp__col--good { border-color: #c9eedb; background: #f5fdf9; }
.lp-cmp__hd { font-weight: 900; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.lp-cmp__badge {
  padding: 2px 8px; border-radius: 6px; background: #eef1f6; color: var(--lp-muted);
  font-size: 11px; font-weight: 800;
}
.lp-cmp__row { display: flex; gap: 9px; padding: 7px 0; font-size: 14px; color: var(--lp-text2); line-height: 1.65; }
.lp-cmp__row i { font-style: normal; font-weight: 900; flex: 0 0 auto; }
.lp-cmp__col--bad .lp-cmp__row i { color: var(--lp-red); }
.lp-cmp__col--good .lp-cmp__row i { color: var(--lp-accent-dark); }
.lp-cmp__concl {
  margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--lp-line);
  font-weight: 800; font-size: 14px;
}
.lp-cmp__col--bad .lp-cmp__concl { color: var(--lp-red); }
.lp-cmp__col--good .lp-cmp__concl { color: var(--lp-accent-dark); }

/* ---------- 服务步骤 ---------- */
.lp-steps { display: grid; gap: 12px; }
.lp-step {
  display: flex; gap: 16px; padding: 20px 22px;
  background: #fff; border: 1px solid var(--lp-line); border-radius: var(--lp-radius);
  box-shadow: var(--lp-shadow);
}
.lp-step__n {
  flex: 0 0 44px; font-family: var(--lp-mono); font-size: 20px; font-weight: 900;
  color: #cfd6e4; letter-spacing: -0.02em; line-height: 1.2;
}
.lp-step__t { font-weight: 800; font-size: 15.5px; margin-bottom: 5px; }
.lp-step__tag {
  padding: 2px 8px; border-radius: 6px; background: var(--lp-accent-soft);
  color: var(--lp-accent-dark); font-size: 11px; font-weight: 800; vertical-align: 2px;
}
.lp-step__d { color: var(--lp-muted); font-size: 14px; line-height: 1.75; }
.lp-step__d b { color: var(--lp-text); }

/* ---------- 适合谁 ---------- */
.lp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.lp-fit { padding: 22px; border-radius: var(--lp-radius); border: 1px solid var(--lp-line); background: #fff; }
.lp-fit--yes { border-color: #c9eedb; background: #f5fdf9; }
.lp-fit--no { border-color: #f2d5d5; background: #fffafa; }
.lp-fit__hd { font-weight: 900; font-size: 15.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.lp-dot {
  width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
  font-size: 12px; font-weight: 900; flex: 0 0 auto;
}
.lp-fit--yes .lp-dot { background: var(--lp-accent); color: #04180d; }
.lp-fit--no .lp-dot { background: var(--lp-red); color: #fff; }
.lp-fit ul { margin: 0; padding-left: 0; list-style: none; }
.lp-fit li { position: relative; padding: 6px 0 6px 18px; color: var(--lp-text2); font-size: 14px; line-height: 1.7; }
.lp-fit li::before { content: "·"; position: absolute; left: 4px; font-weight: 900; color: var(--lp-muted); }
.lp-redline {
  margin-top: 18px; padding: 16px 18px; border-radius: 12px;
  background: #fff8f0; border: 1px solid #f5e0c8; color: #8a5a2b;
  font-size: 13.6px; line-height: 1.8;
}
.lp-redline b { color: #b3261e; }

/* ---------- 价格 ---------- */
.lp-price-wrap { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 28px; align-items: start; }
.lp-price-card {
  position: relative; padding: 30px 26px; text-align: center;
  background: #fff; border: 1px solid var(--lp-line); border-radius: 20px; box-shadow: var(--lp-shadow);
}
.lp-price-card__tag {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  padding: 5px 14px; border-radius: 999px; background: #fff1f1; color: var(--lp-red);
  font-size: 12px; font-weight: 900; white-space: nowrap; border: 1px solid #f7d3d3;
}
.lp-price-card__label { color: var(--lp-muted); font-size: 13.5px; font-weight: 700; }
.lp-price-card__amt { display: flex; align-items: baseline; justify-content: center; gap: 4px; margin: 12px 0 6px; }
.lp-price-card__amt .cur { font-size: 22px; font-weight: 800; color: var(--lp-text2); }
.lp-price-card__amt .num { font-size: 56px; font-weight: 900; letter-spacing: -0.03em; line-height: 1; }
.lp-price-card__amt .unit { color: var(--lp-muted); font-size: 14.5px; font-weight: 700; }
.lp-price-card__amt.is-ask { display: block; margin: 16px 0 10px; }
.lp-price-card__ask {
  display: inline-flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 12px 26px; border-radius: 14px;
  background: var(--lp-accent-soft); color: var(--lp-accent-dark);
  font-size: 30px; font-weight: 900; line-height: 1.2;
}
.lp-price-card__ask small { font-size: 12.5px; font-weight: 700; color: #5c9b7c; }
.lp-price-card__note { color: var(--lp-muted); font-size: 13px; margin-bottom: 22px; }
.lp-price-card__list {
  text-align: left; margin: 0 0 22px; padding: 18px 0 0; list-style: none;
  border-top: 1px dashed var(--lp-line);
}
.lp-price-card__list li { position: relative; padding: 7px 0 7px 25px; font-size: 14.2px; color: var(--lp-text2); }
.lp-price-card__list li::before { content: "✓"; position: absolute; left: 3px; color: var(--lp-accent); font-weight: 900; }
.lp-guarantee {
  display: flex; align-items: center; gap: 11px; margin-top: 16px; padding: 14px 16px;
  background: #fff5f5; border: 1px solid #f7d3d3; border-radius: 11px; text-align: left;
}
.lp-guarantee__i {
  flex: 0 0 34px; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
  background: #fde8e8; color: var(--lp-red); font-size: 17px; font-weight: 900;
}
.lp-guarantee__t { font-weight: 800; font-size: 14.5px; color: #b3261e; }
.lp-guarantee__d { color: #8a5a58; font-size: 12.8px; line-height: 1.6; }
.lp-price-side { margin: 0; padding: 0; list-style: none; }
.lp-price-side li {
  display: flex; gap: 11px; padding: 13px 0;
  border-top: 1px solid var(--lp-line); font-size: 14.6px; color: var(--lp-text2);
}
.lp-price-side li:first-child { border-top: 0; }
.lp-price-side .k { flex: 0 0 76px; color: var(--lp-muted); font-size: 13.6px; font-weight: 700; }
.lp-price-side li b { color: var(--lp-text); font-weight: 800; }

/* ---------- 证据 ---------- */
.lp-proof { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.lp-proof__c {
  padding: 22px; background: #fff; border: 1px solid var(--lp-line);
  border-radius: var(--lp-radius); box-shadow: var(--lp-shadow);
}
.lp-proof__k { font-family: var(--lp-mono); font-size: 25px; font-weight: 900; color: var(--lp-accent-dark); letter-spacing: -0.02em; }
.lp-proof__t { font-weight: 800; font-size: 14.6px; margin: 8px 0 6px; }
.lp-proof__d { color: var(--lp-muted); font-size: 13.4px; line-height: 1.72; }
.lp-proof__src {
  margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--lp-line);
  color: #9aa1ae; font-size: 11.8px;
}

/* ---------- 评价 ---------- */
.lp-reviews-block { margin-top: 34px; }
.lp-reviews-head { font-size: 15.6px; font-weight: 900; margin-bottom: 14px; display: flex; align-items: center; gap: 9px; }
.lp-reviews-head .n {
  padding: 2px 9px; border-radius: 6px; background: var(--lp-accent-soft);
  color: var(--lp-accent-dark); font-size: 11.5px; font-weight: 800;
}
.lp-reviews { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.lp-review {
  padding: 20px; background: #fff; border: 1px solid var(--lp-line);
  border-radius: var(--lp-radius); box-shadow: var(--lp-shadow);
  display: flex; flex-direction: column;
}
.lp-review__q { color: var(--lp-text2); font-size: 14px; line-height: 1.8; flex: 1; }
.lp-review__who {
  margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--lp-line);
  color: var(--lp-muted); font-size: 12.6px; font-weight: 700;
}
.lp-review__who b { color: var(--lp-text); font-weight: 800; }

/* ---------- FAQ ---------- */
.lp-faq { max-width: 820px; margin: 0 auto; }
.lp-qa {
  border: 1px solid var(--lp-line); border-radius: var(--lp-radius);
  background: #fff; margin-bottom: 11px; overflow: hidden; box-shadow: var(--lp-shadow);
}
.lp-qa[open] { border-color: #cdeedb; box-shadow: 0 8px 24px rgba(7, 193, 96, 0.1); }
.lp-qa summary {
  display: flex; align-items: center; gap: 12px; padding: 17px 20px;
  cursor: pointer; list-style: none; font-weight: 800; font-size: 15.4px;
}
.lp-qa summary::-webkit-details-marker { display: none; }
.lp-qa summary .q {
  flex: 0 0 26px; width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center;
  background: var(--lp-accent-soft); color: var(--lp-accent-dark); font-size: 12.5px; font-weight: 900;
}
.lp-qa summary .arw { margin-left: auto; color: var(--lp-muted); font-size: 13px; transition: transform 0.2s; }
.lp-qa[open] summary .arw { transform: rotate(180deg); }
.lp-qa__body { padding: 0 20px 19px 58px; color: var(--lp-text2); font-size: 14.4px; line-height: 1.82; }

/* ---------- 最终 CTA ---------- */
.lp-cta {
  position: relative; color: #fff;
  background:
    radial-gradient(760px 400px at 72% 0%, rgba(7, 193, 96, 0.22), transparent 62%),
    linear-gradient(168deg, #0a1024, #0b1226 55%, #080d1c);
}
.lp-cta__grid { display: grid; grid-template-columns: 1fr 0.95fr; gap: 40px; align-items: start; }
.lp-cta__h2 { font-size: 30px; font-weight: 900; margin: 16px 0 12px; line-height: 1.34; letter-spacing: -0.02em; }
.lp-cta__p { color: #b9c2d6; font-size: 15.5px; }
.lp-cta__list { list-style: none; margin: 22px 0 0; padding: 0; }
.lp-cta__list li { display: flex; gap: 10px; padding: 9px 0; color: #d3d9e6; font-size: 14.8px; }
.lp-cta__list i { color: var(--lp-accent); font-style: normal; font-weight: 900; flex: 0 0 auto; }
.lp-cta__list b { color: #8ff0bb; }

.lp-card-cta {
  padding: 28px 26px; background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.13); border-radius: 20px;
  backdrop-filter: blur(10px); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}
.lp-card-cta__hd { font-size: 17.5px; font-weight: 900; margin-bottom: 6px; }
.lp-card-cta__sub { color: #9aa4bb; font-size: 13.2px; margin-bottom: 20px; }

.lp-form { text-align: left; }
.lp-form__row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.lp-form__row--1 { grid-template-columns: 1fr; }
.lp-form label { display: block; margin-bottom: 6px; color: #9aa4bb; font-size: 12.6px; font-weight: 700; }
.lp-form label .req { color: #ff8b8b; margin-left: 3px; }
.lp-form input,
.lp-form select,
.lp-form textarea {
  width: 100%; padding: 12px 13px; color: #fff; background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 9px;
  font-size: 14px; font-family: inherit; outline: none; transition: 0.16s;
}
.lp-form input::placeholder,
.lp-form textarea::placeholder { color: #7f89a0; }
.lp-form input:focus,
.lp-form select:focus,
.lp-form textarea:focus { border-color: var(--lp-accent); background: rgba(7, 193, 96, 0.08); }
.lp-form select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #8b95ab 50%),
    linear-gradient(135deg, #8b95ab 50%, transparent 50%);
  background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
}
.lp-form select option { color: #161a23; }
.lp-form textarea { min-height: 82px; resize: vertical; }
.lp-form .lp-btn { margin-top: 14px; }
.lp-form input.bad,
.lp-form select.bad { border-color: #ff8b8b; background: rgba(239, 68, 68, 0.1); }
.lp-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.lp-form__err {
  margin-top: 10px; padding: 10px 13px; border-radius: 9px;
  background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(239, 68, 68, 0.4);
  color: #ffc9c9; font-size: 13px;
}
.lp-form__ok {
  margin-top: 14px; padding: 15px 17px; border-radius: 10px; white-space: pre-wrap;
  background: rgba(7, 193, 96, 0.14); border: 1px solid rgba(7, 193, 96, 0.36);
  color: #c9f7dd; font-size: 13.8px; line-height: 1.8; word-break: break-word;
}
.lp-form__note { margin-top: 12px; color: #7f89a0; font-size: 12px; line-height: 1.7; }

.lp-wxid {
  display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 11px 14px;
  background: rgba(255, 255, 255, 0.07); border: 1px dashed rgba(255, 255, 255, 0.22); border-radius: 10px;
}
.lp-wxid__k { color: #9aa4bb; font-size: 12.5px; flex: 0 0 auto; }
.lp-wxid__v {
  font-family: var(--lp-mono); font-weight: 800; font-size: 14.5px; color: #8ff0bb;
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.lp-wxid__btn {
  padding: 5px 11px; border-radius: 7px; background: rgba(255, 255, 255, 0.13);
  color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; flex: 0 0 auto; border: 0;
}
.lp-wxid__btn:hover { background: rgba(255, 255, 255, 0.24); }
.lp-wxid__btn.done { background: var(--lp-accent); color: #04180d; }

/* ---------- 页脚 ---------- */
.lp-foot { background: #080d1c; color: #8b95ab; font-size: 13px; padding: 34px 0 90px; }
.lp-foot__row { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; justify-content: space-between; }
.lp-foot__note {
  margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.09);
  font-size: 12.2px; line-height: 1.8; color: #6f788c; max-width: 820px;
}
.lp-foot__note b { color: #b8c0d4; }
.lp-foot__note a { color: #8ff0bb; text-decoration: none; }
.lp-foot__note a:hover { text-decoration: underline; }

/* ---------- 移动端固定 CTA ---------- */
.lp-mbar {
  display: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 70;
  background: rgba(255, 255, 255, 0.97); backdrop-filter: blur(12px);
  border-top: 1px solid var(--lp-line); box-shadow: 0 -6px 20px rgba(16, 24, 40, 0.08);
}
.lp-mbar__in { display: flex; align-items: center; gap: 12px; padding: 10px 16px; }
.lp-mbar__price { flex: 0 0 auto; line-height: 1.25; }
.lp-mbar__price b { display: block; font-size: 17px; font-weight: 900; color: var(--lp-text); }
.lp-mbar__price span { font-size: 11.5px; color: var(--lp-muted); }
.lp-mbar .lp-btn { flex: 1; }

/* ---------- 响应式 ---------- */
@media (max-width: 1000px) {
  .lp-hero__grid { grid-template-columns: 1fr; gap: 34px; }
  .lp-hero h1 { font-size: 31px; }
  .lp-price-wrap { grid-template-columns: 1fr; gap: 24px; }
  .lp-cta__grid { grid-template-columns: 1fr; gap: 30px; }
  .lp-grid3 { grid-template-columns: 1fr 1fr; }
  .lp-proof { grid-template-columns: 1fr; }
  .lp-reviews { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  .lp-nav__links { display: none; }
  .lp-sec { padding: 52px 0; }
  .lp-hero { padding: 40px 0 52px; }
  .lp-hero h1 { font-size: 26px; }
  .lp-hero__lead { font-size: 15px; }
  .lp-h2 { font-size: 23px; }
  .lp-cta__h2 { font-size: 24px; }
  .lp-stats { grid-template-columns: 1fr 1fr; gap: 16px; margin-top: -20px; }
  .lp-grid3 { grid-template-columns: 1fr; }
  .lp-grid2 { grid-template-columns: 1fr; }
  .lp-cmp { grid-template-columns: 1fr; }
  .lp-form__row { grid-template-columns: 1fr; }
  .lp-mbar { display: block; }
  .lp-foot { padding-bottom: 96px; }
  .lp-hero__cta .lp-btn { width: 100%; }
  .lp-price-card { padding: 26px 20px; }
  .lp-term__body { font-size: 11.2px; }
}
</style>
