import { sendPushNotification } from './push'

export async function sendWebPush(userId: string, title: string, message: string, url: string = '/') {
  return sendPushNotification(userId, {
    title,
    message,
    body: message,
    url
  })
}
