import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { AuthUser } from './authService'

export interface CallData {
  id?: string
  callerId: string
  callerName: string
  callerNumber: string
  recipientId: string
  recipientName: string
  recipientNumber: string
  callType: 'voice' | 'video'
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed'
  timestamp: any
  duration?: number
}

class CallService {
  // Initiate a call
  async initiateCall(
    caller: AuthUser,
    recipientId: string,
    recipientName: string,
    recipientNumber: string,
    callType: 'voice' | 'video' = 'voice'
  ): Promise<string | null> {
    try {
      const callData: Omit<CallData, 'id'> = {
        callerId: caller.uid,
        callerName: caller.displayName || 'Unknown',
        callerNumber: caller.phoneNumber || 'Unknown',
        recipientId,
        recipientName,
        recipientNumber,
        callType,
        status: 'ringing',
        timestamp: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'calls'), callData)
      return docRef.id
    } catch (error) {
      console.error('Error initiating call:', error)
      return null
    }
  }

  // Listen for incoming calls
  onIncomingCalls(
    userId: string,
    callback: (calls: CallData[]) => void
  ): () => void {
    const q = query(
      collection(db, 'calls'),
      where('recipientId', '==', userId),
      where('status', '==', 'ringing'),
      orderBy('timestamp', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      const calls: CallData[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        calls.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as CallData)
      })
      callback(calls)
    })
  }

  // Accept a call
  async acceptCall(callId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error('Error accepting call:', error)
      return false
    }
  }

  // Decline a call
  async declineCall(callId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'declined',
        declinedAt: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error('Error declining call:', error)
      return false
    }
  }

  // End a call
  async endCall(callId: string, duration?: number): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'ended',
        endedAt: serverTimestamp(),
        duration: duration || 0
      })
      return true
    } catch (error) {
      console.error('Error ending call:', error)
      return false
    }
  }

  // Mark call as missed
  async markAsMissed(callId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'missed',
        missedAt: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error('Error marking call as missed:', error)
      return false
    }
  }

  // Get call history
  async getCallHistory(userId: string): Promise<CallData[]> {
    try {
      const q = query(
        collection(db, 'calls'),
        where('callerId', '==', userId),
        orderBy('timestamp', 'desc')
      )

      // Note: In a real implementation, you'd use getDocs here
      // For now, we'll return an empty array
      return []
    } catch (error) {
      console.error('Error getting call history:', error)
      return []
    }
  }

  // Simulate incoming call (for demo purposes)
  simulateIncomingCall(
    recipientId: string,
    callerName: string = 'TonyGamingTZ Support',
    callerNumber: string = '+255 612 111 793',
    callType: 'voice' | 'video' = 'voice'
  ): Promise<string | null> {
    return this.initiateCall(
      {
        uid: 'demo_caller',
        displayName: callerName,
        phoneNumber: callerNumber,
        isAnonymous: false
      } as AuthUser,
      recipientId,
      'You',
      'Your Number',
      callType
    )
  }
}

export const callService = new CallService()