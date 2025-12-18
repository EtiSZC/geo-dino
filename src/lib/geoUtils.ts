import { Checkpoint, Journey } from '@/types/app';

// Calculate distance between two coordinates in meters using Haversine formula
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = coord1[1] * (Math.PI / 180);
  const lat2 = coord2[1] * (Math.PI / 180);
  const deltaLat = (coord2[1] - coord1[1]) * (Math.PI / 180);
  const deltaLng = (coord2[0] - coord1[0]) * (Math.PI / 180);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Generate random checkpoints along a route
export function generateCheckpoints(
  startPoint: [number, number],
  endPoint: [number, number],
  count: number = 5
): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate points at intervals along the route with some random offset
    const t = (i + 1) / (count + 1);
    const baseLng = startPoint[0] + (endPoint[0] - startPoint[0]) * t;
    const baseLat = startPoint[1] + (endPoint[1] - startPoint[1]) * t;
    
    // Add small random offset (roughly 5-50 meters)
    const offsetLng = (Math.random() - 0.5) * 0.0005;
    const offsetLat = (Math.random() - 0.5) * 0.0005;
    
    checkpoints.push({
      id: `checkpoint-${Date.now()}-${i}`,
      coordinates: [baseLng + offsetLng, baseLat + offsetLat],
      validated: false,
    });
  }
  
  return checkpoints;
}

// Check if user is within validation distance of a checkpoint
export function isWithinCheckpoint(
  userPosition: [number, number],
  checkpointPosition: [number, number],
  thresholdMeters: number = 5
): boolean {
  const distance = calculateDistance(userPosition, checkpointPosition);
  return distance <= thresholdMeters;
}

// Create a new journey
export function createJourney(
  name: string,
  startPoint: [number, number],
  endPoint: [number, number]
): Journey {
  return {
    id: `journey-${Date.now()}`,
    name,
    startPoint,
    endPoint,
    checkpoints: generateCheckpoints(startPoint, endPoint, 5),
    createdAt: new Date(),
  };
}

// Check if all checkpoints are validated
export function areAllCheckpointsValidated(journey: Journey): boolean {
  return journey.checkpoints.every(cp => cp.validated);
}
