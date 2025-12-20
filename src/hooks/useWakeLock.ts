import { useState, useEffect, useCallback } from 'react';

export const useWakeLock = (enabled: boolean) => {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      const lock = await navigator.wakeLock.request('screen');
      setWakeLock(lock);
      console.log('Wake Lock activé - l\'écran restera allumé');
      
      lock.addEventListener('release', () => {
        console.log('Wake Lock libéré');
        setWakeLock(null);
      });
    } catch (err) {
      console.error('Erreur Wake Lock:', err);
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  // Request/release based on enabled state
  useEffect(() => {
    if (enabled && isSupported && !wakeLock) {
      requestWakeLock();
    } else if (!enabled && wakeLock) {
      releaseWakeLock();
    }
  }, [enabled, isSupported, wakeLock, requestWakeLock, releaseWakeLock]);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && isSupported) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isSupported, requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [wakeLock]);

  return {
    isSupported,
    isActive: !!wakeLock,
  };
};
