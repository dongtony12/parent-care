// Service Worker — Web Push 알림 처리
// Next.js 16 PWA 가이드 기반: https://nextjs.org/docs/app/guides/progressive-web-apps

self.addEventListener('install', (event) => {
  // 새 SW 즉시 활성화
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // 모든 클라이언트 즉시 제어
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: '안심 케어', body: event.data.text() }
  }

  const options = {
    body: data.body ?? '',
    icon: data.icon ?? '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url ?? '/',
      timestamp: Date.now(),
    },
    tag: data.tag,           // 같은 tag면 알림이 갱신됨 (중복 방지)
    renotify: data.renotify ?? false,
    vibrate: [120, 60, 120],
  }

  event.waitUntil(self.registration.showNotification(data.title ?? '안심 케어', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열려있는 탭 있으면 포커스 + 해당 URL로 이동
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // 없으면 새 창
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})
