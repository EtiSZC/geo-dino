import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Egg, Play, ChevronRight, RotateCcw, Loader2 } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { DinoSelector } from '@/components/DinoSelector';
import { JourneyMap } from '@/components/JourneyMap';
import { JourneyTracker } from '@/components/JourneyTracker';
import { DinoRewardScreen } from '@/components/DinoRewardScreen';
import { DinoHistory } from '@/components/DinoHistory';
import { GpsIndicator } from '@/components/GpsIndicator';
import { Button } from '@/components/ui/button';
import { DinoReward, DINO_TYPES } from '@/types/app';
import { createJourneyWithRoute } from '@/lib/geoUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import hatchingEggImg from '@/assets/dinos/hatching-egg.png';

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

type AppView = 'home' | 'dino-type' | 'setup-journey' | 'active-journey' | 'collection';

// Dinosaur name generator - more diverse prehistoric-inspired names
const DINO_FIRST_NAMES = [
  // Noms latins/grecs
  'Titan', 'Magnus', 'Atlas', 'Brutus', 'Maximus', 'Rex', 'Caesar', 'Nero',
  // Noms de héros
  'Hercule', 'Thor', 'Odin', 'Zeus', 'Apollo', 'Achille', 'Ulysse',
  // Noms de la nature
  'Tempête', 'Tonnerre', 'Volcan', 'Cyclone', 'Ouragan', 'Éclair', 'Comète',
  // Noms mignons
  'Gribouille', 'Croquette', 'Caramel', 'Cookie', 'Nougat', 'Praline',
  // Noms de guerriers
  'Spartacus', 'Conan', 'Attila', 'Genghis', 'Viking',
  // Noms uniques
  'Cosmos', 'Nova', 'Nebula', 'Galaxy', 'Orion', 'Phoenix',
  // Noms rigolos
  'Croc-Mignon', 'Griffe-Douce', 'Patte-Velours', 'Queue-en-Trompette',
];

const DINO_TITLES = [
  // Titres classiques
  'le Magnifique', 'le Terrible', 'le Grand', 'le Brave', 'le Sage',
  // Titres rigolos
  'le Glouton', 'le Ronfleur', 'le Câlin', 'le Farceur', 'le Rêveur',
  // Titres épiques
  'le Légendaire', 'le Mythique', 'l\'Ancien', 'le Colossal', 'le Titanesque',
  // Sans titre (plus court)
  '', '', '', '', '',
];

const getRandomDinoName = () => {
  const firstName = DINO_FIRST_NAMES[Math.floor(Math.random() * DINO_FIRST_NAMES.length)];
  const title = DINO_TITLES[Math.floor(Math.random() * DINO_TITLES.length)];
  return title ? `${firstName} ${title}` : firstName;
};

