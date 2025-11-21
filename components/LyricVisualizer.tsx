
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Track, LyricLine, VisualizerSettings, VisualizerPalette } from '../types';
import { parseLrc } from '../utils/lrcParser';
import * as THREE from 'three';

interface LyricVisualizerProps {
  track: Track | null;
  settings: VisualizerSettings;
}

// Animation Library
const animations = [
  'animate-k-pop', 
  'animate-k-slide-up', 
  'animate-k-slide-down',
  'animate-k-rotate', 
  'animate-k-elastic', 
  'animate-k-squeeze',
  'animate-k-blur-in'
];

// Color Palettes for Text
const paletteMap: Record<VisualizerPalette, string[]> = {
    cyber: ['text-cyan-400', 'text-pink-400', 'text-purple-400', 'text-white', 'text-fuchsia-300'],
    sunset: ['text-orange-400', 'text-red-500', 'text-yellow-300', 'text-white', 'text-amber-500'],
    matrix: ['text-green-500', 'text-green-400', 'text-green-300', 'text-white', 'text-emerald-400'],
    ocean: ['text-blue-400', 'text-teal-400', 'text-cyan-300', 'text-white', 'text-indigo-400']
};

// RGB Normalized Values for Shaders (0-1)
const shaderColors: Record<VisualizerPalette, THREE.Vector3> = {
    cyber: new THREE.Vector3(0.92, 0.28, 0.6), // Pinkish
    sunset: new THREE.Vector3(0.97, 0.45, 0.08), // Orange
    matrix: new THREE.Vector3(0.13, 0.77, 0.36), // Green
    ocean: new THREE.Vector3(0.02, 0.71, 0.83)   // Cyan
};

// --- GLSL SHADERS ---

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

// Mode: Warp (Stars)
const fragmentShaderStars = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_bass;
    uniform vec3 u_color;
    varying vec2 vUv;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        vec2 uv = (vUv - 0.5) * u_resolution / u_resolution.y;
        
        // Bass impact on zoom/warp
        float speed = 0.1 + (u_bass * 0.8);
        float t = u_time * speed;
        
        vec3 col = vec3(0.0);
        
        // 3 Layers of stars
        for(float i = 0.0; i < 1.0; i += 1.0/3.0) {
            float depth = fract(i + t);
            float scale = mix(20.0, 0.5, depth);
            float fade = depth * smoothstep(1.0, 0.9, depth);
            
            vec2 st = uv * scale + vec2(i * 10.0);
            vec2 id = floor(st);
            vec2 f = fract(st) - 0.5;
            
            float n = random(id);
            
            if(n > 0.95) { // Star density
                float star = 1.0 - smoothstep(0.0, 0.2 + (u_bass * 0.1), length(f));
                
                // Add color tint based on bass
                vec3 starCol = mix(vec3(1.0), u_color, u_bass * 0.5);
                col += star * fade * starCol;
                
                // Warp streaks on high bass
                if(u_bass > 0.4) {
                   vec2 dir = normalize(uv);
                   float streak = 1.0 - smoothstep(0.0, 0.3 * u_bass, length(f - dir * 0.1));
                   col += streak * fade * u_color * 0.5;
                }
            }
        }
        
        // Vignette
        col *= 1.0 - length(uv) * 0.5;
        
        gl_FragColor = vec4(col, 1.0);
    }
`;

// Mode: Fluid (Orb)
const fragmentShaderFluid = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_bass;
    uniform vec3 u_color;
    uniform sampler2D u_audio; // Spectrum data
    varying vec2 vUv;

    // Simplex Noise functions (simplified)
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vec2 uv = (vUv - 0.5) * u_resolution / u_resolution.y;
        
        // Get audio frequency at specific points
        float freqLow = texture2D(u_audio, vec2(0.05, 0.0)).r;
        float freqHigh = texture2D(u_audio, vec2(0.5, 0.0)).r;
        
        // Distortion amount
        float dist = snoise(uv * 3.0 + u_time * 0.5) * (0.1 + u_bass * 0.2);
        
        // Circle SDF with noise
        float radius = 0.3 + (freqLow * 0.1);
        float d = length(uv) - radius + dist;
        
        // Glow
        vec3 col = vec3(0.0);
        float glow = 0.01 / abs(d);
        glow = pow(glow, 1.2);
        
        // Coloring
        col = u_color * glow * 2.0;
        
        // Core
        if (d < 0.0) {
            col += u_color * 0.5;
            col += vec3(1.0) * smoothstep(0.0, -0.1, d);
        }
        
        // Outer waves
        float wave = sin(length(uv) * 20.0 - u_time * 2.0);
        col += u_color * smoothstep(0.95, 1.0, wave) * 0.1 * u_bass;

        gl_FragColor = vec4(col, 1.0);
    }
`;

