/**
 * BeforeSpend Web Push Notification Manager
 */

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

/**
 * Check if Push Notifications are supported by the browser
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current Push Notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (!isPushNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request Push Notification permission from the user
 */
export async function requestPushNotificationPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported by this browser.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Push notification permission granted.');
      // Register Service Worker for push if not registered
      if (navigator.serviceWorker) {
        await navigator.serviceWorker.ready;
      }
      return true;
    } else {
      console.info('Push notification permission:', permission);
      return false;
    }
  } catch (err) {
    console.warn('Failed to request push notification permission:', err);
    return false;
  }
}

/**
 * Trigger a native system Push Notification (via Service Worker or Notification API)
 */
export async function triggerSystemPushNotification(options: PushNotificationOptions): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notificationTitle = options.title || 'Budget Alert 🔔';
    const notificationOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/favicon.png',
      badge: options.badge || '/favicon.png',
      tag: options.tag || 'beforespend-notif',
      data: { url: options.url || '/dashboard' },
    };

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(notificationTitle, notificationOptions);
        return true;
      }
    }

    // Fallback to standard web Notification API
    new Notification(notificationTitle, notificationOptions);
    return true;
  } catch (err) {
    console.warn('triggerSystemPushNotification error:', err);
    return false;
  }
}
