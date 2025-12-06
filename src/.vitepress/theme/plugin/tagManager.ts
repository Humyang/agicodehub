export default function ({ id }: { id: string }) {
  if (typeof window === 'undefined' || window.location.hostname === 'localhost')
    return

  if (document.getElementById('gtm-js'))
    return

  const script = document.createElement('script')
  script.id = 'gtm-js'
  script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${id}');`
  document.head.appendChild(script)
}
