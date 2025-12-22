import { Trophy, Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuperRewardUnlockProps {
  onWatchReward: () => void;
}

export function SuperRewardUnlock({ onWatchReward }: SuperRewardUnlockProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-fade-in">
      <div className="glass-card p-6 max-w-sm w-full space-y-6 text-center animate-scale-in">
        {/* Trophy animation */}
        <div className="relative">
          <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 flex items-center justify-center animate-pulse-glow">
            <Trophy className="w-14 h-14 text-white" />
          </div>
          <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full bg-yellow-500/30 animate-ping" />
          
          {/* Sparkles around */}
          <Sparkles className="absolute top-0 left-1/4 w-6 h-6 text-yellow-400 animate-bounce" />
          <Sparkles className="absolute top-4 right-1/4 w-5 h-5 text-amber-400 animate-bounce delay-100" />
          <Sparkles className="absolute bottom-2 left-1/3 w-4 h-4 text-orange-400 animate-bounce delay-200" />
        </div>

        {/* Congratulations */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold gradient-text">
            Bravo explorateur ! 🦖
          </h2>
          <p className="text-lg text-muted-foreground">
            Tu as débloqué ta récompense !
          </p>
          <p className="text-sm text-muted-foreground">
            Tu as collectionné tous les dinosaures ! Une surprise t'attend...
          </p>
        </div>

        {/* Watch button */}
        <Button 
          onClick={onWatchReward} 
          className="w-full gap-2" 
          size="lg"
        >
          <Play className="w-5 h-5" />
          Regarder ma récompense
        </Button>
      </div>
    </div>
  );
}
