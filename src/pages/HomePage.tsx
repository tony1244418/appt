import React from 'react'
import { useNavigate } from 'react-router-dom'
import ExternalLinkWarning from '../components/ExternalLinkWarning'
import { useExternalLinkHandler } from '../hooks/useExternalLinkHandler'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const {
    isWarningOpen,
    pendingUrl,
    handleLinkClick,
    confirmExternalLink,
    cancelExternalLink
  } = useExternalLinkHandler()

  const gameCategories = [
    {
      title: 'TANZANIA GAME SIO BURE',
      image: 'https://tonygamingtz.com/wp-content/uploads/2024/12/360_F_998829852_ct2vUzdtvvC85Vw3MqKklB2aeV3kcoGa.webp',
      link: 'https://tonygamingtz.com/tanzania-games/'
    },
    {
      title: 'MALEO TZ MOD SIO BURE',
      image: 'https://tonygamingtz.com/wp-content/uploads/2024/11/images-2024-11-24T205833.786.jpeg',
      link: 'https://tonygamingtz.com/maleo-mod-tz/'
    },
    {
      title: 'FREE GAMES (BURE)',
      image: 'https://tonygamingtz.com/wp-content/uploads/2024/10/6-65089_facebook-instant-games-logo-video-game-logo-png.png',
      link: 'https://www.freetz.online/'
    },
    {
      title: 'MALEO SKIN FREE (BURE)',
      image: 'https://tonygamingtz.com/wp-content/uploads/2024/11/images-2024-11-24T205833.786.jpeg',
      link: 'https://maleoskin.blogspot.com/?m=1'
    },
    {
      title: 'GAMES PROGRAM FREE (BURE)',
      image: 'https://tonygamingtz.com/wp-content/uploads/2024/12/download-3.png',
      link: 'https://tonygamingtz.com/important-games-programs/'
    },
    {
      title: 'ETS 2 MOD TZ SIO BURE',
      image: 'https://tonygamingtz.com/wp-content/uploads/2025/03/png-transparent-euro-truck-2-simulator-logo-euro-truck-simulator-2-scandinavia-american-truck-simulator-video-game-truck-truck-wizard-truck-driver-thumbnail.png',
      link: 'https://tonygamingtz.com/ets2-tanzania-game-for-pc/'
    }
  ]

  const handleCategoryClick = (link: string, e: React.MouseEvent) => {
    e.preventDefault()
    
    handleLinkClick(link, (internalUrl) => {
      // Internal TonyGamingTZ link - navigate to WebView
      navigate(`/webview?url=${encodeURIComponent(internalUrl)}`)
    })
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {gameCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm text-center">
              <img 
                src={category.image} 
                alt={category.title}
                className="w-20 h-20 mx-auto mb-3 object-contain"
              />
              <a 
                href={category.link}
                onClick={(e) => handleCategoryClick(category.link, e)}
                className="block bg-red-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors"
              >
                {category.title}
              </a>
            </div>
          ))}
        </div>
      </div>

      <ExternalLinkWarning
        isOpen={isWarningOpen}
        url={pendingUrl || ''}
        onConfirm={confirmExternalLink}
        onCancel={cancelExternalLink}
      />
    </>
  )
}

export default HomePage