import { useState } from 'react';
import { MUSIC_GENRES, GenreId } from '@/types/app';
import { cn } from '@/lib/utils';

interface GenreSelectorProps {
  selectedGenre: GenreId | null;
  onSelectGenre: (genre: GenreId) => void;
}

export function GenreSelector({ selectedGenre, onSelectGenre }: GenreSelectorProps) {
  const [hoveredGenre, setHoveredGenre] = useState<GenreId | null>(null);

  return (
    <div className="p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold gradient-text">Choose Your Vibe</h2>
        <p className="text-muted-foreground text-sm">
          Select the music genre you want to discover
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MUSIC_GENRES.map((genre, index) => (
          <button
            key={genre.id}
            onClick={() => onSelectGenre(genre.id)}
            onMouseEnter={() => setHoveredGenre(genre.id)}
            onMouseLeave={() => setHoveredGenre(null)}
            className={cn(
              "relative p-4 rounded-xl transition-all duration-300 overflow-hidden group",
              "border border-border/50",
              selectedGenre === genre.id
                ? "ring-2 ring-primary shadow-lg scale-[1.02]"
                : "hover:scale-[1.02] hover:border-primary/50"
            )}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Background gradient */}
            <div 
              className={cn(
                "absolute inset-0 opacity-20 transition-opacity duration-300",
                `bg-gradient-to-br ${genre.color}`,
                (selectedGenre === genre.id || hoveredGenre === genre.id) && "opacity-40"
              )}
            />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                {genre.emoji}
              </span>
              <span className={cn(
                "font-medium text-sm transition-colors",
                selectedGenre === genre.id ? "text-foreground" : "text-muted-foreground"
              )}>
                {genre.name}
              </span>
            </div>

            {/* Selected indicator */}
            {selectedGenre === genre.id && (
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
