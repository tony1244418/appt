import { useState, useCallback } from 'react'

interface ExternalLinkState {
  isWarningOpen: boolean
  pendingUrl: string | null
}

export const useExternalLinkHandler = () => {
  const [state, setState] = useState<ExternalLinkState>({
    isWarningOpen: false,
    pendingUrl: null
  })

  const isInternalLink = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.includes('tonygamingtz.com')
    } catch {
      return false
    }
  }, [])

  const handleLinkClick = useCallback((url: string, onInternalLink?: (url: string) => void) => {
    if (isInternalLink(url)) {
      // Internal link - handle normally
      onInternalLink?.(url)
    } else {
      // External link - show warning
      setState({
        isWarningOpen: true,
        pendingUrl: url
      })
    }
  }, [isInternalLink])

  const confirmExternalLink = useCallback(() => {
    if (state.pendingUrl) {
      // Open using Chrome Custom Tabs for better in-app browser experience
      openInCustomTabs(state.pendingUrl)
    }
    setState({
      isWarningOpen: false,
      pendingUrl: null
    })
  }, [state.pendingUrl])

  const openInCustomTabs = useCallback((url: string) => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isMobile = isAndroid || isIOS
    
    // Priority 1: Native Android WebView with Custom Tabs
    if (isAndroid && 'AndroidInterface' in window) {
      try {
        // @ts-ignore - Android interface
        if (window.AndroidInterface?.openCustomTab) {
          window.AndroidInterface.openCustomTab(url)
          return
        }
      } catch (error) {
        console.log('Native Custom Tabs failed:', error)
      }
    }
    
    // Priority 2: Android Chrome Custom Tabs Intent (stays in app)
    if (isAndroid) {
      try {
        // Enhanced Custom Tabs intent that opens within the app context
        const customTabsUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;` +
          `scheme=https;` +
          `package=com.android.chrome;` +
          `action=android.intent.action.VIEW;` +
          `category=android.intent.category.BROWSABLE;` +
          `S.android.intent.extra.REFERRER=${encodeURIComponent('android-app://com.tonygamingtz.app')};` +
          `S.browser_fallback_url=${encodeURIComponent(url)};` +
          `B.android.intent.extra.CUSTOM_TABS_EXIT_ANIMATION_BUNDLE=true;` +
          `end`
        
        // Create a hidden iframe to trigger the intent without leaving the page
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = customTabsUrl
        document.body.appendChild(iframe)
        
        // Clean up iframe after a short delay
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe)
          }
        }, 1000)
        
        return
      } catch (error) {
        console.log('Chrome Custom Tabs intent failed:', error)
      }
      
      // Fallback for Android: Try other browsers with Custom Tabs support
      const androidBrowsers = [
        'com.android.chrome',           // Chrome
        'com.chrome.beta',              // Chrome Beta
        'com.chrome.dev',               // Chrome Dev
        'com.microsoft.emmx',           // Edge
        'org.mozilla.firefox',          // Firefox
        'com.opera.browser',            // Opera
        'com.brave.browser'             // Brave
      ]
      
      for (const browser of androidBrowsers) {
        try {
          const browserIntent = `intent://${url.replace(/^https?:\/\//, '')}#Intent;` +
            `scheme=https;` +
            `package=${browser};` +
            `S.browser_fallback_url=${encodeURIComponent(url)};` +
            `end`
          
          const testFrame = document.createElement('iframe')
          testFrame.style.display = 'none'
          testFrame.src = browserIntent
          document.body.appendChild(testFrame)
          
          setTimeout(() => {
            if (testFrame.parentNode) {
              testFrame.parentNode.removeChild(testFrame)
            }
          }, 500)
          
          return
        } catch (error) {
          continue
        }
      }
    }
    
    // Priority 3: iOS Safari View Controller (in-app browser)
    if (isIOS) {
      try {
        // iOS Safari View Controller behavior - opens in app context
        const safariVC = window.open(
          url, 
          '_blank', 
          'location=yes,toolbar=yes,scrollbars=yes,resizable=no,width=device-width,height=device-height'
        )
        
        // Check if window opened successfully
        if (safariVC) {
          return
        }
      } catch (error) {
        console.log('Safari View Controller failed:', error)
      }
      
      // iOS fallback: Try to open in Safari app but return to our app
      try {
        window.location.href = url
        return
      } catch (error) {
        console.log('iOS Safari fallback failed:', error)
      }
    }
    
    // Priority 4: Desktop in-app browser simulation
    if (!isMobile) {
      try {
        // Create a more browser-like popup for desktop
        const browserFeatures = [
          'location=yes',
          'toolbar=yes',
          'menubar=no',
          'scrollbars=yes',
          'resizable=yes',
          'status=yes',
          'width=1024',
          'height=768',
          'left=' + (screen.width / 2 - 512),
          'top=' + (screen.height / 2 - 384)
        ].join(',')
        
        const popup = window.open(url, 'TonyGamingTZ_Browser', browserFeatures)
        
        if (popup) {
          // Focus the popup
          popup.focus()
          return
        }
      } catch (error) {
        console.log('Desktop popup failed:', error)
      }
    }
    
    // Final fallback: Standard window.open with minimal features
    try {
      const fallbackWindow = window.open(
        url, 
        '_blank', 
        'noopener,noreferrer,location=yes,toolbar=yes'
      )
      
      if (fallbackWindow) {
        return
      }
    } catch (error) {
      console.log('Final fallback failed:', error)
    }
    
    // Last resort: direct navigation (should rarely happen)
    console.warn('All browser opening methods failed, using direct navigation')
    window.location.href = url
  }, [])

  const cancelExternalLink = useCallback(() => {
    setState({
      isWarningOpen: false,
      pendingUrl: null
    })
  }, [])

  return {
    isWarningOpen: state.isWarningOpen,
    pendingUrl: state.pendingUrl,
    handleLinkClick,
    confirmExternalLink,
    cancelExternalLink,
    isInternalLink
  }
}