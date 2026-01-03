'use client'

import Script from 'next/script'

export default function RaptiveScript() {
  return (
    <>
      <Script
        id="raptive-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.adthrive = window.adthrive || {};
            window.adthrive.cmd = window.adthrive.cmd || [];
            window.adthrive.plugin = 'adthrive-ads-manual';
            window.adthrive.host = 'ads.adthrive.com';
          `,
        }}
      />
      <Script
        id="raptive-loader"
        src={`https://ads.adthrive.com/sites/5e163f2211916d4860b8f332/ads.min.js?referrer=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}&cb=${Math.floor(Math.random() * 100) + 1}`}
        strategy="afterInteractive"
        async
        defer
        referrerPolicy="no-referrer-when-downgrade"
      />
    </>
  )
}
