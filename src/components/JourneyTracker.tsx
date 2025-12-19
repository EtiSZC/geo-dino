import { useEffect, useRef, useState } from 'react';
import { Flag, Navigation, CheckCircle, Egg } from 'lucide-react';
import { Journey } from '@/types/app';
import { isWithinCheckpoint, areAllCheckpointsValidated } from '@/lib/geoUtils';
import { celebrateEggFound } from '@/lib/celebrationFeedback';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JourneyTrackerProps {
  journey: Journey;
  currentPosition: [number, number] | null;
  isActive: boolean;
  onValidateCheckpoint: (checkpointId: string) => void;
  onJourneyComplete: () => void;
  onStop: () => void;
}

export function JourneyTracker({
  journey,
  currentPosition,
  isActive,
  onValidateCheckpoint,
  onJourneyComplete,
  onStop,
}: JourneyTrackerProps) {
  const validatedCount = journey.checkpoints.filter(cp => cp.validated).length;
  const totalCount = journey.checkpoints.length;
  const progress = (validatedCount / totalCount) * 100;
  
  // Prevent multiple calls to onJourneyComplete
  const hasCompletedRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
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
        setShowConfetti(true);
        onValidateCheckpoint(checkpoint.id);
      }
    });

    // Check if journey is complete - only trigger once
    if (!hasCompletedRef.current && areAllCheckpointsValidated(journey)) {
      hasCompletedRef.current = true;
      onJourneyComplete();
    }
  }, [currentPosition, isActive, journey, onValidateCheckpoint, onJourneyComplete]);

  return (
    <>
      {showConfetti && <ConfettiCelebration onComplete={() => setShowConfetti(false)} />}
    <div className="glass-card p-4 space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between">
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
              {validatedCount} sur {totalCount} œufs trouvés
            </p>
          </div>
        </div>
        
        {isActive && (
          <Button variant="outline" size="sm" onClick={onStop}>
            Arrêter
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-success rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checkpoint list - as eggs */}
      <div className="space-y-2">
        {journey.checkpoints.map((checkpoint, index) => (
          <div
            key={checkpoint.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-all duration-300",
              checkpoint.validated ? "bg-success/10" : "bg-secondary/50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              checkpoint.validated
                ? "bg-success text-success-foreground checkpoint-validated"
                : "bg-amber-500/20 text-amber-600"
            )}>
              {checkpoint.validated ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Egg className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium",
                checkpoint.validated ? "text-success" : "text-foreground"
              )}>
                Œuf #{index + 1}
              </p>
              <p className="text-xs text-muted-foreground">
                {checkpoint.validated ? 'Trouvé ! 🎉' : 'Approche-toi (15m)'}
              </p>
            </div>
            {checkpoint.validated && (
              <span className="text-xl">🥚</span>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
