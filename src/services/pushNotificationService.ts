import { getToken, onMessage } from 'firebase/messaging'
import { collection, addDoc, query, getDocs, where } from 'firebase/firestore'
import { messaging, db } from '../config/firebase'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  launchUrl?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class PushNotificationService {
  private vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

  // Send push notification to all registered users
  async sendToAllUsers(
    title: string, 
    body: string, 
    options?: {
      imageUrl?: string
      launchUrl?: string
      data?: any
    }
  ): Promise<boolean> {
    try {
      console.log('Sending rich push notification to all users:', { 
        title, 
        body, 
        imageUrl: options?.imageUrl,
        launchUrl: options?.launchUrl 
      })
      
      // Create the notification payload
      const payload: PushNotificationPayload = {
        title,
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        image: options?.imageUrl,
        launchUrl: options?.launchUrl,
        data: {
          ...options?.data,
          url: '/',
          launchUrl: options?.launchUrl,
          timestamp: Date.now()
        },
        actions: [
          {
            action: 'open',
            title: 'Open App'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      }

      // Store the notification for tracking
      await this.storeNotificationLog(payload)

      // In a real implementation, you would:
      // 1. Get all user FCM tokens from your database
      // 2. Send to Firebase Cloud Messaging API
      // 3. Handle responses and update delivery status

      // For now, we'll simulate the push notification
      // and show it to users who have the app open
      this.simulatePushNotification(payload)

      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }

  // Send push notification to specific user
  async sendToUser(
    userId: string, 
    title: string, 
    body: string, 
    options?: {
      imageUrl?: string
      launchUrl?: string
      data?: any
    }
  ): Promise<boolean> {
    try {
      console.log('Sending rich push notification to user:', userId, { 
        title, 
        body,
        imageUrl: options?.imageUrl,
        launchUrl: options?.launchUrl 
      })
      
      const payload: PushNotificationPayload = {
        title,
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        image: options?.imageUrl,
        launchUrl: options?.launchUrl,
        data: {
          ...options?.data,
          userId,
          url: '/messages',
          launchUrl: options?.launchUrl,
          timestamp: Date.now()
        }
      }

      // Store the notification for tracking
      await this.storeNotificationLog(payload, userId)

      // Simulate push notification for specific user
      this.simulatePushNotification(payload)

      return true
    } catch (error) {
      console.error('Error sending push notification to user:', error)
      return false
    }
  }

  // Simulate push notification (for development/testing)
  private simulatePushNotification(payload: PushNotificationPayload) {
    console.log('Simulating rich push notification:', payload)
    
    // Check if user has granted notification permission
    if (Notification.permission === 'granted') {
      // Create rich browser notification
      const notificationOptions: NotificationOptions = {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        image: payload.image, // Rich notification image
        tag: 'tonygamingtz-push',
        data: payload.data,
        requireInteraction: true,
        actions: payload.actions as any,
        silent: false,
        vibrate: [200, 100, 200] // Vibration pattern for mobile
      }
      
      const notification = new Notification(payload.title, notificationOptions)

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
        
        // Navigate to launch URL if provided, otherwise default URL
        const targetUrl = payload.launchUrl || payload.data?.url || '/'
        
        // Check if it's an external URL
        if (targetUrl.startsWith('http')) {
          // External URL - open in new tab/window or use custom handler
          this.handleExternalUrl(targetUrl)
        } else {
          // Internal URL - navigate within app
          window.location.href = targetUrl
        }
      }

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close()
      }, 10000)
    }

    // Also trigger in-app notification for users currently using the app
    this.triggerInAppNotification(payload)
  }

  // Handle external URL opening (similar to your existing external link handler)
  private handleExternalUrl(url: string) {
    // Check if it's a TonyGamingTZ link
    if (url.includes('tonygamingtz.com')) {
      // Internal TonyGamingTZ link - open in WebView
      window.location.href = `/webview?url=${encodeURIComponent(url)}`
    } else {
      // External link - use your existing external link handler
      // For now, open in new tab
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Trigger in-app notification
  private triggerInAppNotification(payload: PushNotificationPayload) {
    // Dispatch custom event for in-app notification
    const event = new CustomEvent('pushNotificationReceived', {
      detail: {
        title: payload.title,
        body: payload.body,
        timestamp: new Date(),
        read: false,
        type: 'push',
        imageUrl: payload.image,
        launchUrl: payload.launchUrl,
        data: payload.data
      }
    })
    
    window.dispatchEvent(event)
  }

  // Store notification log for tracking
  private async storeNotificationLog(payload: PushNotificationPayload, userId?: string): Promise<void> {
    try {
      await addDoc(collection(db, 'pushNotificationLogs'), {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image,
        launchUrl: payload.launchUrl,
        targetUserId: userId || 'all',
        timestamp: new Date(),
        status: 'sent',
        data: payload.data
      })
    } catch (error) {
      console.error('Error storing notification log:', error)
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    totalSent: number
    sentToday: number
    sentThisWeek: number
  }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)

      // Get all notifications
      const allQuery = query(collection(db, 'pushNotificationLogs'))
      const allSnapshot = await getDocs(allQuery)
      
      // Get today's notifications
      const todayQuery = query(
        collection(db, 'pushNotificationLogs'),
        where('timestamp', '>=', today)
      )
      const todaySnapshot = await getDocs(todayQuery)
      
      // Get this week's notifications
      const weekQuery = query(
        collection(db, 'pushNotificationLogs'),
        where('timestamp', '>=', weekAgo)
      )
      const weekSnapshot = await getDocs(weekQuery)

      return {
        totalSent: allSnapshot.size,
        sentToday: todaySnapshot.size,
        sentThisWeek: weekSnapshot.size
      }
    } catch (error) {
      console.error('Error getting notification stats:', error)
      return {
        totalSent: 0,
        sentToday: 0,
        sentThisWeek: 0
      }
    }
  }

  // Setup push notification listener for admin
  setupAdminListener() {
    // Listen for custom push notification events
    window.addEventListener('pushNotificationReceived', (event: any) => {
      console.log('Push notification received:', event.detail)
      
      // You can add custom handling here for admin users
      // For example, showing a different UI or logging
    })
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  // Get FCM token (for real implementation)
  async getFCMToken(): Promise<string | null> {
    try {
      if (!this.vapidKey) {
        console.warn('VAPID key not configured')
        return null
      }

      const token = await getToken(messaging, {
        vapidKey: this.vapidKey
      })
      
      console.log('FCM Token:', token)
      return token
    } catch (error) {
      console.error('Error getting FCM token:', error)
      return null
    }
  }

  // Setup foreground message listener
  setupForegroundListener(callback: (notification: any) => void) {
    onMessage(messaging, (payload) => {
      console.log('Foreground FCM message received:', payload)
      
      const notification = {
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        timestamp: new Date(),
        read: false,
        type: 'push',
        data: payload.data
      }

      callback(notification)
    })
  }
}

export const pushNotificationService = new PushNotificationService()