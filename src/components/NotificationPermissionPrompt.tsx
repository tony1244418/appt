import React, { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { notificationService } from '../services/notificationService'

interface NotificationPermissionPromptProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const checkPermissionStatus = () => {
      const permission = notificationService.getPermissionStatus()
      const hideUntil = localStorage.getItem('notificationBannerHideUntil')
      const now = Date.now()
      
      // Check if banner is temporarily hidden
      const isTemporarilyHidden = hideUntil && now < parseInt(hideUntil)
      
      if (permission === 'default') {
        // First time - show initial prompt
        setShowPrompt(true)
        setShowBanner(false)
      } else if (permission === 'denied') {
        // Show banner unless temporarily hidden
        setShowBanner(!isTemporarilyHidden)
        setShowPrompt(false)
      } else {
        // Permission granted
        setShowPrompt(false)
        setShowBanner(false)
      }
    }

    // Check on component mount
    checkPermissionStatus()
    
    // Also check every minute to handle the 24-hour timeout
    const interval = setInterval(checkPermissionStatus, 60000) // 1 minute
    
    return () => clearInterval(interval)
  }, [])

  const handleAllowNotifications = async () => {
    const granted = await notificationService.requestPermission()
    
    if (granted) {
      setShowPrompt(false)
      setShowBanner(false)
      onPermissionGranted?.()
      
      // Get FCM token
      const token = await notificationService.getFCMToken()
      if (token) {
        console.log('FCM Token:', token)
      }
    } else {
      setShowPrompt(false)
      onPermissionDenied?.()
    }
  }

  const handleDismissPrompt = () => {
    setShowPrompt(false)
  }

  const handleDismissBanner = () => {
    setShowBanner(false)
    // Hide for 24 hours like WhatsApp
    const hideUntil = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    localStorage.setItem('notificationBannerHideUntil', hideUntil.toString())
    
    // Check again after 24 hours
    setTimeout(() => {
      const permission = notificationService.getPermissionStatus()
      if (permission === 'denied') {
        setShowBanner(true)
      }
    }, 24 * 60 * 60 * 1000)
  }

  // Initial permission prompt (first time)
  if (showPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <div className="text-center">
            <Bell className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">
              Stay Updated
            </h3>
            <p className="text-gray-600 mb-6">
              Get notified about new games, updates, and important announcements from TonyGamingTZ.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDismissPrompt}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleAllowNotifications}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // WhatsApp-style daily banner
  if (showBanner) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 bg-red-50 border-b border-red-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 leading-tight">
                  Turn on notifications
                </p>
                <p className="text-xs text-red-700 leading-tight">
                  Get notified of new games and updates
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-3">
              <button
                onClick={handleAllowNotifications}
                className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                TURN ON
              </button>
              <button
                onClick={handleDismissBanner}
                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default NotificationPermissionPrompt