import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { Play, Pause, RotateCcw, Heart, Waves, Sun } from 'lucide-react';

const MeditationApp = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('inhale');
  const [sessionTime, setSessionTime] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [breathCount, setBreathCount] = useState(0);
  const [currentExercise, setCurrentExercise] = useState('breathing');
  const intervalRef = useRef(null);
  const phaseIntervalRef = useRef(null);
  const audioRef = useRef(null);


  const exercises = {
    breathing: {
      name: "4-7-8 Breathing",
      description: "Inhale for 4, hold for 7, exhale for 8",
      icon: <Waves className="w-6 h-6" />,
      phases: [
        { name: 'inhale', duration: 4000, text: 'Breathe in slowly...' },
        { name: 'hold', duration: 7000, text: 'Hold your breath...' },
        { name: 'exhale', duration: 8000, text: 'Breathe out slowly...' },
        { name: 'pause', duration: 1000, text: 'Rest...' }
      ]
    },
    boxBreathing: {
      name: "Box Breathing",
      description: "Equal counts of inhale, hold, exhale, hold",
      icon: <Heart className="w-6 h-6" />,
      phases: [
        { name: 'inhale', duration: 4000, text: 'Inhale...' },
        { name: 'hold', duration: 4000, text: 'Hold...' },
        { name: 'exhale', duration: 4000, text: 'Exhale...' },
        { name: 'hold', duration: 4000, text: 'Hold...' }
      ]
    },
    triangle: {
      name: "Triangle Breathing",
      description: "Inhale, exhale, pause in equal measures",
      icon: <Sun className="w-6 h-6" />,
      phases: [
        { name: 'inhale', duration: 4000, text: 'Breathe in...' },
        { name: 'exhale', duration: 4000, text: 'Breathe out...' },
        { name: 'pause', duration: 4000, text: 'Rest and be present...' }
      ]
    }
  };

  const getCurrentPhase = () => {
    const exercise = exercises[currentExercise];
    const currentPhaseData = exercise.phases.find(phase => phase.name === currentPhase);
    return currentPhaseData || exercise.phases[0];
  };

  const startSession = () => {
  setIsActive(true);
  setSessionTime(0);
  setBreathCount(0);

  // Start audio
  if (audioRef.current) {
  audioRef.current.currentTime = 0;
  audioRef.current.volume = 0.4;
    audioRef.current.play().catch((e) => {
      console.warn("Autoplay was blocked:", e);
    });
  }

  // Start timer
  intervalRef.current = setInterval(() => {
    setSessionTime(prev => prev + 1);
  }, 1000);

  startBreathingCycle();
};


  const startBreathingCycle = () => {
    const exercise = exercises[currentExercise];
    let phaseIndex = 0;

    const cyclePhases = () => {
      const phase = exercise.phases[phaseIndex];
      setCurrentPhase(phase.name);

      phaseIntervalRef.current = setTimeout(() => {
        phaseIndex = (phaseIndex + 1) % exercise.phases.length;
        if (phaseIndex === 0) {
          setBreathCount(prev => prev + 1);
        }
        cyclePhases();
      }, phase.duration);
    };

    cyclePhases();
  };

  const pauseSession = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (phaseIntervalRef.current) {
      clearTimeout(phaseIntervalRef.current);
    }
    if (audioRef.current) {
  audioRef.current.pause();
}
  };

  const resetSession = () => {
    setIsActive(false);
    setSessionTime(0);
    setBreathCount(0);
    setCurrentPhase('inhale');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (phaseIntervalRef.current) {
      clearTimeout(phaseIntervalRef.current);
    }
    if (audioRef.current) {
  audioRef.current.pause();
  audioRef.current.currentTime = 0;
}
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCircleScale = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'scale-150';
      case 'hold':
        return 'scale-150';
      case 'exhale':
        return 'scale-75';
      case 'pause':
        return 'scale-100';
      default:
        return 'scale-100';
    }
  };

  const getCircleColor = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'bg-gradient-to-br from-blue-400 to-purple-500';
      case 'hold':
        return 'bg-gradient-to-br from-purple-500 to-pink-500';
      case 'exhale':
        return 'bg-gradient-to-br from-pink-500 to-orange-400';
      case 'pause':
        return 'bg-gradient-to-br from-green-400 to-blue-500';
      default:
        return 'bg-gradient-to-br from-blue-400 to-purple-500';
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (phaseIntervalRef.current) {
        clearTimeout(phaseIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 text-slate-800 p-4">
    <audio ref={audioRef} loop>
  <source src="/meditation-music.mp3" type="audio/mpeg" />
  Your browser does not support the audio element.
</audio>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Mindful Meditation
          </h1>
          <p className="text-slate-600 text-lg">Find peace in the present moment</p>
        </div>

        {/* Exercise Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Choose Your Practice</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(exercises).map(([key, exercise]) => (
              <button
                key={key}
                onClick={() => {
                  setCurrentExercise(key);
                  resetSession();
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  currentExercise === key
                    ? 'border-purple-400 bg-purple-100 shadow-lg shadow-purple-200/50'
                    : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white/90'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-purple-600">{exercise.icon}</div>
                  <h3 className="font-semibold text-slate-800">{exercise.name}</h3>
                </div>
                <p className="text-sm text-slate-600">{exercise.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Meditation Circle */}
        <div className="relative flex flex-col items-center justify-center mb-8">
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Breathing Circle */}
            <div
              className={`absolute w-64 h-64 rounded-full ${getCircleColor()} transition-all duration-1000 ease-in-out ${getCircleScale()} opacity-80`}
            />
            <div className="absolute w-48 h-48 rounded-full border-4 border-white/60 animate-pulse" />

            {/* Center Content */}
            <div className="relative z-10 text-center">
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {getCurrentPhase().text}
              </div>
              <div className="text-lg text-slate-600">
                {exercises[currentExercise].name}
              </div>
            </div>
          </div>

          {/* Breathing Guide Text */}
          <div className="mt-8 text-center">
            <div className="text-2xl font-semibold mb-2 capitalize text-slate-700">
              {currentPhase === 'pause' ? 'Rest' : currentPhase}
            </div>
            <div className="text-slate-600">
              Follow the circle's rhythm
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/70 rounded-xl p-4 text-center border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{formatTime(sessionTime)}</div>
            <div className="text-sm text-slate-600">Session Time</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{breathCount}</div>
            <div className="text-sm text-slate-600">Breath Cycles</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{selectedDuration}</div>
            <div className="text-sm text-slate-600">Target (min)</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-pink-600 capitalize">{currentPhase}</div>
            <div className="text-sm text-slate-600">Current Phase</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={isActive ? pauseSession : startSession}
            className={`px-8 py-4 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
              isActive
                ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isActive ? 'Pause' : 'Start Session'}
          </button>

          <button
            onClick={resetSession}
            className="px-6 py-4 rounded-full bg-slate-200 hover:bg-slate-300 transition-all duration-300 flex items-center gap-2 text-slate-700 shadow-sm"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Duration Selector */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-3 text-slate-800">Session Duration</h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {[1, 3, 5, 10, 15, 20].map(duration => (
              <button
                key={duration}
                onClick={() => setSelectedDuration(duration)}
                className={`px-4 py-2 rounded-full transition-all duration-300 ${
                  selectedDuration === duration
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-200/50'
                    : 'bg-white/70 text-slate-700 hover:bg-white/90 border border-slate-200'
                }`}
              >
                {duration} min
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500">
          <p>Take a moment to breathe and find your center</p>
        </div>
      </div>
    </div>
  );
};

export default MeditationApp;