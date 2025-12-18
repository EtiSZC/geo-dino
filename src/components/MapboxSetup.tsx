import { useState } from 'react';
import { MapPin, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MapboxSetupProps {
  onSetToken: (token: string) => void;
}

export function MapboxSetup({ onSetToken }: MapboxSetupProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter your Mapbox token');
      return;
    }
    if (!token.startsWith('pk.')) {
      setError('Invalid token format. It should start with "pk."');
      return;
    }
    onSetToken(token.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <MapPin className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold gradient-text">SoundQuest</h1>
        <p className="text-muted-foreground max-w-sm">
          Discover new music by completing real-world journeys. Let's set up your map first!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Key className="w-4 h-4" />
            <span>Mapbox Public Token</span>
          </div>
          
          <Input
            type="text"
            placeholder="pk.eyJ1Ijoi..."
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setError('');
            }}
            className="bg-secondary border-border"
          />
          
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          
          <p className="text-xs text-muted-foreground">
            Get your free token at{' '}
            <a
              href="https://mapbox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
            {' '}→ Account → Tokens
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg">
          Continue
        </Button>
      </form>
    </div>
  );
}
