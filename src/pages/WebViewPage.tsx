import React, { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const WebViewPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    const url = searchParams.get('url')
    if (url) {
      const decodedUrl = decodeURIComponent(url)
      
      // Check if it's a TonyGamingTZ link
      if (decodedUrl.includes('tonygamingtz.com')) {
        // TonyGamingTZ links open in WebView
        setCurrentUrl(decodedUrl)
      } else {
        // External links open directly in system browser (Instagram style)
        // Use window.location.href for better compatibility with mobile browsers
        window.location.href = decodedUrl
        // Alternative fallback
        setTimeout(() => {
          navigate(-1)
        }, 100)
      }
    }
  }, [searchParams, navigate])

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Navigation - Only Back Button */}
      <div className="fixed top-0 left-0 z-50 p-4">
        <button
          onClick={handleGoBack}
          className="bg-black bg-opacity-50 text-white p-3 rounded-full shadow-lg hover:bg-opacity-70 transition-all duration-200 active:scale-95 backdrop-blur-sm"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Clean Content Area - No Headers, No Titles */}
      <div className="relative">
        {currentUrl ? (
          <div className="bg-white">
            {/* Full Screen Content Integration */}
            <iframe
              id="content-iframe"
              src={currentUrl}
              className="w-full h-screen border-0 bg-white"
              title="Content"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-top-navigation"
              allow="camera; microphone; geolocation; payment; fullscreen; autoplay; clipboard-read; clipboard-write"
              style={{
                height: '100vh',
                background: 'transparent'
              }}
            />
          </div>
        ) : (
          /* Minimal Welcome State */
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <button
                onClick={handleGoHome}
                className="bg-red-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebViewPage