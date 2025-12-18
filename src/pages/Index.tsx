import { useState, useEffect, useCallback } from 'react';
import { MapPin, Music, Play, ChevronRight, RotateCcw } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { GenreSelector } from '@/components/GenreSelector';
import { JourneyMap } from '@/components/JourneyMap';
import { JourneyTracker } from '@/components/JourneyTracker';
import { RewardScreen } from '@/components/RewardScreen';
import { RewardsHistory } from '@/components/RewardsHistory';
import { Button } from '@/components/ui/button';
import { MusicReward, MUSIC_GENRES } from '@/types/app';
import { createJourneyWithRoute } from '@/lib/geoUtils';
import { getRandomTrack } from '@/lib/musicDatabase';

type AppView = 'home' | 'genre' | 'setup-journey' | 'active-journey' | 'rewards';

export default function Index() {
  const {
    state,
    setGenre,
    setJourney,
    startJourney,
    stopJourney,
    updatePosition,
    validateCheckpoint,
    addReward,
    resetJourney,
  } = useAppState();

  const [view, setView] = useState<AppView>('home');
  const [showReward, setShowReward] = useState<MusicReward | null>(null);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Watch user position
  useEffect(() => {
    if (!state.isJourneyActive) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        updatePosition([position.coords.longitude, position.coords.latitude]);
        setGpsError(null);
      },
      (error) => {
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [state.isJourneyActive, updatePosition]);

  // Get initial position
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updatePosition([position.coords.longitude, position.coords.latitude]);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, [updatePosition]);

  // Handle journey completion
  const handleJourneyComplete = useCallback(() => {
    if (!state.user.currentJourney || !state.user.selectedGenre) return;

    const track = getRandomTrack(state.user.selectedGenre);
    const reward: MusicReward = {
      id: `reward-${Date.now()}`,
      title: track.title,
      artist: track.artist,
      genre: state.user.selectedGenre,
      spotifyUrl: track.spotifyUrl,
      deezerUrl: track.deezerUrl,
      appleMusicUrl: track.appleMusicUrl,
      earnedAt: new Date(),
      journeyId: state.user.currentJourney.id,
    };

    setShowReward(reward);
    addReward(reward);
  }, [state.user.currentJourney, state.user.selectedGenre, addReward]);

  // Handle creating journey after route is calculated
  const handleCreateJourney = useCallback(() => {
    if (!startPoint || !endPoint || !routeCoords) return;

    const journey = createJourneyWithRoute('My Journey', startPoint, endPoint, routeCoords);
    setJourney(journey);
    setView('home');
    setStartPoint(null);
    setEndPoint(null);
    setRouteCoords(null);
  }, [startPoint, endPoint, routeCoords, setJourney]);

  const selectedGenreName = state.user.selectedGenre
    ? MUSIC_GENRES.find(g => g.id === state.user.selectedGenre)?.name
    : null;

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Reward overlay */}
      {showReward && (
        <RewardScreen
          reward={showReward}
          onClose={() => {
            setShowReward(null);
            resetJourney();
            setView('home');
          }}
        />
      )}

      {/* Genre selection view */}
      {view === 'genre' && (
        <div className="min-h-screen flex flex-col">
          <header className="p-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setView('home')}>
              ← Back
            </Button>
          </header>
          <GenreSelector
            selectedGenre={state.user.selectedGenre}
            onSelectGenre={(genre) => {
              setGenre(genre);
              setView('home');
            }}
          />
        </div>
      )}

      {/* Journey setup view */}
      {view === 'setup-journey' && (
        <div className="h-screen flex flex-col">
          <header className="p-4 flex items-center justify-between z-10 relative">
            <Button variant="ghost" size="sm" onClick={() => {
              setView('home');
              setStartPoint(null);
              setEndPoint(null);
              setRouteCoords(null);
            }}>
              ← Back
            </Button>
            {startPoint && endPoint && routeCoords && (
              <Button onClick={handleCreateJourney}>
                Create Journey
              </Button>
            )}
          </header>
          <div className="flex-1 relative">
            <JourneyMap
              mapboxToken={state.user.mapboxToken!}
              journey={null}
              currentPosition={state.currentPosition}
              isActive={false}
              mode="setup"
              onSetStart={setStartPoint}
              onSetEnd={setEndPoint}
              onRouteCalculated={setRouteCoords}
            />
          </div>
        </div>
      )}

      {/* Active journey view */}
      {view === 'active-journey' && state.user.currentJourney && (
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 relative">
            <JourneyMap
              mapboxToken={state.user.mapboxToken}
              journey={state.user.currentJourney}
              currentPosition={state.currentPosition}
              isActive={state.isJourneyActive}
              mode="active"
            />
            
            {/* GPS error */}
            {gpsError && (
              <div className="absolute top-4 left-4 right-4 z-10">
                <div className="glass-card p-3 text-center text-destructive text-sm">
                  GPS Error: {gpsError}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4">
            <JourneyTracker
              journey={state.user.currentJourney}
              currentPosition={state.currentPosition}
              isActive={state.isJourneyActive}
              onValidateCheckpoint={validateCheckpoint}
              onJourneyComplete={handleJourneyComplete}
              onStop={() => {
                stopJourney();
                setView('home');
              }}
            />
          </div>
        </div>
      )}

      {/* Rewards view */}
      {view === 'rewards' && (
        <div className="min-h-screen flex flex-col">
          <header className="p-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setView('home')}>
              ← Back
            </Button>
          </header>
          <div className="flex-1 p-4">
            <RewardsHistory rewards={state.user.rewards} />
          </div>
        </div>
      )}

      {/* Home view */}
      {view === 'home' && (
        <div className="min-h-screen flex flex-col p-4 space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">SoundQuest</h1>
                <p className="text-xs text-muted-foreground">Discover music on the go</p>
              </div>
            </div>
          </header>

          {/* Genre selection card */}
          <button
            onClick={() => setView('genre')}
            className="glass-card p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Music Genre</p>
              <p className="font-semibold">
                {selectedGenreName || 'Select a genre'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Current journey or setup */}
          {state.user.currentJourney ? (
            <div className="space-y-4">
              <div className="glass-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Journey</p>
                    <p className="font-semibold">{state.user.currentJourney.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {state.user.currentJourney.checkpoints.filter(c => c.validated).length} / {state.user.currentJourney.checkpoints.length} checkpoints
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetJourney}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                <div className="h-40 rounded-xl overflow-hidden">
                  <JourneyMap
                    mapboxToken={state.user.mapboxToken}
                    journey={state.user.currentJourney}
                    currentPosition={state.currentPosition}
                    isActive={false}
                    mode="view"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!state.user.selectedGenre}
                onClick={() => {
                  startJourney();
                  setView('active-journey');
                }}
              >
                <Play className="w-5 h-5" />
                Start Journey
              </Button>
              
              {!state.user.selectedGenre && (
                <p className="text-center text-sm text-muted-foreground">
                  Select a music genre first
                </p>
              )}
            </div>
          ) : (
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => setView('setup-journey')}
            >
              <MapPin className="w-5 h-5" />
              Define Your Journey
            </Button>
          )}

          {/* Rewards section */}
          <div className="flex-1">
            <button
              onClick={() => setView('rewards')}
              className="w-full glass-card p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-accent/20 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Your Rewards</p>
                <p className="font-semibold">
                  {state.user.rewards.length} track{state.user.rewards.length !== 1 ? 's' : ''} discovered
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Install hint */}
          <p className="text-center text-xs text-muted-foreground">
            Install this app: Share → Add to Home Screen
          </p>
        </div>
      )}
    </div>
  );
}
