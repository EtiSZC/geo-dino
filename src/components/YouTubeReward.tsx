import { ArrowLeft, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YouTubeRewardProps {
  onClose: () => void;
}

export function YouTubeReward({ onClose }: YouTubeRewardProps) {
  // Convert YouTube URL to embed format
  // Original: https://youtu.be/JtulDX0nwQI?si=Ld7i2za52K498xz9
  const videoId = 'JtulDX0nwQI';
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-fade-in">
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          <span className="font-semibold">Ta Super Récompense</span>
        </div>
      </header>

      {/* Video container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold gradient-text">
              Félicitations, Champion des Dinosaures ! 🏆
            </h2>
            <p className="text-sm text-muted-foreground">
              Tu as collectionné tous les dinosaures. Voici ta récompense exclusive !
            </p>
          </div>

          {/* YouTube embed with responsive aspect ratio */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-border">
            <iframe
              src={embedUrl}
              title="Récompense Dinosaure"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Tu peux revoir cette vidéo à tout moment depuis ta collection 🦕
          </p>
        </div>
      </div>
    </div>
  );
}
