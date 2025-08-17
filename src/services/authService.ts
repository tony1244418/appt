import { 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

export interface AuthUser {
  uid: string
  phoneNumber: string | null
  displayName: string | null
  isAnonymous: boolean
  username?: string
  isAdmin?: boolean
  hasAccount?: boolean
  createdAt?: Date
  lastLogin?: Date
}

// Admin configuration - TONYGAMINGTZ with capital letters as requested
// Note: Actual admin phone number is stored securely and not exposed in code
const ADMIN_NAME = 'TONYGAMINGTZ'  // Capitalized as requested
const PROTECTED_USERNAMES = ['tonygamingtz', 'TONYGAMINGTZ', 'TonyGamingTZ', 'admin', 'support', 'moderator']

class AuthService {
  // Check if phone number belongs to admin (secure check without exposing number)
  private isAdminPhone(phoneNumber: string): boolean {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    // Admin phone number variations
    const adminPhones = [
      '0612111793',    // Original format
      '612111793',     // Without leading 0
      '255612111793'   // With country code
    ]
    return adminPhones.some(adminPhone => 
      cleanPhone === adminPhone.replace(/\D/g, '') || 
      cleanPhone === adminPhone ||
      phoneNumber === adminPhone
    )
  }

  // Check if username is protected
  private isProtectedUsername(username: string): boolean {
    return PROTECTED_USERNAMES.some(protectedName => 
      protectedName.toLowerCase() === username.toLowerCase()
    )
  }

  // Get all stored users from localStorage
  private getStoredUsers(): AuthUser[] {
    try {
      const users = localStorage.getItem('allUsers')
      return users ? JSON.parse(users) : []
    } catch (error) {
      return []
    }
  }

  // Store user in local registry
  private storeUserInRegistry(user: AuthUser): void {
    try {
      const users = this.getStoredUsers()
      const existingIndex = users.findIndex(u => u.uid === user.uid)
      
      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...user, lastLogin: new Date() }
      } else {
        users.push({ ...user, createdAt: new Date(), lastLogin: new Date() })
      }
      
      localStorage.setItem('allUsers', JSON.stringify(users))
    } catch (error) {
      console.error('Error storing user in registry:', error)
    }
  }

  // Generate secure UID
  private generateUID(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (this.isAdminPhone(phoneNumber)) {
      return 'admin_secure_uid' // Secure admin UID without exposing phone
    }
    return `user_${cleanPhone}`
  }

  // Public method to check account status
  async checkAccountStatus(phoneNumber: string): Promise<{ 
    exists: boolean, 
    isAdmin: boolean, 
    userData?: AuthUser 
  }> {
    try {
      const isAdmin = this.isAdminPhone(phoneNumber)
      const uid = this.generateUID(phoneNumber)
      
      // Check localStorage first
      const localUsers = this.getStoredUsers()
      const localUser = localUsers.find(u => u.uid === uid)
      
      if (localUser) {
        return { exists: true, isAdmin, userData: localUser }
      }

      // Try Firestore if available
      try {
        const userRef = doc(db, 'users', uid)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as AuthUser
          return { exists: true, isAdmin, userData }
        }
      } catch (error) {
        console.log('Firestore check failed, using local storage only')
      }

      return { exists: false, isAdmin }
    } catch (error) {
      console.error('Error checking account:', error)
      return { exists: false, isAdmin: false }
    }
  }

  // Login with phone number only
  async loginWithPhoneOnly(phoneNumber: string): Promise<AuthUser | null> {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      const isAdmin = this.isAdminPhone(phoneNumber)
      const uid = this.generateUID(phoneNumber)
      
      // Check if account exists
      const accountCheck = await this.checkAccountStatus(phoneNumber)
      
      if (!accountCheck.exists) {
        // For admin accounts, auto-create if doesn't exist
        if (isAdmin) {
          console.log('Admin account not found, creating automatically...')
          return this.signUpWithPhoneAndUsername(phoneNumber, ADMIN_NAME)
        } else {
          throw new Error('Account not found. Please sign up first.')
        }
      }
      
      const existingUser = accountCheck.userData!
      const userData: AuthUser = {
        uid: existingUser.uid,
        phoneNumber: cleanPhone,
        displayName: isAdmin ? ADMIN_NAME : existingUser.displayName,
        username: isAdmin ? ADMIN_NAME : existingUser.username,
        isAnonymous: false,
        isAdmin,
        hasAccount: true,
        createdAt: existingUser.createdAt,
        lastLogin: new Date()
      }
      
      // Store current user
      localStorage.setItem('currentUser', JSON.stringify(userData))
      
      // Update in registry
      this.storeUserInRegistry(userData)
      
      // Update in Firestore if available
      try {
        const userRef = doc(db, 'users', uid)
        await setDoc(userRef, userData, { merge: true })
      } catch (firestoreError) {
        console.log('Firestore offline, updated locally')
      }
      
      return userData
    } catch (error) {
      console.error('Error during login:', error)
      throw error
    }
  }

  // Sign up with phone number and username
  async signUpWithPhoneAndUsername(phoneNumber: string, username: string): Promise<AuthUser | null> {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      const isAdmin = this.isAdminPhone(phoneNumber)
      const uid = this.generateUID(phoneNumber)
      
      // Admin validation
      if (isAdmin) {
        // Set admin username automatically
        username = ADMIN_NAME
      } else {
        // Prevent others from using admin phone number
        if (this.isAdminPhone(phoneNumber)) {
          throw new Error('This phone number is reserved for admin only')
        }
        
        // Prevent others from using protected usernames
        if (this.isProtectedUsername(username)) {
          throw new Error(`Username "${username}" is reserved and cannot be used`)
        }
      }
      
      // Check if account already exists
      const accountCheck = await this.checkAccountStatus(phoneNumber)
      
      if (accountCheck.exists) {
        throw new Error('Account already exists. Please login instead.')
      }
      
      if (!username.trim()) {
        throw new Error('Username is required')
      }
      
      const userData: AuthUser = {
        uid,
        phoneNumber: cleanPhone,
        displayName: isAdmin ? ADMIN_NAME : username.trim(),
        username: isAdmin ? ADMIN_NAME : username.trim(),
        isAnonymous: false,
        isAdmin,
        hasAccount: true,
        createdAt: new Date(),
        lastLogin: new Date()
      }
      
      // Store current user
      localStorage.setItem('currentUser', JSON.stringify(userData))
      
      // Store in user registry
      this.storeUserInRegistry(userData)
      
      // Store in Firestore if available
      try {
        const userRef = doc(db, 'users', uid)
        await setDoc(userRef, userData)
      } catch (firestoreError) {
        console.log('Firestore offline, account created locally')
      }
      
      return userData
    } catch (error) {
      console.error('Error during signup:', error)
      throw error
    }
  }

  // Legacy method for backward compatibility
  async signInWithPhoneAndUsername(phoneNumber: string, username: string): Promise<AuthUser | null> {
    // Check if account exists first
    const accountCheck = await this.checkAccountStatus(phoneNumber)
    
    if (accountCheck.exists) {
      // Account exists - login
      return this.loginWithPhoneOnly(phoneNumber)
    } else {
      // New account - signup
      return this.signUpWithPhoneAndUsername(phoneNumber, username)
    }
  }

  // Sign in as guest with name
  async signInAsGuest(name: string): Promise<AuthUser | null> {
    try {
      // Prevent guests from using protected names
      if (this.isProtectedUsername(name)) {
        throw new Error(`Name "${name}" is reserved and cannot be used`)
      }

      const guestUser: AuthUser = {
        uid: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phoneNumber: null,
        displayName: name,
        isAnonymous: true,
        isAdmin: false,
        hasAccount: false,
        createdAt: new Date(),
        lastLogin: new Date()
      }
      
      localStorage.setItem('currentUser', JSON.stringify(guestUser))
      return guestUser
    } catch (error) {
      console.error('Error signing in as guest:', error)
      throw error
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem('currentUser')
      if (userData) {
        const user = JSON.parse(userData)
        // Ensure admin flag is set correctly
        if (user.phoneNumber && this.isAdminPhone(user.phoneNumber)) {
          user.isAdmin = true
          user.displayName = ADMIN_NAME
          user.username = ADMIN_NAME
        }
        return user
      }
      return null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Check if user is admin
  isAdmin(user: AuthUser): boolean {
    return user.isAdmin === true || 
           user.uid === 'admin_secure_uid' || 
           (user.phoneNumber && this.isAdminPhone(user.phoneNumber)) ||
           user.displayName === ADMIN_NAME
  }

  // Get user data storage info
  getUserDataInfo(): { 
    location: string, 
    users: AuthUser[], 
    totalUsers: number,
    adminProtected: boolean 
  } {
    const users = this.getStoredUsers()
    const adminUser = users.find(u => u.isAdmin)
    
    return {
      location: 'Browser Local Storage + Firestore Database (when online)',
      users: users.filter(u => !u.isAnonymous), // Only show registered users
      totalUsers: users.length,
      adminProtected: !!adminUser
    }
  }

  // Get all registered users (for admin view)
  getAllUsers(): AuthUser[] {
    return this.getStoredUsers().filter(u => !u.isAnonymous)
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      localStorage.removeItem('currentUser')
      // Also sign out from Firebase if authenticated
      if (auth.currentUser) {
        await signOut(auth)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    // Check localStorage for current user
    const checkUser = () => {
      const currentUser = this.getCurrentUser()
      callback(currentUser)
    }
    
    // Initial check
    checkUser()
    
    // Listen to storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        checkUser()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }

  private mapFirebaseUser(user: User): AuthUser {
    return {
      uid: user.uid,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      isAnonymous: user.isAnonymous,
      isAdmin: false,
      hasAccount: true
    }
  }
}

export const authService = new AuthService()