export default function Index() {
  const {
    state,
    setDinoType,
    setJourney,
    startJourney,
    stopJourney,
    updatePosition,
    validateCheckpoint,
    addDinoReward,
    resetJourney,
    deleteDinoReward,
  } = useAppState();

  const [view, setView] = useState<AppView>('home');
  const [showReward, setShowReward] = useState<DinoReward | null>(null);
  const [isGeneratingDino, setIsGeneratingDino] = useState(false);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Watch user position with high accuracy
  useEffect(() => {
    if (!state.isJourneyActive) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        setGpsAccuracy(accuracy);
        
        if (accuracy < 30) {
          updatePosition([position.coords.longitude, position.coords.latitude]);
          setGpsError(null);
        } else {
          setGpsError(`Précision GPS faible : ${Math.round(accuracy)}m. Va dans un endroit dégagé.`);
        }
      },
      (error) => {
        setGpsError(error.message);
        setGpsAccuracy(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
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

  // Prevent multiple completions
  const isCompletingRef = useRef(false);

  // Handle journey completion - generate dinosaur
  const handleJourneyComplete = useCallback(async () => {
    // Guard against multiple calls
    if (isCompletingRef.current) return;
    if (!state.user.currentJourney || !state.user.selectedDinoType) return;
    
    isCompletingRef.current = true;

    const dinoType = state.user.selectedDinoType;
    const dinoTypeName = DINO_TYPES.find(d => d.id === dinoType)?.name || dinoType;
    const dinoName = getRandomDinoName();
    const journeyId = state.user.currentJourney.id;

    // Create initial reward (without image yet)
    const reward: DinoReward = {
      id: `dino-${Date.now()}`,
      dinoName,
      dinoType,
      imageUrl: '', // Will be filled after generation
      earnedAt: new Date(),
      journeyId,
    };

    setShowReward(reward);
    setIsGeneratingDino(true);

    // Generate dinosaur image
    try {
      const { data, error } = await supabase.functions.invoke('generate-dinosaur', {
        body: { dinoType: dinoTypeName, dinoName }
      });

      if (error) {
        console.error('Error generating dinosaur:', error);
        toast.error("Erreur lors de la création du dinosaure");
      } else if (data?.imageUrl) {
        reward.imageUrl = data.imageUrl;
        reward.funFact = data.funFact;
        setShowReward({ ...reward });
      }
    } catch (err) {
      console.error('Error calling generate-dinosaur:', err);
      toast.error("Impossible de créer le dinosaure");
    } finally {
      setIsGeneratingDino(false);
    }

    // Add to collection AFTER generation (with or without image)
    addDinoReward(reward);
    
    // Reset completion guard for next journey
    isCompletingRef.current = false;
  }, [state.user.currentJourney, state.user.selectedDinoType, addDinoReward]);

  // Handle creating journey after route is calculated
  const handleCreateJourney = useCallback(() => {
    if (!startPoint || !endPoint || !routeCoords) return;

    const journey = createJourneyWithRoute('Mon Expédition', startPoint, endPoint, routeCoords);
    
    if (journey.checkpoints.length === 0) {
      toast.error('Trajet trop court ! Il faut au moins 200m pour placer des œufs.');
      return;
    }
    
    setJourney(journey);
    setView('home');
    setStartPoint(null);
    setEndPoint(null);
    setRouteCoords(null);
  }, [startPoint, endPoint, routeCoords, setJourney]);

  const selectedDinoName = state.user.selectedDinoType
    ? DINO_TYPES.find(d => d.id === state.user.selectedDinoType)?.name
    : null;

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Reward overlay */}
      {showReward && (
        <DinoRewardScreen
          reward={showReward}
          isGenerating={isGeneratingDino}
          onClose={() => {
            setShowReward(null);
            resetJourney();
            setView('home');
          }}
        />
      )}

      {/* Dino type selection view */}
      {view === 'dino-type' && (
        <div className="min-h-screen flex flex-col">
          <header className="p-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setView('home')}>
              ← Retour
            </Button>
          </header>
          <DinoSelector
            selectedDinoType={state.user.selectedDinoType}
            onSelectDinoType={(dinoType) => {
              setDinoType(dinoType);
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
              ← Retour
            </Button>
            {startPoint && endPoint && routeCoords && (
              <Button onClick={handleCreateJourney}>
                Créer l'Expédition
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
        <div className="h-screen flex flex-col">
          <div className="h-1/2 relative">
            <JourneyMap
              mapboxToken={state.user.mapboxToken}
              journey={state.user.currentJourney}
              currentPosition={state.currentPosition}
              isActive={state.isJourneyActive}
              mode="active"
            />
            
            {/* GPS status indicator */}
            <div className="absolute top-4 left-4 z-10">
              <GpsIndicator accuracy={gpsAccuracy} error={gpsError} />
            </div>
          </div>
          
          <div className="h-1/2 p-4 overflow-y-auto">
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

      {/* Collection view */}
      {view === 'collection' && (
        <div className="min-h-screen flex flex-col">
          <header className="p-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setView('home')}>
              ← Retour
            </Button>
          </header>
          <div className="flex-1 p-4">
            <DinoHistory rewards={state.user.dinoRewards} onDelete={deleteDinoReward} />
          </div>
        </div>
      )}

      {/* Home view */}
      {view === 'home' && (
        <div className="min-h-screen flex flex-col p-4 space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-2xl">🥚</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Dino Quest</h1>
                <p className="text-xs text-muted-foreground">Chasse aux œufs de dinosaure</p>
              </div>
            </div>
          </header>

          {/* Dino type selection card */}
          <button
            onClick={() => setView('dino-type')}
            className="glass-card p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center overflow-hidden">
              {state.user.selectedDinoType && DINO_IMAGES[state.user.selectedDinoType] ? (
                <img 
                  src={DINO_IMAGES[state.user.selectedDinoType]} 
                  alt={selectedDinoName || 'Dinosaure'} 
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <Egg className="w-6 h-6 text-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Type de Dinosaure</p>
              <p className="font-semibold">
                {selectedDinoName || 'Choisis un dinosaure'}
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
                    <p className="text-sm text-muted-foreground">Expédition en cours</p>
                    <p className="font-semibold">{state.user.currentJourney.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {state.user.currentJourney.checkpoints.filter(c => c.validated).length} / {state.user.currentJourney.checkpoints.length} œufs trouvés
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

                <div className="h-40 rounded-xl overflow-hidden pointer-events-none">
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
                disabled={!state.user.selectedDinoType}
                onClick={() => {
                  startJourney();
                  setView('active-journey');
                }}
              >
                <Play className="w-5 h-5" />
                Partir à l'aventure !
              </Button>

              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={resetJourney}
              >
                <RotateCcw className="w-5 h-5" />
                Annuler l'expédition
              </Button>
              
              {!state.user.selectedDinoType && (
                <p className="text-center text-sm text-muted-foreground">
                  Choisis d'abord un type de dinosaure
                </p>
              )}
            </div>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-none"
              size="lg"
              onClick={() => setView('setup-journey')}
            >
              <MapPin className="w-5 h-5" />
              Préparer une Expédition
            </Button>
          )}

          {/* Collection section */}
          <div className="flex-1">
            <button
              onClick={() => setView('collection')}
              className="w-full glass-card p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-accent/20 flex items-center justify-center overflow-hidden">
                <img src={hatchingEggImg} alt="Collection" className="w-10 h-10 object-contain" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Ta Collection</p>
                <p className="font-semibold">
                  {state.user.dinoRewards.length} dinosaure{state.user.dinoRewards.length !== 1 ? 's' : ''} découvert{state.user.dinoRewards.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Install hint */}
          <p className="text-center text-xs text-muted-foreground">
            Installe l'app : Partager → Ajouter à l'écran d'accueil
          </p>
        </div>
      )}
    </div>
  );
}
