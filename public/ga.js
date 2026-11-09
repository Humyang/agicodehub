/*!
 * Google Analytics 4 引导脚本 —— 全站共用一份（站点根 /ga.js）
 *
 * 为什么单独一个文件：
 *   工具箱 SPA、文档站 /docs/、博客 /blog/ 是三个独立产物，
 *   但都挂在同一个域名下，硬编码三份 gtag 片段容易漏改 ID。
 *   这里只放一份，三处各用一个 <script async src="/ga.js"> 引入。
 *
 * 行为：
 *   1. 本地开发（localhost / 127.0.0.1 / *.local）默认不上报，
 *      避免自己的调试流量污染报表；加 ?ga=1 可强制打开做自测。
 *   2. 首屏 page_view 交给 gtag('config') 自动上报。
 *   3. SPA 路由切换（vue-router、VitePress 都是 history API）通过
 *      拦截 pushState / replaceState + popstate 补报 page_view，
 *      这样三个站点都不需要在框架层各写一遍路由钩子。
 */
(function () {
  var MEASUREMENT_ID = 'G-7VB7F5RY4Z';
  var host = location.hostname;
  var isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '' ||
    /\.local$/.test(host);

  if (isLocal && !/[?&]ga=1\b/.test(location.search)) {
    return;
  }

  // 被 SPA 用 iframe 嵌进来的老静态页（/static/**、/dve2/**）不上报，
  // 否则同一页面会被算两次：父页面一次、iframe 文档一次。
  if (window.self !== window.top) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(script);

  gtag('js', new Date());
  // 首屏由这里自动上报一次
  gtag('config', MEASUREMENT_ID);

  // ---- SPA 路由切换补报 ----
  var lastPath = location.pathname + location.search;

  function sendPageView(path, title) {
    gtag('event', 'page_view', {
      page_path: path,
      page_location: location.href,
      page_title: title,
    });
  }

  function reportPageView() {
    var path = location.pathname + location.search;
    if (path === lastPath) {
      return;
    }
    lastPath = path;

    // 框架（vue-router / VitePress）换完 document.title 是异步的，
    // 这里最多等 1s：标题一变就发，没变就按当前标题发。
    var startTitle = document.title;
    var tries = 0;
    (function waitForTitle() {
      tries += 1;
      if (document.title !== startTitle || tries > 10) {
        sendPageView(path, document.title);
        return;
      }
      setTimeout(waitForTitle, 100);
    })();
  }

  ['pushState', 'replaceState'].forEach(function (method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      reportPageView();
      return result;
    };
  });

  window.addEventListener('popstate', reportPageView);
})();
