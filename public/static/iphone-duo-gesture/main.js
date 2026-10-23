import { inject } from '@vercel/analytics';
import * as THREE from 'three';
import { USDLoader } from 'three/addons/loaders/USDLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadDefaultUIs } from './ui.js';

// Initialize Vercel Web Analytics
inject();

const viewport = document.querySelector('#viewport');
const languageToggle = document.querySelector('#language-toggle');
const exportBtn = document.querySelector('#export');
const controlDock = document.querySelector('.control-dock');
const gestureToggle = document.querySelector('#gesture-toggle');
const gesturePanel = document.querySelector('#gesture-panel');
const gestureVideo = document.querySelector('#gesture-video');
const gestureCanvas = document.querySelector('#gesture-canvas');
const gestureStatus = document.querySelector('[data-gesture-status]');
const gestureClose = document.querySelector('#gesture-close');
let gestureStream = null;
let gestureHands = null;
let gestureRunning = false;
let gestureFrameBusy = false;
const gesturePose = {
  active: false,
  yaw: 0,
  pitch: 0,
  roll: 0,
  zoom: 0,
  fold: 180,
  lastDistance: null,
};
const translations = {
  zh: { title: 'iPhone Duo · 折叠预览', viewportLabel: 'iPhone Duo 3D 模型。拖拽旋转，滚轮缩放。', viewToolsLabel: '模型视图控制', zoomOut: '缩小模型', zoomIn: '放大模型', resetView: '重置视图', enterImmersive: '进入沉浸体验', exitImmersive: '退出沉浸体验', screenPanelLabel: '屏幕界面', screenInterface: '屏幕界面', screenThemeLabel: '屏幕界面类型', wallpaper: '壁纸', launcher: '启动器', custom: '自定义', mediaSettingsLabel: '媒体显示设置', modelOrientation: '手机方向', orientation: '视频方向', auto: '自动', portrait: '竖屏', landscape: '横屏', fillMode: '填充方式', cover: '填充', contain: '适应', stretch: '拉伸', shellColor: '机身颜色', starLightWhite: '星光白', black: '黑色', blue: '蓝色', pink: '粉色', gold: '金色', customPattern: '自定义图案', animationControls: '折叠动画控制', playAnimation: '播放动画', pauseAnimation: '暂停动画', playbackProgress: '播放进度', playbackSpeed: '播放速度 {speed}×', exportVideo: '导出视频', exportVideoWithMedia: '导出真实视频', recording: '录制中…', languageToggle: '切换语言', gestureControl: '手势操控', gestureOn: '关闭手势操控', gestureOff: '开启摄像头手势操控' },
  en: { title: 'iPhone Duo · Foldable Preview', viewportLabel: 'iPhone Duo 3D model. Drag to rotate, scroll to zoom.', viewToolsLabel: 'Model view controls', zoomOut: 'Zoom out', zoomIn: 'Zoom in', resetView: 'Reset view', enterImmersive: 'Enter immersive experience', exitImmersive: 'Exit immersive experience', screenPanelLabel: 'Screen interface', screenInterface: 'Screen interface', screenThemeLabel: 'Screen interface type', wallpaper: 'Wallpaper', launcher: 'Launcher', custom: 'Custom', mediaSettingsLabel: 'Media display settings', modelOrientation: 'Phone orientation', orientation: 'Video orientation', auto: 'Auto', portrait: 'Portrait', landscape: 'Landscape', fillMode: 'Fill mode', cover: 'Fill', contain: 'Fit', stretch: 'Stretch', shellColor: 'Body color', starLightWhite: 'Starlight white', black: 'Black', blue: 'Blue', pink: 'Pink', gold: 'Gold', customPattern: 'Custom pattern', animationControls: 'Fold animation controls', playAnimation: 'Play animation', pauseAnimation: 'Pause animation', playbackProgress: 'Playback progress', playbackSpeed: 'Playback speed {speed}×', exportVideo: 'Export video', exportVideoWithMedia: 'Export video', recording: 'Recording…', languageToggle: 'Switch language', gestureControl: 'Gesture control', gestureOn: 'Turn off gesture control', gestureOff: 'Enable camera gestures' }
};
let locale = localStorage.getItem('iphone-duo-locale') || (navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en');
function t(key, vars = {}) { return (translations[locale][key] || translations.zh[key] || key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? ''); }
function applyLocale() {
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  languageToggle.textContent = locale === 'zh' ? 'EN' : '中';
  languageToggle.setAttribute('aria-label', t('languageToggle'));
  languageToggle.title = t('languageToggle');
  play.setAttribute('aria-label', t(playing ? 'pauseAnimation' : 'playAnimation'));
  speedBtn.setAttribute('aria-label', t('playbackSpeed', { speed: SPEEDS[speedIndex] }));
  exportBtn.textContent = customVideo ? t('exportVideoWithMedia') : t('exportVideo');
  exportBtn.setAttribute('aria-label', t('exportVideo'));
  document.querySelector('#zoom-out').title = t('zoomOut');
  document.querySelector('#zoom-in').title = t('zoomIn');
  document.querySelector('#zoom-reset').title = t('resetView');
  immersiveToggle.setAttribute('aria-label', t(immersive ? 'exitImmersive' : 'enterImmersive'));
  immersiveToggle.title = t(immersive ? 'exitImmersive' : 'enterImmersive');
  gestureToggle.setAttribute('aria-label', t(gestureRunning ? 'gestureOn' : 'gestureOff'));
  gestureToggle.title = t(gestureRunning ? 'gestureOn' : 'gestureOff');
}
languageToggle.addEventListener('click', () => { locale = locale === 'zh' ? 'en' : 'zh'; localStorage.setItem('iphone-duo-locale', locale); applyLocale(); });

function gestureMessage(message) {
  if (gestureStatus) gestureStatus.textContent = message;
}
function gestureDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function handleGestureResults(results) {
  const hands = results.multiHandLandmarks || [];
  const ctx = gestureCanvas.getContext('2d');
  ctx.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
  if (hands.length < 2) {
    gesturePose.active = false;
    gesturePose.lastDistance = null;
    gestureMessage(locale === 'zh' ? '请将双手放入画面' : 'Place both hands in view');
    return;
  }
  const a = hands[0][9];
  const b = hands[1][9];
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  const lineAngle = Math.atan2(dy, dx);
  // Two-hand geometry maps directly to the physical phone: spread opens it,
  // the line between hands rotates it, and the midpoint steers its viewpoint.
  gesturePose.active = true;
  // The front-camera preview is mirrored, so invert the pose axes to make
  // the model follow the user's visible hand movement.
  gesturePose.yaw = THREE.MathUtils.clamp((.5 - midX) * 1.55, -.78, .78);
  gesturePose.pitch = THREE.MathUtils.clamp((midY - .5) * 1.15, -.58, .58);
  gesturePose.roll = THREE.MathUtils.clamp(-lineAngle, -1.15, 1.15);
  gesturePose.zoom = THREE.MathUtils.clamp((distance - .22) / .5, 0, 1);
  gesturePose.fold = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(distance, .16, .68, 8, 180), 8, 180);
  gesturePose.lastDistance = distance;
  gestureMessage(locale === 'zh' ? '双手操控：间距折叠 · 连线旋转 · 中点视角' : 'Two hands: spread folds · line rotates · midpoint steers');
}
async function stopGestureControl() {
  gestureRunning = false;
  gestureToggle.setAttribute('aria-pressed', 'false');
  gesturePanel.hidden = true;
  if (gestureStream) gestureStream.getTracks().forEach(track => track.stop());
  gestureStream = null;
  gestureVideo.srcObject = null;
  gesturePose.active = false;
  gesturePose.lastDistance = null;
  if (gestureHands?.close) await gestureHands.close();
  gestureHands = null;
  applyLocale();
}
async function startGestureControl() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('camera-unavailable');
  gestureStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  gestureVideo.srcObject = gestureStream;
  await gestureVideo.play();
  gestureCanvas.width = 320; gestureCanvas.height = 240;
  gesturePanel.hidden = false;
  gestureToggle.setAttribute('aria-pressed', 'true');
  gestureMessage(locale === 'zh' ? '摄像头已开启，正在加载双手识别…' : 'Camera ready, loading two-hand tracking…');
  if (!window.Hands) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = () => reject(new Error('hands-unavailable'));
      document.head.appendChild(script);
    });
  }
  if (!window.Hands) throw new Error('hands-unavailable');
  gestureHands = new window.Hands({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
  gestureHands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: .65, minTrackingConfidence: .6 });
  gestureHands.onResults(handleGestureResults);
  gestureRunning = true;
  gesturePanel.hidden = false;
  gestureToggle.setAttribute('aria-pressed', 'true');
  gestureMessage(locale === 'zh' ? '双手识别已开启' : 'Two-hand tracking ready');
  applyLocale();
  const tick = async () => {
    if (!gestureRunning) return;
    if (!gestureFrameBusy && gestureVideo.readyState >= 2) { gestureFrameBusy = true; await gestureHands.send({ image: gestureVideo }); gestureFrameBusy = false; }
    requestAnimationFrame(tick);
  };
  tick();
}
gestureToggle.addEventListener('click', async () => {
  if (gestureRunning) return stopGestureControl();
  gestureToggle.disabled = true;
  try { await startGestureControl(); } catch (error) {
    console.warn('Gesture control unavailable', error);
    gestureMessage(error?.message === 'hands-unavailable'
      ? (locale === 'zh' ? '摄像头已显示，但双手识别模型加载失败' : 'Camera is visible, but hand tracking failed to load')
      : (locale === 'zh' ? '无法访问摄像头，请使用 HTTPS/localhost 并检查权限' : 'Camera access failed; use HTTPS/localhost and check permissions'));
    gesturePanel.hidden = false;
    if (gestureStream && gestureVideo.srcObject) {
      gestureRunning = false;
      gestureToggle.setAttribute('aria-pressed', 'false');
    }
  } finally { gestureToggle.disabled = false; }
});
gestureClose.addEventListener('click', stopGestureControl);
const slider = document.querySelector('#timeline');
const play = document.querySelector('#play');
const timeCurrent = document.querySelector('#time-current');
const timeDuration = document.querySelector('#time-duration');
const speedBtn = document.querySelector('#speed');
const zoomIn = document.querySelector('#zoom-in');
const zoomOut = document.querySelector('#zoom-out');
const zoomReset = document.querySelector('#zoom-reset');
const immersiveToggle = document.querySelector('#immersive-toggle');
let immersive = false;
const videoControls = document.querySelector('#video-controls');
const vplay = document.querySelector('#vplay');
const vtimeline = document.querySelector('#vtimeline');
const vtimeCurrent = document.querySelector('#vtime-current');
const vtimeDuration = document.querySelector('#vtime-duration');
const vmute = document.querySelector('#vmute');
const vspeed = document.querySelector('#vspeed');
const VSPEEDS = [0.5, 1, 2];
const DURATION = 8.6;
const SPEEDS = [0.5, 1, 2];
let speedIndex = 1;
let vSpeedIndex = 1;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, .1, 250);
camera.position.set(0, 0, 40);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0xf6f6f3, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
viewport.appendChild(renderer.domElement);
const environment = new RoomEnvironment();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(environment, .04).texture;
environment.dispose();
pmrem.dispose();
scene.environmentIntensity = 1.35;
scene.add(new THREE.HemisphereLight(0xffffff, 0xb5baa8, 1.8));
const key = new THREE.DirectionalLight(0xfffcf5, 2.6);
key.position.set(-15, 25, 30);
scene.add(key);
const rim = new THREE.DirectionalLight(0xe8edf5, 2);
rim.position.set(15, 5, -15);
scene.add(rim);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 21;
controls.maxDistance = 65;
controls.target.set(0, -1.15, .275454);
controls.update();
const defaultCameraPosition = camera.position.clone();
const defaultTarget = controls.target.clone();
function zoomBy(amount) {
  const direction = camera.position.clone().sub(controls.target).normalize();
  const distance = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) + amount, controls.minDistance, controls.maxDistance);
  camera.position.copy(controls.target).add(direction.multiplyScalar(distance));
  controls.update();
}
function resetView() {
  camera.position.copy(defaultCameraPosition);
  controls.target.copy(defaultTarget);
  controls.update();
}
function setImmersive(value) {
  immersive = value;
  document.body.classList.toggle('immersive-mode', value);
  immersiveToggle.setAttribute('aria-label', t(value ? 'exitImmersive' : 'enterImmersive'));
  immersiveToggle.title = t(value ? 'exitImmersive' : 'enterImmersive');
  immersiveToggle.classList.toggle('active', value);
  updateDockSpace();
  resize();
}
zoomIn.addEventListener('click', () => zoomBy(-4));
zoomOut.addEventListener('click', () => zoomBy(4));
zoomReset.addEventListener('click', resetView);
immersiveToggle.addEventListener('click', () => setImmersive(!immersive));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && immersive) setImmersive(false);
});
const phone = new THREE.Group();
scene.add(phone);
const bodyMaterials = [];
const bend = { value: 0 };
let angle = 180;
let time = 0;
let playing = false;
let phase = 0;
let transition = null;
let ready = false;
const screens = {};
const uiReferenceEye = new THREE.Vector3(0, 0, 40);
const innerUIFrame = new THREE.Vector4(-7.89935, .34562 - 5.8974, 15.7987, 11.1035);
const outerUIFrame = new THREE.Vector4(.23396, .27173 - 5.8974, 7.73936, 11.2513)
  .multiplyScalar((uiReferenceEye.z - .24948) / (uiReferenceEye.z - .825538));
