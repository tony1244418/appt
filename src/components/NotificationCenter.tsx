import React, { useState, useEffect } from 'react'
import { Bell, Trash2, BookMarked as MarkAsRead, ExternalLink } from 'lucide-react'
import { notificationService, Notification } from '../services/notificationService'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const notifs = await notificationService.getNotifications()
      setNotifications(notifs)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await notificationService.markAsRead(notificationId)
    if (success) {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end animate-fade-in">
      <div className="bg-white w-full max-w-md h-full overflow-hidden flex flex-col animate-slide-in-up">
        {/* Header */}
        <div className="bg-red-600 text-white p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center">
            <Bell className="w-6 h-6 mr-2" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-red-700 transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-600">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 animate-fade-in">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 animate-fade-in">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-all duration-200 hover:bg-gray-50 ${
                    !notification.read ? 'bg-red-50 border-l-4 border-red-600' : 'bg-white'
                  }`}
                  onClick={() => {
                    // Handle launch URL
                    if (notification.launchUrl) {
                      if (notification.launchUrl.startsWith('http')) {
                        if (notification.launchUrl.includes('tonygamingtz.com')) {
                          window.location.href = `/webview?url=${encodeURIComponent(notification.launchUrl)}`
                        } else {
                          window.open(notification.launchUrl, '_blank', 'noopener,noreferrer')
                        }
                      } else {
                        window.location.href = notification.launchUrl
                      }
                    }
                    
                    // Mark as read
                    if (!notification.read && notification.id) {
                      handleMarkAsRead(notification.id)
                    }
                  }}
                >
                  {/* Rich notification image */}
                  {notification.imageUrl && (
                    <div className="mb-3 -mx-4 -mt-4">
                      <img
                        src={notification.imageUrl}
                        alt="Notification"
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium ${
                        !notification.read ? 'text-black' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notification.timestamp.toLocaleDateString()} {notification.timestamp.toLocaleTimeString()}
                      </p>
                      
                      {/* Launch URL indicator */}
                      {notification.launchUrl && (
                        <div className="flex items-center mt-2 text-xs text-blue-600">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          <span className="truncate">
                            {notification.launchUrl.includes('tonygamingtz.com') ? 'Open in app' : 'Open link'}
                          </span>
                        </div>
                      )}
                    </div>
                    {!notification.read && notification.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id!)
                        }}
                        className="text-red-600 hover:text-red-800 ml-2 p-1 rounded-full hover:bg-red-100 transition-colors duration-200"
                        title="Mark as read"
                      >
                        <MarkAsRead className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationCenter