// 新增 browserUrlMap 配置：
// 在代码中部添加了这个对象。因为 VS Code 使用的是 command 字符串，而浏览器需要 https://... 链接。你需要手动修改代码中 'btnOpenAgicodeHub' 和 'btnOpenFFmpegTool' 对应的 URL 字符串。
// 核心判断逻辑：
// 在点击事件监听器中，添加了 if (window.VSCodeBridge) { ... } else { ... } 判断。
// VS Code 环境：执行原来的 vscodeActions 并调用 sendToVSCode。
// 浏览器环境：
// 如果是 btnOpenBrowsers，依然动态读取 window.navbarConfig 获取跳转地址。
// 如果是其他按钮，读取 browserUrlMap 中的静态地址。
// 使用 window.open(targetUrl, '_blank') 在新标签页打开链接（如果希望在当前页跳转，请改为 window.location.href = targetUrl）。

(function () {
  // 1. 配置 CSS 样式 (保持不变)
  const cssStyles = `
        /* 导航栏样式 */
        :root {
            --vscode-editor-background: #1e1e1e;
            --vscode-foreground: #cccccc;
            --vscode-panel-border: rgba(128, 128, 128, 0.35);
            --vscode-descriptionForeground: #8b949e;
            --vscode-font-family: "Segoe WPC", "Segoe UI", sans-serif;
            --vscode-button-background: #007acc;
            --vscode-button-foreground: #ffffff;
            --vscode-button-hoverBackground: #0062a3;
            --nav-height: 50px;
        }
        .navbar {
            position:fixed;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background-color: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            position: sticky;
            top: 0;
            z-index: 100;
            font-family: var(--vscode-font-family);
            box-sizing: border-box; 
        }
        .nav-left {
            display: flex;
            align-items: baseline;
            gap: 10px;
        }
        .nav-subtitle {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin-left: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 300px;
        }
        .vscode-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 14px;
            font-size: 13px;
            cursor: pointer;
            border-radius: 2px;
            display: flex;
            align-items: center;
            gap: 5px;
            outline: none;
            transition: background-color 0.2s;
        }
        .vscode-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
    `

  // 2. 配置 HTML 结构 (保持不变)
  const navHtml = `
        <div class="nav-left">
            <button id="btnOpenAgicodeHub" class="vscode-btn">AgicodeHub</button>
            <button id="btnOpenFFmpegTool" class="vscode-btn">FFmpeg Tool</button>
            <button id="btnOpenBrowsers" class="vscode-btn" title="Open configured URL">Browsers ↗</button>
            <span id="navFileName" class="nav-subtitle"></span>
        </div>
        
    `
  // <div class="nav-right">
  //         <button id="btnOpenExternal" class="vscode-btn">Open in External Player ↗</button>
  //     </div>

  // 3. 初始化函数
  function initNavbar() {
    if (document.querySelector('.navbar'))
      return

    // --- A. 注入 CSS ---
    const styleSheet = document.createElement('style')
    styleSheet.innerText = cssStyles
    document.head.appendChild(styleSheet)

    // --- B. 插入 HTML ---
    const navElement = document.createElement('nav')
    navElement.className = 'navbar'
    navElement.innerHTML = navHtml
    document.body.insertBefore(navElement, document.body.firstChild)

    // --- C. 配置 ---
    const DEFAULT_URL = 'http://localhost:5173'

    // 【配置区】：普通浏览器环境下，各按钮对应的跳转地址
    const browserUrlMap = {
      btnOpenAgicodeHub: 'https://agicodehub.com', // 请替换为实际地址
      btnOpenFFmpegTool: 'https://agicodehub.com/ffmpegtool', // 请替换为实际地址
      btnOpenExternal: '', // 外部播放器在浏览器中通常无法调用，可留空
      // btnOpenBrowsers 不需要在这里配置，它会动态读取 config
    }

    // --- D. 动作定义 (VS Code 用) ---
    const actions = {
      btnOpenAgicodeHub: () => ({ command: 'openAgicodeHub' }),
      btnOpenFFmpegTool: () => ({ command: 'openFFmpegTool' }),
      btnOpenExternal: () => ({ command: 'openExternal' }),
      btnOpenBrowsers: () => {
        const config = window.navbarConfig || {}
        const targetUrl = config.browserUrl || DEFAULT_URL
        return { command: 'openBrowsers', url: targetUrl }
      },
    }

    // --- E. 绑定事件 ---
    Object.keys(actions).forEach((btnId) => {
      const btn = document.getElementById(btnId)
      if (btn) {
        btn.addEventListener('click', () => {
          // === 核心修改：根据 Bridge 文件的逻辑判断环境 ===
          // VSCode Webview 运行在 iframe 中，所以 window.parent !== window
          // 普通浏览器直接打开时，window.parent === window
          const isVSCodeEnvironment = window.parent !== window

          if (isVSCodeEnvironment) {
            // 1. VS Code 环境：走 Bridge 发消息
            if (window.VSCodeBridge) {
              const message = actions[btnId]()
              window.VSCodeBridge.sendToVSCode(message)
            }
            else {
              console.error('VSCodeBridge definition missing despite being in iframe.')
            }
          }
          else {
            // 2. 普通浏览器环境：直接跳转 URL
            let targetUrl = ''

            // 特殊处理 Browsers 按钮
            if (btnId === 'btnOpenBrowsers') {
              const config = window.navbarConfig || {}
              targetUrl = config.browserUrl || DEFAULT_URL
            }
            else {
              targetUrl = browserUrlMap[btnId]
            }

            if (targetUrl) {
              window.open(targetUrl, '_blank') // 新标签页打开
            }
            else {
              console.warn(`No URL configured for ${btnId} in browser mode.`)
              // 仅提示，避免报错
              if (btnId === 'btnOpenExternal') {
                alert('浏览器模式下不支持直接调用外部播放器。')
              }
            }
          }
        })
      }
    })

    // --- F. 监听 Navbar 专属消息 (仅 VS Code 环境有效) ---
    // 即使在浏览器中，Bridge 对象也存在，所以这里也加一层环境判断更严谨，
    // 不过 onMessage 在浏览器中本身收不到来自 parent 的消息，所以不加判断也无害。
    if (window.VSCodeBridge) {
      window.VSCodeBridge.onMessage((message) => {
        if (message.command === 'loadVideoUrl') {
          const videoUrl = message.url
          const fileName = message.fileName

          const navFileName = document.getElementById('navFileName')
          if (navFileName)
            navFileName.innerText = fileName || ''

          const fileInfo = document.getElementById('fileInfo')
          if (fileInfo)
            fileInfo.innerHTML = `<strong>Playing:</strong> ${fileName}`

          const video1 = document.getElementById('video1')
          if (video1) {
            video1.src = videoUrl
            video1.play().catch(e => console.warn('Autoplay blocked:', e))
          }
        }
      })
    }
  }

  // 等待 DOM 加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar)
  }
  else {
    initNavbar()
  }
})()
