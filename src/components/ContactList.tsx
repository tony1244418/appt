import React from 'react'
import { Phone, MessageCircle, User, Shield } from 'lucide-react'

interface Contact {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
  isVerified: boolean
  lastSeen?: string
}

interface ContactListProps {
  contacts: Contact[]
  onCall: (contactId: string) => void
  onMessage: (contactId: string) => void
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onCall, onMessage }) => {
  // CENTRALIZED CONTACT SYSTEM: Only admin contact available for all users
  const adminOnlyContacts: Contact[] = [
    {
      id: 'admin_secure_uid',
      name: 'TonyGamingTZ Support',
      status: 'online',
      isVerified: true,
      lastSeen: 'Online'
    }
  ]

  // Only show admin contact - no user-to-user contacts
  const allContacts = adminOnlyContacts

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-black">Available Contact</h3>
        <p className="text-sm text-gray-600">You can only contact TonyGamingTZ Support</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {allContacts.map((contact) => (
          <div key={contact.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(contact.status)} rounded-full border-2 border-white`}></div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-black">{contact.name}</h4>
                    {contact.isVerified && (
                      <Shield className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{contact.lastSeen}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onMessage(contact.id)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title={`Message ${contact.name}`}
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => onCall(contact.id)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  title={`Call ${contact.name}`}
                >
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          🔒 Centralized support system - All users chat with TonyGamingTZ only
        </p>
      </div>
    </div>
  )
}

export default ContactList