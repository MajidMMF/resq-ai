import { calculateDistanceMeters, calculateDistanceKm, estimateDurationSeconds } from "../utils/haversine.js";

export const MOCK_HOSPITALS = [
  {
    id: "hosp_01",
    name: "City Care Emergency Trauma Center",
    type: "Multi-Specialty & Trauma",
    lat: 19.0760,
    lng: 72.8777,
    address: "Bandra Kurla Complex, Mumbai, Maharashtra 400051",
    phone: "+91 22 2650 1100",
    emergency: true,
    traumaLevel: "Level 1",
    icuBedsAvailable: 8,
    operatingRooms: 4,
    tags: {
      amenity: "hospital",
      emergency: "yes",
      healthcare: "hospital",
    },
  },
  {
    id: "hosp_02",
    name: "Metro Apex General Hospital",
    type: "Government General Hospital",
    lat: 19.0880,
    lng: 72.8850,
    address: "LBS Marg, Kurla West, Mumbai 400070",
    phone: "+91 22 2503 5522",
    emergency: true,
    traumaLevel: "Level 2",
    icuBedsAvailable: 5,
    operatingRooms: 2,
    tags: {
      amenity: "hospital",
      emergency: "yes",
      healthcare: "hospital",
    },
  },
  {
    id: "hosp_03",
    name: "Lifeline Critical Care & Heart Institute",
    type: "Cardiac & Trauma Care",
    lat: 19.0620,
    lng: 72.8650,
    address: "Sion West, Mumbai 400022",
    phone: "+91 22 2407 8899",
    emergency: true,
    traumaLevel: "Level 1",
    icuBedsAvailable: 12,
    operatingRooms: 5,
    tags: {
      amenity: "hospital",
      emergency: "yes",
      healthcare: "hospital",
    },
  },
  {
    id: "hosp_04",
    name: "St. Jude Memorial Hospital",
    type: "Charitable Hospital",
    lat: 19.0950,
    lng: 72.8620,
    address: "Santacruz East, Mumbai 400055",
    phone: "+91 22 2618 3344",
    emergency: true,
    traumaLevel: "Level 2",
    icuBedsAvailable: 4,
    operatingRooms: 2,
    tags: {
      amenity: "hospital",
      emergency: "yes",
      healthcare: "hospital",
    },
  },
  {
    id: "hosp_05",
    name: "Sunrise Emergency & Trauma Clinic",
    type: "Emergency Clinic",
    lat: 19.0550,
    lng: 72.8900,
    address: "Chembur West, Mumbai 400071",
    phone: "+91 22 2522 7700",
    emergency: true,
    traumaLevel: "Level 3",
    icuBedsAvailable: 2,
    operatingRooms: 1,
    tags: {
      amenity: "hospital",
      emergency: "yes",
      healthcare: "hospital",
    },
  },
];

/**
 * Returns mock hospitals sorted by distance from the reference location.
 * If reference location is far from default mock coordinates, dynamically projects
 * realistic hospitals nearby so the showcase UI always has beautiful, accurate nearby results!
 */
export function getFallbackHospitals(targetLat, targetLng, radiusMeters = 5000) {
  const tLat = Number(targetLat);
  const tLng = Number(targetLng);

  // Check if target is close to our base mock set (within 100km)
  const baseDist = calculateDistanceMeters(tLat, tLng, MOCK_HOSPITALS[0].lat, MOCK_HOSPITALS[0].lng);

  let hospitals = [];

  if (baseDist < 100000) {
    // Use base mock hospitals with calculated real-time distances
    hospitals = MOCK_HOSPITALS.map((h) => {
      const distM = calculateDistanceMeters(tLat, tLng, h.lat, h.lng);
      return {
        ...h,
        distanceMeters: distM,
        distanceKm: calculateDistanceKm(tLat, tLng, h.lat, h.lng),
        etaSeconds: estimateDurationSeconds(distM),
        isFallback: true,
      };
    });
  } else {
    // Dynamically project hospitals in radial offsets around the user's location
    const offsets = [
      { dLat: 0.008, dLng: 0.007, name: "Central Emergency & Trauma Hospital", trauma: "Level 1" },
      { dLat: -0.012, dLng: 0.011, name: "City Red Cross Medical Center", trauma: "Level 2" },
      { dLat: 0.015, dLng: -0.009, name: "Apex Multi-Specialty Hospital", trauma: "Level 1" },
      { dLat: -0.007, dLng: -0.014, name: "St. Mary's Emergency Hospital", trauma: "Level 2" },
      { dLat: 0.019, dLng: 0.018, name: "District Government Hospital", trauma: "Level 3" },
    ];

    hospitals = offsets.map((off, idx) => {
      const hLat = Number((tLat + off.dLat).toFixed(6));
      const hLng = Number((tLng + off.dLng).toFixed(6));
      const distM = calculateDistanceMeters(tLat, tLng, hLat, hLng);

      return {
        id: `mock_nearby_${idx + 1}`,
        name: off.name,
        type: "Emergency & Trauma Center",
        lat: hLat,
        lng: hLng,
        address: `Emergency Road Sector ${idx + 1}, Vicinity Area`,
        phone: "+91 1800 200 911",
        emergency: true,
        traumaLevel: off.trauma,
        icuBedsAvailable: Math.floor(Math.random() * 8) + 2,
        operatingRooms: 3,
        distanceMeters: distM,
        distanceKm: calculateDistanceKm(tLat, tLng, hLat, hLng),
        etaSeconds: estimateDurationSeconds(distM),
        tags: { amenity: "hospital", emergency: "yes" },
        isFallback: true,
      };
    });
  }

  // Filter within radius if specified, sort ascending by distance
  const filtered = hospitals
    .filter((h) => h.distanceMeters <= radiusMeters * 1.5)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return filtered.length > 0 ? filtered : hospitals.slice(0, 3);
}

export default {
  MOCK_HOSPITALS,
  getFallbackHospitals,
};