const defaultUIs = await loadDefaultUIs();
let uiTheme = 'wallpaper';
let contentOrientation = 'portrait';
let modelOrientation = 'landscape';
let fillMode = 'cover';
let customVideo = null;
let customVideoUrl = null;
let lastCustomSource = null;
let lastCustomSourceSize = null;
const uiCanvas = document.createElement('canvas');
uiCanvas.width = 1600;
uiCanvas.height = 1125;
const uiTexture = new THREE.CanvasTexture(uiCanvas);
uiTexture.colorSpace = THREE.SRGBColorSpace;
uiTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const bodyImageCanvas = document.createElement('canvas');
bodyImageCanvas.width = 1660;
bodyImageCanvas.height = 1200;
const bodyImageTexture = new THREE.CanvasTexture(bodyImageCanvas);
bodyImageTexture.colorSpace = THREE.SRGBColorSpace;
bodyImageTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const bodyStrength = { value: 0 };
for (const kind of ['inner', 'outer']) {
  const defaultTextures = {};
  for (const [theme, canvases] of Object.entries(defaultUIs)) {
    const texture = new THREE.CanvasTexture(canvases[kind]);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    defaultTextures[theme] = texture;
  }
  const material = new THREE.MeshBasicMaterial({ map: defaultTextures[uiTheme], toneMapped: false });
  screens[kind] = {
    material, defaultTextures,
    frame: { value: (kind === 'inner' ? innerUIFrame : outerUIFrame).clone() },
    gradient: { value: new THREE.Vector2(kind === 'inner' ? .5 : 0, kind === 'inner' ? 0 : 1) },
    pixel: { value: new THREE.Vector2(1 / defaultUIs[uiTheme][kind].width, 1 / defaultUIs[uiTheme][kind].height) },
  };
}
const uiInput = document.querySelector('#ui-upload');
function drawSource(source, width, height) {
  const c = uiCanvas.getContext('2d');
  c.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
  c.fillStyle = '#101418';
  c.fillRect(0, 0, uiCanvas.width, uiCanvas.height);

  let rotation = 0;
  if (contentOrientation === 'portrait' && width > height) rotation = 90;
  else if (contentOrientation === 'landscape' && height > width) rotation = -90;
  else if (contentOrientation === 'auto') rotation = 0;

  const baseWidth = rotation % 180 === 0 ? width : height;
  const baseHeight = rotation % 180 === 0 ? height : width;

  let scale = 1;
  if (fillMode === 'cover') scale = Math.max(uiCanvas.width / baseWidth, uiCanvas.height / baseHeight);
  else if (fillMode === 'contain') scale = Math.min(uiCanvas.width / baseWidth, uiCanvas.height / baseHeight);
  else if (fillMode === 'stretch') scale = 1;

  // The canvas transform performs the rotation. Keep drawImage dimensions in
  // the source video's coordinate space so a 90-degree rotation does not
  // stretch one axis a second time.
  const w = fillMode === 'stretch'
    ? (rotation % 180 === 0 ? uiCanvas.width : uiCanvas.height)
    : width * scale;
  const h = fillMode === 'stretch'
    ? (rotation % 180 === 0 ? uiCanvas.height : uiCanvas.width)
    : height * scale;

  c.save();
  c.translate(uiCanvas.width / 2, uiCanvas.height / 2);
  c.rotate(rotation * Math.PI / 180);
  c.drawImage(source, -w / 2, -h / 2, w, h);
  c.restore();
  uiTexture.needsUpdate = true;
}
function setContentOrientation(value) {
  contentOrientation = value;
  document.querySelectorAll('[data-orientation]').forEach(button => {
    const active = button.dataset.orientation === value;
    button.setAttribute('aria-pressed', String(active));
  });
  if (lastCustomSource && lastCustomSourceSize) {
    drawSource(lastCustomSource, lastCustomSourceSize.width, lastCustomSourceSize.height);
  }
}
function setModelOrientation(value) {
  modelOrientation = value;
  phone.rotation.z = value === 'landscape' ? 0 : -Math.PI / 2;
  document.querySelectorAll('[data-model-orientation]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.modelOrientation === value)));
}
function setFillMode(value) {
  fillMode = value;
  document.querySelectorAll('[data-fill-mode]').forEach(button => {
    const active = button.dataset.fillMode === value;
    button.setAttribute('aria-pressed', String(active));
  });
  if (lastCustomSource && lastCustomSourceSize) {
    drawSource(lastCustomSource, lastCustomSourceSize.width, lastCustomSourceSize.height);
  }
}
document.querySelectorAll('[data-orientation]').forEach(button => {
  button.addEventListener('click', () => setContentOrientation(button.dataset.orientation));
});
document.querySelectorAll('[data-model-orientation]').forEach(button => button.addEventListener('click', () => setModelOrientation(button.dataset.modelOrientation)));
document.querySelectorAll('[data-fill-mode]').forEach(button => {
  button.addEventListener('click', () => setFillMode(button.dataset.fillMode));
});
function stopCustomVideo() {
  if (customVideo) {
    customVideo.pause();
    customVideo = null;
  }
  if (customVideoUrl) {
    URL.revokeObjectURL(customVideoUrl);
  customVideoUrl = null;
  }
  hideVideoControls();
}
uiInput.addEventListener('change', async () => {
  const file = uiInput.files[0];
  if (!file) return;
  stopCustomVideo();
  const url = URL.createObjectURL(file);
  const applyToScreens = () => {
    for (const [kind, screen] of Object.entries(screens)) {
      screen.material.map = uiTexture;
      screen.pixel.value.set(1 / uiCanvas.width, 1 / uiCanvas.height);
      screen.frame.value.copy(innerUIFrame);
      screen.gradient.value.set(.5, kind === 'inner' ? 0 : 1);
    }
    uiTheme = 'custom';
    document.querySelectorAll('[data-ui-theme]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.uiTheme === uiTheme)));
    setPlaying(false);
    transition = { from: angle, to: 180, elapsed: 0 };
  };
  if (file.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    try {
      await new Promise((resolve, reject) => {
        video.addEventListener('loadeddata', resolve, { once: true });
        video.addEventListener('error', () => reject(new Error('video')), { once: true });
        video.load();
      });
      await video.play().catch(() => {});
      lastCustomSource = video;
      lastCustomSourceSize = { width: video.videoWidth, height: video.videoHeight };
      drawSource(video, video.videoWidth, video.videoHeight);
      customVideo = video;
      customVideoUrl = url;
      video.addEventListener('timeupdate', updateVideoProgress);
      video.addEventListener('play', updateVideoPlayIcon);
      video.addEventListener('pause', updateVideoPlayIcon);
      applyToScreens();
      showVideoControls(video);
    } catch {
      URL.revokeObjectURL(url);
      alert('无法读取这个视频，请选择有效的 MP4 文件。');
    } finally {
      uiInput.value = '';
    }
    return;
  }
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
    lastCustomSource = img;
    lastCustomSourceSize = { width: img.width, height: img.height };
    drawSource(img, img.width, img.height);
    applyToScreens();
  } catch {
    alert('无法读取这张图片，请选择 PNG、JPG 或 WebP 格式的文件。');
  } finally {
    URL.revokeObjectURL(url);
    uiInput.value = '';
  }
});
function showDefaultUI() {
  stopCustomVideo();
  lastCustomSource = null;
  lastCustomSourceSize = null;
  for (const [kind, screen] of Object.entries(screens)) {
    const texture = screen.defaultTextures[uiTheme];
    screen.material.map = texture;
    screen.pixel.value.set(1 / texture.image.width, 1 / texture.image.height);
    screen.frame.value.copy(kind === 'inner' ? innerUIFrame : outerUIFrame);
    screen.gradient.value.set(kind === 'inner' ? .5 : 0, kind === 'inner' ? 0 : 1);
  }
  document.querySelectorAll('[data-ui-theme]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.uiTheme === uiTheme)));
}
document.querySelectorAll('[data-ui-theme]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.uiTheme === 'custom') {
    uiInput.click();
    return;
  }
  uiTheme = button.dataset.uiTheme;
  showDefaultUI();
}));
const SHELL_COLORS = { white: null, black: new THREE.Color(0x2a2d31), blue: new THREE.Color(0x3a5f8a), pink: new THREE.Color(0xd9a7b0), gold: new THREE.Color(0xc9a86a) };
function setShellColor(name) {
  if (name === 'image') {
    bodyInput.click();
    return;
  }
  bodyStrength.value = 0;
  const tint = SHELL_COLORS[name] || null;
  for (const { material, base } of bodyMaterials) {
    material.color.copy(base);
    if (tint) material.color.multiply(tint);
  }
  document.querySelectorAll('[data-shell-color]').forEach(button => button.setAttribute('aria-checked', String(button.dataset.shellColor === name)));
}
document.querySelectorAll('[data-shell-color]').forEach(button => button.addEventListener('click', () => setShellColor(button.dataset.shellColor)));
const bodyInput = document.querySelector('#body-upload');
bodyInput.addEventListener('change', async () => {
  const file = bodyInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
    const c = bodyImageCanvas.getContext('2d');
    c.fillStyle = '#101418';
    c.fillRect(0, 0, bodyImageCanvas.width, bodyImageCanvas.height);
    const scale = Math.min(bodyImageCanvas.width / img.width, bodyImageCanvas.height / img.height);
    const w = img.width * scale, h = img.height * scale;
    c.drawImage(img, (bodyImageCanvas.width - w) / 2, (bodyImageCanvas.height - h) / 2, w, h);
    bodyImageTexture.needsUpdate = true;
    bodyStrength.value = 1;
    for (const { material, base } of bodyMaterials) material.color.copy(base);
    document.querySelectorAll('[data-shell-color]').forEach(button => button.setAttribute('aria-checked', String(button.dataset.shellColor === 'image')));
  } catch {
    alert('无法读取这张图片，请选择 PNG、JPG 或 WebP 格式的文件。');
  } finally {
    URL.revokeObjectURL(url);
    bodyInput.value = '';
  }
});

