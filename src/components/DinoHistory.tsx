import { useState } from 'react';
import { DinoReward, DINO_TYPES } from '@/types/app';
import { Trophy, Info, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  onDelete?: (rewardId: string) => void;
}

export function DinoHistory({ rewards, onDelete }: DinoHistoryProps) {
  const [selectedDino, setSelectedDino] = useState<DinoReward | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (rewardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === rewardId) {
      onDelete?.(rewardId);
      setConfirmDeleteId(null);
      if (selectedDino?.id === rewardId) {
        setSelectedDino(null);
      }
    } else {
      setConfirmDeleteId(rewardId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

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
    <>
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
                onClick={() => setSelectedDino(reward)}
                className={cn(
                  "glass-card p-3 space-y-3 overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]",
                  "border-2"
                )}
                style={{
                  borderColor: `hsl(var(--primary))`,
                }}
              >
                {/* Dinosaur image */}
                <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 relative">
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
                  {/* Fun fact indicator */}
                  {reward.funFact && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/90 flex items-center justify-center">
                      <Info className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                  {/* Delete button */}
                  {onDelete && (
                    <button
                      onClick={(e) => handleDelete(reward.id, e)}
                      className={cn(
                        "absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                        confirmDeleteId === reward.id 
                          ? "bg-destructive text-destructive-foreground" 
                          : "bg-background/80 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

      {/* Detail Modal */}
      {selectedDino && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedDino(null)}
        >
          <div 
            className="glass-card p-5 max-w-sm w-full space-y-4 animate-scale-in max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{selectedDino.dinoName}</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setSelectedDino(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Dinosaur Image */}
            <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
              {selectedDino.imageUrl ? (
                <img 
                  src={selectedDino.imageUrl} 
                  alt={selectedDino.dinoName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={DINO_IMAGES[selectedDino.dinoType]} 
                    alt={DINO_TYPES.find(d => d.id === selectedDino.dinoType)?.name}
                    className="w-24 h-24 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Dino Type */}
            <div className="flex items-center justify-center gap-2">
              <img 
                src={DINO_IMAGES[selectedDino.dinoType]} 
                alt={DINO_TYPES.find(d => d.id === selectedDino.dinoType)?.name}
                className="w-8 h-8 object-contain"
              />
              <span className="text-muted-foreground">
                {DINO_TYPES.find(d => d.id === selectedDino.dinoType)?.name}
              </span>
            </div>

            {/* Fun Fact */}
            {selectedDino.funFact && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                      Le savais-tu ?
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {selectedDino.funFact}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Date and Delete */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Découvert le {new Date(selectedDino.earnedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDelete(selectedDino.id, e)}
                  className={cn(
                    "h-8 gap-1.5 text-xs",
                    confirmDeleteId === selectedDino.id 
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                      : "text-muted-foreground hover:text-destructive"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {confirmDeleteId === selectedDino.id ? "Confirmer" : "Supprimer"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
