import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const auroraStars = useMemo(
    () =>
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 6 + 4,
        size: Math.random() * 1.8 + 0.6,
        opacity: Math.random() * 0.6 + 0.2,
        twinkle: Math.random() * 0.7 + 0.7,
      })),
    []
  );
  const emberSparks = useMemo(
    () =>
      Array.from({ length: 28 }, () => ({
        left: Math.random() * 100,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 3 + 2.6,
        delay: Math.random() * 4,
        drift: Math.random() * 60 - 30,
      })),
    []
  );
  const emberEmbers = useMemo(
    () =>
      Array.from({ length: 18 }, () => ({
        left: Math.random() * 100,
        size: Math.random() * 2.4 + 1.2,
        duration: Math.random() * 4 + 4,
        delay: Math.random() * 5,
        drift: Math.random() * 40 - 20,
      })),
    []
  );

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
      case 'aurora':
        return (
          <div key={`${currentKey}-${currentIndex}`} className="w-full h-full flex items-center justify-center aurora-container relative overflow-hidden">
            <div className="aurora-gradient aurora-gradient-one" />
            <div className="aurora-gradient aurora-gradient-two" />
            <div className="aurora-stars">
              {auroraStars.map((star, i) => (
                <span
                  key={i}
                  className="aurora-star"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.duration}s`,
                    opacity: star.opacity,
                    ['--twinkle-scale' as any]: star.twinkle.toString(),
                  } as React.CSSProperties}
                />
              ))}
            </div>
            <div className="text-center font-sans relative z-10 px-6 py-4 backdrop-blur-[1px]">
              <p className={`${lineClasses} aurora-subtext`}>{prevLine?.text}</p>
              <p className={`${lineClasses} aurora-text`}>{currentLine?.text || '...'}</p>
              <p className={`${lineClasses} aurora-subtext`}>{nextLine?.text}</p>
            </div>
          </div>
        );
      case 'ember':
        return (
          <div key={`${currentKey}-${currentIndex}`} className="w-full h-full flex items-center justify-center ember-container relative overflow-hidden">
            <div className="ember-smoke" />
            <div className="ember-ground" />
            <div className="ember-particles ember-particles--sparks">
              {emberSparks.map((spark, i) => (
                <div
                  key={`spark-${i}`}
                  className="particle spark"
                  style={{
                    left: `${spark.left}%`,
                    width: `${spark.size}px`,
                    height: `${spark.size}px`,
                    animationDelay: `${spark.delay}s`,
                    animationDuration: `${spark.duration}s`,
                    ['--drift' as any]: `${spark.drift}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
            <div className="ember-particles ember-particles--embers">
              {emberEmbers.map((ember, i) => (
                <div
                  key={`ember-${i}`}
                  className="particle ember"
                  style={{
                    left: `${ember.left}%`,
                    width: `${ember.size}px`,
                    height: `${ember.size}px`,
                    animationDelay: `${ember.delay}s`,
                    animationDuration: `${ember.duration}s`,
                    ['--drift' as any]: `${ember.drift}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
            <div className="text-center font-serif relative z-10 space-y-2 px-6 py-4">
              <p className={`${lineClasses} ember-subtext`}>{prevLine?.text}</p>
              <p className={`${lineClasses} ember-text`}>{currentLine?.text || '...'}</p>
              <p className={`${lineClasses} ember-subtext`}>{nextLine?.text}</p>
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
          /* Aurora Mode */
          .aurora-container {
            background: radial-gradient(circle at 50% 120%, rgba(10, 30, 80, 0.5), rgba(3, 8, 20, 0.95) 65%);
            color: #fff;
          }
          .aurora-gradient {
            position: absolute;
            inset: -30%;
            filter: blur(60px);
            opacity: 0.55;
            mix-blend-mode: screen;
            animation: aurora-wave 18s ease-in-out infinite;
          }
          .aurora-gradient-one {
            background: conic-gradient(from 90deg at 50% 50%, rgba(94, 234, 212, 0.15), rgba(59, 130, 246, 0.35), rgba(16, 185, 129, 0.2), rgba(124, 58, 237, 0.25), rgba(94, 234, 212, 0.15));
          }
          .aurora-gradient-two {
            background: conic-gradient(from 180deg at 50% 50%, rgba(244, 114, 182, 0.2), rgba(56, 189, 248, 0.4), rgba(129, 140, 248, 0.25), rgba(34, 197, 94, 0.2), rgba(244, 114, 182, 0.2));
            animation-duration: 22s;
            animation-direction: reverse;
          }
          @keyframes aurora-wave {
            0% { transform: translate3d(-10%, 12%, 0) scale(1); }
            50% { transform: translate3d(12%, -14%, 0) scale(1.08); }
            100% { transform: translate3d(-10%, 12%, 0) scale(1); }
          }
          .aurora-stars {
            position: absolute;
            inset: 0;
            pointer-events: none;
          }
          .aurora-star {
            position: absolute;
            border-radius: 9999px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%);
            box-shadow: 0 0 6px rgba(168, 222, 255, 0.6);
            animation-name: aurora-star-twinkle;
            animation-iteration-count: infinite;
            animation-timing-function: ease-in-out;
          }
          @keyframes aurora-star-twinkle {
            0%, 100% { opacity: 0.25; transform: scale(calc(var(--twinkle-scale, 1) * 0.9)); }
            45% { opacity: 1; transform: scale(calc(var(--twinkle-scale, 1) * 1.3)); }
            70% { opacity: 0.6; transform: scale(calc(var(--twinkle-scale, 1))); }
          }
          .aurora-text {
            font-size: clamp(2.6rem, 5vw, 4.6rem);
            font-weight: 700;
            letter-spacing: 0.1em;
            color: #f8fbff;
            text-transform: uppercase;
            text-shadow:
              0 0 12px rgba(163, 230, 255, 0.8),
              0 0 30px rgba(129, 212, 250, 0.6),
              0 0 60px rgba(56, 189, 248, 0.35);
            animation: aurora-text-glow 7s ease-in-out infinite;
          }
          .aurora-subtext {
            font-size: clamp(1.1rem, 2.4vw, 1.9rem);
            color: rgba(199, 218, 255, 0.35);
            letter-spacing: 0.08em;
          }
          @keyframes aurora-text-glow {
            0%, 100% {
              text-shadow:
                0 0 10px rgba(163, 230, 255, 0.7),
                0 0 28px rgba(56, 189, 248, 0.55),
                0 0 55px rgba(129, 212, 250, 0.35);
            }
            45% {
              text-shadow:
                0 0 18px rgba(224, 242, 254, 0.9),
                0 0 42px rgba(110, 231, 183, 0.5),
                0 0 80px rgba(56, 189, 248, 0.5);
            }
          }

          /* Ember Mode */
          .ember-container {
            background:
              radial-gradient(circle at 50% 120%, rgba(255, 132, 57, 0.18), rgba(30, 6, 2, 0.95) 65%),
              #020103;
            color: #fff;
          }
          .ember-smoke {
            position: absolute;
            inset: -25% -25% 0 -25%;
            background: radial-gradient(circle at 50% 30%, rgba(255, 155, 90, 0.22), rgba(20, 5, 0, 0));
            filter: blur(60px);
            opacity: 0.45;
            mix-blend-mode: screen;
            animation: ember-smoke-move 18s ease-in-out infinite;
          }
          .ember-ground {
            position: absolute;
            left: -15%;
            right: -15%;
            bottom: -8%;
            height: 45%;
            background: radial-gradient(circle at 50% 115%, rgba(255, 150, 70, 0.35), rgba(64, 16, 0, 0.15) 60%, rgba(20, 5, 0, 0) 75%);
            filter: blur(20px);
            opacity: 0.8;
            animation: ember-ground-pulse 6s ease-in-out infinite;
          }
          @keyframes ember-smoke-move {
            0% { transform: translateY(2%) scale(1); opacity: 0.35; }
            50% { transform: translateY(-4%) scale(1.06); opacity: 0.55; }
            100% { transform: translateY(2%) scale(1); opacity: 0.35; }
          }
          @keyframes ember-ground-pulse {
            0%, 100% { opacity: 0.65; }
            45% { opacity: 0.92; }
          }
          .ember-particles {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
          }
          .ember-particles .particle {
            position: absolute;
            bottom: -12vh;
            border-radius: 9999px;
            opacity: 0;
            --drift: 0px;
          }
          .ember-particles--sparks .spark {
            background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 189, 89, 0.85) 45%, rgba(255, 94, 0, 0) 100%);
            box-shadow: 0 0 14px rgba(255, 196, 120, 0.9);
            mix-blend-mode: screen;
            animation-name: ember-spark-rise;
            animation-iteration-count: infinite;
            animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
          }
          .ember-particles--embers .ember {
            background: radial-gradient(circle, rgba(255, 132, 57, 0.65) 0%, rgba(255, 63, 0, 0) 70%);
            filter: blur(1.4px);
            animation-name: ember-ember-rise;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
          }
          @keyframes ember-spark-rise {
            0% { transform: translate3d(0, 0, 0) scale(0.6); opacity: 0; }
            12% { opacity: 1; }
            55% { opacity: 0.85; }
            100% { transform: translate3d(var(--drift), -120vh, 0) scale(0.9); opacity: 0; }
          }
          @keyframes ember-ember-rise {
            0% { transform: translate3d(0, 0, 0) scale(0.4); opacity: 0; }
            20% { opacity: 0.75; }
            60% { opacity: 0.55; }
            100% { transform: translate3d(var(--drift), -100vh, 0) scale(0.7); opacity: 0; }
          }
          .ember-text {
            font-size: clamp(2.6rem, 5vw, 4.6rem);
            font-weight: 700;
            letter-spacing: 0.08em;
            color: #fff7ed;
            text-transform: uppercase;
            text-shadow:
              0 0 10px rgba(255, 204, 153, 0.8),
              0 0 28px rgba(255, 140, 0, 0.7),
              0 0 50px rgba(255, 84, 0, 0.5);
            animation: ember-text-flicker 3.2s ease-in-out infinite, ember-text-heat 10s ease-in-out infinite;
          }
          .ember-subtext {
            font-size: clamp(1.05rem, 2.3vw, 1.7rem);
            color: rgba(255, 172, 102, 0.4);
            letter-spacing: 0.08em;
          }
          @keyframes ember-text-flicker {
            0%, 100% {
              opacity: 1;
              text-shadow:
                0 0 10px rgba(255, 204, 153, 0.8),
                0 0 28px rgba(255, 140, 0, 0.7),
                0 0 50px rgba(255, 84, 0, 0.5);
            }
            38% {
              opacity: 0.9;
              text-shadow:
                0 0 6px rgba(255, 176, 112, 0.7),
                0 0 20px rgba(255, 102, 0, 0.55),
                0 0 35px rgba(255, 51, 0, 0.4);
            }
            64% {
              opacity: 0.95;
              text-shadow:
                0 0 14px rgba(255, 210, 160, 0.85),
                0 0 32px rgba(255, 165, 0, 0.68),
                0 0 58px rgba(255, 94, 0, 0.5);
            }
          }
          @keyframes ember-text-heat {
            0%, 100% { transform: translateY(0) skewY(0deg); }
            50% { transform: translateY(-3px) skewY(1deg); }
          }

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