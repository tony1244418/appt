import React, { useState, useEffect, useRef } from 'react'
import { 
  Send, 
  Paperclip, 
  Camera, 
  Mic, 
  Phone, 
  Monitor,
  Image as ImageIcon,
  FileText,
  Play,
  Pause,
  Download,
  X,
  Users,
  ArrowDown,
  MoreVertical,
  LogOut,
  Trash2,
  StopCircle,
  MessageCircle
} from 'lucide-react'
import { AuthUser, authService } from '../services/authService'
import { chatService, ChatMessage } from '../services/chatService'
import toast from 'react-hot-toast'
import IncomingCallModal from './IncomingCallModal'
import SMSModal from './SMSModal'

interface ChatInterfaceProps {
  user: AuthUser
  selectedUserId?: string
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, selectedUserId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({})
  const [showCallModal, setShowCallModal] = useState(false)
  const [callType, setCallType] = useState<'voice' | 'screen'>('voice')
  const [isInCall, setIsInCall] = useState(false)
  const [showMediaPreview, setShowMediaPreview] = useState<string | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [showConversations, setShowConversations] = useState(false)
  const [currentRecipient, setCurrentRecipient] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([])
  const [showIncomingCall, setShowIncomingCall] = useState(false)
  const [showSMSModal, setShowSMSModal] = useState(false)
  const [incomingCallData, setIncomingCallData] = useState<{
    callerName: string
    callerId: string
    callType: 'voice' | 'video'
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Listen to messages
    const unsubscribeMessages = chatService.onMessagesChange(user, setMessages)
    
    // Listen to online users
    const unsubscribeUsers = chatService.onOnlineUsersChange(setOnlineUsers)
    
    // Update user status
    chatService.updateUserStatus(user, true)
    
    // Cleanup on unmount
    return () => {
      unsubscribeMessages()
      unsubscribeUsers()
      chatService.updateUserStatus(user, false)
    }
  }, [user])

  useEffect(() => {
    // Load conversations for admin
    if (chatService.isAdmin(user)) {
      loadConversations()
    }
  }, [user])

  // Simulate incoming call (for demo purposes)
  useEffect(() => {
    // Listen for incoming calls for this specific user
    const unsubscribe = chatService.onIncomingCallsChange(user.uid, (calls) => {
      if (calls.length > 0 && !showIncomingCall) {
        const call = calls[0] // Get the most recent call
        setIncomingCallData({
          callerName: call.callerName,
          callerId: call.callerId,
          callType: call.callType
        })
        setShowIncomingCall(true)
      }
    })

    return () => unsubscribe()
  }, [user.uid, showIncomingCall])

  const loadConversations = async () => {
    const convs = await chatService.getUserConversations()
    setConversations(convs)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100)
      }
      
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleLogout = async () => {
    await authService.signOut()
    toast.success('Logged out successfully')
    setShowLogoutConfirm(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const success = await chatService.sendMessage(user, newMessage.trim(), currentRecipient || undefined)
    if (success) {
      setNewMessage('')
      setIsTyping(false)
    } else {
      toast.error('Failed to send message')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    const success = await chatService.sendFile(user, file, undefined, currentRecipient || undefined)
    if (success) {
      toast.success('File sent successfully')
    } else {
      toast.error('Failed to send file')
    }
    
    e.target.value = ''
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        setVoicePreviewUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      toast.error('Could not access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const playVoicePreview = () => {
    if (!voicePreviewUrl) return

    if (isPreviewPlaying) {
      previewAudioRef.current?.pause()
      setIsPreviewPlaying(false)
    } else {
      previewAudioRef.current = new Audio(voicePreviewUrl)
      previewAudioRef.current.play()
      setIsPreviewPlaying(true)
      
      previewAudioRef.current.onended = () => {
        setIsPreviewPlaying(false)
      }
    }
  }

  const sendVoiceNote = async () => {
    if (!audioBlob) return
    
    const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
    const success = await chatService.sendFile(user, file, undefined, currentRecipient || undefined)
    
    if (success) {
      toast.success('Voice note sent')
      cancelVoiceNote()
    } else {
      toast.error('Failed to send voice note')
    }
  }

  const cancelVoiceNote = () => {
    setAudioBlob(null)
    setVoicePreviewUrl(null)
    setRecordingTime(0)
    setIsPreviewPlaying(false)
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
  }

  const playAudio = (messageId: string, audioUrl: string) => {
    if (isPlaying[messageId]) {
      audioRef.current?.pause()
      setIsPlaying(prev => ({ ...prev, [messageId]: false }))
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      setIsPlaying(prev => ({ ...prev, [messageId]: true }))
      
      audioRef.current.onended = () => {
        setIsPlaying(prev => ({ ...prev, [messageId]: false }))
      }
    }
  }

  const startCall = (type: 'voice' | 'screen') => {
    setCallType(type)
    setShowCallModal(true)
  }

  const initiateCall = async () => {
    try {
      let stream: MediaStream
      
      if (callType === 'screen') {
        // Get screen sharing stream with audio
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        })
        
        // Get microphone stream for voice communication
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        })
        
        // Combine screen video with microphone audio
        const combinedStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...micStream.getAudioTracks()
        ])
        
        stream = combinedStream
        setIsScreenSharing(true)
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          endCall()
        }
        
        toast.success('Screen sharing with voice started')
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: false, 
          audio: true 
        })
        toast.success('Voice call started')
      }
      
      setLocalStream(stream)
      setIsInCall(true)
      setShowCallModal(false)
      
      // Display local stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
    } catch (error) {
      console.error('Error starting call:', error)
      
      // Handle specific permission errors
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
          toast.error(
            `Permission denied. Please allow ${callType === 'screen' ? 'screen sharing and microphone' : 'microphone'} access in your browser settings and try again.`,
            { duration: 6000 }
          )
        } else if (error.name === 'NotFoundError') {
          toast.error(
            `No ${callType === 'screen' ? 'screen or microphone' : 'microphone'} found. Please check your device settings.`,
            { duration: 4000 }
          )
        } else if (error.name === 'NotSupportedError') {
          toast.error(
            `${callType === 'screen' ? 'Screen sharing' : 'Voice calls'} not supported in this browser.`,
            { duration: 4000 }
          )
        } else {
          toast.error(`Could not start ${callType === 'screen' ? 'screen sharing with voice' : 'voice call'}: ${error.message}`)
        }
      } else {
        toast.error(`Could not start ${callType === 'screen' ? 'screen sharing with voice' : 'voice call'}`)
      }
      
      setShowCallModal(false)
    }
  }

  const endCall = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    
    setIsInCall(false)
    setIsScreenSharing(false)
    setIsMuted(false)
    setRemoteStreams([])
    
    toast.success(`${callType === 'screen' ? 'Screen sharing' : 'Call'} ended`)
  }
  
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
      toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted')
    }
  }

  const handleAcceptCall = () => {
    setShowIncomingCall(false)
    setIsInCall(true)
    setCallType('voice')
    toast.success('Call connected!')
    
    // Start actual call functionality
    initiateCall()
  }

  const handleDeclineCall = () => {
    setShowIncomingCall(false)
    toast.success('Call declined')
  }

  const handleIncomingCallMessage = () => {
    setShowIncomingCall(false)
    setShowSMSModal(true)
  }

  const handleSendSMS = (message: string) => {
    // Open SMS app with pre-filled message (using caller ID to get contact info)
    const contactInfo = getContactInfo(incomingCallData?.callerId || 'admin')
    const encodedMessage = encodeURIComponent(message)
    
    // Try different SMS URL formats for better compatibility
    const smsUrls = [
      `sms:${contactInfo.phoneNumber}?body=${encodedMessage}`, // iOS format
      `sms:${contactInfo.phoneNumber}&body=${encodedMessage}`, // Android format
      `sms://${contactInfo.phoneNumber}?body=${encodedMessage}` // Alternative format
    ]
    
    // Try each URL format
    let opened = false
    for (const url of smsUrls) {
      try {
        window.location.href = url
        opened = true
        break
      } catch (error) {
        continue
      }
    }
    
    if (opened) {
      toast.success('SMS app opened!')
    } else {
      toast.error('Could not open SMS app')
    }
  }

  const handleCallFromSMS = () => {
    setShowSMSModal(false)
    const contactInfo = getContactInfo(incomingCallData?.callerId || 'admin')
    
    try {
      window.location.href = `tel:${contactInfo.phoneNumber}`
      toast.success('Opening phone dialer...')
    } catch (error) {
      toast.error('Could not open phone dialer')
    }
  }

  // Get contact information by user ID (privacy-focused)
  const getContactInfo = (userId: string) => {
    const contacts = {
      'admin_secure_uid': {
        name: 'TonyGamingTZ Support',
        phoneNumber: '+255612111793'
      },
      'admin': {
        name: 'TonyGamingTZ Support', 
        phoneNumber: '+255612111793'
      },
      'user_612111793': {
        name: 'TonyGamingTZ Support',
        phoneNumber: '+255612111793'
      }
    }
    
    return contacts[userId as keyof typeof contacts] || {
      name: 'Unknown Contact',
      phoneNumber: '+255000000000'
    }
  }

  // Initiate call to specific person
  const initiateCallToContact = async (contactId: string) => {
    const contactInfo = getContactInfo(contactId)
    
    try {
      // Store call attempt in database
      await chatService.initiateCall(user, contactId, contactInfo.name, 'voice')
      
      // Open phone dialer
      window.location.href = `tel:${contactInfo.phoneNumber}`
      toast.success(`Calling ${contactInfo.name}...`)
    } catch (error) {
      toast.error('Could not initiate call')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwn = message.senderId === user.uid
    const isFromAdmin = message.senderId === 'admin_tonygamingtz'
    const isToAdmin = message.recipientId === 'admin_tonygamingtz'
    const timestamp = message.timestamp instanceof Date 
      ? message.timestamp 
      : new Date(message.timestamp?.seconds * 1000)

    return (
      <div
        key={message.id}
        className={`flex mb-4 message-enter ${isOwn ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          {!isOwn && (
            <div className="text-xs text-gray-500 mb-1 px-3">
              {isFromAdmin ? (
                <div className="flex items-center space-x-1">
                  <img 
                    src="https://tonygamingtz.com/wp-content/uploads/2024/11/cropped-cropped-20241124_183631.png" 
                    alt="TonyGamingTZ"
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="font-medium">TONYGAMINGTZ Support</span>
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : message.senderName}
            </div>
          )}
          
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwn
                ? 'bg-red-600 text-white rounded-br-md'
                : isFromAdmin 
                  ? 'bg-blue-600 text-white rounded-bl-md'
                  : 'bg-gray-200 text-black rounded-bl-md'
            }`}
          >
            {message.type === 'text' && (
              <p className="break-words">{message.text}</p>
            )}
            
            {message.type === 'image' && (
              <div className="space-y-2">
                <img
                  src={message.fileUrl}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowMediaPreview(message.fileUrl!)}
                />
                {message.text && <p className="break-words">{message.text}</p>}
              </div>
            )}
            
            {message.type === 'video' && (
              <div className="space-y-2">
                <video
                  src={message.fileUrl}
                  controls
                  className="max-w-full h-auto rounded-lg"
                  preload="metadata"
                />
                {message.text && <p className="break-words">{message.text}</p>}
              </div>
            )}
            
            {message.type === 'file' && message.fileName?.includes('voice_') && (
              <div className="flex items-center space-x-3 min-w-[200px]">
                <button
                  onClick={() => playAudio(message.id!, message.fileUrl!)}
                  className={`p-2 rounded-full transition-colors ${
                    isOwn 
                      ? 'bg-red-700 hover:bg-red-800' 
                      : isFromAdmin 
                        ? 'bg-blue-700 hover:bg-blue-800'
                        : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  {isPlaying[message.id!] ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm">Voice message</span>
                  </div>
                  <div className="text-xs opacity-70">
                    {formatFileSize(message.fileSize || 0)}
                  </div>
                </div>
              </div>
            )}
            
            {message.type === 'file' && !message.fileName?.includes('voice_') && (
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{message.fileName}</div>
                  <div className="text-xs opacity-70">
                    {formatFileSize(message.fileSize || 0)}
                  </div>
                </div>
                <a
                  href={message.fileUrl}
                  download={message.fileName}
                  className={`p-2 rounded-full transition-colors ${
                    isOwn 
                      ? 'bg-red-700 hover:bg-red-800' 
                      : isFromAdmin 
                        ? 'bg-blue-700 hover:bg-blue-800'
                        : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs opacity-70">
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isOwn && (
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-current rounded-full opacity-70"></div>
                  <div className={`w-1 h-1 rounded-full ${
                    message.delivered ? 'bg-current' : 'bg-current opacity-30'
                  }`}></div>
                  {message.read && (
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {chatService.isAdmin(user) ? (
                <div className="relative">
                  <img 
                    src="https://tonygamingtz.com/wp-content/uploads/2024/11/cropped-cropped-20241124_183631.png" 
                    alt="TonyGamingTZ"
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  <div className="absolute -top-1 -right-1">
                    <svg className="w-4 h-4 text-blue-500 bg-white rounded-full" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ) : (
                <img 
                  src="https://tonygamingtz.com/wp-content/uploads/2024/11/cropped-cropped-20241124_183631.png" 
                  alt="TonyGamingTZ"
                  className="w-10 h-10 rounded-full border-2 border-red-600"
                />
              )}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-black">
                  {chatService.isAdmin(user) ? 'TONYGAMINGTZ (You) - All Users Chat' : 'TONYGAMINGTZ Support'}
                </h3>
                {chatService.isAdmin(user) && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {chatService.isAdmin(user) 
                  ? `Managing all user conversations • ${onlineUsers.length} users online • You can reply to any user`
                  : 'Direct chat with TONYGAMINGTZ Support only'
                } • {chatService.isAdmin(user) 
                  ? 'All users chat with you exclusively' 
                  : user.isAnonymous 
                    ? 'Guest User' 
                    : 'Verified User'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {chatService.isAdmin(user) && (
              <button
                onClick={() => setShowConversations(!showConversations)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="View Conversations"
              >
                <Users className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => startCall('voice')}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Voice Call"
            >
              <Phone className="w-5 h-5" />
            </button>
            
            {/* Quick Call to TonyGamingTZ */}
            <button
              onClick={() => initiateCallToContact('admin_secure_uid')}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Call TonyGamingTZ Support"
            >
              <Phone className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => startCall('screen')}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Screen Share"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Admin Conversations Sidebar */}
      {chatService.isAdmin(user) && showConversations && (
        <div className="bg-white border-b border-gray-200 p-4 max-h-48 overflow-y-auto">
          <h4 className="font-semibold text-black mb-3">All User Conversations</h4>
          <p className="text-xs text-gray-600 mb-3">All users can only chat with you - no user-to-user messaging</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setCurrentRecipient(null)
                setShowConversations(false)
              }}
              className={`w-full text-left p-2 rounded-lg transition-colors ${
                !currentRecipient ? 'bg-red-100 text-red-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">All User Messages</div>
              <div className="text-xs text-gray-600">View all conversations</div>
            </button>
            {conversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => {
                  setCurrentRecipient(conv.userId)
                  setShowConversations(false)
                }}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  currentRecipient === conv.userId ? 'bg-red-100 text-red-800' : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{conv.userName}</div>
                <div className="text-xs text-gray-600 truncate">{conv.lastMessage}</div>
                <div className="text-xs text-gray-400">{conv.timestamp.toLocaleTimeString()}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth chat-scroll"
      >
        {messages.map(renderMessage)}
        
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-2xl rounded-bl-md px-4 py-2">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full typing-dot"></div>
                </div>
                <span className="text-xs text-gray-600 ml-2">typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors z-10"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Voice Recording UI */}
      {(isRecording || audioBlob) && (
        <div className="bg-red-50 border-t border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Mic className={`w-5 h-5 text-red-600 ${isRecording ? 'recording-pulse' : ''}`} />
                <span className="text-red-800 font-medium">
                  {isRecording ? 'Recording...' : 'Voice note ready'}
                </span>
              </div>
              <span className="text-red-600 font-mono">
                {formatTime(recordingTime)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {audioBlob && !isRecording && (
                <button
                  onClick={playVoicePreview}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                  title="Preview voice note"
                >
                  {isPreviewPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
              )}
              <button
                onClick={cancelVoiceNote}
                className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                title="Cancel"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              {audioBlob && (
                <button
                  onClick={sendVoiceNote}
                  className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-full transition-colors"
                  title="Send voice note"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex space-x-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Camera"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                chatService.isAdmin(user) 
                  ? currentRecipient 
                    ? `Replying to ${conversations.find(c => c.userId === currentRecipient)?.userName || 'user'} (private reply)...`
                    : "Type a message to all users (broadcast) or select a specific conversation..."
                  : "Type a message to TONYGAMINGTZ Support (only you and admin can see this)..."
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none max-h-32"
              rows={1}
            />
          </div>
          
          {newMessage.trim() ? (
            <button
              onClick={sendMessage}
              className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-full transition-colors"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`p-2 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
              }`}
              title="Hold to record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Incoming Call Modal */}
      {showIncomingCall && incomingCallData && (
        <IncomingCallModal
          isOpen={showIncomingCall}
          callerName={incomingCallData.callerName}
          callerId={incomingCallData.callerId}
          callType={incomingCallData.callType}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          onMessage={handleIncomingCallMessage}
        />
      )}

      {/* SMS Modal */}
      <SMSModal
        isOpen={showSMSModal}
        contactName={incomingCallData?.callerName || "TonyGamingTZ Support"}
        contactId={incomingCallData?.callerId || "admin"}
        onClose={() => setShowSMSModal(false)}
        onSendSMS={handleSendSMS}
        onCall={handleCallFromSMS}
        initialMessage="I can't take your call right now. What can I help you with?"
      />

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />
      <input
        ref={cameraInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*"
        capture="environment"
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="text-center">
              <LogOut className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">
                Logout
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout from the chat?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-black mb-4 text-center">
              Start {callType === 'screen' ? 'screen sharing' : 'voice call'}?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {callType === 'screen' 
                ? 'Share your screen with other participants'
                : 'Start a voice call with online users'
              }
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCallModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={initiateCall}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Call UI */}
      {isInCall && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Call Header */}
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {callType === 'screen' ? (
                <Monitor className="w-6 h-6 text-green-400" />
              ) : (
                <Phone className="w-6 h-6 text-green-400" />
              )}
              <div>
                <h3 className="font-semibold">
                  {callType === 'screen' ? 'Screen Sharing with Voice' : 'Voice Call'}
                </h3>
                <p className="text-sm text-gray-300">Connected • {onlineUsers.length} participants</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-xs ${
                isMuted ? 'bg-red-600' : 'bg-green-600'
              }`}>
                {isMuted ? 'Muted' : 'Live'}
              </div>
            </div>
          </div>
          
          {/* Video/Screen Content */}
          <div className="flex-1 relative bg-gray-900">
            {callType === 'screen' && isScreenSharing ? (
              <div className="w-full h-full flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-white">
                <div>
                  <Phone className="w-24 h-24 mx-auto mb-4 call-pulse text-green-400" />
                  <h2 className="text-2xl font-bold mb-2">Voice Call Active</h2>
                  <p className="text-gray-300">Speaking with {onlineUsers.length} participants</p>
                </div>
              </div>
            )}
            
            {/* Participants overlay for screen sharing */}
            {callType === 'screen' && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-white text-sm">
                  <Users className="w-4 h-4" />
                  <span>{onlineUsers.length} watching</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Call Controls */}
          <div className="bg-gray-900 p-6">
            <div className="flex items-center justify-center space-x-6">
              {/* Mute/Unmute Button */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <Mic className={`w-6 h-6 text-white ${isMuted ? 'opacity-50' : ''}`} />
              </button>
              
              {/* Screen Share Toggle (only in voice calls) */}
              {callType === 'voice' && (
                <button
                  onClick={() => {
                    setCallType('screen')
                    initiateCall()
                  }}
                  className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                  title="Start screen sharing"
                >
                  <Monitor className="w-6 h-6 text-white" />
                </button>
              )}
              
              {/* End Call Button */}
              <button
                onClick={endCall}
                className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                title={`End ${callType === 'screen' ? 'screen sharing' : 'call'}`}
              >
                <Phone className="w-6 h-6 text-white transform rotate-135" />
              </button>
              
              {/* Speaker/Audio Toggle */}
              <button
                className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                title="Audio settings"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-5a3 3 0 00-6 0v5z" />
                </svg>
              </button>
            </div>
            
            {/* Call Info */}
            <div className="text-center mt-4">
              <p className="text-gray-400 text-sm">
                {callType === 'screen' 
                  ? 'Your screen is being shared with voice communication' 
                  : 'Voice call in progress'
                }
              </p>
              {callType === 'screen' && (
                <p className="text-gray-500 text-xs mt-1">
                  Participants can see your screen and hear your voice
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {showMediaPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 media-preview">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowMediaPreview(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={showMediaPreview}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatInterface