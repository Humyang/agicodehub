# 落地页线索收集：Cloudflare Pages Function + D1

`/service` 页面的需求表单提交到 `POST /api/lead`，由 Pages Function 写入 D1（没配 D1 时自动退到 KV）。
数据存在**你自己的 Cloudflare 账号**下，不经过任何第三方。

```
浏览器表单  →  POST /api/lead  →  functions/api/lead.ts  →  D1（表 leads）
                                        ↓ 可选
                                    NOTIFY_WEBHOOK（企业微信 / 飞书 / Server酱）
```

## 一、为什么是 `functions/` 这个位置

`wrangler pages deploy`（本项目用 `scripts/deploy-cloudflare.sh`）**没有** `--functions-dir` 参数，它按约定读取**项目根目录**的 `functions/` 并自动编译。

所以文件位置不能改：

```
functions/api/lead.ts   →   路由 /api/lead
```

`functions/` 不会被 Vite 构建影响，也不会影响 `dist/` 产物。

> 已实测：`/api/lead` 不会被 `public/_redirects` 里的 `/* → /index.html 200` 通配规则吃掉。
> Pages 的路由优先级是 **Functions > _redirects > 静态资源**，POST 会正确进入 Function。

## 二、五步接上

### 1. 建 D1 数据库

```bash
wrangler d1 create agicodehub-leads
```

输出里有一行 `database_id = "xxxxxxxx-xxxx-..."`，记下来。

### 2. 建表

用脚本（**推荐**，在任何目录下执行都不会因相对路径出错）：

```bash
./scripts/apply-d1-schema.sh           # 线上
./scripts/apply-d1-schema.sh --local   # 本地调试
```

或者直接用 wrangler，但**必须在项目根目录执行**：

```bash
cd /path/to/it-tools-src          # 关键：--file 是相对路径
wrangler d1 execute agicodehub-leads --remote --file=db/schema.sql
```

在工作目录外执行会报 `Unable to read SQL text file "db/schema.sql"`——不是文件不存在，是相对路径找不到。也可以改用绝对路径：

```bash
wrangler d1 execute agicodehub-leads --remote \
  --file=/绝对路径/it-tools-src/db/schema.sql
```

建完确认一下：

```bash
wrangler d1 execute agicodehub-leads --remote \
  --command "SELECT name FROM sqlite_master WHERE type IN ('table','index')"
# 应能看到 leads / idx_leads_created_at / idx_leads_contact
```

**`--remote` 会直接改线上库**，执行期间该库短暂不可查询，属于正常现象。

### 3. 绑定到 Pages 项目

两种方式，选一种。

**方式 A：用 wrangler.toml（已配好，推荐）**

仓库根目录的 `wrangler.toml` **已经填好了真实的 `database_id`**，直接部署即可：

```bash
./scripts/deploy-cloudflare.sh
```

绑定会随部署生效。当前 `database_id` 是：

```
d966be66-154f-4d4b-94cc-55d9d0c98a19
```

换库或换账号时，用 `wrangler d1 list` 查新 ID，替换 `wrangler.toml` 里那一行就行。

**方式 B：在 Cloudflare 后台点**

Pages → `agicodehub` → Settings → Functions → Bindings → 添加：

| 类型 | 变量名（必须一致） | 值 |
| --- | --- | --- |
| D1 database | `DB` | `agicodehub-leads` |

变量名写错等于没绑，函数会返回 `storage_not_configured`。

### 4. 设置查看口令

```bash
wrangler pages secret put ADMIN_TOKEN --project-name agicodehub
```

随便输一串足够长的随机字符。用于后面查线索，**不要写进前端代码**。

### 5.（可选）即时通知

想要"有人填表就弹条消息"，设一个 webhook 即可。**详细步骤和渠道对比见本文第十节。**

```bash
wrangler pages secret put NOTIFY_WEBHOOK --project-name agicodehub
```

> **KV 是可选的**，不配也能完整使用：存储走 D1，限流也用 D1 统计。
> 只有在「不绑 D1、想用 KV 当唯一存储」时才需要它。

## 三、验证是否真的通了

部署后：

```bash
# 1. 提交一条
curl -X POST https://agicodehub.pages.dev/api/lead \
  -H "Content-Type: application/json" \
  -d '{"contact":"wx_smoke_test","system":"macOS 15","issue":"自测"}'
# 期望：{"ok":true,"id":"...."}

# 2. 读回来
curl "https://agicodehub.pages.dev/api/lead?token=你的ADMIN_TOKEN"
# 期望：{"ok":true,"storage":"d1","count":1,"leads":[...]}
```

如果第 1 步返回的是一大段 HTML（而不是 JSON），说明请求被页面兜底规则接走了——检查 `functions/api/lead.ts` 是否在项目根目录、以及部署时是否在根目录执行 wrangler。

## 四、看线索

### 通过接口（最快）

