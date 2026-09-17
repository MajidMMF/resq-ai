import {
  nearbyHospitalsQuerySchema,
  routeSchema,
  geocodeSchema,
  reverseGeocodeSchema,
  autocompleteSchema,
  distanceSchema,
} from "../validators/location.validator.js";
import { findNearbyHospitals } from "../services/overpass.service.js";
import { calculateRoute, calculateDistanceAndEta } from "../services/osrm.service.js";
import { geocodeAddress, reverseGeocodeCoords, autocompletePlaces } from "../services/nominatim.service.js";

/**
 * GET /api/locations/hospitals?lat=&lng=&radius=
 * Search for hospitals and trauma centers around a point
 */
export const getNearbyHospitals = async (req, res, next) => {
  try {
    const query = nearbyHospitalsQuerySchema.parse(req.query);
    const hospitals = await findNearbyHospitals(query.lat, query.lng, query.radius);

    return res.status(200).json({
      success: true,
      data: {
        center: { lat: query.lat, lng: query.lng },
        radiusMeters: query.radius,
        count: hospitals.length,
        hospitals,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/locations/route
 * Calculates driving route with geometry and steps between from and to
 */
export const getRoute = async (req, res, next) => {
  try {
    const { from, to } = routeSchema.parse(req.body);
    const route = await calculateRoute(from, to);

    return res.status(200).json({
      success: true,
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/locations/geocode
 * Converts address to coordinates
 */
export const geocode = async (req, res, next) => {
  try {
    const { address } = geocodeSchema.parse(req.body);
    const result = await geocodeAddress(address);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/locations/reverse-geocode
 * Converts coordinates to human-readable address
 */
export const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = reverseGeocodeSchema.parse(req.body);
    const result = await reverseGeocodeCoords(lat, lng);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/locations/autocomplete
 * Search suggestions for places/streets
 */
export const autocomplete = async (req, res, next) => {
  try {
    const { query } = autocompleteSchema.parse(req.body);
    const suggestions = await autocompletePlaces(query);

    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/locations/distance
 * Fast distance and duration (ETA) computation
 */
export const getDistance = async (req, res, next) => {
  try {
    const { from, to } = distanceSchema.parse(req.body);
    const result = await calculateDistanceAndEta(from, to);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getNearbyHospitals,
  getRoute,
  geocode,
  reverseGeocode,
  autocomplete,
  getDistance,
};

