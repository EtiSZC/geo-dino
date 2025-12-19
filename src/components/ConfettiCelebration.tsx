import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  type: 'star' | 'circle' | 'egg';
}

const COLORS = ['#f59e0b', '#eab308', '#84cc16', '#22c55e', '#f97316', '#ef4444'];

export function ConfettiCelebration({ onComplete }: { onComplete?: () => void }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 60,
        y: 50 + (Math.random() - 0.5) * 40,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        type: ['star', 'circle', 'egg'][Math.floor(Math.random() * 3)] as 'star' | 'circle' | 'egg',
      });
    }
    setParticles(newParticles);

    // Clean up after animation
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animationDelay: `${Math.random() * 0.3}s`,
          }}
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
          {particle.type === 'egg' && (
            <div className="text-2xl">🥚</div>
          )}
        </div>
      ))}
    </div>
  );
}
