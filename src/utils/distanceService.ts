/**
 * Distance calculation service that calls the Netlify serverless function
 * to calculate driving distance from Theaterkerk Bemmel to a destination.
 */

export type DistanceErrorType =
  | 'location_not_found'
  | 'route_not_found'
  | 'rate_limited'
  | 'api_error'
  | 'invalid_input'
  | 'network_error';

/**
 * Response from the distance calculation service
 */
export interface DistanceResult {
  success: boolean;
  distance?: number;
  destinationName?: string;
  error?: DistanceErrorType;
  message?: string;
}

/**
 * Calculate driving distance from Theaterkerk Bemmel to a destination.
 * Uses Nominatim for geocoding and OSRM for routing.
 *
 * @param destination - The destination address or venue name
 * @returns Promise with the distance in km or an error
 */
export async function calculateDistance(destination: string): Promise<DistanceResult> {
  if (!destination || destination.trim().length === 0) {
    return {
      success: false,
      error: 'invalid_input',
      message: 'Please enter a location first',
    };
  }

  try {
    const response = await fetch('/.netlify/functions/calculateDistance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: destination.trim(),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        distance: data.distance,
        destinationName: data.destinationName,
      };
    } else {
      return {
        success: false,
        error: data.error || 'api_error',
        message: data.message || 'Failed to calculate distance',
      };
    }
  } catch (error) {
    console.error('Error calculating distance:', error);
    return {
      success: false,
      error: 'network_error',
      message: 'Network error. Please check your connection.',
    };
  }
}
