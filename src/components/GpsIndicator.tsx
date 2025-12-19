import { Signal, SignalHigh, SignalLow, SignalZero } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GpsIndicatorProps {
  accuracy: number | null;
  error: string | null;
}

export function GpsIndicator({ accuracy, error }: GpsIndicatorProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30">
        <SignalZero className="w-4 h-4 text-destructive" />
        <span className="text-xs text-destructive font-medium">{error}</span>
      </div>
    );
  }

  if (accuracy === null) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
        <Signal className="w-4 h-4 text-muted-foreground animate-pulse" />
        <span className="text-xs text-muted-foreground">Recherche GPS...</span>
      </div>
    );
  }

  // Determine quality based on accuracy
  let quality: 'excellent' | 'good' | 'poor';
  let label: string;
  let Icon = SignalHigh;
  let colorClass: string;

  if (accuracy <= 10) {
    quality = 'excellent';
    label = 'Excellent';
    Icon = SignalHigh;
    colorClass = 'text-success bg-success/10 border-success/30';
  } else if (accuracy <= 20) {
    quality = 'good';
    label = 'Bon';
    Icon = Signal;
    colorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/30';
  } else {
    quality = 'poor';
    label = 'Faible';
    Icon = SignalLow;
    colorClass = 'text-destructive bg-destructive/10 border-destructive/30';
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border",
      colorClass
    )}>
      <Icon className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="text-xs font-medium">GPS {label}</span>
        <span className="text-[10px] opacity-70">±{Math.round(accuracy)}m</span>
      </div>
    </div>
  );
}
