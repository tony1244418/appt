import React from 'react'
import { Gamepad2, Download, Star } from 'lucide-react'

const GamePage: React.FC = () => {
  const games = [
    {
      title: 'Tanzania Simulator',
      description: 'Mchezo wa kuongoza gari Tanzania',
      image: 'https://tonygamingtz.com/wp-content/uploads/2024/12/360_F_998829852_ct2vUzdtvvC85Vw3MqKklB2aeV3kcoGa.webp',
      rating: 4.5,
      downloads: '10K+'
    },
    {
      title: 'Maleo TZ Mod',
      description: 'Mod ya mchezo wa Maleo',
      image: 'https://tonygamingtz.com/wp-content/uploads/2024/11/images-2024-11-24T205833.786.jpeg',
      rating: 4.8,
      downloads: '25K+'
    },
    {
      title: 'ETS2 Mod',
      description: 'Euro Truck Simulator 2 Mod',
      image: 'https://tonygamingtz.com/wp-content/uploads/2025/03/png-transparent-euro-truck-2-simulator-logo-euro-truck-simulator-2-scandinavia-american-truck-simulator-video-game-truck-truck-wizard-truck-driver-thumbnail.png',
      rating: 4.7,
      downloads: '15K+'
    }
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-black mb-4 flex items-center justify-center">
          <Gamepad2 className="mr-2" size={28} />
          Omba Game Hapa
        </h2>
        <p className="text-gray-600">
          Pata michezo bora
        </p>
      </div>

      <div className="space-y-4">
        {games.map((game, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start space-x-4">
              <img 
                src={game.image} 
                alt={game.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-black text-lg">
                  {game.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {game.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      {game.rating}
                    </div>
                    <div className="flex items-center">
                      <Download className="w-4 h-4 mr-1" />
                      {game.downloads}
                    </div>
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Pakua
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">
          <strong>Kumbuka:</strong> Michezo yote ni bure kabisa. Hakuna malipo yoyote yanayohitajika.
        </p>
      </div>
    </div>
  )
}

export default GamePage