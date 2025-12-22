import { useEffect, useState } from 'react';
import { DinoTypeId, DINO_TYPES } from '@/types/app';

// Import dinosaur images
import tRexImg from '@/assets/dinos/t-rex.png';
import triceratopsImg from '@/assets/dinos/triceratops.png';
import velociraptorImg from '@/assets/dinos/velociraptor.png';
import stegosaurusImg from '@/assets/dinos/stegosaurus.png';
import pterodactylImg from '@/assets/dinos/pterodactyl.png';
import brachiosaurusImg from '@/assets/dinos/brachiosaurus.png';
import ankylosaurusImg from '@/assets/dinos/ankylosaurus.png';
import spinosaurusImg from '@/assets/dinos/spinosaurus.png';

const DINO_IMAGES: Record<string, string> = {
  't-rex': tRexImg,
  'triceratops': triceratopsImg,
  'velociraptor': velociraptorImg,
  'stegosaurus': stegosaurusImg,
  'pterodactyl': pterodactylImg,
  'brachiosaurus': brachiosaurusImg,
  'ankylosaurus': ankylosaurusImg,
  'spinosaurus': spinosaurusImg,
};

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  color: string;
  type: 'star' | 'circle' | 'sparkle' | 'dino';
  delay: number;
}

const DINO_COLORS = ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#f59e0b', '#eab308'];

interface DinoDiscoveryCelebrationProps {
  dinoType: DinoTypeId;
  onComplete?: () => void;
}

export function DinoDiscoveryCelebration({ dinoType, onComplete }: DinoDiscoveryCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showDino, setShowDino] = useState(false);
  const [flashVisible, setFlashVisible] = useState(true);
  
  const dinoImage = DINO_IMAGES[dinoType];
  const dinoInfo = DINO_TYPES.find(d => d.id === dinoType);

  useEffect(() => {
    // Initial flash
    setTimeout(() => setFlashVisible(false), 200);
    
    // Show dino with bounce animation
    setTimeout(() => setShowDino(true), 300);
    
    // Generate explosion of particles
    const newParticles: Particle[] = [];
    
    // First wave - burst from center
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: i,
        x: 50,
        y: 45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        scale: 0.4 + Math.random() * 0.8,
        color: DINO_COLORS[Math.floor(Math.random() * DINO_COLORS.length)],
        type: ['star', 'circle', 'sparkle'][Math.floor(Math.random() * 3)] as 'star' | 'circle' | 'sparkle',
        delay: Math.random() * 0.2,
      });
    }
    
    // Second wave - more particles from sides
    for (let i = 0; i < 40; i++) {
      const side = Math.random() > 0.5;
      newParticles.push({
        id: 60 + i,
        x: side ? -5 : 105,
        y: 20 + Math.random() * 60,
        vx: (side ? 1 : -1) * (3 + Math.random() * 3),
        vy: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        scale: 0.5 + Math.random() * 0.6,
        color: DINO_COLORS[Math.floor(Math.random() * DINO_COLORS.length)],
        type: ['star', 'sparkle'][Math.floor(Math.random() * 2)] as 'star' | 'sparkle',
        delay: 0.3 + Math.random() * 0.3,
      });
    }
    
    setParticles(newParticles);

    // Clean up after animation
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Flash effect */}
      {flashVisible && (
        <div className="absolute inset-0 bg-white animate-pulse" style={{ opacity: 0.8 }} />
      )}
      
      {/* Radial glow behind dino */}
      {showDino && (
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0) 70%)',
          }}
        />
      )}
      
      {/* Central dinosaur reveal */}
      {showDino && dinoImage && (
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 animate-dino-reveal"
        >
          <div className="relative">
            {/* Glow ring */}
            <div 
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: 'radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, transparent 70%)',
                transform: 'scale(1.5)',
              }}
            />
            {/* Rotating sparkle ring */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <div
                  key={angle}
                  className="absolute w-3 h-3"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${angle}deg) translateY(-70px) translateX(-50%)`,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="#fbbf24" className="w-full h-full animate-pulse">
                    <path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z" />
                  </svg>
                </div>
              ))}
            </div>
            <img 
              src={dinoImage} 
              alt={dinoInfo?.name} 
              className="w-32 h-32 object-contain drop-shadow-2xl relative z-10"
            />
          </div>
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-2xl font-bold text-white drop-shadow-lg">
              🦖 {dinoInfo?.name} capturé ! 🦖
            </p>
          </div>
        </div>
      )}
      
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-dino-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            '--vx': particle.vx,
            '--vy': particle.vy,
            '--rotation-speed': particle.rotationSpeed,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animationDelay: `${particle.delay}s`,
          } as React.CSSProperties}
        >
          {particle.type === 'star' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill={particle.color}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
          {particle.type === 'circle' && (
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: particle.color }}
            />
          )}
          {particle.type === 'sparkle' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={particle.color}>
              <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
            </svg>
          )}
        </div>
      ))}
      
      {/* Screen edge glow */}
      <div 
        className="absolute inset-0 pointer-events-none animate-pulse"
        style={{
          boxShadow: 'inset 0 0 100px 20px rgba(34, 197, 94, 0.3)',
          animationDuration: '0.5s',
        }}
      />
    </div>
  );
}
