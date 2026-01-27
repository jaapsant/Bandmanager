import type { Handler } from "@netlify/functions";

// Fixed starting point: Theaterkerk Bemmel
const ORIGIN_LAT = 51.8922;
const ORIGIN_LON = 5.8969;
const ORIGIN_NAME = "Theaterkerk Bemmel";

// Nominatim API for geocoding
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// OSRM API for routing
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
}

interface OSRMRoute {
    distance: number; // meters
    duration: number; // seconds
}

interface OSRMResponse {
    code: string;
    routes: OSRMRoute[];
}

export const handler: Handler = async (event) => {
    // Set CORS headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    };

    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: "method_not_allowed", message: "Method Not Allowed" }),
        };
    }

    try {
        const { destination } = JSON.parse(event.body || "{}");

        if (!destination || typeof destination !== "string" || destination.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "invalid_input", message: "Missing or invalid destination" }),
            };
        }

        // Step 1: Geocode the destination using Nominatim
        const geocodeUrl = `${NOMINATIM_URL}?q=${encodeURIComponent(destination)}&format=json&limit=1&countrycodes=nl,de,be,lu,fr`;

        const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
                "User-Agent": "Bandmanager/1.0 (https://github.com/bandmanager)",
                "Accept": "application/json",
            },
        });

        if (!geocodeResponse.ok) {
            if (geocodeResponse.status === 429) {
                return {
                    statusCode: 429,
                    headers,
                    body: JSON.stringify({ error: "rate_limited", message: "Too many requests. Please wait a moment." }),
                };
            }
            throw new Error(`Nominatim API error: ${geocodeResponse.status}`);
        }

        const geocodeResults: NominatimResult[] = await geocodeResponse.json();

        if (!geocodeResults || geocodeResults.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: "location_not_found", message: "Location not found" }),
            };
        }

        const destLat = parseFloat(geocodeResults[0].lat);
        const destLon = parseFloat(geocodeResults[0].lon);
        const destinationName = geocodeResults[0].display_name;

        // Step 2: Calculate route using OSRM
        // OSRM expects coordinates as lon,lat (not lat,lon)
        const routeUrl = `${OSRM_URL}/${ORIGIN_LON},${ORIGIN_LAT};${destLon},${destLat}?overview=false`;

        const routeResponse = await fetch(routeUrl, {
            headers: {
                "Accept": "application/json",
            },
        });

        if (!routeResponse.ok) {
            throw new Error(`OSRM API error: ${routeResponse.status}`);
        }

        const routeData: OSRMResponse = await routeResponse.json();

        if (routeData.code !== "Ok" || !routeData.routes || routeData.routes.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: "route_not_found", message: "Could not find a route to this location" }),
            };
        }

        // Convert meters to kilometers and round to 1 decimal place
        const distanceKm = Math.round(routeData.routes[0].distance / 100) / 10;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                distance: distanceKm,
                destinationName: destinationName,
                origin: ORIGIN_NAME,
            }),
        };
    } catch (error) {
        console.error("Error calculating distance:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "api_error", message: "Failed to calculate distance" }),
        };
    }
};