// Mode: Grid (Terrain)
const fragmentShaderGrid = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_bass;
    uniform vec3 u_color;
    uniform sampler2D u_audio;
    varying vec2 vUv;

    void main() {
        vec2 uv = (vUv - 0.5) * u_resolution / u_resolution.y;
        
        // Horizon
        if (uv.y > 0.0) {
            // Sky (Sun)
            float sunDist = length(uv - vec2(0.0, 0.1));
            float sunSize = 0.15 + u_bass * 0.05;
            vec3 sunCol = vec3(0.0);
            if(sunDist < sunSize) {
                // Sun bars gradient
                float bar = step(0.02, mod(uv.y + u_time * 0.05, 0.05));
                sunCol = mix(u_color, vec3(1.0, 0.8, 0.0), uv.y * 5.0);
                sunCol *= bar;
            }
            
            // Glow around sun
            sunCol += u_color * (0.02 / sunDist);
            
            gl_FragColor = vec4(sunCol, 1.0);
            return;
        }
        
        // Plane projection
        vec3 ro = vec3(0.0, 1.0, u_time * 2.0); // Camera origin
        vec3 rd = normalize(vec3(uv.x, uv.y, 1.0)); // Ray direction
        
        // Intersect with plane y = 0 (actually y = -1 relative to camera height)
        float t = -1.0 / rd.y;
        vec3 pos = ro + rd * t;
        
        // Grid logic
        vec2 gridUV = pos.xz;
        
        // Displace grid lines based on frequency
        // Map Z coordinate to frequency texture X
        float zNorm = abs(fract(gridUV.y * 0.05) * 2.0 - 1.0); 
        float freq = texture2D(u_audio, vec2(zNorm, 0.0)).r;
        
        // Wobbly lines
        gridUV.x += sin(gridUV.y * 0.5 + u_time) * u_bass * 0.5;
        
        float gridVal = step(0.95, fract(gridUV.x)) + step(0.95, fract(gridUV.y));
        
        vec3 col = vec3(0.0);
        
        // Grid color
        col = mix(vec3(0.0), u_color, gridVal);
        
        // Fog (fade to horizon)
        float fog = 1.0 / (t * t * 0.1 + 1.0);
        col *= fog;
        
        // Add "Terrain" volume visualizer on sides
        float terrainX = abs(uv.x);
        if (terrainX > 0.3) {
            // Sample audio based on X
            float audioH = texture2D(u_audio, vec2(terrainX, 0.0)).r;
            float mountainH = audioH * 0.5 * fog;
            if (abs(uv.y) < mountainH) {
                col += u_color * 0.5;
            }
        }

        gl_FragColor = vec4(col, 1.0);
    }
