import React from 'react'
import { ExternalLink, AlertTriangle, X } from 'lucide-react'

interface ExternalLinkWarningProps {
  isOpen: boolean
  url: string
  onConfirm: () => void
  onCancel: () => void
}

const ExternalLinkWarning: React.FC<ExternalLinkWarningProps> = ({
  isOpen,
  url,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-scale-in shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Leaving TonyGamingTZ
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 text-sm mb-3">
            You're about to visit an external website. This link will open in a secure browser within the app.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center space-x-2 mb-1">
              <ExternalLink className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Secure Browser
              </span>
            </div>
            <p className="text-sm text-gray-800 font-mono break-all">
              {getDomain(url)}
            </p>
            <div className="flex items-center space-x-1 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Opens in secure in-app browser</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Continue</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          TonyGamingTZ is not responsible for external content
        </p>
        
        <div className="mt-2 text-center">
          <div className="inline-flex items-center space-x-1 text-xs text-gray-400">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>Stays within app</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>Address bar included</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>Easy return</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExternalLinkWarning