import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Home, MessageCircle, Gamepad2, HelpCircle } from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import NotificationPermissionPrompt from './NotificationPermissionPrompt'
import ExternalLinkWarning from './ExternalLinkWarning'
import { useExternalLinkHandler } from '../hooks/useExternalLinkHandler'
import { notificationService } from '../services/notificationService'
import { pushNotificationService } from '../services/pushNotificationService'
import { authService } from '../services/authService'
import { chatService } from '../services/chatService'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState(location.pathname)
  const [currentUser, setCurrentUser] = React.useState(authService.getCurrentUser())
  const {
    isWarningOpen,
    pendingUrl,
    handleLinkClick,
    confirmExternalLink,
    cancelExternalLink
  } = useExternalLinkHandler()

  React.useEffect(() => {
    setActiveTab(location.pathname)
    
    // Setup push notification listener
    pushNotificationService.setupAdminListener()
    
    // Listen for auth changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user)
    })
    
    return unsubscribe
  }, [location.pathname])

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/messages', icon: MessageCircle, label: 'Message' },
    { 
      path: '/omba-game', 
      icon: Gamepad2, 
      label: 'Omba Game',
      external: true,
      url: 'https://tonygamingtz.com/omba-game-hapa/'
    },
    { 
      path: '/msaada', 
      icon: HelpCircle, 
      label: 'Msaada',
      external: true,
      url: 'https://tonygamingtz.com/maswali-na-jinsi-yakutumia-app-gusa-hapa/'
    },
  ]

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    setActiveTab(item.path)
    if (item.external) {
      e.preventDefault()
      handleLinkClick(item.url, (internalUrl) => {
        // Internal TonyGamingTZ link - navigate to WebView
        navigate(`/webview?url=${encodeURIComponent(internalUrl)}`)
      })
    }
  }

  const handleSearchClick = () => {
    const searchUrl = 'https://tonygamingtz.com/tonygamingtz/'
    handleLinkClick(searchUrl, (internalUrl) => {
      navigate(`/webview?url=${encodeURIComponent(internalUrl)}`)
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b backdrop-blur-md bg-white/95">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <img 
              src="https://tonygamingtz.com/wp-content/uploads/2024/11/cropped-cropped-20241124_183631.png" 
              alt="Tonygamingtz Logo"
              className="w-10 h-10 mr-3"
            />
            <h1 className="text-lg font-bold text-black">TONYGAMINGTZ</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Admin Panel Button - Only show for admin users */}
            {currentUser && (currentUser.isAdmin || chatService.isAdmin(currentUser)) && (
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                onClick={() => navigate('/admin')}
                title="Admin Panel"
              >
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
              </button>
            )}
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              onClick={handleSearchClick}
            >
              <Search className="w-6 h-6 text-black" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 relative"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="w-6 h-6 text-black" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-24 px-4 pt-4 transition-all duration-300 ease-in-out">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl">
        <div className="flex justify-around items-center py-1 px-2 relative">
          {/* Active Tab Indicator */}
          <div 
            className="absolute top-0 h-1 bg-red-600 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${100 / navItems.length}%`,
              left: `${navItems.findIndex(item => item.path === activeTab) * (100 / navItems.length)}%`,
            }}
          />
          
          {navItems.map((item) => {
            const { path, icon: Icon, label, external } = item
            const isActive = activeTab === path
            return (
              <Link
                key={path}
                to={path}
                onClick={(e) => handleNavClick(item, e)}
                className={`flex flex-col items-center px-3 py-3 text-xs transition-all duration-200 ease-out transform ${
                  isActive
                    ? 'text-red-600 scale-105'
                    : 'text-gray-600 hover:text-red-500 hover:scale-102'
                } active:scale-95`}
              >
                <div className={`relative transition-all duration-200 ${isActive ? 'mb-1' : 'mb-1'}`}>
                  <Icon 
                    className={`w-6 h-6 transition-all duration-200 ${
                      isActive ? 'text-red-600' : 'text-gray-600'
                    }`} 
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-red-100 rounded-full scale-150 opacity-20 animate-pulse" />
                  )}
                </div>
                <span className={`transition-all duration-200 ${
                  isActive ? 'font-semibold text-red-600' : 'font-medium'
                }`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* External Link Warning */}
      <NotificationPermissionPrompt />
      <ExternalLinkWarning
        isOpen={isWarningOpen}
        url={pendingUrl || ''}
        onConfirm={confirmExternalLink}
        onCancel={cancelExternalLink}
      />
    </div>
  )
}

export default Layout