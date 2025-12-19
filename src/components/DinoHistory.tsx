import { DinoReward, DINO_TYPES } from '@/types/app';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import all dinosaur images
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

interface DinoHistoryProps {
  rewards: DinoReward[];
}

export function DinoHistory({ rewards }: DinoHistoryProps) {
  if (rewards.length === 0) {
    return (
      <div className="glass-card p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <Trophy className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Pas encore de dinosaures</p>
          <p className="text-sm text-muted-foreground">
            Termine des expéditions pour découvrir des dinosaures
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Tes Dinosaures ({rewards.length})
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {rewards.map((reward) => {
          const dinoType = DINO_TYPES.find(d => d.id === reward.dinoType);
          
          return (
            <div
              key={reward.id}
              className={cn(
                "glass-card p-3 space-y-3 overflow-hidden",
                "border-2"
              )}
              style={{
                borderColor: `hsl(var(--primary))`,
              }}
            >
              {/* Dinosaur image */}
              <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                {reward.imageUrl ? (
                  <img 
                    src={reward.imageUrl} 
                    alt={reward.dinoName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={DINO_IMAGES[reward.dinoType]} 
                      alt={dinoType?.name}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                )}
              </div>
              
              {/* Dino info */}
              <div className="text-center">
                <p className="font-semibold text-sm truncate">{reward.dinoName}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <img 
                    src={DINO_IMAGES[reward.dinoType]} 
                    alt={dinoType?.name}
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-xs text-muted-foreground">{dinoType?.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