`;

const LyricVisualizer: React.FC<LyricVisualizerProps> = ({ track, settings }) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentKey, setCurrentKey] = useState(0); 
  
  // Audio Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Three.js Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const audioTextureRef = useRef<THREE.DataTexture | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const frameIdRef = useRef<number>(0);

  // Reactivity
  const [bassScale, setBassScale] = useState(1);

  // Parse Lyrics
  useEffect(() => {
    if (track) {
      setLyrics(parseLrc(track.lrc));
      setCurrentIndex(-1);
      setCurrentKey(prev => prev + 1);
    } else {
      setLyrics([]);
    }
  }, [track]);

  // Audio Setup
  useEffect(() => {
    const allAudio = document.getElementsByTagName('audio');
    if (allAudio.length === 0) return;
    const audioEl = allAudio[0];
    audioRef.current = audioEl;

    const initAudioContext = () => {
        if (!audioContextRef.current) {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const ctx = new AudioContextClass();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512; 
            analyser.smoothingTimeConstant = 0.85;
            
            try {
                const source = ctx.createMediaElementSource(audioEl);
                source.connect(analyser);
                analyser.connect(ctx.destination);
                audioContextRef.current = ctx;
                analyserRef.current = analyser;
            } catch (e) { /* CORS ignore */ }
        } else if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };
    audioEl.addEventListener('play', initAudioContext);
    
    const handleTimeUpdate = () => {
      const currentTime = audioEl.currentTime;
      let newIndex = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].time) {
          newIndex = i;
          break;
        }
      }
      if (newIndex !== currentIndex) {
          setCurrentIndex(newIndex);
          if (newIndex !== -1) setCurrentKey(k => k + 1);
      }
    };

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audioEl.removeEventListener('play', initAudioContext);
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [lyrics, currentIndex]);

  // --- THREE.JS INIT & LOOP ---
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    
    // 2. Audio Texture Setup
    const bufferSize = 256; // frequencyBinCount for fftSize 512
    const dataArray = new Uint8Array(bufferSize);
    const texture = new THREE.DataTexture(
        dataArray, 
        bufferSize, 
        1, 
        THREE.RedFormat
    );
    dataArrayRef.current = dataArray;
    audioTextureRef.current = texture;

    // 3. Material & Mesh
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_bass: { value: 0.0 },
        u_color: { value: shaderColors[settings.palette] },
        u_audio: { value: texture }
    };

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: fragmentShaderStars, // Default
        uniforms
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    rendererRef.current = renderer;
    sceneRef.current = scene;

    // 4. Animation Loop
    const animate = (time: number) => {
        frameIdRef.current = requestAnimationFrame(animate);
        
        // Update Audio Data
        let bassNormalized = 0;
        if (analyserRef.current && dataArrayRef.current && audioTextureRef.current) {
             analyserRef.current.getByteFrequencyData(dataArrayRef.current);
             audioTextureRef.current.needsUpdate = true;
             
             // Calc Bass for React Logic
             let bassSum = 0;
             for(let i=0; i<10; i++) bassSum += dataArrayRef.current[i];
             const avg = bassSum / 10;
             bassNormalized = avg / 255;
             
             // Update Text Scale (React State)
             // Throttled naturally by loop, but React handles this fine mostly
             const kick = Math.pow(Math.max(0, avg - 40) / 150, 3);
             setBassScale(1 + kick * 0.3);
        }

        // Update Uniforms
        if (materialRef.current) {
            materialRef.current.uniforms.u_time.value = time * 0.001;
            materialRef.current.uniforms.u_bass.value = bassNormalized;
            // Ensure color is up to date (handled by effect below, but just in case)
        }

        renderer.render(scene, camera);
    };
    
    animate(0);

    // Handle Resize
    const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        if (materialRef.current) {
            materialRef.current.uniforms.u_resolution.value.set(width, height);
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(frameIdRef.current);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        geometry.dispose();
    };
  }, []); // Run once on mount

  // Update Shader / Uniforms when Settings Change
  useEffect(() => {
      if (!materialRef.current) return;
      
      // Update Color
      materialRef.current.uniforms.u_color.value = shaderColors[settings.palette];

      // Update Fragment Shader (Hot Swap)
      if (settings.bgEffect === 'none') {
          // Simple black shader
          materialRef.current.fragmentShader = `void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); }`;
      } else if (settings.bgEffect === 'stars') {
          materialRef.current.fragmentShader = fragmentShaderStars;
      } else if (settings.bgEffect === 'fluid') {
          materialRef.current.fragmentShader = fragmentShaderFluid;
      } else if (settings.bgEffect === 'grid') {
          materialRef.current.fragmentShader = fragmentShaderGrid;
      }
      materialRef.current.needsUpdate = true;

  }, [settings]);


  const currentColors = useMemo(() => paletteMap[settings.palette], [settings.palette]);
  const currentLine = lyrics[currentIndex];
  const nextLine = lyrics[currentIndex + 1];

  return (
    <div className="h-full w-full flex items-center justify-center overflow-hidden relative bg-transparent">
      {/* Three.js Container */}
      <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />
      
      {!track && <div className="text-gray-600 font-orbitron text-sm tracking-widest animate-pulse relative z-10">WAITING FOR AUDIO...</div>}
      
      {track && (
          <div className="relative w-full h-full flex flex-col items-center justify-center z-10 overflow-hidden">
            {/* Main Kinetic Text */}
            <div 
                className="flex flex-wrap justify-center content-center gap-x-6 gap-y-4 px-8 max-w-[95vw] text-center perspective-container"
                style={{ 
                    transform: `scale(${bassScale})`,
                    transition: 'transform 0.05s cubic-bezier(0.2, 0.8, 0.2, 1)', // Snappy transition
                    textShadow: '0 20px 50px rgba(0,0,0,0.9)' // Deep shadow to pop from bg
                }}
            >
                {(currentLine?.text || '...').split(' ').map((word, i) => {
                    const animIndex = (word.length + i) % animations.length;
                    const colorIndex = (word.length + i) % currentColors.length;
                    
                    return (
                        <span 
                            key={`${currentKey}-${i}`} 
                            className={`inline-block font-black text-6xl lg:text-9xl uppercase leading-none tracking-tight ${currentColors[colorIndex]} ${animations[animIndex]}`}
                            style={{ 
                                animationDelay: `${i * 50}ms`, 
                                filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                            }}
                        >
                            {word}
                        </span>
                    )
                })}
            </div>
            
            {/* Next Line Preview */}
            <div className="absolute bottom-10 lg:bottom-24 text-white/40 font-orbitron text-xs lg:text-sm tracking-[0.6em] uppercase opacity-0 lg:opacity-60 transition-all duration-300" style={{ transform: `scale(${Math.max(0.8, 1.5 - bassScale * 0.5)})` }}>
                {nextLine?.text}
            </div>
        </div>
      )}
      
      <style>{`
          .perspective-container { perspective: 1000px; }
          
          /* Animation Definitions */
          @keyframes k-pop { 0% { opacity: 0; transform: scale(0.5); } 50% { transform: scale(1.15); } 100% { opacity: 1; transform: scale(1); } }
          .animate-k-pop { animation: k-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards; }
          
          @keyframes k-slide-up { 0% { opacity: 0; transform: translateY(60px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-k-slide-up { animation: k-slide-up 0.3s cubic-bezier(0.23, 1, 0.32, 1) backwards; }

          @keyframes k-slide-down { 0% { opacity: 0; transform: translateY(-60px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-k-slide-down { animation: k-slide-down 0.3s cubic-bezier(0.23, 1, 0.32, 1) backwards; }
          
          @keyframes k-rotate { 0% { opacity: 0; transform: rotate(-15deg) scale(0.8); } 100% { opacity: 1; transform: rotate(0) scale(1); } }
          .animate-k-rotate { animation: k-rotate 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }

          @keyframes k-elastic { 0% { opacity: 0; transform: scaleX(0); } 60% { transform: scaleX(1.2); } 100% { opacity: 1; transform: scaleX(1); } }
          .animate-k-elastic { animation: k-elastic 0.5s ease-out backwards; }
          
          @keyframes k-squeeze { 0% { opacity: 0; letter-spacing: -0.5em; filter: blur(10px); } 100% { opacity: 1; letter-spacing: normal; filter: blur(0); } }
          .animate-k-squeeze { animation: k-squeeze 0.4s ease-out backwards; }

          @keyframes k-blur-in { 0% { opacity: 0; filter: blur(20px) brightness(2); transform: scale(1.1); } 100% { opacity: 1; filter: blur(0) brightness(1); transform: scale(1); } }
          .animate-k-blur-in { animation: k-blur-in 0.3s ease-out backwards; }
        `}</style>
    </div>
  );
};

export default LyricVisualizer;
