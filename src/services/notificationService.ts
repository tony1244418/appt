import { getToken, onMessage } from 'firebase/messaging'
import { collection, addDoc, query, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore'
import { messaging, db } from '../config/firebase'

export interface Notification {
  id?: string
  title: string
  body: string
  timestamp: Date
  read: boolean
  type: 'push' | 'in-app'
  imageUrl?: string
  launchUrl?: string
  data?: any
}

class NotificationService {
  private vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

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

  // Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey
      })
      return token
    } catch (error) {
      console.error('Error getting FCM token:', error)
      return null
    }
  }

  // Setup foreground message listener
  setupForegroundListener(callback: (notification: Notification) => void) {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)
      
      const notification: Notification = {
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        timestamp: new Date(),
        read: false,
        type: 'push',
        data: payload.data
      }

      // Store in Firestore
      this.storeNotification(notification)
      
      // Show in-app notification
      callback(notification)
    })
  }

  // Store notification in Firestore
  async storeNotification(notification: Omit<Notification, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        timestamp: notification.timestamp
      })
      return docRef.id
    } catch (error) {
      console.error('Error storing notification:', error)
      return null
    }
  }

  // Get stored notifications
  async getNotifications(limitCount: number = 50): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      const notifications: Notification[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        notifications.push({
          id: doc.id,
          title: data.title,
          body: data.body,
          timestamp: data.timestamp.toDate(),
          read: data.read,
          type: data.type,
          data: data.data
        })
      })
      
      return notifications
    } catch (error) {
      console.error('Error getting notifications:', error)
      return []
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      })
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  // Check if should show daily reminder
  shouldShowDailyReminder(): boolean {
    const permission = this.getPermissionStatus()
    if (permission !== 'denied') return false
    
    const lastShown = localStorage.getItem('notificationBannerLastShown')
    const dismissedToday = localStorage.getItem('notificationBannerDismissedToday')
    const today = new Date().toDateString()
    
    // If dismissed today, don't show
    if (dismissedToday === today) {
      return false
    }
    
    // If never shown or not shown today, show it
    return !lastShown || lastShown !== today
  }
}

export const notificationService = new NotificationService()