function setPlaying(value) {
  playing = value;
  document.querySelector('#pause-icon').toggleAttribute('hidden', !value);
  document.querySelector('#play-icon').toggleAttribute('hidden', value);
  play.setAttribute('aria-label', t(value ? 'pauseAnimation' : 'playAnimation'));
}
function setAngle(value) {
  angle = value;
  bend.value = (180 - value) / 180 * Math.PI;
  screens.outer.material.color.setScalar(value >= 180 ? 0 : 1);
}
function angleFromTime(t) {
  if (t < 1.2) return 180;
  if (t < 4.3) return 90 * (1 + Math.cos((t - 1.2) / 3.1 * Math.PI));
  if (t < 5.5) return 0;
  return 90 * (1 - Math.cos((t - 5.5) / 3.1 * Math.PI));
}
function formatTime(t) {
  const whole = Math.floor(t);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
function setTime(value) {
  time = value;
  slider.value = value;
  slider.style.setProperty('--progress', `${value / DURATION * 100}%`);
  timeCurrent.textContent = formatTime(value);
  setAngle(angleFromTime(value));
}
timeDuration.textContent = formatTime(Math.ceil(DURATION));
play.addEventListener('click', () => {
  transition = null;
  if (!playing) phase = time;
  setPlaying(!playing);
});
slider.addEventListener('input', () => {
  transition = null;
  setPlaying(false);
  setTime(Number(slider.value));
});
speedBtn.addEventListener('click', () => {
  speedIndex = (speedIndex + 1) % SPEEDS.length;
  const speed = SPEEDS[speedIndex];
  speedBtn.textContent = `${speed}×`;
  speedBtn.setAttribute('aria-label', t('playbackSpeed', { speed }));
});
// ---- 上传视频控制 ----
function updateVideoProgress() {
  if (!customVideo || videoControls.hidden) return;
  vtimeline.value = customVideo.currentTime;
  vtimeline.style.setProperty('--progress', `${customVideo.currentTime / customVideo.duration * 100}%`);
  vtimeCurrent.textContent = formatTime(customVideo.currentTime);
}
function updateVideoPlayIcon() {
  const playing = customVideo && !customVideo.paused;
  document.querySelector('#vplay-pause').toggleAttribute('hidden', !playing);
  document.querySelector('#vplay-play').toggleAttribute('hidden', playing);
  vplay.setAttribute('aria-label', locale === 'zh' ? (playing ? '暂停视频' : '播放视频') : (playing ? 'Pause video' : 'Play video'));
}
function updateVideoMuteIcon() {
  const muted = customVideo ? customVideo.muted : true;
  document.querySelector('#vmute-sound').toggleAttribute('hidden', muted);
  document.querySelector('#vmute-muted').toggleAttribute('hidden', !muted);
  vmute.setAttribute('aria-label', locale === 'zh' ? (muted ? '取消静音' : '静音') : (muted ? 'Unmute' : 'Mute'));
}
function showVideoControls(video) {
  videoControls.hidden = false;
  vtimeline.max = Number.isFinite(video.duration) ? video.duration : 0;
  vtimeDuration.textContent = formatTime(video.duration);
  updateVideoProgress();
  updateVideoPlayIcon();
  updateVideoMuteIcon();
  exportBtn.textContent = t('exportVideoWithMedia');
}
function hideVideoControls() {
  videoControls.hidden = true;
  vtimeline.value = 0;
  vtimeline.style.setProperty('--progress', '0%');
  vtimeCurrent.textContent = '0:00';
  if (typeof exportBtn !== 'undefined') exportBtn.textContent = t('exportVideo');
}
vplay.addEventListener('click', () => {
  if (!customVideo) return;
  if (customVideo.paused) customVideo.play().catch(() => {});
  else customVideo.pause();
});
vtimeline.addEventListener('input', () => {
  if (!customVideo) return;
  const value = Number(vtimeline.value);
  customVideo.currentTime = value;
  vtimeline.style.setProperty('--progress', `${value / customVideo.duration * 100}%`);
  vtimeCurrent.textContent = formatTime(value);
  if (customVideo.paused) {
    customVideo.addEventListener('seeked', () => drawSource(customVideo, customVideo.videoWidth, customVideo.videoHeight), { once: true });
  }
});
vmute.addEventListener('click', () => {
  if (!customVideo) return;
  customVideo.muted = !customVideo.muted;
  updateVideoMuteIcon();
});
vspeed.addEventListener('click', () => {
  vSpeedIndex = (vSpeedIndex + 1) % VSPEEDS.length;
  const rate = VSPEEDS[vSpeedIndex];
  vspeed.textContent = `${rate}×`;
  vspeed.setAttribute('aria-label', locale === 'zh' ? `视频倍速 ${rate}×` : `Video speed ${rate}×`);
  if (customVideo) customVideo.playbackRate = rate;
});
applyLocale();
exportBtn.addEventListener('click', () => {
  if (exportBtn.disabled || !ready) return;
  exportBtn.disabled = true;
  exportBtn.textContent = t('recording');
  const prevClearColor = renderer.getClearColor(new THREE.Color()).clone();
  const prevClearAlpha = renderer.getClearAlpha();
  renderer.setClearColor(0xf6f6f3, 1);
  // captureStream records the exact WebGL canvas, including the current camera
  // orbit/zoom and every fold-angle update rendered during the recording.
  const stream = renderer.domElement.captureStream(30);
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mimeType = candidates.find(type => window.MediaRecorder && MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 8_000_000 } : undefined);
  const chunks = [];
  recorder.ondataavailable = event => {
    if (event.data && event.data.size) chunks.push(event.data);
  };
  recorder.onstop = () => {
    renderer.setClearColor(prevClearColor, prevClearAlpha);
    stream.getTracks().forEach(track => track.stop());
    const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iPhone-Duo-折叠动画.${(recorder.mimeType || '').includes('mp4') ? 'mp4' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    exportBtn.disabled = false;
    exportBtn.textContent = customVideo ? t('exportVideoWithMedia') : t('exportVideo');
  };
  const previousTime = time;
  const previousPlaying = playing;
  phase = customVideo ? 0 : 0;
  transition = null;
  playing = true;
  setPlaying(true);
  if (customVideo) {
    customVideo.currentTime = 0;
    customVideo.play().catch(() => {});
  }
  recorder.start(200);
  const recordingDuration = customVideo && Number.isFinite(customVideo.duration)
    ? Math.min(Math.max(customVideo.duration * 1000, 1000), 30000)
    : 9600;
  setTimeout(() => {
    playing = false;
    setPlaying(false);
    if (customVideo) customVideo.pause();
    if (previousPlaying && !customVideo) {
      phase = previousTime;
      setTime(previousTime);
      setPlaying(true);
    }
    recorder.stop();
  }, recordingDuration);
});
function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  const pixelsPerUnit = Math.min(width / 25, height / 17, 37);
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(height / pixelsPerUnit / 2 / 40));
  camera.updateProjectionMatrix();
}
function updateDockSpace() {
  if (!controlDock) return;
  if (document.body.classList.contains('immersive-mode')) {
    document.documentElement.style.removeProperty('--dock-space');
    return;
  }
  const dockRect = controlDock.getBoundingClientRect();
  const mainRect = document.querySelector('main').getBoundingClientRect();
  const gap = window.matchMedia('(max-width: 700px)').matches ? 10 : 18;
  const space = Math.max(0, Math.ceil(mainRect.bottom - dockRect.top + gap));
  document.documentElement.style.setProperty('--dock-space', `${space}px`);
}
new ResizeObserver(resize).observe(viewport);
new ResizeObserver(updateDockSpace).observe(controlDock);
window.addEventListener('resize', updateDockSpace);
updateDockSpace();
resize();

