'use client'

import Script from 'next/script'

export default function VisiblTracking() {
  return (
    <Script
      id="visibl-tracking"
      src="https://assets.govisibl.io/scripts/dist/v1/sk.min.js?s=1&t=6008c3a6-0ddf-47a3-9146-2c4a38a74751"
      strategy="afterInteractive"
      async
    />
  )
}
