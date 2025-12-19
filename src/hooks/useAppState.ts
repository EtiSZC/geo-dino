import { useState, useEffect, useCallback } from 'react';
import { AppState, UserProfile, Journey, DinoReward, DinoTypeId } from '@/types/app';

const STORAGE_KEY = 'dinoquest_data';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXRpc3pjIiwiYSI6ImNtamI5ZG1kMTAwNnczZHNtanY3N2s4bnEifQ.LpEZBQpE3_8MdmdqIPFHEQ';

const defaultUserProfile: UserProfile = {
  selectedDinoType: null,
  currentJourney: null,
  completedJourneys: [],
  dinoRewards: [],
  mapboxToken: MAPBOX_TOKEN,
};

const defaultAppState: AppState = {
  user: defaultUserProfile,
  isJourneyActive: false,
  currentPosition: null,
};

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultAppState,
          user: { ...defaultUserProfile, ...parsed.user },
          isJourneyActive: parsed.isJourneyActive || false,
        };
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
    return defaultAppState;
  });

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user: state.user,
        isJourneyActive: state.isJourneyActive,
      }));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [state.user, state.isJourneyActive]);

  const setDinoType = useCallback((dinoType: DinoTypeId) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, selectedDinoType: dinoType },
    }));
  }, []);

  const setMapboxToken = useCallback((token: string) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, mapboxToken: token },
    }));
  }, []);

  const setJourney = useCallback((journey: Journey) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, currentJourney: journey },
    }));
  }, []);

  const startJourney = useCallback(() => {
    setState(prev => ({
      ...prev,
      isJourneyActive: true,
    }));
  }, []);

  const stopJourney = useCallback(() => {
    setState(prev => ({
      ...prev,
      isJourneyActive: false,
    }));
  }, []);

  const updatePosition = useCallback((position: [number, number]) => {
    setState(prev => ({
      ...prev,
      currentPosition: position,
    }));
  }, []);

  const validateCheckpoint = useCallback((checkpointId: string) => {
    // Trigger haptic feedback on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }

    setState(prev => {
      if (!prev.user.currentJourney) return prev;
      
      const updatedCheckpoints = prev.user.currentJourney.checkpoints.map(cp =>
        cp.id === checkpointId
          ? { ...cp, validated: true, validatedAt: new Date() }
          : cp
      );

      return {
        ...prev,
        user: {
          ...prev.user,
          currentJourney: {
            ...prev.user.currentJourney,
            checkpoints: updatedCheckpoints,
          },
        },
      };
    });
  }, []);

  const addDinoReward = useCallback((reward: DinoReward) => {
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        dinoRewards: [...prev.user.dinoRewards, reward],
        completedJourneys: prev.user.currentJourney
          ? [...prev.user.completedJourneys, prev.user.currentJourney.id]
          : prev.user.completedJourneys,
      },
      isJourneyActive: false,
    }));
  }, []);

  const resetJourney = useCallback(() => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, currentJourney: null },
      isJourneyActive: false,
    }));
  }, []);

  return {
    state,
    setDinoType,
    setMapboxToken,
    setJourney,
    startJourney,
    stopJourney,
    updatePosition,
    validateCheckpoint,
    addDinoReward,
    resetJourney,
  };
}
