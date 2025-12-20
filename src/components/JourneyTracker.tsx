import { useEffect, useRef, useState, useMemo } from 'react';
import { Flag, Navigation, CheckCircle, Egg } from 'lucide-react';
import { Journey } from '@/types/app';
import { isWithinCheckpoint, areAllCheckpointsValidated, calculateDistance } from '@/lib/geoUtils';
import { celebrateEggFound } from '@/lib/celebrationFeedback';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWakeLock } from '@/hooks/useWakeLock';

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
}

export function JourneyTracker({
  journey,
  currentPosition,
  isActive,
  onValidateCheckpoint,
  onJourneyComplete,
  onStop,
}: JourneyTrackerProps) {
  // Keep screen awake while journey is active
  const { isSupported: wakeLockSupported, isActive: wakeLockActive } = useWakeLock(isActive);
  
  const validatedCount = journey.checkpoints.filter(cp => cp.validated).length;
  const totalCount = journey.checkpoints.length;
  const progress = (validatedCount / totalCount) * 100;
  
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
    };
  }, [currentPosition, journey.checkpoints]);
  
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


      {/* Distance to next egg */}
      {isActive && nextCheckpointInfo && (
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
          <Egg className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-medium">
            Prochain œuf #{nextCheckpointInfo.index} :
          </span>
          <span className="text-lg font-bold text-amber-500">
            {nextCheckpointInfo.formattedDistance}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-success rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checkpoint list - as eggs - scrollable with max height */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
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
