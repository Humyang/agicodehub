export default function ({ id }: { id: string }) {
  if (typeof window === 'undefined' || window.location.hostname === 'localhost')
    return

  if (document.getElementById('gtm-noscript'))
    return

  const noscript = document.createElement('noscript')
  noscript.id = 'gtm-noscript'
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe>`
  document.body.appendChild(noscript)
}
