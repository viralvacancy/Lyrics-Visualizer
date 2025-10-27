import React, { useState, useEffect, useRef } from 'react';
import type { Track, LyricLine, VisualMode } from '../types';
import { parseLrc } from '../utils/lrcParser';

interface LyricVisualizerProps {
  track: Track | null;
  visualMode: VisualMode;
}

const kineticAnimations = ['animate-kinetic-fade-up', 'animate-kinetic-zoom-in', 'animate-kinetic-flip-in', 'animate-kinetic-slide-down', 'animate-kinetic-rotate-in'];

const LyricVisualizer: React.FC<LyricVisualizerProps> = ({ track, visualMode }) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentKey, setCurrentKey] = useState(0);
  const [typedText, setTypedText] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (track) {
      setLyrics(parseLrc(track.lrc));
      setCurrentIndex(-1);
      setCurrentKey(prev => prev + 1); // Force re-render for animations
      const allAudio = document.getElementsByTagName('audio');
      if (allAudio.length > 0) {
        audioRef.current = allAudio[0];
      }
    } else {
      setLyrics([]);
    }
  }, [track]);

  const currentLine = lyrics[currentIndex];

  useEffect(() => {
    if (visualMode === 'terminal' && currentLine) {
      setTypedText('');
      let i = 0;
      const interval = setInterval(() => {
        setTypedText(currentLine.text.substring(0, i + 1));
        i++;
        if (i >= currentLine.text.length) {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [currentLine, visualMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || lyrics.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      let newIndex = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].time) {
          newIndex = i;
          break;
        }
      }
      if (newIndex !== currentIndex) {
          setCurrentIndex(newIndex);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [lyrics, currentIndex]);
  
  const renderLyricsContent = () => {
    if (!track) return null;
    if (lyrics.length === 0 || lyrics[0].text.toLowerCase().includes('transcription failed')) {
        return <div className="text-gray-500 font-orbitron text-center">No lyrics available or transcription failed.</div>
    }

    const prevLine = lyrics[currentIndex - 1];
    const nextLine = lyrics[currentIndex + 1];

    const lineClasses = "transition-all duration-700 ease-in-out";
    
    switch (visualMode) {
      case 'rain':
        return (
            <div key={`${currentKey}-${currentIndex}`} className="w-full h-full flex items-center justify-center rain-container">
                <div className="text-center font-sans">
                    <p className={`${lineClasses} text-xl lg:text-2xl text-blue-200/40 blur-sm h-8`}>{prevLine?.text}</p>
                    <p className={`${lineClasses} text-4xl lg:text-6xl font-bold my-4 text-white animate-rain-text-focus h-20`} style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.8)' }}>
                        {currentLine?.text || '...'}
                    </p>
                    <p className={`${lineClasses} text-xl lg:text-2xl text-blue-200/40 blur-sm h-8`}>{nextLine?.text}</p>
                </div>
            </div>
        );
      case 'ember':
        return (
            <div key={`${currentKey}-${currentIndex}`} className="w-full h-full flex items-center justify-center ember-container relative overflow-hidden">
                <div className="absolute inset-0 ember-particles">
                    {[...Array(20)].map((_, i) => <div key={i} className="particle"></div>)}
                </div>
                <div className="text-center font-serif relative">
                    <p className={`${lineClasses} text-xl lg:text-2xl text-orange-400/30 opacity-50 h-8`}>{prevLine?.text}</p>
                    <p className={`${lineClasses} text-4xl lg:text-6xl font-bold my-4 text-white ember-text h-20`}>
                        {currentLine?.text || '...'}
                    </p>
                    <p className={`${lineClasses} text-xl lg:text-2xl text-orange-400/30 opacity-50 h-8`}>{nextLine?.text}</p>
                </div>
            </div>
        );
      case 'neon':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-black neon-bg"></div>
            <div className="text-center font-orbitron relative">
              <p className="text-3xl lg:text-5xl text-cyan-300 animate-neon-flicker-improved neon-text" data-text={currentLine?.text || '...'}>
                {currentLine?.text || '...'}
              </p>
            </div>
          </div>
        );
      case 'terminal':
        return (
          <div className="font-mono text-left p-4 sm:p-8 text-lg sm:text-xl text-green-400 self-start w-full overflow-y-auto">
             {lyrics.map((line, index) => (
                <p key={index} className={`transition-opacity duration-300 ${index === currentIndex ? 'opacity-100' : 'opacity-30'}`}>
                    <span className="text-green-800 mr-4 select-none">{`> [${line.time.toFixed(2)}]`}</span>
                    {index === currentIndex ? (
                      <>
                        <span>{typedText}</span>
                        <span className="animate-blink">_</span>
                      </>
                    ) : line.text}
                </p>
             ))}
          </div>
        );
      case 'kinetic':
        return (
            <div key={`${currentKey}-${currentIndex}`} className="text-center font-extrabold text-4xl lg:text-6xl text-white uppercase tracking-wider animate-pulse-shadow animate-kinetic-container-punch">
                {(currentLine?.text || '...').split(' ').map((word, i) => {
                    const randomAnimation = kineticAnimations[Math.floor(Math.random() * kineticAnimations.length)];
                    const randomDelay = i * 80 + Math.random() * 50;
                    return (
                        <span key={`${currentKey}-${currentIndex}-${i}`} className={`inline-block ${randomAnimation}`} style={{ animationDelay: `${randomDelay}ms`}}>{word}&nbsp;</span>
                    )
                })}
            </div>
        )
      case 'focus':
      default:
        return (
          <div className="text-center">
            <p className={`${lineClasses} text-xl lg:text-2xl text-gray-500 h-8`}>{prevLine?.text}</p>
            <p className={`${lineClasses} text-4xl lg:text-6xl font-bold my-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 animate-gradient-shift h-20`}>{currentLine?.text || '...'}</p>
            <p className={`${lineClasses} text-xl lg:text-2xl text-gray-500 h-8`}>{nextLine?.text}</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 overflow-hidden relative bg-black">
      {renderLyricsContent()}
      <style>{`
          /* Rain Mode */
          .rain-container { 
              background: linear-gradient(to bottom, #0c1445, #070b24);
              overflow: hidden;
          }
          @keyframes fall {
              to { transform: translateY(100vh); }
          }
          .rain-container::before {
              content: ''; position: absolute; top: -100vh; left: 0; right: 0; bottom: 0;
              height: 200vh;
              background-image:
                  linear-gradient(178deg, transparent 95%, rgba(173, 216, 230, 0.4) 95%),
                  linear-gradient(178deg, transparent 95%, rgba(173, 216, 230, 0.2) 95%);
              background-repeat: repeat-x;
              background-size: 4px 100%, 8px 100%;
              background-position: 10% 0, 80% 0;
              animation: fall 1s linear infinite;
          }
          .rain-container::after {
              content: ''; position: absolute; top: -100vh; left: 0; right: 0; bottom: 0;
              height: 200vh;
              background-image:
                  linear-gradient(178deg, transparent 95%, rgba(173, 216, 230, 0.3) 95%),
                  linear-gradient(178deg, transparent 95%, rgba(173, 216, 230, 0.5) 95%);
              background-repeat: repeat-x;
              background-size: 2px 100%, 6px 100%;
              background-position: 40% 0, 60% 0;
              animation: fall 0.7s linear infinite;
          }
          @keyframes rain-text-focus {
            from { opacity: 0.5; filter: blur(5px); }
            to { opacity: 1; filter: blur(0); }
          }
          .animate-rain-text-focus { animation: rain-text-focus 0.8s ease-out; }

          /* Ember Mode */
          .ember-container { background: #000; }
          .ember-container::before {
             content: ''; position: absolute; bottom: -50%; left: -50%; width: 200%; height: 100%;
             background: radial-gradient(ellipse at center, rgba(255,100,0,0.2) 0%, rgba(0,0,0,0) 60%);
             animation: ember-glow 5s infinite alternate;
          }
          @keyframes ember-glow {
            from { transform: scale(0.9) translateY(10px); opacity: 0.8; }
            to { transform: scale(1.1) translateY(-10px); opacity: 1; }
          }
          .ember-text {
            color: #fff;
            animation: ember-flicker 2s infinite linear;
            text-shadow:
              0 0 5px #fff, 0 0 10px #fff, 0 0 20px #ff9900, 0 0 30px #ff9900,
              0 0 40px #ff6600, 0 0 50px #ff6600;
          }
          @keyframes ember-flicker {
            0%, 100% { opacity: 1; text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #ff9900, 0 0 30px #ff9900, 0 0 40px #ff6600, 0 0 50px #ff6600; }
            50% { opacity: 0.9; text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 18px #ff9900, 0 0 28px #ff9900, 0 0 38px #ff6600, 0 0 48px #ff6600; }
          }
          .ember-particles .particle {
            position: absolute; bottom: -20px; background: #ffcc00; border-radius: 50%;
            opacity: 0; animation: rise 5s infinite; filter: blur(1px);
          }
          @keyframes rise {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-100vh) scale(0); opacity: 0; }
          }
          ${[...Array(20)].map((_, i) => `
            .ember-particles .particle:nth-child(${i + 1}) {
              width: ${Math.random() * 5 + 2}px;
              height: ${Math.random() * 5 + 2}px;
              left: ${Math.random() * 100}%;
              animation-duration: ${Math.random() * 4 + 3}s;
              animation-delay: ${Math.random() * 5}s;
            }
          `).join('')}

          /* Focus Mode */
          .animate-gradient-shift { background-size: 200% auto; animation: gradient-shift 5s ease infinite; }
          @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

          /* Kinetic Mode */
          @keyframes pulse-shadow { 0%, 100% { text-shadow: 0 0 20px rgba(236, 72, 153, 0.5); } 50% { text-shadow: 0 0 35px rgba(168, 85, 247, 0.7); } }
          .animate-pulse-shadow { animation: pulse-shadow 3s ease-in-out infinite; }
          @keyframes kinetic-container-punch { from { transform: scale(0.98); opacity: 0.8; } to { transform: scale(1); opacity: 1; } }
          .animate-kinetic-container-punch { animation: kinetic-container-punch 0.4s ease-out; }

          @keyframes kinetic-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-kinetic-fade-up { animation: kinetic-fade-up 0.5s ease-out forwards; opacity: 0; }
          @keyframes kinetic-zoom-in { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
          .animate-kinetic-zoom-in { animation: kinetic-zoom-in 0.4s ease-out forwards; opacity: 0; }
          @keyframes kinetic-flip-in { from { opacity: 0; transform: perspective(500px) rotateX(-90deg); } to { opacity: 1; transform: perspective(500px) rotateX(0); } }
          .animate-kinetic-flip-in { animation: kinetic-flip-in 0.6s ease-out forwards; opacity: 0; }
          @keyframes kinetic-slide-down { from { opacity: 0; transform: translateY(-30px) skewY(10deg); } to { opacity: 1; transform: translateY(0) skewY(0); } }
          .animate-kinetic-slide-down { animation: kinetic-slide-down 0.5s ease-out forwards; opacity: 0; }
          @keyframes kinetic-rotate-in { from { opacity: 0; transform: rotate(-15deg) scale(0.8); } to { opacity: 1; transform: rotate(0) scale(1); } }
          .animate-kinetic-rotate-in { animation: kinetic-rotate-in 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards; opacity: 0; }
          
          /* Neon Mode */
          .neon-bg { background-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.8) 80%), radial-gradient(circle at 50% 50%, #3a0ca3 0%, #000 70%); }
          .neon-text { position: relative; text-shadow: 0 0 5px #06b6d4, 0 0 10px #06b6d4, 0 0 20px #06b6d4, 0 0 40px #0891b2, 0 0 70px #0891b2; }
          .neon-text::before { content: attr(data-text); position: absolute; left: 0; top: 0; z-index: -1; filter: blur(15px); opacity: 0.8; }
          @keyframes neon-flicker-improved { 0%, 100% { opacity: 1; } 5% { opacity: 0.95; } 10% { opacity: 1; } 12% { opacity: 0.9; } 20% { opacity: 1; } 25% { opacity: 0.93; } 30% { opacity: 1; } 50% { opacity: 0.98; } 52% { opacity: 1; } 55% { opacity: 0.95; } 60% { opacity: 1; } }
          .animate-neon-flicker-improved { animation: neon-flicker-improved 4s infinite linear; }
          
          /* Terminal Mode */
          @keyframes blink { 50% { opacity: 0; } }
          .animate-blink { animation: blink 1s step-end infinite; }
        `}</style>
    </div>
  );
};

export default LyricVisualizer;