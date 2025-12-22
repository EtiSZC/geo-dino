import { useState } from 'react';
import { DinoReward, DINO_TYPES } from '@/types/app';
import { Trophy, Sparkles, Loader2, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import dinosaur icon for type display only (not for main reveal)
import tRexImg from '@/assets/dinos/t-rex.png';
import triceratopsImg from '@/assets/dinos/triceratops.png';
import velociraptorImg from '@/assets/dinos/velociraptor.png';
import stegosaurusImg from '@/assets/dinos/stegosaurus.png';
import pterodactylImg from '@/assets/dinos/pterodactyl.png';
import brachiosaurusImg from '@/assets/dinos/brachiosaurus.png';
import ankylosaurusImg from '@/assets/dinos/ankylosaurus.png';
import spinosaurusImg from '@/assets/dinos/spinosaurus.png';

// Icons used ONLY for type indicator, NOT for main dinosaur reveal
const DINO_ICONS: Record<string, string> = {
  't-rex': tRexImg,
  'triceratops': triceratopsImg,
  'velociraptor': velociraptorImg,
  'stegosaurus': stegosaurusImg,
  'pterodactyl': pterodactylImg,
  'brachiosaurus': brachiosaurusImg,
  'ankylosaurus': ankylosaurusImg,
  'spinosaurus': spinosaurusImg,
};

interface DinoRewardScreenProps {
  reward: DinoReward;
  onClose: () => void;
  isGenerating: boolean;
}

export function DinoRewardScreen({ reward, onClose, isGenerating }: DinoRewardScreenProps) {
  const dinoType = DINO_TYPES.find(d => d.id === reward.dinoType);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-fade-in">
      <div className="glass-card p-6 max-w-sm w-full space-y-6 text-center animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Trophy animation */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center animate-pulse-glow">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-amber-500/20 animate-ping" />
        </div>

        {/* Congratulations */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold gradient-text">Bravo, Explorateur ! 🎉</h2>
          <p className="text-muted-foreground">
            Tu as collecté tous les œufs de dinosaure !
          </p>
        </div>

        {/* Dinosaur reveal */}
        {!revealed ? (
          <div className="space-y-4">
            <div className={cn(
              "p-6 rounded-xl border border-border/50",
              `bg-gradient-to-br ${dinoType?.color} bg-opacity-20`
            )}>
              <div className="w-24 h-24 mx-auto rounded-full bg-card/80 flex items-center justify-center animate-bounce">
                <span className="text-5xl">🥚</span>
              </div>
              <p className="mt-4 text-lg font-medium">
                Un dinosaure t'attend !
              </p>
              <p className="text-sm text-muted-foreground">
                Clique pour le découvrir
              </p>
            </div>

            <Button 
              onClick={() => setRevealed(true)} 
              className="w-full" 
              size="lg"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Révéler le dinosaure !
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dino card with image */}
            <div className={cn(
              "p-4 rounded-xl border border-border/50 space-y-3",
              `bg-gradient-to-br ${dinoType?.color} bg-opacity-20`
            )}>
            {/* Image container - shows generated realistic image, NOT icon */}
              <div className="aspect-square rounded-xl overflow-hidden bg-card/80">
                {reward.imageUrl ? (
                  <img 
                    src={reward.imageUrl} 
                    alt={reward.dinoName}
                    className="w-full h-full object-cover animate-scale-in"
                  />
                ) : isGenerating ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Création du dinosaure...</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                    <AlertCircle className="w-12 h-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Erreur lors de la génération de l'image
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-lg font-bold">{reward.dinoName}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {/* Small icon to show dino type */}
                  <img 
                    src={DINO_ICONS[reward.dinoType]} 
                    alt={dinoType?.name}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-sm text-muted-foreground">{dinoType?.name}</span>
                </div>
              </div>
            </div>

            {/* Fun Fact Section */}
            {reward.funFact && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                      Le savais-tu ?
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {reward.funFact}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={onClose} className="w-full" size="lg">
              Nouvelle Aventure
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
