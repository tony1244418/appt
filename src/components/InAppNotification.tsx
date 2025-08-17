import React, { useState, useEffect } from 'react'
import { Bell, X, ExternalLink } from 'lucide-react'
import { Notification } from '../services/notificationService'

interface InAppNotificationProps {
  notification: Notification | null
  onDismiss: () => void
  onRead?: (notificationId: string) => void
}

const InAppNotification: React.FC<InAppNotificationProps> = ({
  notification,
  onDismiss,
  onRead
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (notification) {
      setIsVisible(true)
      
      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      onDismiss()
    }, 300) // Wait for animation to complete
  }

  const handleClick = () => {
    // Handle launch URL if present
    if (notification?.launchUrl) {
      if (notification.launchUrl.startsWith('http')) {
        // External URL
        if (notification.launchUrl.includes('tonygamingtz.com')) {
          // Internal TonyGamingTZ link
          window.location.href = `/webview?url=${encodeURIComponent(notification.launchUrl)}`
        } else {
          // External link
          window.open(notification.launchUrl, '_blank', 'noopener,noreferrer')
        }
      } else {
        // Internal app route
        window.location.href = notification.launchUrl
      }
    }
    
    if (notification?.id && onRead) {
      onRead(notification.id)
    }
    handleDismiss()
  }

  if (!notification) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className="bg-white rounded-lg shadow-xl border-l-4 border-red-600 p-4 max-w-sm cursor-pointer transform hover:scale-105 transition-transform duration-200 animate-scale-in"
        onClick={handleClick}
      >
        {/* Rich notification image */}
        {notification.imageUrl && (
          <div className="mb-3 -mx-4 -mt-4">
            <img
              src={notification.imageUrl}
              alt="Notification"
              className="w-full h-32 object-cover rounded-t-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
        
        <div className="flex items-start">
          <Bell className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-black truncate">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.body}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {notification.timestamp.toLocaleTimeString()}
            </p>
            
            {/* Launch URL indicator */}
            {notification.launchUrl && (
              <div className="flex items-center mt-2 text-xs text-blue-600">
                <ExternalLink className="w-3 h-3 mr-1" />
                <span>Tap to open</span>
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDismiss()
            }}
            className="text-gray-400 hover:text-gray-600 ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default InAppNotification