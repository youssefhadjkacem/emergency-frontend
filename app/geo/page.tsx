"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Navigation,
  Clock,
  Car,
  Phone,
  Star,
  ChevronLeft,
  ShieldPlus,
  Loader2,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

const C = {
  dark: "#212E53",
  teal: "#18534F",
  mid: "#226D68",
  light: "#ECF8F6",
};

// ── Mock doctors with coordinates around Tunis ────────────────────────────────
const MOCK_DOCTORS = [
  {
    id: 1,
    name: "Dr. Sami Belhaj",
    specialty: "Médecine générale",
    lat: 36.818,
    lng: 10.1658,
    rating: 4.9,
    reviews: 312,
    distance: null,
    duration: null,
    cost: 40,
    waitDays: 0,
    available: true,
    address: "8 Rue de Marseille, Tunis Centre",
    phone: "+216 71 123 456",
    badge: "Urgences acceptées",
  },
  {
    id: 2,
    name: "Dr. Leila Mansour",
    specialty: "Cardiologie",
    lat: 36.832,
    lng: 10.182,
    rating: 4.7,
    reviews: 198,
    distance: null,
    duration: null,
    cost: 80,
    waitDays: 1,
    available: true,
    address: "Clinique El Manar, La Marsa",
    phone: "+216 71 234 567",
    badge: "Spécialiste certifiée",
  },
  {
    id: 3,
    name: "Dr. Karim Trabelsi",
    specialty: "Pneumologie",
    lat: 36.806,
    lng: 10.18,
    rating: 4.5,
    reviews: 87,
    distance: null,
    duration: null,
    cost: 60,
    waitDays: 2,
    available: false,
    address: "12 Avenue Habib Bourguiba, Tunis",
    phone: "+216 71 345 678",
    badge: null,
  },
  {
    id: 4,
    name: "Dr. Nadia Gharbi",
    specialty: "Médecine interne",
    lat: 36.84,
    lng: 10.155,
    rating: 4.8,
    reviews: 245,
    distance: null,
    duration: null,
    cost: 55,
    waitDays: 0,
    available: true,
    address: "Polyclinique Taoufik, Ariana",
    phone: "+216 71 456 789",
    badge: "Consultation rapide",
  },
] as const;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SortKey = "distance" | "rating" | "cost" | "wait";
type Doctor = Omit<typeof MOCK_DOCTORS[number], 'distance' | 'duration'> & { distance: number | null; duration: number | null };

export default function GeoPage() {
  const router = useRouter();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>(
    MOCK_DOCTORS.map((d) => ({ ...d, distance: null, duration: null }))
  );
  const [sortBy, setSortBy] = useState<SortKey>("distance");
  const [selected, setSelected] = useState<number | null>(null);
  const [animIn, setAnimIn] = useState<boolean>(false);

  // Animation-in effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimIn(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Compute distances when location changes
  useEffect(() => {
    if (userLat === null || userLng === null) return;

    const updated = MOCK_DOCTORS.map((d) => ({
      ...d,
      distance: Math.round(haversine(userLat, userLng, d.lat, d.lng) * 10) / 10,
      duration: Math.round(haversine(userLat, userLng, d.lat, d.lng) * 3 + 2),
    }));

    setDoctors(updated);
  }, [userLat, userLng]);

  const locate = () => {
    setLocating(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Géolocalisation non supportée.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);

        // Reverse geocode (OpenStreetMap)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
            { headers: { "Accept-Language": "fr" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.state_district ||
            "Votre position";
          setCity(city);
        } catch (err) {
          console.error("Reverse geocode error:", err);
          setCity("Votre position");
        }
        setLocating(false);
      },
      (err) => {
        setLocError("Accès refusé / erreur GPS.");
        setLocating(false);
        console.error("Geolocation error:", err);
      }
    );
  };

  // Sort doctors
  const sorted = [...doctors].sort((a, b) => {
    if (sortBy === "distance") return (a.distance ?? 999) - (b.distance ?? 999);
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "cost") return a.cost - b.cost;
    if (sortBy === "wait") return a.waitDays - b.waitDays;
    return 0;
  });

  const selectedDoc = doctors.find((d) => d.id === selected);

  return (
    <main
      className="min-h-screen"
      style={{ background: "#F0F4F8", fontFamily: "'Georgia', serif" }}
    >
      {/* Navbar */}
      <nav
        style={{ background: C.dark }}
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            style={{ color: "rgba(236,248,246,0.5)" }}
            className="hover:opacity-100 transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            <ChevronLeft size={20} />
          </button>
          <ShieldPlus size={18} color={C.light} />
          <span style={{ color: C.light }} className="font-bold tracking-tight">
            Médecins à proximité
          </span>
        </div>
        <div
          style={{ background: "rgba(236,248,246,0.1)", color: C.light }}
          className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Google Maps API
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">
        {/* ── Location hero ── */}
        <div
          className="rounded-3xl p-7 relative overflow-hidden transition-all duration-700"
          style={{
            background: userLat
              ? `linear-gradient(135deg, ${C.dark}, ${C.teal})`
              : C.dark,
            opacity: animIn ? 1 : 0,
            transform: animIn ? "translateY(0)" : "translateY(20px)",
          }}
        >
          {/* Decorative rings */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full border opacity-10"
            style={{ borderColor: C.light, transform: "translate(30%, -30%)" }}
          />
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full border opacity-10"
            style={{ borderColor: C.light, transform: "translate(20%, -20%)" }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} color="rgba(236,248,246,0.6)" />
              <span
                style={{ color: "rgba(236,248,246,0.6)" }}
                className="text-xs font-semibold uppercase tracking-widest"
              >
                Géolocalisation temps réel
              </span>
            </div>

            {userLat ? (
              <>
                <h2 style={{ color: C.light }} className="text-2xl font-bold mb-1">
                  {city || "Position détectée"}
                </h2>
                <p
                  style={{ color: "rgba(236,248,246,0.55)" }}
                  className="text-sm mb-5"
                >
                  {userLat.toFixed(4)}° N, {userLng && userLng.toFixed(4)}° E — Précision GPS activée
                </p>
                <div className="flex flex-wrap gap-3">
                  <div
                    style={{ background: "rgba(236,248,246,0.12)", color: C.light }}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-full font-medium"
                  >
                    <CheckCircle2 size={12} color="#4ADE80" />
                    Distance calculée
                  </div>
                  <div
                    style={{ background: "rgba(236,248,246,0.12)", color: C.light }}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-full font-medium"
                  >
                    <Car size={12} />
                    Temps de trajet estimé
                  </div>
                  <div
                    style={{ background: "rgba(236,248,246,0.12)", color: C.light }}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-full font-medium"
                  >
                    <Zap size={12} color="#FBBF24" />
                    Tri optimisé NSGA-II
                  </div>
                </div>
                <button
                  onClick={locate}
                  style={{ color: "rgba(236,248,246,0.4)" }}
                  className="text-xs mt-4 flex items-center gap-1 hover:opacity-70 transition"
                >
                  <RefreshCw size={10} /> Actualiser la position
                </button>
              </>
            ) : (
              <>
                <h2 style={{ color: C.light }} className="text-2xl font-bold mb-2">
                  Trouvez le médecin le plus proche
                </h2>
                <p
                  style={{ color: "rgba(236,248,246,0.55)" }}
                  className="text-sm mb-6"
                >
                  Activez la géolocalisation pour calculer les distances en temps réel
                  et trier les médecins par proximité.
                </p>
                {locError && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-red-300">
                    <AlertTriangle size={12} /> {locError}
                  </div>
                )}
                <button
                  onClick={locate}
                  disabled={locating}
                  style={{ background: C.light, color: C.dark }}
                  className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {locating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Localisation en cours...
                    </>
                  ) : (
                    <>
                      <Navigation size={16} /> Activer la géolocalisation
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Map placeholder ── */}
        <div
          style={{ background: "white" }}
          className="rounded-2xl overflow-hidden shadow-sm"
        >
          <div
            className="relative"
            style={{ height: 220 }}
          >
            {/* Fake map background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #e8f0e8 0%, #d4e4d4 50%, #c8dcc8 100%)",
              }}
            >
              {/* Grid lines */}
              <svg className="absolute inset-0 w-full h-full opacity-30">
                {[...Array(8)].map((_, i) => (
                  <line
                    key={`h${i}`}
                    x1="0"
                    y1={`${i * 14.28}%`}
                    x2="100%"
                    y2={`${i * 14.28}%`}
                    stroke="#18534F"
                    strokeWidth="0.5"
                  />
                ))}
                {[...Array(10)].map((_, i) => (
                  <line
                    key={`v${i}`}
                    x1={`${i * 11.11}%`}
                    y1="0"
                    x2={`${i * 11.11}%`}
                    y2="100%"
                    stroke="#18534F"
                    strokeWidth="0.5"
                  />
                ))}
              </svg>

              {/* Fake roads */}
              <svg className="absolute inset-0 w-full h-full">
                <path
                  d="M 0 110 Q 200 90 400 120 T 800 100"
                  stroke="white"
                  strokeWidth="6"
                  fill="none"
                  opacity="0.8"
                />
                <path
                  d="M 0 110 Q 200 90 400 120 T 800 100"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.6"
                />
                <path
                  d="M 150 0 Q 180 110 160 220"
                  stroke="white"
                  strokeWidth="5"
                  fill="none"
                  opacity="0.7"
                />
                <path
                  d="M 350 0 Q 370 110 340 220"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.6"
                />
                <path
                  d="M 0 160 Q 300 150 600 170 T 900 155"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.5"
                />
              </svg>

 {/* Doctor pins */}
{sorted.map((doc, i) => {
  const positions = [
    { left: "52%", top: "35%" },
    { left: "68%", top: "20%" },
    { left: "38%", top: "62%" },
    { left: "72%", top: "58%" },
  ];

  const pos = positions[i % positions.length];
  const isSelected = selected === doc.id;

  return (
    <button
      key={doc.id}
      onClick={() => setSelected(isSelected ? null : doc.id)}
      className="absolute transition-all duration-200 hover:scale-110"
      style={{
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div
        style={{
          background: isSelected
            ? C.dark
            : i === 0 && sortBy === "distance"
            ? C.teal
            : "white",
          color:
            isSelected || (i === 0 && sortBy === "distance")
              ? "white"
              : C.dark,
          border: `2px solid ${isSelected ? C.dark : C.teal}`,
          boxShadow: isSelected
            ? `0 4px 20px rgba(33,46,83,0.4)`
            : `0 2px 8px rgba(0,0,0,0.15)`,
        }}
        className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      >
        {doc.name.split(" ")[1]}
        {doc.distance !== null && ` · ${doc.distance}km`}
      </div>

      {/* Pin tail */}
      <div
        className="mx-auto w-0.5 h-2"
        style={{ background: isSelected ? C.dark : C.teal }}
      />
    </button>
  );
})}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}