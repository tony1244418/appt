import React, { useState } from 'react'
import { X, Phone, User, Shield, CheckCircle, UserPlus, LogIn } from 'lucide-react'
import { authService, AuthUser } from '../services/authService'
import toast from 'react-hot-toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: AuthUser) => void
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [step, setStep] = useState<'choose' | 'guest' | 'login' | 'signup'>('choose')
  const [guestName, setGuestName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [accountStatus, setAccountStatus] = useState<'checking' | 'exists' | 'new' | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const handleGuestLogin = async () => {
    if (!guestName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setLoading(true)
    try {
      const user = await authService.signInAsGuest(guestName.trim())
      if (user) {
        toast.success('Welcome to the chat!')
        onAuthSuccess(user)
        onClose()
      } else {
        toast.error('Failed to sign in as guest')
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    // Validate phone number format (must start with 0)
    if (!phoneNumber.startsWith('0')) {
      toast.error('Phone number must start with 0 (e.g., 0612111793)')
      return
    }

    setLoading(true)
    try {
      const user = await authService.loginWithPhoneOnly(phoneNumber.trim())
      
      if (user) {
        if (user.isAdmin) {
          toast.success('Welcome Admin!')
        } else {
          toast.success('Welcome back!')
        }
        onAuthSuccess(user)
        onClose()
      } else {
        toast.error('Account not found. Please sign up first.')
      }
    } catch (error) {
      console.log('Login error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Login failed, please try again')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    if (!username.trim()) {
      toast.error('Please enter your username')
      return
    }

    // Validate phone number format (must start with 0)
    if (!phoneNumber.startsWith('0')) {
      toast.error('Phone number must start with 0 (e.g., 0612111793)')
      return
    }

    setLoading(true)
    try {
      const user = await authService.signUpWithPhoneAndUsername(
        phoneNumber.trim(), 
        username.trim()
      )
      
      if (user) {
        if (user.isAdmin) {
          toast.success('Welcome Admin!')
        } else {
          toast.success('Account created successfully!')
        }
        onAuthSuccess(user)
        onClose()
      } else {
        toast.error('Failed to create account')
      }
    } catch (error) {
      console.log('Signup error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Signup failed, please try again')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneNumberChange = async (phone: string) => {
    setPhoneNumber(phone)
    setAccountStatus(null)
    setIsAdmin(false)
    
    // Only allow numbers and format with 0 prefix
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone && !cleanPhone.startsWith('0')) {
      setPhoneNumber('0' + cleanPhone)
      return
    }
    
    // Check account status when phone number is complete (10+ digits)
    if (cleanPhone.length >= 10) {
      setAccountStatus('checking')
      
      try {
        const result = await authService.checkAccountStatus(cleanPhone)
        
        if (result.isAdmin) {
          setIsAdmin(true)
          setAccountStatus('exists')
          toast.success('Admin account detected')
        } else if (result.exists) {
          setAccountStatus('exists')
        } else {
          setAccountStatus('new')
        }
      } catch (error) {
        console.log('Error checking account:', error)
        setAccountStatus('new')
      }
    }
  }

  const resetModal = () => {
    setStep('choose')
    setGuestName('')
    setPhoneNumber('')
    setUsername('')
    setLoading(false)
    setAccountStatus(null)
    setIsAdmin(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-lg max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-black">Join Chat</h2>
          <button
            onClick={() => {
              resetModal()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'choose' && (
          <div className="space-y-4">
            <p className="text-gray-600 text-center mb-6">
              Choose how you'd like to join the chat
            </p>
            
            <button
              onClick={() => setStep('guest')}
              className="w-full flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200"
            >
              <User className="w-6 h-6 text-red-600 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-black">Guest Access</div>
                <div className="text-sm text-gray-600">Enter with just your name</div>
              </div>
            </button>

            <button
              onClick={() => setStep('login')}
              className="w-full flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <LogIn className="w-6 h-6 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-black">Login</div>
                <div className="text-sm text-gray-600">Login with your phone number only</div>
              </div>
            </button>

            <button
              onClick={() => setStep('signup')}
              className="w-full flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200"
            >
              <UserPlus className="w-6 h-6 text-green-600 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-black">Sign Up</div>
                <div className="text-sm text-gray-600">Create new account with phone number and name</div>
              </div>
            </button>
          </div>
        )}

        {step === 'guest' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <User className="w-12 h-12 text-red-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-black">Guest Access</h3>
              <p className="text-gray-600 text-sm">Enter your name to join the chat</p>
            </div>

            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              maxLength={50}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGuestLogin}
                disabled={loading || !guestName.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Joining...' : 'Join Chat'}
              </button>
            </div>
          </div>
        )}

        {step === 'login' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              {isAdmin ? (
                <Shield className="w-12 h-12 text-red-600 mx-auto mb-2" />
              ) : (
                <LogIn className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              )}
              <h3 className="text-lg font-semibold text-black">
                {isAdmin ? 'Admin Login' : 'Login'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isAdmin 
                  ? 'Welcome Admin!' 
                  : 'Enter your phone number to login'
                }
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                placeholder="0123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Account Status Indicators */}
              {accountStatus === 'checking' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-blue-800 text-sm">Checking account...</p>
                  </div>
                </div>
              )}

              {accountStatus === 'exists' && isAdmin && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-red-600" />
                    <p className="text-red-800 text-sm font-medium">
                      Admin Account Detected
                    </p>
                  </div>
                </div>
              )}

              {accountStatus === 'exists' && !isAdmin && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-green-800 text-sm">
                      Account found! You can login now.
                    </p>
                  </div>
                </div>
              )}

              {accountStatus === 'new' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-orange-600" />
                    <p className="text-orange-800 text-sm">
                      No account found. Please sign up first.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleLogin}
                disabled={loading || !phoneNumber.trim() || accountStatus === 'new'}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Logging in...' : isAdmin ? 'Admin Login' : 'Login'}
              </button>
            </div>

            {accountStatus === 'new' && (
              <div className="text-center">
                <button
                  onClick={() => setStep('signup')}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Don't have an account? Sign up here
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'signup' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <UserPlus className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-black">Sign Up</h3>
              <p className="text-gray-600 text-sm">Create your new account</p>
            </div>

            <div className="space-y-3">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                placeholder="0123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                maxLength={30}
              />

              {/* Account Status Indicators */}
              {accountStatus === 'checking' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-blue-800 text-sm">Checking availability...</p>
                  </div>
                </div>
              )}

              {accountStatus === 'exists' && isAdmin && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-red-600" />
                    <p className="text-red-800 text-sm font-medium">
                      Admin Account - Please use Login instead
                    </p>
                  </div>
                </div>
              )}

              {accountStatus === 'exists' && !isAdmin && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    <p className="text-orange-800 text-sm">
                      Account already exists. Please use Login instead.
                    </p>
                  </div>
                </div>
              )}

              {accountStatus === 'new' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-green-600" />
                    <p className="text-green-800 text-sm">
                      Phone number available! You can create your account.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSignup}
                disabled={
                  loading || 
                  !phoneNumber.trim() || 
                  !username.trim() ||
                  accountStatus === 'exists'
                }
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </div>

            {accountStatus === 'exists' && (
              <div className="text-center">
                <button
                  onClick={() => setStep('login')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Already have an account? Login here
                </button>
              </div>
            )}
          </div>
        )}

        {/* Data Storage Info */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <strong>Secure Storage:</strong> Your account details are stored securely in your browser 
            and synced to our database when online. All admin accounts are protected.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthModal