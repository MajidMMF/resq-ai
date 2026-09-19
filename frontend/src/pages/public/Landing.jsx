import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MapContainer from "../../components/maps/MapContainer";
import AmbulanceMarker from "../../components/maps/AmbulanceMarker";
import HospitalMarker from "../../components/maps/HospitalMarker";
import UserMarker from "../../components/maps/UserMarker";
import RoutePolyline from "../../components/maps/RoutePolyline";
import {
  ShieldAlert,
  Bot,
  Truck,
  Hospital,
  Zap,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Activity,
  HeartPulse,
  Radio,
  Lock,
  Compass,
  AlertTriangle,
  Play,
  Flame,
  Volume2,
} from "lucide-react";

export const Landing = () => {
  // Default fallback coordinates: Hyderabad Regional Hub (Charminar / Osmania General Hospital)
  const DEFAULT_SCENE = [17.385, 78.4867];
  const DEFAULT_HOSPITAL = [17.379, 78.476];

  const [scenePos, setScenePos] = useState(DEFAULT_SCENE);
  const [hospitalPos, setHospitalPos] = useState(DEFAULT_HOSPITAL);
  const [hospitalName, setHospitalName] = useState("Osmania Apex Trauma Center");
  const [isVisitorLocation, setIsVisitorLocation] = useState(false);
  const [roadPath, setRoadPath] = useState([]);
  const [ambPos, setAmbPos] = useState([DEFAULT_SCENE[0] + 0.012, DEFAULT_SCENE[1] + 0.01]);
  const [telemetry, setTelemetry] = useState({
    speed: 58,
    distanceKm: "1.8 km",
    eta: "3.5 mins",
    status: "EN ROUTE TO SCENE",
  });

  // 1. Detect visitor live geolocation (fallback to Hyderabad on error or denial)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          const userCoords = [lat, lng];
          const hospCoords = [
            Number((lat - 0.014).toFixed(5)),
            Number((lng - 0.012).toFixed(5)),
          ];
          setScenePos(userCoords);
          setHospitalPos(hospCoords);
          setHospitalName("Regional Emergency Trauma Hospital");
          setIsVisitorLocation(true);
        },
        (err) => {
          console.log("Visitor location denied or unavailable, using Hyderabad default:", err.message);
          setScenePos(DEFAULT_SCENE);
          setHospitalPos(DEFAULT_HOSPITAL);
          setHospitalName("Osmania Apex Trauma Center");
          setIsVisitorLocation(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, []);

  // 2. Fetch turn-by-turn road route via free OSRM driving engine
  useEffect(() => {
    let isCancelled = false;

    async function loadRoadRoute() {
      const ambStart = [
        Number((scenePos[0] + 0.013).toFixed(5)),
        Number((scenePos[1] + 0.011).toFixed(5)),
      ];

      const fetchSegment = async (start, end) => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data?.routes?.[0]?.geometry?.coordinates) {
            // OSRM returns [lng, lat] -> Leaflet uses [lat, lng]
            return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          }
        } catch (e) {
          console.warn("OSRM road routing fallback:", e.message);
        }
        // Fallback: 12 interpolated points along road line if OSRM takes too long
        const fallback = [];
        for (let i = 0; i <= 12; i++) {
          const t = i / 12;
          fallback.push([
            Number((start[0] + (end[0] - start[0]) * t).toFixed(5)),
            Number((start[1] + (end[1] - start[1]) * t).toFixed(5)),
          ]);
        }
        return fallback;
      };

      // Segment 1: Ambulance starting depot to Scene (following streets)
      const toScene = await fetchSegment(ambStart, scenePos);
      // Segment 2: Scene to Destination Hospital (following streets)
      const toHospital = await fetchSegment(scenePos, hospitalPos);

      if (!isCancelled) {
        const fullRoadPath = [...toScene, ...toHospital];
        setRoadPath(fullRoadPath);
        if (fullRoadPath.length > 0) {
          setAmbPos(fullRoadPath[0]);
        }
      }
    }

    loadRoadRoute();

    return () => {
      isCancelled = true;
    };
  }, [scenePos, hospitalPos]);

  // 3. Smooth street-by-street realistic movement along the road coordinates
  useEffect(() => {
    if (!roadPath || roadPath.length === 0) return;

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step >= roadPath.length) {
        step = 0;
      }

      const nextPos = roadPath[step];
      setAmbPos(nextPos);

      const remainingSteps = roadPath.length - step;
      const progressFraction = step / roadPath.length;
      const estDist = ((remainingSteps / roadPath.length) * 3.2).toFixed(1);
      const estEta = Math.max(0.5, estDist * 1.4).toFixed(1);
      const dynSpeed = Math.floor(46 + Math.random() * 18);

      const statusText = progressFraction < 0.5 ? "EN ROUTE TO SCENE" : "TRANSPORTING TO ER";

      setTelemetry({
        speed: dynSpeed,
        distanceKm: estDist > 0 ? `${estDist} km` : "Arrived",
        eta: estDist > 0 ? `${estEta} mins` : "On Scene",
        status: statusText,
      });
    }, 750);

    return () => clearInterval(interval);
  }, [roadPath]);

  return (
    <div className="flex-1 flex flex-col space-y-24 py-12 sm:py-16">
      {/* ────────────────────────────────────────────────────────
          1. HERO SECTION
          ──────────────────────────────────────────────────────── */}
      <section className="px-4 text-center max-w-5xl mx-auto space-y-6">
        {/* Status Chip */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-emergency-500/10 border border-emergency-500/25 text-emergency-400 text-xs font-mono font-bold shadow-lg shadow-emergency-950/30">
          <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping" />
          <span>AUTONOMOUS EMERGENCY TRIAGE & FLEET GRID</span>
        </div>

        {/* Catchy Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
          Saving Lives in the <br />
          <span className="bg-gradient-to-r from-emergency-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
            Golden Hour of Trauma
          </span>
        </h1>

        {/* Subtitle / Value Proposition */}
        <p className="text-base sm:text-lg text-dark-300 max-w-3xl mx-auto leading-relaxed font-normal">
          In severe accidents, the first 60 minutes determine survival. 
          <strong className="text-white font-semibold"> ResQ AI</strong> replaces manual 108/112 phone queues with 
          instant AI triage, live GPS ambulance telematics, and automated hospital ICU bed reservation.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emergency-600 to-emergency-500 hover:from-emergency-500 hover:to-emergency-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-emergency-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Report Accident / Register Free</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-dark-900/90 hover:bg-dark-800 border border-dark-700 hover:border-dark-600 text-dark-200 hover:text-white font-bold text-sm transition transform active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Operator & Driver Login</span>
          </Link>
        </div>

        {/* Quick Metric Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
            <span className="text-[10px] uppercase font-mono text-dark-400 block">AI Triage Speed</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">&lt; 3 Seconds</span>
          </div>
          <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
            <span className="text-[10px] uppercase font-mono text-dark-400 block">Dispatch Latency</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">Zero Operator Lag</span>
          </div>
          <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
            <span className="text-[10px] uppercase font-mono text-dark-400 block">Verification Security</span>
            <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono">4-Digit OTP</span>
          </div>
          <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
            <span className="text-[10px] uppercase font-mono text-dark-400 block">Network Coverage</span>
            <span className="text-xl sm:text-2xl font-black text-emergency-400 font-mono">24/7 Realtime</span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          2. INTERACTIVE LIVE TELEMETRY RADAR SHOWCASE (WOW FACTOR)
          ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 w-full space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-dark-900/90 border-2 border-emergency-500/40 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-emergency-400 uppercase tracking-widest">
                  LIVE INTERACTIVE DISPATCH HUD
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Real-Time Geospatial Coordination
              </h2>
              <p className="text-xs text-dark-400 mt-1 max-w-xl">
                Experience how ResQ connects accident victim coordinates, nearest moving ambulance, and Level-1 trauma surgical centers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-700 text-cyan-400 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {isVisitorLocation ? "LIVE: YOUR LOCATION" : "HYDERABAD HUB"}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-700 text-cyan-400 font-bold">
                ETA: {telemetry.eta}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emergency-500/10 border border-emergency-500/30 text-emergency-400 font-bold">
                CRITICAL TIER 1
              </span>
            </div>
          </div>

          {/* Interactive Map HUD */}
          <div className="h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-dark-700 relative">
            <MapContainer
              center={scenePos}
              zoom={13}
              bounds={roadPath.length > 0 ? [scenePos, hospitalPos, ambPos] : [scenePos, hospitalPos]}
              className="w-full h-full"
            >
              <UserMarker
                position={scenePos}
                label={isVisitorLocation ? "Your Detected Location (Incident Scene)" : "Accident Scene (Victim Coordinates)"}
              />
              <AmbulanceMarker
                position={ambPos}
                plateNumber="TS-09-EM-108 (ALS)"
                speed={telemetry.speed}
                eta={telemetry.eta}
              />
              <HospitalMarker
                position={hospitalPos}
                name={hospitalName}
                traumaLevel="LEVEL_1"
                bedsAvailable={5}
              />
              {roadPath.length > 0 ? (
                <RoutePolyline positions={roadPath} color="#22D3EE" />
              ) : (
                <RoutePolyline positions={[hospitalPos, ambPos, scenePos]} color="#22D3EE" />
              )}
            </MapContainer>

            {/* Floating Live Telemetry Panel */}
            <div className="absolute top-4 left-4 z-[400] max-w-xs p-3.5 rounded-2xl bg-dark-950/85 backdrop-blur-md border border-dark-700 text-xs font-mono space-y-1.5 shadow-xl hidden sm:block">
              <div className="flex items-center justify-between text-dark-400">
                <span>AMBULANCE SPEED</span>
                <span className="text-white font-bold">{telemetry.speed} km/h</span>
              </div>
              <div className="flex items-center justify-between text-dark-400">
                <span>REMAINING DISTANCE</span>
                <span className="text-cyan-400 font-bold">{telemetry.distanceKm}</span>
              </div>
              <div className="flex items-center justify-between text-dark-400">
                <span>DISPATCH STATUS</span>
                <span className="text-emergency-400 font-bold">{telemetry.status}</span>
              </div>
              <div className="flex items-center justify-between text-dark-400">
                <span>ICU BEDS PRE-ALLOCATED</span>
                <span className="text-emerald-400 font-bold">Bay 01 Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          3. WHY TRADITIONAL SYSTEMS FAIL VS RESQ AI (COMPARISON)
          ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 w-full space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold text-emergency-400 uppercase tracking-widest">
            THE CRITICAL DIFFERENCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Traditional Emergency Calls vs. ResQ AI
          </h2>
          <p className="text-xs sm:text-sm text-dark-400 max-w-xl mx-auto">
            Minutes lost in telephone queues cost lives. Here is how ResQ changes the game.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Traditional Way */}
          <div className="p-7 rounded-2xl bg-dark-900/60 border border-dark-800 space-y-4 relative">
            <div className="flex items-center space-x-2 text-emergency-400 font-mono font-bold text-xs uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Old / Traditional Emergency Calling (108 / 112)</span>
            </div>

            <ul className="space-y-3 text-xs text-dark-400 font-mono">
              <li className="p-3 rounded-xl bg-dark-950/60 border border-dark-800 flex items-start space-x-3">
                <span className="text-emergency-500 font-bold">✗</span>
                <span>Panicked callers struggle to explain complex landmarks over bad phone lines.</span>
              </li>
              <li className="p-3 rounded-xl bg-dark-950/60 border border-dark-800 flex items-start space-x-3">
                <span className="text-emergency-500 font-bold">✗</span>
                <span>Manual dispatch queues create a 7–15 minute delay before an ambulance is rolled out.</span>
              </li>
              <li className="p-3 rounded-xl bg-dark-950/60 border border-dark-800 flex items-start space-x-3">
                <span className="text-emergency-500 font-bold">✗</span>
                <span>Ambulances arrive at hospitals unannounced only to find zero ICU beds or blood available.</span>
              </li>
              <li className="p-3 rounded-xl bg-dark-950/60 border border-dark-800 flex items-start space-x-3">
                <span className="text-emergency-500 font-bold">✗</span>
                <span>No first-aid guidance for bystanders while waiting for help to arrive.</span>
              </li>
            </ul>
          </div>

          {/* ResQ AI Modern Way */}
          <div className="p-7 rounded-2xl bg-gradient-to-br from-dark-900 to-dark-950 border-2 border-emerald-500/40 space-y-4 shadow-xl shadow-emerald-950/20">
            <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-xs uppercase">
              <Sparkles className="w-4 h-4" />
              <span>ResQ Autonomous AI Emergency Grid</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 font-mono">
              <li className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-start space-x-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Instant GPS auto-lock transmits pinpoint coordinates with zero room for human error.</span>
              </li>
              <li className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-start space-x-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Sub-3-second AI severity triage assigns the closest Advanced Life Support (ALS) vehicle.</span>
              </li>
              <li className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-start space-x-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Hospital trauma staff receives pre-arrival vitals and pre-allocates an ICU bay in advance.</span>
              </li>
              <li className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-start space-x-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Interactive AI Medical Copilot coaches bystanders through CPR and bleed-stanching.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          4. 4-STEP END-TO-END AUTOMATION PIPELINE
          ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            THE RESQ WORKFLOW
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Four Steps to a Saved Life
          </h2>
          <p className="text-xs sm:text-sm text-dark-400 max-w-xl mx-auto">
            From the instant a distress alarm is triggered to the operating theater, every millisecond is orchestrated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-dark-900/80 border border-dark-700/80 space-y-4 hover:border-emergency-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-emergency-600/15 border border-emergency-500/30 flex items-center justify-center text-emergency-400 font-black text-lg">
              01
            </div>
            <h3 className="text-lg font-bold text-white">One-Tap SOS Report</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              Bystanders upload photos or voice descriptions. Device GPS instantly pinpoints accident coordinates.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-dark-900/80 border border-dark-700/80 space-y-4 hover:border-cyan-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-lg">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Instant AI Triage</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              Gemini models classify severity into Critical Tier 1, High, or Moderate and generate immediate CPR guidance.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-dark-900/80 border border-dark-700/80 space-y-4 hover:border-amber-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Smart Ambulance Dispatch</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              Closest ALS unit receives route telemetry and verifies patient pickup with a secure 4-digit arrival OTP.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl bg-dark-900/80 border border-dark-700/80 space-y-4 hover:border-emerald-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
              04
            </div>
            <h3 className="text-lg font-bold text-white">Hospital Pre-Admission</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              Trauma ER surgeons prep surgical bays, calibrate ventilators, and ready matching blood before arrival.
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          5. THREE-ROLE INTEGRATED ECOSYSTEM
          ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold text-emergency-400 uppercase tracking-widest">
            3-ROLE UNIFIED PORTAL
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Built for Everyone in the Lifesaving Chain
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Citizen */}
          <div className="p-7 rounded-2xl bg-gradient-to-b from-dark-900 to-dark-950 border border-dark-700 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Citizens & Bystanders</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              One-tap emergency SOS, real-time incoming ambulance ETA radar, and 
              voice-enabled Medical Copilot for immediate wound care.
            </p>
            <ul className="text-xs text-dark-400 space-y-2 pt-2 font-mono">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Live GPS location pin</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Real-time ETA & routing tracker</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Step-by-step CPR audio coach</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Driver */}
          <div className="p-7 rounded-2xl bg-gradient-to-b from-dark-900 to-dark-950 border border-dark-700 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Ambulance Paramedics</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              Night-mode driver console, automated callout siren alerts, Turn-by-Turn Google Maps HUD, and 4-digit arrival OTP.
            </p>
            <ul className="text-xs text-dark-400 space-y-2 pt-2 font-mono">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant dispatch siren audio</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Continuous background GPS stream</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Direct caller telephone link</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Hospital */}
          <div className="p-7 rounded-2xl bg-gradient-to-b from-dark-900 to-dark-950 border border-dark-700 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emergency-500/10 border border-emergency-500/30 flex items-center justify-center text-emergency-400">
              <Hospital className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Hospital Trauma Staff</h3>
            <p className="text-xs text-dark-300 leading-relaxed">
              Inbound patient radar, dynamic ICU & ventilator counters, and pre-arrival trauma bay allocation deck.
            </p>
            <ul className="text-xs text-dark-400 space-y-2 pt-2 font-mono">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Live ICU & ventilator counters</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pre-arrival patient triage telemetry</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Bay readiness confirmation broadcast</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          6. BOTTOM CALL TO ACTION
          ──────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emergency-950/80 via-dark-900 to-dark-900 border-2 border-emergency-500/50 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-emergency-600/20 border border-emergency-500/40 flex items-center justify-center text-emergency-400 mx-auto">
            <HeartPulse className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Be Prepared Before an Emergency Strikes
          </h2>

          <p className="text-xs sm:text-sm text-dark-300 max-w-xl mx-auto">
            Every second counts in an emergency. Join ResQ AI today to report incidents or integrate your fleet into our dispatch grid.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-emergency-600 hover:bg-emergency-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emergency-600/30 transition"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-200 hover:text-white font-bold text-xs uppercase tracking-wider transition"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
