import React, { useState } from 'react'
import { Send, Users, Bell, MessageCircle, Zap, Globe, Target, ExternalLink, Upload, Link, X } from 'lucide-react'
import { notificationService } from '../services/notificationService'
import { pushNotificationService } from '../services/pushNotificationService'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../config/firebase'
import { useNavigate } from 'react-router-dom'

const AdminPanel: React.FC = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [launchUrl, setLaunchUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'stored' | 'push' | 'both'>('both')
  const [pushSending, setPushSending] = useState(false)
  const [pushMessage, setPushMessage] = useState('')
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const [imageInputType, setImageInputType] = useState<'url' | 'upload'>('url')
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !body.trim()) {
      setMessage('Please fill in both title and body')
      return
    }

    setSending(true)
    setMessage('')

    try {
      let success = false
      
      if (notificationType === 'stored' || notificationType === 'both') {
        // Store notification in Firestore
        const notification = {
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
          launchUrl: launchUrl.trim() || undefined,
          timestamp: new Date(),
          read: false,
          type: 'push' as const
        }

        const notificationId = await notificationService.storeNotification(notification)
        success = !!notificationId
      }
      
      if (notificationType === 'push' || notificationType === 'both') {
        // Send push notification to all users
        const pushSuccess = await pushNotificationService.sendToAllUsers(
          title.trim(),
          body.trim(),
          {
            imageUrl: imageUrl.trim() || undefined,
            launchUrl: launchUrl.trim() || undefined
          }
        )
        success = success || pushSuccess
      }
      
      if (success) {
        setMessage(`${notificationType === 'both' ? 'Notification stored and push sent' : 
          notificationType === 'push' ? 'Push notification sent' : 'Notification stored'} successfully!`)
        setTitle('')
        setBody('')
        setImageUrl('')
        setLaunchUrl('')
        setImagePreviewError(false)
      } else {
        setMessage('Failed to send notification. Please try again.')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      setMessage('Error sending notification')
    } finally {
      setSending(false)
    }
  }

  const handleQuickUrlSelect = (url: string) => {
    setLaunchUrl(url)
  }

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
    setImagePreviewError(false)
  }

  const handleImageFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file (JPG, PNG, WebP, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image file must be smaller than 5MB')
      return
    }

    setUploadingImage(true)
    setUploadedImageFile(file)
    
    try {
      // Upload to Firebase Storage
      const timestamp = Date.now()
      const fileName = `notification-images/${timestamp}_${file.name}`
      const storageRef = ref(storage, fileName)
      
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      // Set the uploaded image URL
      setImageUrl(downloadURL)
      setImagePreviewError(false)
      setMessage('Image uploaded successfully!')
      
      // Clear the message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error uploading image:', error)
      setMessage('Failed to upload image. Please try again.')
      setUploadedImageFile(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveUploadedImage = () => {
    setUploadedImageFile(null)
    setImageUrl('')
    setImagePreviewError(false)
  }

  const handleSendPushToAll = async () => {
    if (!pushMessage.trim()) {
      setPushMessage('Please enter a message')
      return
    }

    setPushSending(true)
    try {
      const success = await pushNotificationService.sendToAllUsers(
        'TONYGAMINGTZ Update',
        pushMessage.trim()
      )
      
      if (success) {
        setPushMessage('')
        setMessage('Push notification sent to all users!')
      } else {
        setMessage('Failed to send push notification')
      }
    } catch (error) {
      console.error('Error sending push notification:', error)
      setMessage('Error sending push notification')
    } finally {
      setPushSending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Bell className="w-8 h-8 text-red-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-black">Admin Notification Panel</h1>
            <p className="text-sm text-gray-600">Logged in as: TONYGAMINGTZ (Admin)</p>
          </div>
        </div>

        {/* User Data Storage Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-black mb-3">User Data Storage & Admin Protection</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Storage Location:</strong> Browser Local Storage + Firestore Database</p>
            <p><strong>Your Admin Data:</strong> Protected and cannot be used by others</p>
            <p><strong>Phone Number:</strong> Protected (Reserved for admin only)</p>
            <p><strong>Username:</strong> TONYGAMINGTZ (Protected username)</p>
            <p><strong>Authentication:</strong> Admin login requires phone number only</p>
            <p><strong>New Users:</strong> Must provide phone number + username to sign up</p>
            <p><strong>Existing Users:</strong> Can login with phone number only</p>
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 text-xs">
                ℹ️ All user accounts are stored locally and synced to Firestore when online. 
                Your admin credentials (phone: protected, name: TONYGAMINGTZ) are fully protected.
                Other users cannot use your phone number or username.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-black mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/messages')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Open Chat Dashboard
            </button>
            
            <button
              onClick={handleSendPushToAll}
              disabled={pushSending || !pushMessage.trim()}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {pushSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Quick Push
            </button>
          </div>
          
          {/* Quick Push Message Input */}
          <div className="mt-3">
            <input
              type="text"
              value={pushMessage}
              onChange={(e) => setPushMessage(e.target.value)}
              placeholder="Quick push message to all users..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              maxLength={100}
            />
          </div>
        </div>

        {/* Notification Type Selector */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Notification Type
          </h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="notificationType"
                value="both"
                checked={notificationType === 'both'}
                onChange={(e) => setNotificationType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-red-800 text-sm">
                <strong>Both:</strong> Store in app + Send push notification (Recommended)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="notificationType"
                value="push"
                checked={notificationType === 'push'}
                onChange={(e) => setNotificationType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-red-800 text-sm">
                <strong>Push Only:</strong> Send immediate push notification
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="notificationType"
                value="stored"
                checked={notificationType === 'stored'}
                onChange={(e) => setNotificationType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-red-800 text-sm">
                <strong>Store Only:</strong> Save in notification center (no push)
              </span>
            </label>
          </div>
        </div>

        <form onSubmit={handleSendNotification} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Notification Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter notification title..."
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              Notification Body
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter notification message..."
              maxLength={500}
            />
          </div>

          {/* Rich Notification Section */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-3 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Rich Notification - OneSignal Style (Optional)
            </h3>
            
            {/* OneSignal-style Image Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-purple-700 mb-3">
                📸 Large Image (Optional)
              </label>
              
              {/* OneSignal-style Toggle Buttons */}
              <div className="bg-white border border-red-300 rounded-lg p-1 flex mb-4">
                <button
                  type="button"
                  onClick={() => setImageInputType('url')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    imageInputType === 'url'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  <Link className="w-4 h-4 mr-2" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputType('upload')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    imageInputType === 'upload'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </button>
              </div>

              {/* OneSignal-style URL Input */}
              {imageInputType === 'url' && (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Image URL</span>
                    </div>
                    <p className="text-xs text-red-700">
                      Enter the URL of an image hosted online. The image will be displayed in the notification.
                    </p>
                  </div>
                  <input
                    type="url"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    placeholder="https://tonygamingtz.com/wp-content/uploads/2024/11/image.jpg"
                  />
                </div>
              )}

              {/* OneSignal-style File Upload */}
              {imageInputType === 'upload' && (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Upload className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Upload Image</span>
                    </div>
                    <p className="text-xs text-red-700">
                      Upload an image from your computer. It will be stored securely and optimized for notifications.
                    </p>
                  </div>
                  
                  {!uploadedImageFile && !imageUrl && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 hover:bg-red-50 transition-all duration-200 cursor-pointer"
                         onClick={() => document.getElementById('imageFileInput')?.click()}>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-red-600" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Upload an image
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Drag and drop an image here, or click to browse
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageFileUpload(file)
                          }
                        }}
                        className="hidden"
                        id="imageFileInput"
                      />
                      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                        <span>JPG, PNG, WebP</span>
                        <span>•</span>
                        <span>Max 5MB</span>
                        <span>•</span>
                        <span>Recommended: 512x256px</span>
                      </div>
                    </div>
                  )}

                  {/* OneSignal-style Upload Progress */}
                  {uploadingImage && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <Upload className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Uploading image...</p>
                          <p className="text-xs text-gray-500">Please wait while we process your image</p>
                        </div>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  )}

                  {/* OneSignal-style Success Display */}
                  {uploadedImageFile && imageUrl && !uploadingImage && (
                    <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {uploadedImageFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(uploadedImageFile.size / 1024 / 1024).toFixed(2)} MB • Uploaded successfully
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveUploadedImage}
                              className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* OneSignal-style Image Preview */}
              {imageUrl && !imagePreviewError && (
                <div className="mt-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Image Preview</span>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt="Notification preview"
                        className="w-full h-40 object-cover"
                        onError={() => setImagePreviewError(true)}
                        onLoad={() => setImagePreviewError(false)}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This is how your image will appear in the notification
                    </p>
                  </div>
                </div>
              )}
              
              {/* Error State */}
              {imagePreviewError && imageUrl && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">Unable to load image</p>
                      <p className="text-xs text-red-700">Please check the URL or try uploading a different image.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* OneSignal-style Tips */}
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-2">Image Guidelines</h4>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>• <strong>Best size:</strong> 512x256px (2:1 ratio) for optimal display</li>
                      <li>• <strong>Formats:</strong> JPG, PNG, WebP, GIF supported</li>
                      <li>• <strong>File size:</strong> Maximum 5MB for fast loading</li>
                      <li>• <strong>Storage:</strong> Uploaded images are stored securely in Firebase</li>
                      <li>• <strong>Display:</strong> Images appear above notification text</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* OneSignal-style Launch URL Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-red-700 mb-3">
                🔗 Launch URL (Optional)
              </label>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Action URL</span>
                </div>
                <p className="text-xs text-red-700">
                  When users tap the notification, they'll be taken to this URL. Leave empty to open the app normally.
                </p>
              </div>
              
              <input
                type="text"
                id="launchUrl"
                value={launchUrl}
                onChange={(e) => setLaunchUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="/messages or https://tonygamingtz.com/games/"
              />
              
              {/* OneSignal-style Quick URL Buttons */}
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickUrlSelect('/')}
                    className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    🏠 Homepage
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickUrlSelect('/messages')}
                    className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    💬 Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickUrlSelect('https://tonygamingtz.com/tanzania-games/')}
                    className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    🎮 Games
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickUrlSelect('https://tonygamingtz.com')}
                    className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    🌐 Website
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickUrlSelect('https://www.freetz.online/')}
                    className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    🎮 Free Games
                  </button>
                </div>
              </div>
            </div>

            {/* OneSignal-style Rich Notification Preview */}
            {(title || body || imageUrl || launchUrl) && (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Live Preview</span>
                  <span className="text-xs text-gray-500">• How users will see your notification</span>
                </div>
                
                {/* Mobile-style notification preview */}
                <div className="bg-gray-900 rounded-lg p-4 max-w-sm">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {imageUrl && !imagePreviewError && (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-24 object-cover"
                        onError={() => setImagePreviewError(true)}
                      />
                    )}
                    <div className="p-3">
                      <div className="flex items-start space-x-3">
                        <img 
                          src="https://tonygamingtz.com/wp-content/uploads/2024/11/cropped-cropped-20241124_183631.png" 
                          alt="App Icon"
                          className="w-6 h-6 rounded-sm flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-900">TONYGAMINGTZ</span>
                            <span className="text-xs text-gray-500">now</span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 mt-1">
                            {title || 'Notification Title'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {body || 'Notification body text will appear here...'}
                          </p>
                          {launchUrl && (
                            <div className="flex items-center mt-2 text-xs text-red-600">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              <span>Tap to open</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                {notificationType === 'both' ? (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Send Notification (Store + Push)
                  </>
                ) : notificationType === 'push' ? (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Send Push Notification
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Store Notification
                  </>
                )}
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.includes('success') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Instructions:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• <strong>Push notifications:</strong> Sent immediately to all users who enabled notifications</li>
            <li>• <strong>Stored notifications:</strong> Saved in app notification center for users to view</li>
            <li>• <strong>Both mode:</strong> Combines immediate push + permanent storage (recommended)</li>
            <li>• <strong>Quick Push:</strong> Use the quick action above for fast announcements</li>
            <li>• Your admin account (TONYGAMINGTZ) is protected from unauthorized use</li>
          </ul>
          
          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
            <p className="text-red-900 text-xs">
              <strong>💡 Tip:</strong> Use "Both" mode for important announcements, "Push Only" for urgent updates, 
              and "Store Only\" for information users can check later.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel