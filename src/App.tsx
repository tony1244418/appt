import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import InAppNotification from './components/InAppNotification'
import HomePage from './pages/HomePage'
import MessagesPage from './pages/MessagesPage'
import GamePage from './pages/GamePage'
import HelpPage from './pages/HelpPage'
import WebViewPage from './pages/WebViewPage'
import AdminPanel from './admin/AdminPanel'
import { notificationService, Notification } from './services/notificationService'
import { pushNotificationService } from './services/pushNotificationService'

function App() {
  const [currentNotification, setCurrentNotification] = React.useState<Notification | null>(null)

  React.useEffect(() => {
    // Setup foreground message listener
    if (notificationService.isSupported()) {
      notificationService.setupForegroundListener((notification) => {
        setCurrentNotification(notification)
      })
      
      // Setup push notification listener
      pushNotificationService.setupForegroundListener((notification) => {
        setCurrentNotification(notification)
      })
    }
    
    // Listen for custom push notification events
    const handlePushNotification = (event: any) => {
      setCurrentNotification(event.detail)
    }
    
    window.addEventListener('pushNotificationReceived', handlePushNotification)
    
    return () => {
      window.removeEventListener('pushNotificationReceived', handlePushNotification)
    }
  }, [])

  const handleNotificationRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId)
  }

  return (
    <>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/omba-game" element={<GamePage />} />
            <Route path="/msaada" element={<HelpPage />} />
            <Route path="/webview" element={<WebViewPage />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </Layout>
      </Router>

      {/* Notification Components */}
      <InAppNotification
        notification={currentNotification}
        onDismiss={() => setCurrentNotification(null)}
        onRead={handleNotificationRead}
      />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

export default App