```bash
curl "https://agicodehub.pages.dev/api/lead?token=你的ADMIN_TOKEN&limit=50"
```

### 通过 D1 直接查（要导出时用这个）

```bash
# 最近 20 条
wrangler d1 execute agicodehub-leads --remote \
  --command "SELECT created_at, contact, system, client, engine, issue FROM leads ORDER BY created_at DESC LIMIT 20"

# 导出 CSV
wrangler d1 execute agicodehub-leads --remote --json \
  --command "SELECT * FROM leads ORDER BY created_at DESC" > leads.json

# 查某个联系方式的历史提交
wrangler d1 execute agicodehub-leads --remote \
  --command "SELECT * FROM leads WHERE contact = 'wx_xxx'"
```

## 五、存了哪些字段

| 字段 | 含义 | 来源 |
| --- | --- | --- |
| `id` | UUID | 服务端生成 |
| `created_at` | 服务端收到时间（UTC） | 服务端，**不信任客户端时间** |
| `contact` | 微信号 / 手机号 / 邮箱 | 客户填写，必填 |
| `system` | 系统版本 | 客户填写，必填 |
| `client` | Agent 客户端 | 客户选择 |
| `engine` | 反编译引擎 | 客户选择 |
| `issue` | 卡在哪一步 | 客户填写，截断 2000 字 |
| `page` | 来源页面 URL | 前端带上 |
| `country` | 国家/地区 | Cloudflare 请求头 |
| `ua` | User-Agent，截断 200 字 | 请求头 |
| `ip_hash` | IP 的 SHA-256 前 32 位 | 服务端计算 |

**关于隐私**：不存原始 IP，只存加盐哈希（盐由 `IP_SALT` 决定，没设则不加盐）。
哈希只用于限流和去重，无法反查。建议设一下：

```bash
wrangler pages secret put IP_SALT --project-name agicodehub
```

**不要存储客户没同意的额外信息。** 表单里已经写明"只用于本次服务沟通"，别拿去做别的。

## 六、服务端做了哪些防护

都实测过：

| 场景 | 行为 |
| --- | --- |
| 跨站 Origin 提交 | `403 bad_origin`（同源校验） |
| `Content-Type` 不是 JSON | `415 bad_content_type` |
| 报文超过 8KB | `413 too_large` |
| 蜜罐字段 `_hp` 被填 | 返回成功但**不入库**（静默丢弃机器人） |
| 缺联系方式 | `422 contact_required` |
| 同一 IP 每分钟超过 5 次 | `429 too_many_requests`（用 D1 统计，不需要 KV） |
| 没配 D1/KV | `500 storage_not_configured` |
| 字段超长 | 服务端截断，不会写爆 |

前端也有同样的校验，但那只是体验优化；**服务端的校验才是真正的防线**，因为请求可以绕过前端直接发。

## 七、排错对照表

| 现象 | 原因 |
| --- | --- |
| `Unable to read SQL text file "db/schema.sql"` | 工作目录不是项目根目录（`--file` 是相对路径）。用 `./scripts/apply-d1-schema.sh` 或改绝对路径 |
| 表单显示"✅ 需求已提交"但库里没有 | 绑定变量名不是 `DB` / `LEADS`，函数返回了 500，前端把非 2xx 当成……（见下） |
| 返回 `storage_not_configured` | 没绑 D1 也没绑 KV，或变量名写错 |
| 返回 `unauthorized` | `ADMIN_TOKEN` 没设，或 token 传错 |
| 返回 `admin_token_not_configured` | 没执行第 4 步 |
| 所有请求都返回 `bad_origin` | 用了自定义域名但 Origin 与请求 host 不一致（正常应一致，检查反代配置） |
| 提交后拿到一大段 HTML | `/api/lead` 没被 Functions 接住，检查 `functions/` 是否在项目根目录 |
| 429 太多 | 限流是每 IP 每分钟 5 次，正常用户不会碰到 |

> 前端在拿到非 2xx 时会显示 ⚠️ 提示并把内容展示给访客，不会假装成功。

## 八、免费额度够不够

- **Pages Functions**：免费 10 万次请求/天
- **D1**：免费 500 万次读/天、10 万次写/天、5GB 存储
- **KV**：免费 10 万次读/天、1000 次写/天（**不配也能正常用**，只在不绑 D1 时兜底）

每天几十个线索的量，离限额非常远。

## 九、常用运维

```bash
# 看最近的函数日志（部署后实时排查）
wrangler pages deployment tail --project-name agicodehub

# 删掉某条测试数据
wrangler d1 execute agicodehub-leads --remote \
  --command "DELETE FROM leads WHERE contact = 'wx_smoke_test'"

# 统计每天线索量
wrangler d1 execute agicodehub-leads --remote \
  --command "SELECT substr(created_at,1,10) d, count(*) c FROM leads GROUP BY d ORDER BY d DESC"
```

## 十、推送到微信

