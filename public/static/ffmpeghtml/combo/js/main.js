// Tab management
document.addEventListener('DOMContentLoaded', () => {
  loadTabContent('extract')

  // Tab click handlers
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab')
      switchTab(tabId)
    })
  })
})

function switchTab(tabId) {
  // Update active tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active')

  // Load tab content
  loadTabContent(tabId)
}

function loadTabContent(tabId) {
  fetch(`./tabs/${tabId}.html`)
    .then(response => response.text())
    .then((html) => {
      document.getElementById('tab-content-container').innerHTML = html
      initializeTabScripts(tabId)
    })
    .catch((error) => {
      console.error('Error loading tab content:', error)
    })
}
// ... existing code ...

function initializeTabScripts(tabId) {
  switch (tabId) {
    case 'extract':
      initializeExtractTab()
      break
    case 'crop':
      initializeCropTab()
      break
    case 'combine':
      initializeCombineTab()
      break
    case 'reverse':
      initializeReverseTab()
      break
    case 'video':
      initializeVideoTab()
      break
  }
}

// 1. Video Extraction Tab
function initializeExtractTab() {
  const videoUploadArea = document.getElementById('video-upload-area')
  const videoUpload = document.getElementById('video-upload')
  const videoPreview = document.getElementById('video-preview')
  const videoPreviewContainer = document.getElementById('video-preview-container')
  const videoDuration = document.getElementById('video-duration')
  const videoResolution = document.getElementById('video-resolution')
  const inputVideo = document.getElementById('input-video')

  // Video upload functionality
  videoUploadArea.addEventListener('click', () => videoUpload.click())
  videoUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault()
    videoUploadArea.style.borderColor = '#3498db'
  })
  videoUploadArea.addEventListener('dragleave', () => {
    videoUploadArea.style.borderColor = '#ccc'
  })
  videoUploadArea.addEventListener('drop', (e) => {
    e.preventDefault()
    videoUploadArea.style.borderColor = '#ccc'
    if (e.dataTransfer.files.length) {
      videoUpload.files = e.dataTransfer.files
      handleVideoUpload(e.dataTransfer.files[0])
    }
  })

  videoUpload.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleVideoUpload(e.target.files[0])
    }
  })

  function handleVideoUpload(file) {
    if (!file.type.startsWith('video/')) {
      alert('请上传视频文件')
      return
    }

    const videoURL = URL.createObjectURL(file)
    videoPreview.src = videoURL

    // Auto-fill the input video path with the uploaded file name
    inputVideo.value = file.name

    videoPreviewContainer.style.display = 'block'

    // Get video information when metadata is loaded
    videoPreview.addEventListener('loadedmetadata', () => {
      const duration = formatTime(videoPreview.duration)
      const resolution = `${videoPreview.videoWidth} x ${videoPreview.videoHeight}`

      videoDuration.textContent = `时长: ${duration}`
      videoResolution.textContent = `分辨率: ${resolution}`
    })

    videoPreview.addEventListener('error', () => {
      alert('视频加载失败，请尝试其他格式的视频文件')
      videoPreviewContainer.style.display = 'none'
    })
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Existing extract functionality
  document.getElementById('generate-extract').addEventListener('click', () => {
    const inputVideoValue = inputVideo.value
    const outputDir = document.getElementById('output-dir').value
    const frameRate = document.getElementById('frame-rate').value
    const imageFormat = document.getElementById('image-format').value

    if (!inputVideoValue || !outputDir) {
      alert('请输入必要的参数')
      return
    }

    const command = `ffmpeg -i "${inputVideoValue}" -r ${frameRate} "${outputDir}frame_%04d.${imageFormat}"`
    document.getElementById('extract-output').textContent = command
  })
}

