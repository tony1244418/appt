// Android WebView Interface for Chrome Custom Tabs
// This file provides the interface between the WebView and native Android Custom Tabs

window.AndroidInterface = {
  // Function to open URL in Chrome Custom Tabs
  openCustomTab: function(url) {
    console.log('Opening URL in Custom Tabs:', url)
    
    // Check for native Android WebView interface
    if (typeof Android !== 'undefined') {
      if (Android.openCustomTab) {
        // Native Custom Tabs implementation
        Android.openCustomTab(url)
        return true
      } else if (Android.openUrl) {
        // Fallback native method
        Android.openUrl(url)
        return true
      }
    }
    
    // Check for Cordova/PhoneGap
    if (typeof cordova !== 'undefined' && cordova.InAppBrowser) {
      cordova.InAppBrowser.open(url, '_blank', 'location=yes,toolbar=yes')
      return true
    }
    
    // Check for Capacitor
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.Browser) {
      Capacitor.Plugins.Browser.open({ url: url })
      return true
    }
    
    // Use intent-based approach
    return this.openWithIntent(url)
  },
  
  // Enhanced intent-based Custom Tabs opener
  openWithIntent: function(url) {
    try {
      // Primary: Chrome Custom Tabs with enhanced parameters
      const chromeIntent = this.createCustomTabsIntent(url, 'com.android.chrome')
      
      // Create hidden iframe to trigger intent without page navigation
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'display:none;width:0;height:0;border:none;'
      iframe.src = chromeIntent
      
      document.body.appendChild(iframe)
      
      // Set up cleanup and fallback
      let cleaned = false
      const cleanup = () => {
        if (!cleaned && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
          cleaned = true
        }
      }
      
      // Quick cleanup
      setTimeout(cleanup, 1000)
      
      // Fallback detection - if still on same page after 2 seconds, try alternatives
      setTimeout(() => {
        if (!cleaned) {
          console.log('Chrome Custom Tabs may have failed, trying alternatives')
          this.tryAlternativeBrowsers(url)
        }
      }, 2000)
      
      return true
    } catch (error) {
      console.error('Intent-based Custom Tabs failed:', error)
      return this.tryAlternativeBrowsers(url)
    }
  },
  
  // Create Custom Tabs intent with proper parameters
  createCustomTabsIntent: function(url, packageName) {
    const cleanUrl = url.replace(/^https?:\/\//, '')
    
    return `intent://${cleanUrl}#Intent;` +
           `scheme=https;` +
           `package=${packageName};` +
           `action=android.intent.action.VIEW;` +
           `category=android.intent.category.BROWSABLE;` +
           `S.android.intent.extra.REFERRER=${encodeURIComponent('android-app://com.tonygamingtz.app')};` +
           `S.browser_fallback_url=${encodeURIComponent(url)};` +
           `B.android.intent.extra.CUSTOM_TABS_EXIT_ANIMATION_BUNDLE=true;` +
           `B.android.intent.extra.CUSTOM_TABS_TOOLBAR_COLOR=-65536;` + // Red color
           `end`
  },
  
  // Try alternative browsers with Custom Tabs support
  tryAlternativeBrowsers: function(url) {
    const browsers = [
      { package: 'com.chrome.beta', name: 'Chrome Beta' },
      { package: 'com.chrome.dev', name: 'Chrome Dev' },
      { package: 'com.microsoft.emmx', name: 'Microsoft Edge' },
      { package: 'org.mozilla.firefox', name: 'Firefox' },
      { package: 'com.opera.browser', name: 'Opera' },
      { package: 'com.brave.browser', name: 'Brave' },
      { package: 'com.UCMobile.intl', name: 'UC Browser' }
    ]
    
    for (const browser of browsers) {
      try {
        const intent = this.createCustomTabsIntent(url, browser.package)
        
        const testFrame = document.createElement('iframe')
        testFrame.style.display = 'none'
        testFrame.src = intent
        document.body.appendChild(testFrame)
        
        setTimeout(() => {
          if (testFrame.parentNode) {
            testFrame.parentNode.removeChild(testFrame)
          }
        }, 500)
        
        console.log(`Trying ${browser.name}...`)
        return true
      } catch (error) {
        console.log(`${browser.name} failed:`, error)
        continue
      }
    }
    
    // Final fallback: standard browser opening
    console.log('All Custom Tabs attempts failed, using standard browser')
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
      if (newWindow) {
        return true
      } else {
        window.location.href = url
        return true
      }
    } catch (error) {
      window.location.href = url
      return true
    }
  },
  
  // Check if Custom Tabs are available
  isCustomTabsAvailable: function() {
    // Check for native support
    if (typeof Android !== 'undefined' && Android.openCustomTab) {
      return true
    }
    
    // Check for Cordova/PhoneGap
    if (typeof cordova !== 'undefined' && cordova.InAppBrowser) {
      return true
    }
    
    // Check for Capacitor
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.Browser) {
      return true
    }
    
    // Check if we're on Android (intent-based Custom Tabs available)
    return /Android/i.test(navigator.userAgent)
  },
  
  // Get available browser information
  getBrowserInfo: function() {
    const userAgent = navigator.userAgent
    const isAndroid = /Android/i.test(userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
    
    return {
      isAndroid,
      isIOS,
      isMobile: isAndroid || isIOS,
      hasNativeSupport: typeof Android !== 'undefined',
      hasCordova: typeof cordova !== 'undefined',
      hasCapacitor: typeof Capacitor !== 'undefined',
      customTabsAvailable: this.isCustomTabsAvailable()
    }
  }
}

// Auto-detect and enhance Custom Tabs functionality
document.addEventListener('DOMContentLoaded', function() {
  // Enhance all external links to use Custom Tabs
  const isAndroid = /Android/i.test(navigator.userAgent)
  
  if (isAndroid) {
    console.log('Android detected - Custom Tabs interface ready')
    
    // Add Custom Tabs styling hints
    const style = document.createElement('style')
    style.textContent = `
      .custom-tabs-ready {
        position: relative;
      }
      .custom-tabs-ready::after {
        content: "🔒";
        position: absolute;
        top: -5px;
        right: -5px;
        font-size: 10px;
        opacity: 0.7;
      }
    `
    document.head.appendChild(style)
  }
})

// Export for use in React components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.AndroidInterface
}