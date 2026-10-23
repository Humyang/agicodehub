# Third-party notices

本仓库包含第三方开源代码。分发（包括线上部署）时必须保留本文件与相应的许可证文件。

## 1. 工具箱 SPA（仓库根 `src/`、`public/`）

- 上游项目：**IT-Tools** — <https://github.com/CorentinTh/it-tools>
- 作者：Corentin Th
- 许可证：**GPL-3.0**（见仓库根 `LICENSE`）
- 本仓库在其基础上做了品牌、SEO、i18n、PWA 与工具集的二次开发（提交 `87e099b`）。

GPL-3.0 要求：对外分发（含以网站形式提供）时，须向接收者提供完整对应源码，且不得删除许可证与版权声明。

## 2. 文档站 / 博客（`site/`）

- 上游项目：**website-dev**（KeyTik 官网）— <https://github.com/Fajar-RahmadJaya/website-dev>
- 原版权方：Fajar Rahmad Jaya
- 许可证：**MPL-2.0**（Mozilla Public License 2.0）

`site/` 下的 VitePress 主题、布局组件、构建配置（`site/docs/.vitepress/**`、`site/scripts/**`、
`tailwind.config.js`、`stylelint.config.js` 等）派生自上述项目。
本仓库导入的是文件内容，未保留其 git 历史。

MPL-2.0 是**文件级** copyleft：被修改的 MPL 源文件继续受 MPL 约束，必须保持可获取；
新增文件可采用其他许可证。与 GPL-3.0 兼容（FSF 认可），因此可以与本仓库共存。

### 待补：许可证正文

上游仓库的 `package.json` 声明了 MPL-2.0，但**未附带许可证全文**。本仓库同样未附，
请在首次公开发布前补齐（任选其一）：

```bash
# 有网络时
curl -fsSL https://www.mozilla.org/media/MPL/2.0/index.txt -o site/LICENSE-MPL-2.0
```

或从 <https://mozilla.org/MPL/2.0/> 手动保存为 `site/LICENSE-MPL-2.0`。

## 3. 站点内的第三方资源

| 资源 | 位置 | 说明 |
| --- | --- | --- |
| FFmpeg 系列静态页 | `public/static/ffmpegtool/`、`public/static/ffmpeghtml/` | 自建工具页，内含其自身依赖（Next.js 导出产物） |
| 图标样式页 | `public/static/ui/iconstyle/` | 内含 Google Material Icons 与 Element UI 图标字体，遵循各自许可证 |
| iPhone Duo 3D 演示 | `public/static/iphone-duo-gesture/` | 含 three.js（MIT）与 `@mediapipe/hands`（Apache-2.0） |
| VitePress | 构建依赖 | MIT |
| Element Plus | 构建依赖 | MIT |
| Tailwind CSS | 构建依赖 | MIT |

## 4. 已从上游模板中移除的第三方集成

导入 `site/` 时移除了上游模板自带的第三方服务集成，原因见各文件注释：

- Google Analytics（`G-7VB7F5RY4Z`）与 Google Tag Manager（`GTM-NL5P6NDT`）— 属于上游站点的账号
- iubenda GDPR cookie 脚本（`siteId 4345460`）— 同上
- satori + resvg 的 OG 图片生成钩子 — 其模板会抛错并中断构建

如需统计或合规组件，请用本站自己的账号重新接入。