const screenShader = `
uniform float foldAngle;
uniform vec2 uiPixel;
uniform vec4 uiFrame;
uniform vec2 uiGradient;
uniform vec3 uiReferenceEye;
varying vec3 vUIPosition;
vec3 screenColor() {
  // Intersect the fixed front-view ray with the unfolded inner-screen plane.
  float depth = (0.24948 - uiReferenceEye.z) / (vUIPosition.z - uiReferenceEye.z);
  vec2 projected = uiReferenceEye.xy + (vUIPosition.xy - uiReferenceEye.xy) * depth;
  vec2 sourceUV = (projected - uiFrame.xy) / uiFrame.zw;
  #ifdef INNER_UI
    float progress = clamp(foldAngle / 1.570796327, 0.0, 1.0);
  #else
    // Anchor the image to the projected hinge-side edge of the outer screen.
    float c = cos(foldAngle), s = sin(foldAngle);
    vec2 hingeEdge = vec2(-0.23396, -0.27463 - 0.275454);
    vec2 foldedEdge = vec2(c * hingeEdge.x + s * hingeEdge.y,
      -s * hingeEdge.x + c * hingeEdge.y + 0.275454);
    float edgeDepth = (0.24948 - uiReferenceEye.z) / (foldedEdge.y - uiReferenceEye.z);
    float anchorX = uiReferenceEye.x + (foldedEdge.x - uiReferenceEye.x) * edgeDepth;
    sourceUV.x = uiGradient.x + (projected.x - anchorX) / uiFrame.z;
    float progress = clamp((3.141592654 - foldAngle) / 1.570796327, 0.0, 1.0);
  #endif
  float edge = (sourceUV.x - uiGradient.x) / (uiGradient.y - uiGradient.x);
  float motion = smoothstep(0.0, 1.0, progress);
  float blurGradient = clamp(edge, 0.0, 1.0);
  float darkenGradient = clamp((edge - 0.2) / 0.8, 0.0, 1.0);
  float effect = motion * pow(darkenGradient, 1.35);
  float radius = 72.0 * motion * pow(blurGradient, 1.35);
  vec2 aa = max(fwidth(sourceUV), uiPixel * 0.5);
  vec2 dx = dFdx(sourceUV) / uiPixel;
  vec2 dy = dFdy(sourceUV) / uiPixel;
  float baseLod = log2(max(1.0, max(length(dx), length(dy))));
  vec2 coverage = smoothstep(-aa, aa, sourceUV)
    * (1.0 - smoothstep(vec2(1.0) - aa, vec2(1.0) + aa, sourceUV));
  vec3 color = textureLod(map, clamp(sourceUV, vec2(0.0), vec2(1.0)), baseLod).rgb * coverage.x * coverage.y;
  if (radius > 0.0) {
    // Use the same mip level at zero blur, then increase it continuously.
    float lod = max(baseLod, log2(max(1.0, radius)));
    vec2 footprint = max(aa, uiPixel * radius * 0.75);
    color = vec3(0.0);
    for (int y = -2; y <= 2; y++) {
      for (int x = -2; x <= 2; x++) {
        float wx = x == 0 ? 6.0 : (abs(x) == 1 ? 4.0 : 1.0);
        float wy = y == 0 ? 6.0 : (abs(y) == 1 ? 4.0 : 1.0);
        vec2 sampleUV = sourceUV + vec2(float(x), float(y)) * uiPixel * radius;
        // Blur the image and its coverage together so color spreads into the black margin.
        vec2 coverage = smoothstep(-footprint, footprint, sampleUV)
          * (1.0 - smoothstep(vec2(1.0) - footprint, vec2(1.0) + footprint, sampleUV));
        color += textureLod(map, clamp(sampleUV, vec2(0.0), vec2(1.0)), lod).rgb
          * coverage.x * coverage.y * wx * wy / 256.0;
      }
    }
  }
  return color * (1.0 - min(1.0, effect * 2.0));
}
`;

