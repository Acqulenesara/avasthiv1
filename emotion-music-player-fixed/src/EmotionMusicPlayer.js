import React, { useState } from 'react';

const EmotionMusicPlayer = () => {
  const [hoveredEmotion, setHoveredEmotion] = useState(null);

  const songCollections = {
    happy: [
      "https://music.youtube.com/watch?v=ZbZSe6N_BXs", // Happy - Pharrell Williams
      "https://music.youtube.com/watch?v=y6Sxv-sUYtM", // Don't Stop Me Now - Queen
      "https://music.youtube.com/watch?v=nfWlot6h_JM", // Shake It Off - Taylor Swift
      "https://music.youtube.com/watch?v=ru0K8uYEZWw", // Can't Stop the Feeling - Justin Timberlake
      "https://music.youtube.com/watch?v=fLexgOxsZu0", // Good as Hell - Lizzo
      "https://music.youtube.com/watch?v=aJOTlE1K90k", // Girls Just Want to Have Fun - Cyndi Lauper
      "https://music.youtube.com/watch?v=kYtGl1dX5qI", // Walking on Sunshine - Katrina and the Waves
      "https://music.youtube.com/watch?v=WbN0nX61rIs" // Lovely Day - Bill Withers
    ],
    sad: [
      "https://music.youtube.com/watch?v=4NRXx6U8ABQ", // Mad World - Gary Jules
      "https://music.youtube.com/watch?v=8AHCfZTRGiI", // Mad World - Tears for Fears
      "https://music.youtube.com/watch?v=n4RjJKxsamQ", // Hurt - Johnny Cash
      "https://music.youtube.com/watch?v=FB3ptjiNJsY", // Black - Pearl Jam
      "https://music.youtube.com/watch?v=hTWKbfoikeg", // Creep - Radiohead
      "https://music.youtube.com/watch?v=5anLPw0Efmo", // Everybody Hurts - R.E.M.
      "https://music.youtube.com/watch?v=vt1Pwfnh5pc", // Hallelujah - Jeff Buckley
      "https://music.youtube.com/watch?v=3MB8C1npOhI" // The Sound of Silence - Simon & Garfunkel
    ],
    angry: [
      "https://music.youtube.com/watch?v=xO1TScQwu6g", // Bodies - Drowning Pool
      "https://music.youtube.com/watch?v=04F4xlWSFh0", // Killing in the Name - Rage Against the Machine
      "https://music.youtube.com/watch?v=WsSCjIWFmyY", // Break Stuff - Limp Bizkit
      "https://music.youtube.com/watch?v=CSvFpBOe8eY", // Du Hast - Rammstein
      "https://music.youtube.com/watch?v=qeMFqkcPYcg", // Chop Suey! - System of a Down
      "https://music.youtube.com/watch?v=j_QLzthSkfM", // You're Going Down - Sick Puppies
      "https://music.youtube.com/watch?v=7qrRzNidzIc", // Down with the Sickness - Disturbed
      "https://music.youtube.com/watch?v=L397TWLwrUU" // Freak on a Leash - Korn
    ],
    relaxed: [
      "https://music.youtube.com/watch?v=UnPMoAb4y8U", // Weightless - Marconi Union
      "https://music.youtube.com/watch?v=HEuKbwyQbEs", // Aqueous Transmission - Incubus
      "https://music.youtube.com/watch?v=hHW1oY26kxQ", // Clair de Lune - Debussy
      "https://music.youtube.com/watch?v=9jK-NcRmVcw", // Gymnopédie No. 1 - Erik Satie
      "https://music.youtube.com/watch?v=NvryolGa19A", // Porcelain - Moby
      "https://music.youtube.com/watch?v=J7HIxqDpJ0Q", // Teardrop - Massive Attack
      "https://music.youtube.com/watch?v=RDF_Tyqq4zI", // Svefn-g-englar - Sigur Rós
      "https://music.youtube.com/watch?v=MElfYleGIVU" // Ambient 1: Music for Airports - Brian Eno
    ],
    anxious: [
      "https://music.youtube.com/watch?v=YQHsXMglC9A", // Hello - Adele
      "https://music.youtube.com/watch?v=ktvTqknDobU", // Apologize - OneRepublic
      "https://music.youtube.com/watch?v=gH476CxJxfg", // Breathe - Sia
      "https://music.youtube.com/watch?v=hLQl3WQQoQ0", // Weightless - Marconi Union
      "https://music.youtube.com/watch?v=u9Dg-g7t2l4", // Breathe Me - Sia
      "https://music.youtube.com/watch?v=ScNNfyq3d_w", // Calm Down - Rema
      "https://music.youtube.com/watch?v=PVjiKRfKpPI", // Anxiety - Julia Michaels
      "https://music.youtube.com/watch?v=JkK8g6FMEXE" // Stressed Out - Twenty One Pilots
    ]
  };

  const emotions = [
    {
      id: 'happy',
      emoji: '😊',
      label: 'Happy',
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      description: 'Upbeat & Energetic'
    },
    {
      id: 'sad',
      emoji: '😢',
      label: 'Sad',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      description: 'Melancholic & Soothing'
    },
    {
      id: 'angry',
      emoji: '😠',
      label: 'Angry',
      color: 'from-red-500 to-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      description: 'Intense & Powerful'
    },
    {
      id: 'relaxed',
      emoji: '😌',
      label: 'Relaxed',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      description: 'Calm & Peaceful'
    },
    {
      id: 'anxious',
      emoji: '😨',
      label: 'Anxious',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      description: 'Calming & Comforting'
    }
  ];

  const redirectToYouTube = (mood) => {
    const songs = songCollections[mood];
    if (songs && songs.length > 0) {
      // Get a random song from the collection
      const randomIndex = Math.floor(Math.random() * songs.length);
      const randomSong = songs[randomIndex];
      window.open(randomSong, '_blank');
    } else {
      alert("No songs found for this mood!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-block p-4 bg-white bg-opacity-10 rounded-full backdrop-blur-sm mb-6">
            <div className="text-6xl animate-bounce">🎵</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              How are you feeling today?
            </span>
          </h1>
          <p className="text-xl text-white text-opacity-80 max-w-2xl mx-auto leading-relaxed">
            Choose your mood and discover a new song every time you click!
          </p>
        </div>

        {/* Emotion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {emotions.map((emotion) => (
            <div
              key={emotion.id}
              onClick={() => redirectToYouTube(emotion.id)}
              onMouseEnter={() => setHoveredEmotion(emotion.id)}
              onMouseLeave={() => setHoveredEmotion(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  redirectToYouTube(emotion.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Play ${emotion.label} playlist - ${emotion.description}`}
              className={`relative group cursor-pointer transform transition-all duration-500 ease-out hover:scale-110 hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 ${
                hoveredEmotion === emotion.id ? 'z-20' : 'z-10'
              }`}
            >
              {/* Card Background */}
              <div className={`relative overflow-hidden rounded-2xl bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 p-8 shadow-2xl transition-all duration-300 group-hover:bg-opacity-20 group-hover:shadow-2xl ${emotion.bgColor} ${emotion.borderColor}`}>

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${emotion.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl`}></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Emoji */}
                  <div className="text-7xl mb-4 select-none transform transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                    {emotion.emoji}
                  </div>

                  {/* Label */}
                  <h3 className="font-bold text-2xl mb-2 text-white group-hover:text-opacity-90 transition-colors duration-300">
                    {emotion.label}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-white text-opacity-70 group-hover:text-opacity-90 transition-colors duration-300 mb-4">
                    {emotion.description}
                  </p>

                  {/* Play Button */}
                  <div className="flex items-center justify-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-300 group-hover:scale-110">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Hover Effect Ring */}
                <div className="absolute inset-0 rounded-2xl ring-4 ring-white ring-opacity-0 group-hover:ring-opacity-30 transition-all duration-300"></div>
              </div>

              {/* Floating Particles Effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300 animate-ping"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300 animate-ping" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-white text-opacity-60 text-lg">
            Click on any emotion to discover a random song that matches your mood
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-white bg-opacity-40 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white bg-opacity-40 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
            <div className="w-2 h-2 bg-white bg-opacity-40 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionMusicPlayer;