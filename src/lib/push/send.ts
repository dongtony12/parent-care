import 'server-only'
import webpush from 'web-push'

let configured = false

function ensureConfigured() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  configured = true
}

export type PushSubscriptionPayload = {
  endpoint: string
  p256dh: string
  auth: string
}

export type PushNotificationPayload = {
  title: string
  body: string
  url?: string
}

export async function sendPush(
  subscription: PushSubscriptionPayload,
  payload: PushNotificationPayload,
): Promise<{ ok: true } | { ok: false; statusCode: number | null; gone: boolean }> {
  ensureConfigured()
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
    )
    return { ok: true }
  } catch (err) {
    const statusCode =
      typeof err === 'object' && err && 'statusCode' in err
        ? (err as { statusCode: number }).statusCode
        : null
    return {
      ok: false,
      statusCode,
      gone: statusCode === 404 || statusCode === 410,
    }
  }
}
