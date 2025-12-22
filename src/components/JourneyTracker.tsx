import { useEffect, useRef, useState, useMemo } from 'react';
import { Flag, Navigation, CheckCircle, Egg, Star } from 'lucide-react';
import { Journey, DinoTypeId, DINO_TYPES } from '@/types/app';
import { isWithinCheckpoint, areAllCheckpointsValidated, calculateDistance } from '@/lib/geoUtils';
import { celebrateEggFound } from '@/lib/celebrationFeedback';
import { playDinoRoar } from '@/lib/dinoSounds';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { DinoDiscoveryCelebration } from '@/components/DinoDiscoveryCelebration';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWakeLock } from '@/hooks/useWakeLock';

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

// Format distance for display
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

interface JourneyTrackerProps {
  journey: Journey;
  currentPosition: [number, number] | null;
  isActive: boolean;
  onValidateCheckpoint: (checkpointId: string) => void;
  onJourneyComplete: () => void;
  onStop: () => void;
  selectedDinoType?: DinoTypeId | null;
}

export function JourneyTracker({
  journey,
  currentPosition,
  isActive,
  onValidateCheckpoint,
  onJourneyComplete,
  onStop,
  selectedDinoType,
}: JourneyTrackerProps) {
  // Keep screen awake while journey is active
  const { isSupported: wakeLockSupported, isActive: wakeLockActive } = useWakeLock(isActive);
  
  const validatedCount = journey.checkpoints.filter(cp => cp.validated).length;
  const totalCount = journey.checkpoints.length;
  const eggCount = journey.checkpoints.filter(cp => !cp.isDestination).length;
  const validatedEggCount = journey.checkpoints.filter(cp => !cp.isDestination && cp.validated).length;
  
  // Get dinosaur info
  const dinoInfo = selectedDinoType ? DINO_TYPES.find(d => d.id === selectedDinoType) : null;
  const dinoImage = selectedDinoType ? DINO_IMAGES[selectedDinoType] : null;
  
  // Calculate distance to next unvalidated checkpoint
  const nextCheckpointInfo = useMemo(() => {
    if (!currentPosition) return null;
    
    const nextCheckpoint = journey.checkpoints.find(cp => !cp.validated);
    if (!nextCheckpoint) return null;
    
    const distance = calculateDistance(currentPosition, nextCheckpoint.coordinates);
    const index = journey.checkpoints.indexOf(nextCheckpoint);
    
    return {
      index: index + 1,
      distance,
      formattedDistance: formatDistance(distance),
      isDestination: nextCheckpoint.isDestination,
    };
  }, [currentPosition, journey.checkpoints]);
  
  // Prevent multiple calls to onJourneyComplete
  const hasCompletedRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDinoCelebration, setShowDinoCelebration] = useState(false);
  
  // Reset completion flag when journey changes
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [journey.id]);

  // Check for checkpoint validation - use 15m radius for better mobile GPS accuracy
  useEffect(() => {
    if (!isActive || !currentPosition) return;

    journey.checkpoints.forEach(checkpoint => {
      if (!checkpoint.validated && isWithinCheckpoint(currentPosition, checkpoint.coordinates, 15)) {
        // Trigger celebration feedback
        celebrateEggFound();
        
        if (checkpoint.isDestination && selectedDinoType) {
          // Play specific dino roar and show special celebration for destination
          const dinoTypeName = DINO_TYPES.find(d => d.id === selectedDinoType)?.name;
          playDinoRoar(dinoTypeName);
          setShowDinoCelebration(true);
        } else {
          // Regular confetti for egg checkpoints
          playDinoRoar();
          setShowConfetti(true);
        }
        
        onValidateCheckpoint(checkpoint.id);
      }
    });

    // Check if journey is complete - only trigger once (when destination is validated)
    if (!hasCompletedRef.current && areAllCheckpointsValidated(journey)) {
      hasCompletedRef.current = true;
      // Delay completion to allow celebration animation to play
      setTimeout(() => {
        onJourneyComplete();
      }, 2500);
    }
  }, [currentPosition, isActive, journey, onValidateCheckpoint, onJourneyComplete, selectedDinoType]);

  return (
    <>
      {showConfetti && <ConfettiCelebration onComplete={() => setShowConfetti(false)} />}
      {showDinoCelebration && selectedDinoType && (
        <DinoDiscoveryCelebration 
          dinoType={selectedDinoType} 
          onComplete={() => setShowDinoCelebration(false)} 
        />
      )}
    <div className="glass-card p-4 space-y-4 h-full flex flex-col">
      {/* Progress header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isActive ? "bg-success/20" : "bg-primary/20"
          )}>
            <Navigation className={cn(
              "w-5 h-5",
              isActive ? "text-success animate-pulse" : "text-primary"
            )} />
          </div>
          <div>
            <h3 className="font-semibold">{journey.name}</h3>
            <p className="text-sm text-muted-foreground">
              {validatedEggCount} sur {eggCount} œufs + {dinoInfo?.name || 'dinosaure'}
            </p>
          </div>
        </div>
        
        {isActive && (
          <Button variant="outline" size="sm" onClick={onStop}>
            Arrêter
          </Button>
        )}
      </div>


      {/* Distance to next checkpoint */}
      {isActive && nextCheckpointInfo && (
        <div className={cn(
          "flex items-center justify-center gap-2 p-3 rounded-xl border flex-shrink-0",
          nextCheckpointInfo.isDestination 
            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30"
            : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30"
        )}>
          {nextCheckpointInfo.isDestination ? (
            <>
              {dinoImage ? (
                <img src={dinoImage} alt={dinoInfo?.name} className="w-6 h-6 object-contain" />
              ) : (
                <Star className="w-5 h-5 text-emerald-500" />
              )}
              <span className="text-sm font-medium">
                {dinoInfo?.name || 'Dinosaure'} :
              </span>
              <span className="text-lg font-bold text-emerald-500">
                {nextCheckpointInfo.formattedDistance}
              </span>
            </>
          ) : (
            <>
              <Egg className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium">
                Œuf #{nextCheckpointInfo.index} :
              </span>
              <span className="text-lg font-bold text-amber-500">
                {nextCheckpointInfo.formattedDistance}
              </span>
            </>
          )}
        </div>
      )}


      {/* Checkpoint list - fills remaining space */}
      <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
        {journey.checkpoints.map((checkpoint, index) => (
          <div
            key={checkpoint.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-all duration-300",
              checkpoint.validated 
                ? "bg-success/10" 
                : checkpoint.isDestination 
                  ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                  : "bg-secondary/50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all overflow-hidden",
              checkpoint.validated
                ? "bg-success text-success-foreground checkpoint-validated"
                : checkpoint.isDestination
                  ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                  : "bg-amber-500/20 text-amber-600"
            )}>
              {checkpoint.validated ? (
                <CheckCircle className="w-5 h-5" />
              ) : checkpoint.isDestination && dinoImage ? (
                <img src={dinoImage} alt={dinoInfo?.name} className="w-6 h-6 object-contain" />
              ) : checkpoint.isDestination ? (
                <Star className="w-4 h-4 text-white" />
              ) : (
                <Egg className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium",
                checkpoint.validated 
                  ? "text-success" 
                  : checkpoint.isDestination 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-foreground"
              )}>
                {checkpoint.isDestination 
                  ? `🦖 ${dinoInfo?.name || 'Dinosaure'}` 
                  : `Œuf #${index + 1}`
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {checkpoint.validated 
                  ? (checkpoint.isDestination ? 'Dinosaure capturé ! 🎉' : 'Trouvé ! 🎉')
                  : (checkpoint.isDestination ? 'Destination finale (15m)' : 'Approche-toi (15m)')
                }
              </p>
            </div>
            {checkpoint.validated && !checkpoint.isDestination && (
              <span className="text-xl">🥚</span>
            )}
            {checkpoint.validated && checkpoint.isDestination && (
              <span className="text-xl">🦕</span>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