// 2. Image Crop Tab
function initializeCropTab() {
  const cropUploadArea = document.getElementById('crop-upload-area')
  const cropUpload = document.getElementById('crop-upload')
  const cropCanvas = document.getElementById('crop-canvas')
  const cropCanvasContainer = document.getElementById('crop-canvas-container')
  const cropArea = document.getElementById('crop-area')
  const cropX = document.getElementById('crop-x')
  const cropY = document.getElementById('crop-y')
  const cropWidth = document.getElementById('crop-width')
  const cropHeight = document.getElementById('crop-height')
  const cropCoords = document.getElementById('crop-coords')
  const generateCropBtn = document.getElementById('generate-crop')

  let isDragging = false
  let startX, startY
  let cropRect = { x: 0, y: 0, width: 0, height: 0 }

  // Upload image functionality
  cropUploadArea.addEventListener('click', () => cropUpload.click())
  cropUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault()
    cropUploadArea.style.borderColor = '#3498db'
  })
  cropUploadArea.addEventListener('dragleave', () => {
    cropUploadArea.style.borderColor = '#ccc'
  })
  cropUploadArea.addEventListener('drop', (e) => {
    e.preventDefault()
    cropUploadArea.style.borderColor = '#ccc'
    if (e.dataTransfer.files.length) {
      cropUpload.files = e.dataTransfer.files
      handleImageUpload(e.dataTransfer.files[0])
    }
  })

  cropUpload.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleImageUpload(e.target.files[0])
    }
  })

  function handleImageUpload(file) {
    const reader = new FileReader()
    reader.onload = function (e) {
      const img = new Image()
      img.onload = function () {
        cropCanvas.width = img.width
        cropCanvas.height = img.height

        const ctx = cropCanvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        cropCanvasContainer.style.display = 'block'
        cropCoords.style.display = 'block'
        generateCropBtn.style.display = 'block'

        initCropArea()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  function initCropArea() {
    const canvasWidth = cropCanvas.width
    const canvasHeight = cropCanvas.height

    cropRect = {
      x: Math.floor(canvasWidth * 0.1),
      y: Math.floor(canvasHeight * 0.1),
      width: Math.floor(canvasWidth * 0.8),
      height: Math.floor(canvasHeight * 0.8),
    }

    updateCropArea()
  }

  function updateCropArea() {
    cropArea.style.left = `${cropRect.x}px`
    cropArea.style.top = `${cropRect.y}px`
    cropArea.style.width = `${cropRect.width}px`
    cropArea.style.height = `${cropRect.height}px`

    cropX.value = cropRect.x
    cropY.value = cropRect.y
    cropWidth.value = cropRect.width
    cropHeight.value = cropRect.height
  }

  // Crop area dragging
  cropArea.addEventListener('mousedown', startDrag)

  function startDrag(e) {
    isDragging = true
    startX = e.clientX - cropRect.x
    startY = e.clientY - cropRect.y
    document.addEventListener('mousemove', drag)
    document.addEventListener('mouseup', stopDrag)
  }

  function drag(e) {
    if (!isDragging)
      return

    const canvasRect = cropCanvas.getBoundingClientRect()
    const newX = e.clientX - startX - canvasRect.left
    const newY = e.clientY - startY - canvasRect.top

    cropRect.x = Math.max(0, Math.min(newX, cropCanvas.width - cropRect.width))
    cropRect.y = Math.max(0, Math.min(newY, cropCanvas.height - cropRect.height))

    updateCropArea()
  }

  function stopDrag() {
    isDragging = false
    document.removeEventListener('mousemove', drag)
    document.removeEventListener('mouseup', stopDrag)
  }

  // Generate crop script
  generateCropBtn.addEventListener('click', () => {
    const inputDir = document.getElementById('input-dir').value
    const outputDir = document.getElementById('output-crop-dir').value

    if (!inputDir || !outputDir) {
      alert('请输入必要的参数')
      return
    }

    const command = `for img in "${inputDir}"*.{jpg,png,jpeg,bmp}; do\n`
      + `  ffmpeg -i "$img" -filter:v "crop=${cropRect.width}:${cropRect.height}:${cropRect.x}:${cropRect.y}" "${outputDir}$(basename "$img")"\n`
      + `done`

    document.getElementById('crop-output').textContent = command
  })
}

// 3. Image Combine Tab
function initializeCombineTab() {
  document.getElementById('generate-combine').addEventListener('click', () => {
    const inputDir = document.getElementById('input-combine-dir').value
    const outputFile = document.getElementById('output-combine').value
    const tileWidth = document.getElementById('tile-width').value
    const tileHeight = document.getElementById('tile-height').value
    const imagesPerRow = document.getElementById('images-per-row').value

    if (!inputDir || !outputFile) {
      alert('请输入必要的参数')
      return
    }

    const command = `ffmpeg -i "${inputDir}frame_%04d.png" -filter_complex "tile=${imagesPerRow}x${Math.ceil(100 / imagesPerRow)}" "${outputFile}"`
    document.getElementById('combine-output').textContent = command
  })

  // Save config
  document.getElementById('save-config').addEventListener('click', () => {
    const configName = document.getElementById('config-name').value
    const tileWidth = document.getElementById('tile-width').value
    const tileHeight = document.getElementById('tile-height').value
    const imagesPerRow = document.getElementById('images-per-row').value

    if (!configName) {
      alert('请输入配置名称')
      return
    }

    const config = {
      name: configName,
      tileWidth,
      tileHeight,
      imagesPerRow,
    }

    const configs = JSON.parse(localStorage.getItem('ffmpegConfigs') || '[]')
    configs.push(config)
    localStorage.setItem('ffmpegConfigs', JSON.stringify(configs))

    updateConfigSelect()
    alert('配置已保存')
  })
}

// 4. Reverse Operation Tab
function initializeReverseTab() {
  updateConfigSelect()

  document.getElementById('generate-reverse').addEventListener('click', () => {
    const inputCombined = document.getElementById('input-combined').value
    const outputDir = document.getElementById('output-reverse-dir').value
    const outputRecombined = document.getElementById('output-recombined').value
    const selectedConfig = document.getElementById('config-select').value

    if (!inputCombined || !outputDir || !outputRecombined || !selectedConfig) {
      alert('请输入必要的参数')
      return
    }

    const configs = JSON.parse(localStorage.getItem('ffmpegConfigs') || '[]')
    const config = configs.find(c => c.name === selectedConfig)

    if (!config) {
      alert('未找到配置')
      return
    }

    const command = `# 将大图裁剪成小图\n`
      + `ffmpeg -i "${inputCombined}" -filter_complex "crop=${config.tileWidth}:${config.tileHeight}" "${outputDir}tile_%04d.png"\n\n`
      + `# 将小图重新组合\n`
      + `ffmpeg -i "${outputDir}tile_%04d.png" -filter_complex "tile=${config.imagesPerRow}x${Math.ceil(100 / config.imagesPerRow)}" "${outputRecombined}"`

    document.getElementById('reverse-output').textContent = command
  })
}

// 5. Video Creation Tab
function initializeVideoTab() {
  document.getElementById('generate-video').addEventListener('click', () => {
    const inputDir = document.getElementById('input-video-dir').value
    const outputVideo = document.getElementById('output-video').value
    const frameRate = document.getElementById('video-frame-rate').value
    const videoFormat = document.getElementById('video-format').value

    if (!inputDir || !outputVideo) {
      alert('请输入必要的参数')
      return
    }

    const command = `ffmpeg -r ${frameRate} -i "${inputDir}frame_%04d.png" -c:v libx264 -pix_fmt yuv420p "${outputVideo}"`
    document.getElementById('video-output').textContent = command
  })
}

// Utility function
function updateConfigSelect() {
  const configSelect = document.getElementById('config-select')
  if (!configSelect)
    return

  configSelect.innerHTML = '<option value="">-- 选择配置 --</option>'
  const configs = JSON.parse(localStorage.getItem('ffmpegConfigs') || '[]')
  configs.forEach((config) => {
    const option = document.createElement('option')
    option.value = config.name
    option.textContent = config.name
    configSelect.appendChild(option)
  })
}
