import React from 'react'

interface ArenaSelectorProps {
  onArenaSelected: () => void
}

export const ArenaSelector: React.FC<ArenaSelectorProps> = ({ onArenaSelected }) => {
  const arenas = [
    { id: 'classic', name: 'Classic Arena', theme: 'classic' },
    { id: 'mystic', name: 'Mystic Realm', theme: 'mystic' },
    { id: 'future', name: 'Future City', theme: 'future' }
  ]

  const handleSelectArena = (arenaId: string) => {
    // TODO: Implement arena selection logic
    console.log('Selected arena:', arenaId)
    onArenaSelected()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">Choose Your Arena</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {arenas.map((arena) => (
            <div
              key={arena.id}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors border-2 border-transparent hover:border-blue-500"
              onClick={() => handleSelectArena(arena.id)}
            >
              <div className="aspect-video bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-400">Arena Preview</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{arena.name}</h3>
              <p className="text-gray-400">Experience chess in the {arena.theme} environment</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => handleSelectArena('classic')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition-colors"
          >
            Quick Match (Classic Arena)
          </button>
        </div>
      </div>
    </div>
  )
}