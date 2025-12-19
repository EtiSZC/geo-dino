import { DINO_TYPES, DinoTypeId } from '@/types/app';
import { cn } from '@/lib/utils';
import { Egg } from 'lucide-react';

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

interface DinoSelectorProps {
  selectedDinoType: DinoTypeId | null;
  onSelectDinoType: (dinoType: DinoTypeId) => void;
}

export function DinoSelector({ selectedDinoType, onSelectDinoType }: DinoSelectorProps) {
  return (
    <div className="flex-1 flex flex-col p-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Egg className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold gradient-text">Choisis ton dinosaure</h2>
        <p className="text-muted-foreground">
          Quel dinosaure veux-tu découvrir ?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DINO_TYPES.map((dino) => (
          <button
            key={dino.id}
            onClick={() => onSelectDinoType(dino.id)}
            className={cn(
              "p-3 rounded-xl border-2 transition-all duration-300",
              "flex flex-col items-center gap-2",
              selectedDinoType === dino.id
                ? "border-primary bg-primary/10 scale-105"
                : "border-border hover:border-primary/50 bg-card"
            )}
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <img 
                src={DINO_IMAGES[dino.id]} 
                alt={dino.name}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-medium text-sm">{dino.name}</span>
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-auto">
        Pars à la chasse aux œufs de dinosaure ! 🥚
      </p>
    </div>
  );
}
