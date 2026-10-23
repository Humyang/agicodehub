---
title: Privacy Policy
titleTemplate: Term & Policies
description: What agicodehub.com collects, why, and how to have it deleted.
---

# Privacy Policy

**Effective Date:** 2026-10-23

This policy covers **AGI Code Hub** (`agicodehub.com`, `www.agicodehub.com`) — "we", "us", "our", "the Site".

> **说明（中文）**：本页长期有效，最后一次修订见上方日期。中文读者可直接看第 1 节末尾的「一句话总结」。
> This document was previously adapted from a third-party template and described services we do not operate. It has been rewritten to match what the Site actually does.

## 1. Information We Collect

The Site is mostly static: the toolbox and the documentation run entirely in your browser. We only receive data in two situations.

### 1.1 Ordinary request data

Like any website, our hosting provider (Cloudflare) processes standard request metadata in order to serve pages and mitigate abuse: IP address, User-Agent, requested URL, timestamp, and country. We don't build profiles from it and we don't sell it.

### 1.2 Information you submit through the request form

The `/service` page has a form for installation/configuration help. Submitting it is optional. We collect:

| Field | Required | Purpose |
| --- | --- | --- |
| contact (WeChat ID / phone / email) | yes | to reply to you |
| system (OS version) | no | to reproduce your situation |
| client (which app you're using) | no | same |
| engine (which engine you're using) | no | same |
| issue (where you got stuck) | no | same |
| page (the page you submitted from) | auto | to know which article brought you here |

What we **do not** store: your raw IP address. We store only a salted SHA-256 prefix of it, used for rate-limiting and duplicate detection — it cannot be reversed into an address.

Where it lives: a Cloudflare D1 database in our own Cloudflare account. No third-party CRM, no advertising network, no data broker.

Optional notifications: if we enable a webhook so that a new request pings our phone (WeChat / Feishu), the message goes through that provider. Contact details are masked in those messages by default; the unmasked value stays in our database.

**一句话总结**：我们只在你主动填表时拿到你的联系方式，存在自己的 Cloudflare 数据库里，不卖、不共享、不存原始 IP。

## 2. Use of Your Information

- To reply to the request you submitted, and to improve the documentation based on the questions we actually receive.
- To keep the form usable (rate-limiting, spam filtering).
- That's it. We do not use submitted contact details for marketing, and we do not send newsletters unless you separately asked for one.

## 3. Cookies and Local Storage

The Site sets no advertising or cross-site tracking cookies.

The toolbox stores your preferences (theme, language, recent tools) in your browser's `localStorage`. That data never leaves your device and is removed when you clear site data.

Documentation pages may load fonts and icon assets from the Site itself. No third-party analytics script is loaded.

## 4. Retention and Deletion

- Submitted requests are kept while the conversation is active, and for up to 24 months afterwards for reference.
- To have your submission deleted, email the address in section 7 with the contact detail you used. We remove the row from the database; there is no soft-delete copy kept elsewhere.

## 5. Data Security

Data in transit is encrypted (HTTPS). Submissions are stored in Cloudflare D1 with access limited to our own account. No online transmission is 100% secure, but the amount of data we hold is deliberately small.

## 6. Children

The Site is a developer tool and is not directed at children under 13. We do not knowingly collect their data.

## 7. Changes to This Privacy Policy

We may update this policy when the Site's behaviour changes. The effective date at the top always reflects the current version. Material changes will be noted on this page.

## 8. Contact Us

Questions, or a deletion request:

- Email: [jessebutchman@gmail.com](mailto:jessebutchman@gmail.com)
- X: [https://x.com/NicoYangxg](https://x.com/NicoYangxg)