`functions/api/lead.ts` 会按 webhook 的**域名自动识别**渠道并生成对应报文，不需要你改代码。

### 先搞清楚：哪个渠道能在「个人微信」里收到

这一点最容易踩坑——企业微信和飞书都要装各自的 App，个人微信是收不到的。

| 渠道 | 消息落在哪 | 个人微信能直接收 | 免费额度 | 配置 |
| --- | --- | --- | --- | --- |
| **PushPlus** | 公众号推送 | ✅ 能 | 200 条/天 | 较简单（要 token） |
| **Server酱** | 服务号推送 | ✅ 能 | 有限（够用） | 最简单（一个 URL） |
| 企业微信群机器人 | 企业微信群 | ❌ 需装企业微信 App | 无限 | 简单 |
| 飞书自定义机器人 | 飞书群 | ❌ 需装飞书 | 无限 | 简单 |

只想在手机上用微信收通知 → 选 **Server酱** 或 **PushPlus**。

### A. Server酱（最省事，一个 URL 搞定）

1. 打开 <https://sct.ftqq.com>，微信扫码登录
2. 复制页面上的 **SendKey**
3. 设置 webhook（把你的 SendKey 填进去）：

```bash
wrangler pages secret put NOTIFY_WEBHOOK --project-name agicodehub
# 粘贴：https://sctapi.ftqq.com/你的SendKey.send
```

完成。之后每条新线索都会通过「方糖」服务号推到你的微信。

> 新版 Server酱³ 的地址形如 `https://<uid>.push.ft07.com/send/<sendkey>.send`，同样直接粘贴即可，两条域名都支持识别。

### B. PushPlus（免费额度更大）

1. 打开 <https://www.pushplus.plus>，微信扫码登录
2. 复制你的 **token**
3. 设置两个变量：

```bash
wrangler pages secret put NOTIFY_WEBHOOK --project-name agicodehub
# 粘贴：https://www.pushplus.plus/send

wrangler pages secret put NOTIFY_TOKEN --project-name agicodehub
# 粘贴：你的 token
```

### C. 企业微信群机器人

1. 企业微信里建一个群（可以只有自己）
2. 群设置 → 群机器人 → 添加 → 复制 **Webhook 地址**
3. 设置：

```bash
wrangler pages secret put NOTIFY_WEBHOOK --project-name agicodehub
# 粘贴：https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxx
```

> 注意：消息进的是企业微信群，手机上得装**企业微信**才能看到，个人微信收不到。

### D. 飞书自定义机器人

```bash
wrangler pages secret put NOTIFY_WEBHOOK --project-name agicodehub
# 粘贴：https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx
```

### 推送内容长什么样

```
【新的安装需求】
联系方式：13422233323
系统：macOS 15
客户端：Cursor
引擎：Ghidra
卡点：MCP 注册后找不到工具
地区：HK
时间：2026-10-21T13:35:21.731Z
```

### 隐私选项：号码打码

推送会经过第三方服务。如果你不希望客户的联系方式留在那些服务里：

```bash
wrangler pages secret put NOTIFY_MASK --project-name agicodehub
# 随便输入一个值，比如 1
```

开启后推送里显示 `134***23`，**完整号码只存在你自己的 D1 里**，需要回复客户时去后台查。

### 强制指定渠道（一般用不上）

如果 webhook 域名不在自动识别范围内（比如你自建的中转服务），可以显式指定：

```bash
wrangler pages secret put NOTIFY_PROVIDER --project-name agicodehub
# 填：wecom | feishu | serverchan | pushplus | custom
```

`custom` 会把 `title / text / content / msgtype / text_content / lead` 一起发过去，你的端点按需取用。

### 提示都设好了但还是没收到？

推送失败是**静默**的（不影响线索入库），所以要看日志：

```bash
wrangler pages deployment tail --project-name agicodehub
```

日志里会出现类似：

```
notify failed [pushplus] HTTP 200: {"code":903,"msg":"token不能为空"}
notify failed [wecom] HTTP 400: {"errcode":93000,"errmsg":"invalid webhook url"}
```

对照排查：

| 日志 | 原因 |
| --- | --- |
| `notify skipped: pushplus 需要同时设置 NOTIFY_TOKEN` | 只设了 WEBHOOK，漏了 TOKEN |
| pushplus `903` / `999` | token 错，或没关注 PushPlus 公众号 |
| 企业微信 `93000` | webhook 地址不完整（少了 `?key=`） |
| 飞书 `19021` / `sign match fail` | 机器人开了签名校验，这类需要关掉签名或改用 custom |
| 完全没有任何 `notify` 日志 | `NOTIFY_WEBHOOK` 没设成功，用 `wrangler pages secret list --project-name agicodehub` 确认 |

> secret 改动通常立即生效，不用重新部署。如果发现没生效，再跑一次 `./scripts/deploy-cloudflare.sh`。
