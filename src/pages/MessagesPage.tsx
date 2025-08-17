import React, { useState, useEffect } from 'react'
import { MessageCircle, User, Phone } from 'lucide-react'
import AuthModal from '../components/AuthModal'
import ChatInterface from '../components/ChatInterface'
import ContactList from '../components/ContactList'
import { authService, AuthUser } from '../services/authService'
import { chatService } from '../services/chatService'
import toast from 'react-hot-toast'

const MessagesPage: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showContacts, setShowContacts] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
    setLoading(false)

    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser)
    })

    return () => unsubscribe()
  }, [])

  const handleAuthSuccess = (authUser: AuthUser) => {
    setUser(authUser)
    setShowAuthModal(false)
  }

  const handleSignOut = async () => {
    await authService.signOut()
    setUser(null)
  }

  const handleCallContact = async (contactId: string) => {
    if (!user) return
    
    // CENTRALIZED SYSTEM: Users can only call admin
    if (!chatService.isAdmin(user) && contactId !== 'admin_secure_uid') {
      toast.error('You can only call TonyGamingTZ Support')
      return
    }
    
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

  const handleMessageContact = (contactId: string) => {
    // CENTRALIZED SYSTEM: Users can only message admin
    if (!chatService.isAdmin(user) && contactId !== 'admin_secure_uid') {
      toast.error('You can only message TonyGamingTZ Support')
      return
    }
    
    toast.success('Chat interface ready for messaging with TonyGamingTZ Support')
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <MessageCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-4">
            Join the Chat
          </h2>
          <p className="text-gray-600 mb-6">
            Connect with other TonyGamingTZ users, share gaming experiences, 
            and get help with games and mods.
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                Real-time messaging
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Share media files
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Voice & video calls
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Join Chat Now
          </button>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Safe & Secure:</strong> Your privacy is protected. 
              You can join as a guest or verify with your phone number.
            </p>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Contact List Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowContacts(!showContacts)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>{showContacts ? 'Hide Contact' : 'Show Contact'}</span>
        </button>
      </div>

      {/* Contact List */}
      {showContacts && (
        <div className="mb-4">
          <ContactList
            contacts={[]}
            onCall={handleCallContact}
            onMessage={handleMessageContact}
          />
        </div>
      )}

      {/* Centralized Chat Notice */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>📢 Centralized Support:</strong> All users can only chat with TonyGamingTZ Support. 
          {chatService.isAdmin(user) ? ' You manage all user conversations from here.' : ' No user-to-user messaging allowed.'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Chat Header with User Info */}
        <div className="bg-red-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">{user.displayName}</h3>
              <p className="text-red-200 text-sm">
                {chatService.isAdmin(user) 
                  ? 'Admin - Managing All User Chats' 
                  : user.isAnonymous 
                    ? 'Guest User - Chatting with Admin Only' 
                    : 'Verified User - Chatting with Admin Only'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="text-red-200 hover:text-white text-sm px-3 py-1 rounded border border-red-400 hover:border-red-300 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Chat Interface */}
        <div className="h-full">
          <ChatInterface user={user} />
        </div>
      </div>
    </div>
  )
}

export default MessagesPage