/**
 * Progressive enhancement Web Notification helper.
 * Safe for all browsers, zero side-effects if unsupported or denied.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permission', err);
    return false;
  }
}

export function sendNotification(title: string, body?: string, icon: string = '/icon.svg'): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon,
          badge: icon,
        });
      });
    } else {
      new Notification(title, {
        body,
        icon,
      });
    }
  } catch (err) {
    console.warn('Failed to send notification', err);
  }
}
