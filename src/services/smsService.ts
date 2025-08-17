import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { AuthUser } from './authService'

export interface SMSMessage {
  id?: string
  senderId: string
  senderName: string
  senderNumber: string
  recipientId: string
  recipientName: string
  recipientNumber: string
  message: string
  timestamp: any
  status: 'sent' | 'delivered' | 'read'
  type: 'incoming' | 'outgoing'
}

class SMSService {
  // Send SMS message
  async sendSMS(
    sender: AuthUser,
    recipientId: string,
    recipientName: string,
    recipientNumber: string,
    message: string
  ): Promise<boolean> {
    try {
      // Store SMS in database for tracking
      const smsData: Omit<SMSMessage, 'id'> = {
        senderId: sender.uid,
        senderName: sender.displayName || 'Unknown',
        senderNumber: sender.phoneNumber || 'Unknown',
        recipientId,
        recipientName,
        recipientNumber,
        message,
        timestamp: serverTimestamp(),
        status: 'sent',
        type: 'outgoing'
      }

      await addDoc(collection(db, 'sms'), smsData)

      // Open native SMS app
      const encodedMessage = encodeURIComponent(message)
      const smsUrls = [
        `sms:${recipientNumber}?body=${encodedMessage}`, // iOS format
        `sms:${recipientNumber}&body=${encodedMessage}`, // Android format
        `sms://${recipientNumber}?body=${encodedMessage}` // Alternative format
      ]

      // Try each URL format
      for (const url of smsUrls) {
        try {
          window.location.href = url
          return true
        } catch (error) {
          continue
        }
      }

      return false
    } catch (error) {
      console.error('Error sending SMS:', error)
      return false
    }
  }

  // Listen for SMS messages
  onSMSMessages(
    userId: string,
    callback: (messages: SMSMessage[]) => void
  ): () => void {
    const q = query(
      collection(db, 'sms'),
      where('recipientId', '==', userId),
      orderBy('timestamp', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      const messages: SMSMessage[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as SMSMessage)
      })
      callback(messages)
    })
  }

  // Get SMS history
  async getSMSHistory(userId: string): Promise<SMSMessage[]> {
    try {
      // In a real implementation, you'd use getDocs here
      return []
    } catch (error) {
      console.error('Error getting SMS history:', error)
      return []
    }
  }

  // Quick reply templates
  getQuickReplies(): string[] {
    return [
      "Hello! How can I help you?",
      "Thanks for contacting TonyGamingTZ!",
      "I'll get back to you soon.",
      "Can you call me instead?",
      "What game are you looking for?",
      "Check our website for latest games!",
      "Sure, no problem!",
      "I'm busy right now, I'll call you later.",
      "Please send me more details.",
      "I'll check and let you know."
    ]
  }

  // Auto-reply for missed calls
  getAutoReplyForMissedCall(): string {
    return "I missed your call. What can I help you with?"
  }

  // Business hours auto-reply
  getBusinessHoursReply(): string {
    const now = new Date()
    const hour = now.getHours()
    
    if (hour < 8 || hour > 18) {
      return "Thanks for contacting TonyGamingTZ! Our business hours are 8 AM - 6 PM. I'll get back to you during business hours."
    }
    
    return "Thanks for contacting TonyGamingTZ! I'll respond to you shortly."
  }
}

export const smsService = new SMSService()