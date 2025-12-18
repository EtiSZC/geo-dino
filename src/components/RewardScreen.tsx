import { MusicReward, MUSIC_GENRES, GenreId } from '@/types/app';
import { ExternalLink, Trophy, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RewardScreenProps {
  reward: MusicReward;
  onClose: () => void;
}

export function RewardScreen({ reward, onClose }: RewardScreenProps) {
  const genre = MUSIC_GENRES.find(g => g.id === reward.genre);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-fade-in">
      <div className="glass-card p-6 max-w-sm w-full space-y-6 text-center animate-scale-in">
        {/* Trophy animation */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center animate-pulse-glow">
            <Trophy className="w-12 h-12 text-primary-foreground" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-primary/20 animate-ping" />
        </div>

        {/* Congratulations */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold gradient-text">Journey Complete!</h2>
          <p className="text-muted-foreground">
            You've earned a music reward
          </p>
        </div>

        {/* Music card */}
        <div className={cn(
          "p-4 rounded-xl border border-border/50 space-y-3",
          `bg-gradient-to-br ${genre?.color} bg-opacity-20`
        )}>
          <div className="w-16 h-16 mx-auto rounded-xl bg-card/80 flex items-center justify-center">
            <Music className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <p className="text-lg font-bold">{reward.title}</p>
            <p className="text-muted-foreground">{reward.artist}</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{genre?.emoji}</span>
            <span className="text-sm text-muted-foreground">{genre?.name}</span>
          </div>
        </div>

        {/* Streaming links */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">Listen now on</p>
          
          <a
            href={reward.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-[#1DB954]/10 hover:bg-[#1DB954]/20 transition-colors group"
          >
            <span className="font-medium text-[#1DB954]">Spotify</span>
            <ExternalLink className="w-4 h-4 text-[#1DB954] group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href={reward.appleMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-[#FA57C1]/10 hover:bg-[#FA57C1]/20 transition-colors group"
          >
            <span className="font-medium text-[#FA57C1]">Apple Music</span>
            <ExternalLink className="w-4 h-4 text-[#FA57C1] group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href={reward.deezerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-[#A238FF]/10 hover:bg-[#A238FF]/20 transition-colors group"
          >
            <span className="font-medium text-[#A238FF]">Deezer</span>
            <ExternalLink className="w-4 h-4 text-[#A238FF] group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <Button onClick={onClose} className="w-full" size="lg">
          Start New Journey
        </Button>
      </div>
    </div>
  );
}
