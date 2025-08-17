import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  doc,
  where,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { AuthUser } from './authService'

export interface ChatMessage {
  id?: string
  text?: string
  senderId: string
  senderName: string
  recipientId: string
  recipientName: string
  timestamp: any
  type: 'text' | 'image' | 'video' | 'file'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  read: boolean
  delivered: boolean
}

export interface UserStatus {
  uid: string
  isOnline: boolean
  lastSeen: any
  displayName: string
  isTyping?: boolean
}

export interface TypingStatus {
  userId: string
  userName: string
  timestamp: any
}

// Admin user ID - this should be your user ID
const ADMIN_USER_ID = 'admin_secure_uid' // Secure admin UID
const ADMIN_NAME = 'TONYGAMINGTZ' // Capitalized as requested

class ChatService {
  // Send text message
  async sendMessage(user: AuthUser, text: string, recipientId?: string): Promise<boolean> {
    try {
      // CENTRALIZED CHAT: All users can only chat with admin
      let recipient: string = ADMIN_USER_ID
      let recipientName: string = ADMIN_NAME
      
      if (this.isAdmin(user)) {
        // Admin can reply to specific user or broadcast to all
        if (recipientId && recipientId !== ADMIN_USER_ID) {
          recipient = recipientId
          recipientName = await this.getUserName(recipientId) || 'User'
        } else {
          // Broadcast message (visible to all users)
          recipient = 'broadcast'
          recipientName = 'All Users'
        }
      } else {
        // ALL USERS can ONLY send to admin - no user-to-user chat
        recipient = ADMIN_USER_ID
        recipientName = ADMIN_NAME
      }

      const message: Omit<ChatMessage, 'id'> = {
        text,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        recipientId: recipient,
        recipientName,
        timestamp: serverTimestamp(),
        type: 'text',
        read: false,
        delivered: true
      }

      await addDoc(collection(db, 'messages'), message)
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }

  // Get user name by ID
  private async getUserName(userId: string): Promise<string | null> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        return userData.displayName || userData.username || 'User'
      }
      return null
    } catch (error) {
      console.error('Error getting user name:', error)
      return null
    }
  }

  // Send file message (images, videos, documents, voice notes)
  async sendFile(user: AuthUser, file: File, caption?: string, recipientId?: string): Promise<boolean> {
    try {
      // Upload file to Firebase Storage
      const fileRef = ref(storage, `chat-files/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(fileRef, file)
      const fileUrl = await getDownloadURL(snapshot.ref)

      // Determine file type
      let type: 'image' | 'video' | 'file' = 'file'
      if (file.type.startsWith('image/')) {
        type = 'image'
      } else if (file.type.startsWith('video/')) {
        type = 'video'
      }

      // CENTRALIZED CHAT: All files go to admin only
      let recipient: string = ADMIN_USER_ID
      let recipientName: string = ADMIN_NAME
      
      if (this.isAdmin(user)) {
        // Admin can send files to specific user or broadcast
        if (recipientId && recipientId !== ADMIN_USER_ID) {
          recipient = recipientId
          recipientName = await this.getUserName(recipientId) || 'User'
        } else {
          recipient = 'broadcast'
          recipientName = 'All Users'
        }
      }
      
      const message: Omit<ChatMessage, 'id'> = {
        text: caption,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        recipientId: recipient,
        recipientName,
        timestamp: serverTimestamp(),
        type,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        read: false,
        delivered: true
      }

      await addDoc(collection(db, 'messages'), message)
      return true
    } catch (error) {
      console.error('Error sending file:', error)
      return false
    }
  }

  // Listen to messages
  onMessagesChange(user: AuthUser, callback: (messages: ChatMessage[]) => void): () => void {
    // CENTRALIZED CHAT SYSTEM:
    // - Admin sees ALL conversations with all users
    // - Regular users see ONLY their conversation with admin + broadcasts
    let q
    
    if (this.isAdmin(user)) {
      // Admin sees ALL messages from ALL users
      q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(100)
      )
    } else {
      // Regular users see ONLY their conversation with admin + broadcasts
      q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(100)
      )
    }

    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        
        if (this.isAdmin(user)) {
          // Admin sees ALL messages from ALL users
          messages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          } as ChatMessage)
        } else {
          // Regular users see ONLY:
          // 1. Their messages to admin
          // 2. Admin's replies to them specifically  
          // 3. Admin's broadcast messages
          // NO user-to-user messages allowed
          const shouldShow = 
            (data.senderId === user.uid && data.recipientId === ADMIN_USER_ID) ||
            (data.senderId === ADMIN_USER_ID && data.recipientId === user.uid) ||
            (data.senderId === ADMIN_USER_ID && data.recipientId === 'broadcast')
          
          if (shouldShow) {
            messages.push({
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate() || new Date()
            } as ChatMessage)
          }
        }
      })
      callback(messages.reverse())
    })
  }

  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        read: true
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Get user conversations (for admin to see all active chats)
  async getUserConversations(): Promise<{ userId: string, userName: string, lastMessage: string, timestamp: Date }[]> {
    try {
      // Only admin can see all conversations
      const q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(1000)
      )
      
      const snapshot = await getDocs(q)
      const conversations = new Map<string, any>()
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        
        // Only show conversations where admin is involved
        let otherUserId: string
        let otherUserName: string
        
        if (data.senderId === ADMIN_USER_ID && data.recipientId !== 'broadcast') {
          // Admin sent to user
          otherUserId = data.recipientId
          otherUserName = data.recipientName
        } else if (data.recipientId === ADMIN_USER_ID) {
          // User sent to admin
          otherUserId = data.senderId
          otherUserName = data.senderName
        } else {
          // Skip non-admin conversations
          return
        }
        
        if (otherUserId !== ADMIN_USER_ID && otherUserId !== 'broadcast' && !conversations.has(otherUserId)) {
          conversations.set(otherUserId, {
            userId: otherUserId,
            userName: otherUserName,
            lastMessage: data.text || (data.type === 'file' ? `Sent a ${data.type}` : 'Message'),
            timestamp: data.timestamp?.toDate() || new Date()
          })
        }
      })
      
      return Array.from(conversations.values())
    } catch (error) {
      console.error('Error getting user conversations:', error)
      return []
    }
  }

  // Initiate call to specific contact
  async initiateCall(
    caller: AuthUser,
    recipientId: string,
    recipientName: string,
    callType: 'voice' | 'video' = 'voice'
  ): Promise<boolean> {
    try {
      // CENTRALIZED CALLS: Only admin can receive calls from users
      // Users can only call admin, admin can call specific users
      if (!this.isAdmin(caller) && recipientId !== ADMIN_USER_ID) {
        throw new Error('Users can only call TonyGamingTZ Support')
      }
      
      const callData = {
        callerId: caller.uid,
        callerName: caller.displayName || 'Unknown',
        recipientId,
        recipientName,
        callType,
        status: 'initiated',
        timestamp: serverTimestamp()
      }

      await addDoc(collection(db, 'calls'), callData)
      return true
    } catch (error) {
      console.error('Error initiating call:', error)
      return false
    }
  }

  // Listen for incoming calls
  onIncomingCallsChange(
    userId: string,
    callback: (calls: { callerId: string, callerName: string, callType: 'voice' | 'video' }[]) => void
  ): () => void {
    const q = query(
      collection(db, 'calls'),
      where('recipientId', '==', userId),
      where('status', '==', 'ringing'),
      orderBy('timestamp', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      const calls: { callerId: string, callerName: string, callType: 'voice' | 'video' }[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        calls.push({
          callerId: data.callerId,
          callerName: data.callerName,
          callType: data.callType
        })
      })
      callback(calls)
    })
  }

  // Check if user is admin
  isAdmin(user: AuthUser): boolean {
    return user.isAdmin === true || user.uid === ADMIN_USER_ID || 
           user.displayName === 'TONYGAMINGTZ'
  }

  // Update user online status
  async updateUserStatus(user: AuthUser, isOnline: boolean): Promise<void> {
    try {
      const statusRef = doc(db, 'userStatus', user.uid)
      await setDoc(statusRef, {
        uid: user.uid,
        isOnline,
        lastSeen: serverTimestamp(),
        displayName: user.displayName || 'Anonymous',
        isTyping: false
      }, { merge: true })
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  // Update typing status
  async updateTypingStatus(user: AuthUser, isTyping: boolean): Promise<void> {
    try {
      const statusRef = doc(db, 'userStatus', user.uid)
      await updateDoc(statusRef, {
        isTyping,
        lastSeen: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating typing status:', error)
    }
  }

  // Listen to online users
  onOnlineUsersChange(callback: (users: UserStatus[]) => void): () => void {
    const q = query(
      collection(db, 'userStatus'),
      where('isOnline', '==', true)
    )

    return onSnapshot(q, (snapshot) => {
      const users: UserStatus[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          ...data,
          lastSeen: data.lastSeen?.toDate() || new Date()
        } as UserStatus)
      })
      callback(users)
    })
  }

  // Listen to typing users
  onTypingUsersChange(callback: (users: string[]) => void): () => void {
    const q = query(
      collection(db, 'userStatus'),
      where('isTyping', '==', true)
    )

    return onSnapshot(q, (snapshot) => {
      const typingUsers: string[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        typingUsers.push(data.displayName || 'Someone')
      })
      callback(typingUsers)
    })
  }

  // Send call notification
  async sendCallNotification(
    caller: AuthUser, 
    recipientId: string,
    recipientName: string,
    callType: 'voice' | 'video' | 'screen'
  ): Promise<boolean> {
    try {
      // CENTRALIZED CALLS: Enforce admin-only calling
      if (!this.isAdmin(caller) && recipientId !== ADMIN_USER_ID) {
        throw new Error('Users can only call TonyGamingTZ Support')
      }
      
      const callData = {
        callerId: caller.uid,
        callerName: caller.displayName || 'Anonymous',
        recipientId,
        recipientName,
        callType,
        status: 'ringing',
        timestamp: serverTimestamp(),
      }

      await addDoc(collection(db, 'calls'), callData)
      return true
    } catch (error) {
      console.error('Error sending call notification:', error)
      return false
    }
  }

  // Answer call
  async answerCall(callId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'answered'
      })
      return true
    } catch (error) {
      console.error('Error answering call:', error)
      return false
    }
  }

  // Reject call
  async rejectCall(callId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'rejected'
      })
      return true
    } catch (error) {
      console.error('Error rejecting call:', error)
      return false
    }
  }

  // End call
  async endCall(callId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'ended'
      })
      return true
    } catch (error) {
      console.error('Error ending call:', error)
      return false
    }
  }
}

export const chatService = new ChatService()