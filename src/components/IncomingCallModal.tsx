import React, { useState, useEffect } from 'react'
import { Phone, PhoneOff, MessageCircle, User, Clock } from 'lucide-react'

interface IncomingCallModalProps {
  isOpen: boolean
  callerName: string
  callerId: string
  callType: 'voice' | 'video'
  onAccept: () => void
  onDecline: () => void
  onMessage: () => void
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  callerName,
  callerId,
  callType,
  onAccept,
  onDecline,
  onMessage
}) => {
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setCallDuration(0)
    }
  }, [isOpen])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Incoming Call UI */}
      <div className="flex-1 flex flex-col items-center justify-center text-white p-8">
        {/* Caller Info */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
            <User className="w-16 h-16 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{callerName}</h2>
          <p className="text-gray-300 text-lg">Incoming Call</p>
          <div className="flex items-center justify-center mt-4 text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatDuration(callDuration)}</span>
          </div>
        </div>

        {/* Call Type Indicator */}
        <div className="mb-8">
          <div className="bg-green-600 px-4 py-2 rounded-full">
            <span className="text-white font-medium">
              Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
            </span>
          </div>
        </div>

        {/* Contact Status */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Verified Contact</span>
          </div>
        </div>

        {/* Ringtone Animation */}
        <div className="mb-12">
          <div className="relative">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center animate-bounce">
              <Phone className="w-10 h-10 text-white" />
            </div>
            {/* Ripple effect */}
            <div className="absolute inset-0 w-20 h-20 bg-green-600 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 w-20 h-20 bg-green-600 rounded-full animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-black bg-opacity-50 p-6">
        <div className="flex items-center justify-center space-x-12">
          {/* Message Button */}
          <button
            onClick={onMessage}
            className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
            title="Send Message"
          >
            <MessageCircle className="w-8 h-8 text-white" />
          </button>

          {/* Decline Button */}
          <button
            onClick={onDecline}
            className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors animate-pulse"
            title="Decline Call"
          >
            <PhoneOff className="w-10 h-10 text-white" />
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors animate-pulse"
            title="Accept Call"
          >
            <Phone className="w-10 h-10 text-white" />
          </button>
        </div>

        {/* Quick Response Messages */}
        <div className="mt-6 space-y-2">
          <p className="text-gray-400 text-center text-sm">Quick responses:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => onMessage()}
              className="bg-gray-700 text-white px-3 py-1 rounded-full text-xs hover:bg-gray-600 transition-colors"
            >
              "I'll call you back"
            </button>
            <button
              onClick={() => onMessage()}
              className="bg-gray-700 text-white px-3 py-1 rounded-full text-xs hover:bg-gray-600 transition-colors"
            >
              "Can't talk now"
            </button>
            <button
              onClick={() => onMessage()}
              className="bg-gray-700 text-white px-3 py-1 rounded-full text-xs hover:bg-gray-600 transition-colors"
            >
              "What's up?"
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallModal