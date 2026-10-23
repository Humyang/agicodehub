(function () {
  /**
   * Helper function to send messages to the VSCode extension.
   * @param {object} message The message object to send.
   */
  function postMessageToVSCode(message) {
    // Check if running inside an iframe (like a VSCode webview)
    if (window.parent !== window) {
      console.log('Sending message to VSCode:', message)
      window.parent.postMessage(message, '*')
    }
    else {
      console.warn('Not in a VSCode webview environment. Message not sent:', message)
    }
  }

  /**
   * VSCodeBridge provides utilities for communicating with a VSCode extension.
   */
  const VSCodeBridge = {
    /**
     * Sends a message to the VSCode extension.
     * @param {object} message The message object.
     */
    sendToVSCode: postMessageToVSCode,

    /**
     * Registers a callback function to handle messages received from the VSCode extension.
     * @param {function(object): void} callback The function to call when a message is received.
     */
    onMessage(callback) {
      window.addEventListener('message', (event) => {
        // Ensure the message is from the parent window (the VSCode webview host)
        if (event.source === window.parent) {
          console.log('Received message from VSCode:', event.data)
          callback(event.data)
        }
      })
    },
  }

  // Expose VSCodeBridge globally for other scripts to use
  window.VSCodeBridge = VSCodeBridge

  /**
   * Handles the result received from a VSCode command execution.
   */
  window.handleCommandResult = function (result) {
    console.log('FFmpeg Command Result:', result)
    const resultElement = document.getElementById('outputResult')
    if (resultElement) {
      resultElement.textContent = `Command Execution Result: ${JSON.stringify(result)}`
      resultElement.style.color = 'green'
      setTimeout(() => resultElement.textContent = '', 5000)
    }

    const event = new CustomEvent('vscode-command-result', { detail: result })
    document.dispatchEvent(event)
  }

  /**
   * 【核心修改】
   * 直接读取 input 框的值发送给 VS Code
   */
  window.runFFmpegCommand = function () {
    // 获取输入框元素
    const inputElement = document.getElementById('ffmpegCommandInput')

    // 校验输入值
    if (inputElement && inputElement.value.trim()) {
      const command = inputElement.value.trim()

      // 发送消息
      postMessageToVSCode({
        command: 'runCommand',
        text: command,
      })

      // 按钮交互反馈
      const btn = document.querySelector('button[onclick="runFFmpegCommand()"]')
      if (btn) {
        const oldText = btn.innerHTML
        btn.innerHTML = '🚀 Running...'
        btn.disabled = true // 防止重复点击
        setTimeout(() => {
          btn.innerHTML = oldText
          btn.disabled = false
        }, 3000)
      }
    }
    else {
      console.warn('Command input is empty or element not found.')
      // alert('Please enter a command in the input box.');
    }
  }

  // --- Initialization Logic ---
  document.addEventListener('DOMContentLoaded', () => {
    const isVSCodeEnvironment = window.parent !== window
    const runOnVscodeButton = document.querySelector('button[onclick="runFFmpegCommand()"]')
    if (runOnVscodeButton && !isVSCodeEnvironment) {
      runOnVscodeButton.style.display = 'none'
    }

    // 这里的 onMessage 是全局监听，Navbar 内部也会添加自己的监听
    // Bridge 的监听主要处理 commandResult
    VSCodeBridge.onMessage((message) => {
      if (message.command === 'commandResult') {
        window.handleCommandResult(message.result)
      }
    })
  })
})()
