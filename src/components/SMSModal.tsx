import React, { useState } from 'react'
import { Send, X, MessageCircle, Phone } from 'lucide-react'

interface SMSModalProps {
  isOpen: boolean
  contactName: string
  contactId: string
  onClose: () => void
  onSendSMS: (message: string) => void
  onCall: () => void
  initialMessage?: string
}

const SMSModal: React.FC<SMSModalProps> = ({
  isOpen,
  contactName,
  contactId,
  onClose,
  onSendSMS,
  onCall,
  initialMessage = ''
}) => {
  const [message, setMessage] = useState(initialMessage)

  const quickReplies = [
    "Hello! How can I help you?",
    "Thanks for contacting TonyGamingTZ!",
    "I'll get back to you soon.",
    "Can you call me instead?",
    "What game are you looking for?",
    "Check our website for latest games!",
    "Sure, no problem!",
    "I'm busy right now, I'll call you later."
  ]

  const handleSend = () => {
    if (message.trim()) {
      onSendSMS(message.trim())
      setMessage('')
      onClose()
    }
  }

  const handleQuickReply = (reply: string) => {
    setMessage(reply)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl animate-slide-in-up max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">{contactName}</h3>
              <p className="text-red-200 text-sm">Verified Contact</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCall}
              className="p-2 bg-red-700 rounded-full hover:bg-red-800 transition-colors"
              title="Call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-red-700 rounded-full hover:bg-red-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Replies */}
        <div className="p-4 border-b border-gray-200 max-h-48 overflow-y-auto">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Replies:</p>
          <div className="grid grid-cols-1 gap-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm border border-gray-200"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your SMS message..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              maxLength={160}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {message.length}/160 characters
              </span>
              <span className="text-xs text-gray-500">
                SMS will open in your messaging app
              </span>
            </div>
          </div>

          {/* Send Button */}
          <div className="flex space-x-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send SMS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SMSModal