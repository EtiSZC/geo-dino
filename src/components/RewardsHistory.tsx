import { MusicReward, MUSIC_GENRES } from '@/types/app';
import { Music, ExternalLink, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardsHistoryProps {
  rewards: MusicReward[];
}

export function RewardsHistory({ rewards }: RewardsHistoryProps) {
  if (rewards.length === 0) {
    return (
      <div className="glass-card p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <Trophy className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">No rewards yet</p>
          <p className="text-sm text-muted-foreground">
            Complete journeys to earn music recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Your Rewards ({rewards.length})
      </h3>

      <div className="space-y-3">
        {rewards.map((reward) => {
          const genre = MUSIC_GENRES.find(g => g.id === reward.genre);
          
          return (
            <div
              key={reward.id}
              className={cn(
                "glass-card p-4 space-y-3",
                `border-l-4`
              )}
              style={{
                borderLeftColor: `hsl(var(--primary))`,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-card flex items-center justify-center shrink-0">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{reward.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{reward.artist}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm">{genre?.emoji}</span>
                    <span className="text-xs text-muted-foreground">{genre?.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={reward.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 p-2 rounded-lg bg-[#1DB954]/10 hover:bg-[#1DB954]/20 transition-colors text-xs text-[#1DB954]"
                >
                  Spotify <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={reward.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 p-2 rounded-lg bg-[#FA57C1]/10 hover:bg-[#FA57C1]/20 transition-colors text-xs text-[#FA57C1]"
                >
                  Apple <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={reward.deezerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 p-2 rounded-lg bg-[#A238FF]/10 hover:bg-[#A238FF]/20 transition-colors text-xs text-[#A238FF]"
                >
                  Deezer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
