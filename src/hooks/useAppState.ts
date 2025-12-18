import { useState, useEffect, useCallback } from 'react';
import { AppState, UserProfile, Journey, MusicReward, GenreId } from '@/types/app';

const STORAGE_KEY = 'soundquest_data';

const defaultUserProfile: UserProfile = {
  selectedGenre: null,
  currentJourney: null,
  completedJourneys: [],
  rewards: [],
  mapboxToken: null,
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

  const setGenre = useCallback((genre: GenreId) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, selectedGenre: genre },
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

  const addReward = useCallback((reward: MusicReward) => {
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        rewards: [...prev.user.rewards, reward],
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
    setGenre,
    setMapboxToken,
    setJourney,
    startJourney,
    stopJourney,
    updatePosition,
    validateCheckpoint,
    addReward,
    resetJourney,
  };
}
