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

// Constants for waypoint rules
const MAX_WAYPOINTS = 5;
const MIN_DISTANCE_BETWEEN_WAYPOINTS = 100; // meters

// Calculate optimal number of waypoints based on route distance
function calculateOptimalWaypointCount(totalDistance: number): number {
  // We need space for waypoints plus gaps at start and end
  // Each waypoint needs at least MIN_DISTANCE_BETWEEN_WAYPOINTS from neighbors
  // Formula: totalDistance / (count + 1) >= MIN_DISTANCE_BETWEEN_WAYPOINTS
  // So: count <= (totalDistance / MIN_DISTANCE_BETWEEN_WAYPOINTS) - 1
  
  const maxPossibleWaypoints = Math.floor(totalDistance / MIN_DISTANCE_BETWEEN_WAYPOINTS) - 1;
  
  // Clamp between 0 and MAX_WAYPOINTS (allow 0 for very short routes)
  return Math.max(0, Math.min(MAX_WAYPOINTS, maxPossibleWaypoints));
}

// Generate checkpoints along an actual route path
export function generateCheckpointsAlongRoute(
  routeCoordinates: [number, number][],
  requestedCount: number = MAX_WAYPOINTS
): Checkpoint[] {
  if (routeCoordinates.length < 2) return [];
  
  const checkpoints: Checkpoint[] = [];
  
  // Calculate total route distance
  let totalDistance = 0;
  const distances: number[] = [0];
  
  for (let i = 1; i < routeCoordinates.length; i++) {
    const segmentDistance = calculateDistance(routeCoordinates[i - 1], routeCoordinates[i]);
    totalDistance += segmentDistance;
    distances.push(totalDistance);
  }
  
  // Calculate optimal count based on route distance and rules
  const optimalCount = calculateOptimalWaypointCount(totalDistance);
  const count = Math.min(requestedCount, optimalCount, MAX_WAYPOINTS);
  
  // If route is too short for any waypoints with proper spacing, return empty
  if (count === 0) {
    console.log(`Route too short (${totalDistance.toFixed(0)}m) for waypoints with ${MIN_DISTANCE_BETWEEN_WAYPOINTS}m spacing`);
    return [];
  }
  
  // Place checkpoints at evenly spaced intervals along the route
  for (let i = 0; i < count; i++) {
    // Calculate target distance (evenly distributed, avoiding start and end)
    const targetDistance = totalDistance * ((i + 1) / (count + 1));
    
    // Find the segment containing this distance
    let segmentIndex = 0;
    for (let j = 1; j < distances.length; j++) {
      if (distances[j] >= targetDistance) {
        segmentIndex = j - 1;
        break;
      }
    }
    
    // Interpolate position within the segment
    const segmentStart = distances[segmentIndex];
    const segmentEnd = distances[segmentIndex + 1];
    const segmentLength = segmentEnd - segmentStart;
    const t = segmentLength > 0 ? (targetDistance - segmentStart) / segmentLength : 0;
    
    const startCoord = routeCoordinates[segmentIndex];
    const endCoord = routeCoordinates[segmentIndex + 1] || startCoord;
    
    const lng = startCoord[0] + (endCoord[0] - startCoord[0]) * t;
    const lat = startCoord[1] + (endCoord[1] - startCoord[1]) * t;
    
    checkpoints.push({
      id: `checkpoint-${Date.now()}-${i}`,
      coordinates: [lng, lat],
      validated: false,
    });
  }
  
  console.log(`Generated ${checkpoints.length} waypoints for ${totalDistance.toFixed(0)}m route`);
  return checkpoints;
}

// Legacy: Generate random checkpoints between two points (fallback)
export function generateCheckpoints(
  startPoint: [number, number],
  endPoint: [number, number],
  requestedCount: number = MAX_WAYPOINTS
): Checkpoint[] {
  const totalDistance = calculateDistance(startPoint, endPoint);
  
  // Calculate optimal count based on distance and rules
  const optimalCount = calculateOptimalWaypointCount(totalDistance);
  const count = Math.min(requestedCount, optimalCount, MAX_WAYPOINTS);
  
  // If route is too short for any waypoints with proper spacing, return empty
  if (count === 0) {
    console.log(`Route too short (${totalDistance.toFixed(0)}m) for waypoints with ${MIN_DISTANCE_BETWEEN_WAYPOINTS}m spacing`);
    return [];
  }
  
  const checkpoints: Checkpoint[] = [];
  
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const baseLng = startPoint[0] + (endPoint[0] - startPoint[0]) * t;
    const baseLat = startPoint[1] + (endPoint[1] - startPoint[1]) * t;
    
    const offsetLng = (Math.random() - 0.5) * 0.0005;
    const offsetLat = (Math.random() - 0.5) * 0.0005;
    
    checkpoints.push({
      id: `checkpoint-${Date.now()}-${i}`,
      coordinates: [baseLng + offsetLng, baseLat + offsetLat],
      validated: false,
    });
  }
  
  console.log(`Generated ${checkpoints.length} waypoints for ${totalDistance.toFixed(0)}m route (fallback)`);
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

// Create a new journey with route coordinates
export function createJourneyWithRoute(
  name: string,
  startPoint: [number, number],
  endPoint: [number, number],
  routeCoordinates: [number, number][]
): Journey {
  return {
    id: `journey-${Date.now()}`,
    name,
    startPoint,
    endPoint,
    checkpoints: generateCheckpointsAlongRoute(routeCoordinates, 5),
    routeCoordinates,
    createdAt: new Date(),
  };
}

// Create a new journey (fallback without route)
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
