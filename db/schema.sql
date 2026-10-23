-- AGI Code Hub 落地页线索表（Cloudflare D1）
-- 应用方式：
--   本地：wrangler d1 execute agicodehub-leads --local  --file=db/schema.sql
--   线上：wrangler d1 execute agicodehub-leads --remote --file=db/schema.sql

CREATE TABLE IF NOT EXISTS leads (
  id          TEXT PRIMARY KEY,          -- UUID
  created_at  TEXT NOT NULL,             -- 服务端收到的时间（ISO8601，UTC）
  contact     TEXT NOT NULL,             -- 联系方式：微信号 / 手机号 / 邮箱
  system      TEXT NOT NULL DEFAULT '',  -- 系统版本
  client      TEXT NOT NULL DEFAULT '',  -- Agent 客户端
  engine      TEXT NOT NULL DEFAULT '',  -- 反编译引擎
  issue       TEXT NOT NULL DEFAULT '',  -- 卡在哪一步
  page        TEXT NOT NULL DEFAULT '',  -- 来源页面
  country     TEXT NOT NULL DEFAULT '',  -- 国家/地区（来自 Cloudflare，不存原始 IP）
  ua          TEXT NOT NULL DEFAULT '',  -- User-Agent（截断 200 字符）
  ip_hash     TEXT NOT NULL DEFAULT ''   -- IP 的 SHA-256 前 32 位，用于限流与去重
);

-- 按时间倒序取最近线索是最常用的查询
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

-- 用来判断同一个联系方式是否重复提交过
CREATE INDEX IF NOT EXISTS idx_leads_contact ON leads (contact);
