import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '부모님 안심 케어',
    short_name: '안심케어',
    description: '매일 부모님께 자식의 안부를 자동으로 전하는 PWA',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316',
    lang: 'ko',
    orientation: 'portrait',
    icons: [
      // SVG 단일 아이콘 (개발용). 프로덕션 배포 전 192/512 PNG로 교체 권장.
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