// The camera half stays in its original transform. Only the cover half rotates.
const foldShader = `
uniform float foldAngle;
vec2 rotateHinge(vec2 p) {
  float c = cos(foldAngle), s = sin(foldAngle);
  p.y -= 0.275454;
  return vec2(c * p.x + s * p.y, -s * p.x + c * p.y + 0.275454);
}
#ifdef FLEXIBLE_SCREEN
vec4 bendStrip(vec3 p) {
  float halfWidth = 0.35;
  if (p.x >= halfWidth) return vec4(p.x, p.z, 1.0, 0.0);
  if (p.x <= -halfWidth) return vec4(rotateHinge(p.xz), cos(foldAngle), -sin(foldAngle));
  float t = (p.x + halfWidth) / (2.0 * halfWidth);
  float t2 = t*t, t3 = t2*t;
  vec2 a = rotateHinge(vec2(-halfWidth, p.z));
  vec2 b = vec2(halfWidth, p.z);
  vec2 ta = 2.0 * halfWidth * vec2(cos(foldAngle), -sin(foldAngle));
  vec2 tb = vec2(2.0 * halfWidth, 0.0);
  vec2 point = (2.0*t3-3.0*t2+1.0)*a + (t3-2.0*t2+t)*ta + (-2.0*t3+3.0*t2)*b + (t3-t2)*tb;
  vec2 tangent = normalize((6.0*t2-6.0*t)*a + (3.0*t2-4.0*t+1.0)*ta + (-6.0*t2+6.0*t)*b + (3.0*t2-2.0*t)*tb);
  return vec4(point, tangent);
}
#endif
`;
function addBodyImageInjection(material) {
  const existing = material.onBeforeCompile;
  material.onBeforeCompile = shader => {
    if (existing) existing(shader);
    shader.vertexShader = `varying vec2 vBodyUV;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      vBodyUV = (transformed.xy + vec2(8.3, 6.0)) / vec2(16.6, 12.0);
      #include <project_vertex>
    `);
    shader.fragmentShader = `varying vec2 vBodyUV;
uniform sampler2D bodyMap;
uniform float bodyStrength;
${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(bodyMap, vBodyUV).rgb, bodyStrength);
    `);
    shader.uniforms.bodyMap = { value: bodyImageTexture };
    shader.uniforms.bodyStrength = bodyStrength;
  };
  const prevKey = material.customProgramCacheKey;
  material.customProgramCacheKey = () => `${prevKey.call(material)}-bodyimg`;
}
try {
  const model = await new USDLoader().loadAsync('./assets/iPhone_Duo_Render.usdc');
  model.scale.multiplyScalar(100);
  model.updateMatrixWorld(true);
  const count = { moving: 0, fixed: 0, flexible: 0 };
  model.traverse(object => {
    if (!object.isMesh) return;
    const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
    geometry.translate(0, -5.8974, 0);
    let ancestor = object;
    while (ancestor && !['upTUAKvMVkPOMKq', 'SiftyleUEEZwLhF'].includes(ancestor.name)) ancestor = ancestor.parent;
    const moving = ancestor?.name === 'upTUAKvMVkPOMKq';
    const flexible = ['JnJdTkxbQgUtLwU', 'xdyyaajWsatVNxN', 'UXtsBZYlaUvHoEh', 'MvKPXGSdYDVvSpk'].includes(object.name);
    const kind = object.name === 'UXtsBZYlaUvHoEh' ? 'inner' : object.name === 'hhgAIoCGsHXeDPY' ? 'outer' : null;
    const material = kind ? screens[kind].material : object.material.clone();
    if (!kind) bodyMaterials.push({ material, base: material.color.clone() });
    if (kind) {
      const p = geometry.attributes.position;
      const uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) {
        uv[i * 2] = kind === 'inner' ? (p.getX(i) + 7.89935) / 15.7987 : (-.23396 - p.getX(i)) / 7.73936;
        uv[i * 2 + 1] = kind === 'inner' ? (p.getY(i) + 5.8974 - .34562) / 11.1035 : (p.getY(i) + 5.8974 - .27173) / 11.2513;
      }
      geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    }
    if (moving || flexible) {
      material.onBeforeCompile = shader => {
        shader.uniforms.foldAngle = bend;
        if (kind) {
          shader.uniforms.uiFrame = screens[kind].frame;
          shader.uniforms.uiGradient = screens[kind].gradient;
          shader.uniforms.uiReferenceEye = { value: uiReferenceEye };
          shader.uniforms.uiPixel = screens[kind].pixel;
          shader.fragmentShader = shader.fragmentShader.replace('#include <map_pars_fragment>', `
            #include <map_pars_fragment>
            ${kind === 'inner' ? '#define INNER_UI' : ''}
            ${screenShader}
          `).replace('#include <map_fragment>', 'diffuseColor.rgb *= screenColor();');
          shader.vertexShader = `varying vec3 vUIPosition;\n${shader.vertexShader}`;
          shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
            vUIPosition = transformed;
            #include <project_vertex>
          `);
        }
        shader.vertexShader = `${flexible ? '#define FLEXIBLE_SCREEN\n' : ''}${foldShader}\n${shader.vertexShader}`;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', flexible ? `
          vec4 folded = bendStrip(position);
          vec3 transformed = vec3(folded.x, position.y, folded.y);
        ` : `
          vec2 folded = rotateHinge(position.xz);
          vec3 transformed = vec3(folded.x, position.y, folded.y);
        `);
        shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
          vec3 objectNormal = vec3(normal);
          ${flexible ? 'vec4 strip = bendStrip(position); float a = atan(-strip.w, strip.z);' : 'float a = foldAngle;'}
          objectNormal.x = cos(a) * normal.x + sin(a) * normal.z;
          objectNormal.z = -sin(a) * normal.x + cos(a) * normal.z;
        `);
      };
      material.customProgramCacheKey = () => `${flexible ? 'fold-flexible' : 'fold-cover'}-${kind || 'body'}`;
    }
    if (!kind) addBodyImageInjection(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = object.name;
    mesh.frustumCulled = false;
    phone.add(mesh);
    count[flexible ? 'flexible' : moving ? 'moving' : 'fixed']++;
  });
  console.info('Official model ready', JSON.stringify({ ...count, sourceMeshes: phone.children.length, innerUI: true, outerUI: true, fixedHalf: 'rear camera' }));
  setContentOrientation(contentOrientation);
  setModelOrientation(modelOrientation);
  showDefaultUI();
  document.querySelectorAll('button, input').forEach(element => element.disabled = false);
  ready = true;
  setTime(0);
} catch (error) {
  alert('模型加载失败，请刷新页面重试。');
  console.error(error);
}
let lastTime = performance.now();
renderer.setAnimationLoop(now => {
  const delta = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  if (ready && playing) {
    phase = (phase + delta * SPEEDS[speedIndex]) % DURATION;
    setTime(phase);
  } else if (transition) {
    transition.elapsed += delta;
    const progress = Math.min(transition.elapsed / 1.4, 1);
    const ease = progress * progress * (3 - 2 * progress);
    setAngle(THREE.MathUtils.lerp(transition.from, transition.to, ease));
    if (progress === 1) transition = null;
  }
  if (gestureRunning && gesturePose.active && ready) {
    // Keep the model responsive while smoothing camera/hand jitter.
    phone.rotation.y = THREE.MathUtils.lerp(phone.rotation.y, gesturePose.yaw, .16);
    phone.rotation.x = THREE.MathUtils.lerp(phone.rotation.x, gesturePose.pitch, .16);
    phone.rotation.z = THREE.MathUtils.lerp(phone.rotation.z, gesturePose.roll, .16);
    setAngle(gesturePose.fold);
  }
  if (customVideo && !customVideo.paused) drawSource(customVideo, customVideo.videoWidth, customVideo.videoHeight);
  controls.update();
  renderer.render(scene, camera);
});
