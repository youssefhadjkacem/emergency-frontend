"use client";

  import { useEffect, useState } from "react";
  import { useRouter } from "next/navigation";
  import {
    ShieldPlus, ChevronLeft, AlertTriangle, CheckCircle2,
    Stethoscope, User, Mic, ImageOff, RefreshCw, Activity,
    MapPin, Clock, DollarSign, Star, Filter, ChevronDown,
    Heart, Zap, Award, TrendingUp, Navigation
  } from "lucide-react";
  import { AnalysisResult } from "@/lib/api";

  const C = { dark: "#212E53", teal: "#18534F", mid: "#226D68", light: "#ECF8F6" };

  const riskConfig = (level: string) => {
    switch (level.toUpperCase()) {
      case "CRITICAL": return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", label: "Critique", dot: "#DC2626" };
      case "HIGH":     return { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA", label: "Élevé", dot: "#EA580C" };
      case "MEDIUM":   return { bg: "#FEFCE8", text: "#CA8A04", border: "#FEF08A", label: "Modéré", dot: "#CA8A04" };
      case "LOW":      return { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0", label: "Faible", dot: "#16A34A" };
      default:         return { bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB", label: "Inconnu", dot: "#6B7280" };
    }
  };

  type SortKey = "score" | "name";

  export default function ResultatsPage() {
    const router = useRouter();
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [sortBy, setSortBy] = useState<SortKey>("score");
    const [showAll, setShowAll] = useState(false);
    const [activeTab, setActiveTab] = useState<"specialties" | "details">("specialties");

    useEffect(() => {
      const raw = sessionStorage.getItem("analysisResult");
      if (!raw) { router.push("/analyse"); return; }
      setResult(JSON.parse(raw));
    }, [router]);

    if (!result) return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.light }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: C.teal, borderTopColor: "transparent" }} />
          <span style={{ color: C.mid }} className="text-sm">Chargement des résultats...</span>
        </div>
      </div>
    );

    const hasWound = result.wound_conditions?.length > 0;
    const hasSpecialties = result.recommended_specialties?.length > 0;
    const risk = riskConfig(result.risk_level);

    const sorted = [...(result.recommended_specialties || [])].sort((a, b) =>
      sortBy === "score" ? b.score - a.score : a.specialty.localeCompare(b.specialty)
    );
    const displayed = showAll ? sorted : sorted.slice(0, 3);
    const topSpecialty = sorted[0]?.specialty || null;

    return (
      <main className="min-h-screen" style={{ background: "#F0F4F8" }}>

        {/* Navbar */}
        <nav style={{ background: C.dark }} className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/analyse")} style={{ color: "rgba(236,248,246,0.5)" }}
              className="hover:opacity-100 transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
              <ChevronLeft size={20} />
            </button>
            <ShieldPlus size={18} color={C.light} />
            <span style={{ color: C.light }} className="font-bold tracking-tight">Résultats</span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem("analysisResult"); router.push("/analyse"); }}
            style={{ color: "rgba(236,248,246,0.8)", border: "1px solid rgba(236,248,246,0.2)" }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <RefreshCw size={12} />
            Nouvelle analyse
          </button>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">

          {/* ── Hero result card ── */}
          <div style={{ background: result.auto_urgent ? "#FEF2F2" : C.dark }}
            className="rounded-3xl p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
              style={{ background: result.auto_urgent ? "#DC2626" : C.teal, transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
              style={{ background: result.auto_urgent ? "#DC2626" : C.mid, transform: "translate(-30%, 30%)" }} />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {result.auto_urgent
                    ? <AlertTriangle size={20} color="#DC2626" />
                    : <CheckCircle2 size={20} color="#4ADE80" />}
                  <span style={{ color: result.auto_urgent ? "#DC2626" : "#4ADE80" }}
                    className="font-bold text-sm">
                    {result.auto_urgent ? "Situation urgente" : "Analyse terminée"}
                  </span>
                </div>
                <span style={{
                  background: result.auto_urgent ? "#DC2626" : "rgba(236,248,246,0.15)",
                  color: result.auto_urgent ? "white" : C.light
                }} className="text-xs font-semibold px-3 py-1 rounded-full">
                  {result.age_group === "child" ? "Enfant" : result.age_group === "senior" ? "Senior" : "Adulte"}
                </span>
              </div>

              <h1 style={{ color: result.auto_urgent ? "#991B1B" : C.light }}
                className="text-2xl font-bold mb-2">
                {result.auto_urgent
                  ? "Consultez un médecin immédiatement"
                  : "Voici vos recommandations"}
              </h1>

              {result.auto_urgent && (
                <p style={{ color: "#DC2626" }} className="text-sm mb-4">
                  Appelez le <strong>190</strong> ou rendez-vous aux urgences.
                </p>
              )}

              {result.detected_symptoms?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.detected_symptoms.map((s, i) => (
                    <span key={i} style={{
                      background: result.auto_urgent ? "rgba(220,38,38,0.1)" : "rgba(236,248,246,0.12)",
                      color: result.auto_urgent ? "#DC2626" : C.light,
                      border: result.auto_urgent ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(236,248,246,0.15)"
                    }} className="text-xs px-3 py-1 rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {topSpecialty && (
                <div className="flex items-center gap-2 mt-4">
                  <Stethoscope size={14} color={result.auto_urgent ? "#DC2626" : "rgba(236,248,246,0.6)"} />
                  <span style={{ color: result.auto_urgent ? "#991B1B" : "rgba(236,248,246,0.7)" }} className="text-sm">
                    Spécialité principale :
                  </span>
                  <span style={{ color: result.auto_urgent ? "#DC2626" : C.light }} className="text-sm font-bold">
                    {topSpecialty}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Find Nearby Doctors CTA ── */}
          <button
            onClick={() => router.push("/geo")}
            className="rounded-2xl p-5 shadow-sm flex items-center justify-between group transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${C.teal}, ${C.mid})`,
              border: "none",
              cursor: "pointer",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(236,248,246,0.15)" }}
              >
                <MapPin size={20} color={C.light} />
              </div>
              <div className="text-left">
                <p style={{ color: C.light }} className="font-bold text-sm">
                  Trouver un médecin à proximité
                </p>
                <p style={{ color: "rgba(236,248,246,0.65)" }} className="text-xs mt-0.5">
                  Distances en temps réel · Tri optimisé
                </p>
              </div>
            </div>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:translate-x-1"
              style={{ background: "rgba(236,248,246,0.15)" }}
            >
              <Navigation size={15} color={C.light} />
            </div>
          </button>

          {/* ── Transcript ── */}
          <div style={{ background: "white" }} className="rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Mic size={15} color={C.mid} />
              <span style={{ color: C.dark }} className="font-bold text-sm">Transcription vocale</span>
            </div>
            <p style={{ background: C.light, color: C.dark, borderLeft: `3px solid ${C.mid}` }}
              className="text-sm leading-relaxed rounded-xl px-4 py-3 italic">
              &ldquo;{result.transcript || "Aucune transcription disponible"}&rdquo;
            </p>
          </div>

          {/* ── Wound detection ── */}
          {(hasWound || result.annotated_image) && (
            <div style={{ background: "white" }} className="rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={15} color={C.mid} />
                <span style={{ color: C.dark }} className="font-bold text-sm">Détection visuelle</span>
                {hasWound && (
                  <span style={{ background: risk.bg, color: risk.text, border: `1px solid ${risk.border}` }}
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full ml-auto">
                    Risque {risk.label}
                  </span>
                )}
              </div>
              {hasWound ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {result.wound_conditions.map((c) => (
                      <span key={c} style={{ background: "rgba(34,109,104,0.08)", color: C.teal, border: `1px solid rgba(34,109,104,0.2)` }}
                        className="text-xs px-3 py-1 rounded-full font-medium">{c}</span>
                    ))}
                  </div>
                  {result.annotated_image && (
                    <img src={`data:image/jpeg;base64,${result.annotated_image}`}
                      alt="Image annotée" className="w-full rounded-xl mt-1 max-h-52 object-cover" />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(34,109,104,0.5)" }}>
                  <ImageOff size={16} />Aucune condition détectée
                </div>
              )}
            </div>
          )}

          {/* ── Specialties + Best Provider ── */}
          {hasSpecialties && (
            <div style={{ background: "white" }} className="rounded-2xl shadow-sm overflow-hidden">

              <div className="flex border-b" style={{ borderColor: "rgba(34,109,104,0.1)" }}>
                {(["specialties", "details"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="flex-1 py-3.5 text-sm font-semibold transition-colors"
                    style={{
                      color: activeTab === tab ? C.teal : "rgba(34,109,104,0.4)",
                      borderBottom: activeTab === tab ? `2px solid ${C.teal}` : "2px solid transparent",
                      background: "transparent"
                    }}>
                    {tab === "specialties" ? "🏥 Spécialités" : "👨‍⚕️ Médecin recommandé"}
                  </button>
                ))}
              </div>

              {activeTab === "specialties" && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span style={{ color: C.dark }} className="text-sm font-semibold">
                      {sorted.length} spécialité{sorted.length > 1 ? "s" : ""} recommandée{sorted.length > 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <Filter size={12} color={C.mid} />
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
                        className="text-xs border-0 outline-none cursor-pointer font-medium"
                        style={{ color: C.mid, background: "transparent" }}>
                        <option value="score">Par pertinence</option>
                        <option value="name">Par nom</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {displayed.map((s, i) => {
                      const isTop = i === 0 && sortBy === "score";
                      const pct = Math.min(s.score, 100);
                      return (
                        <div key={i} style={{
                          background: isTop ? `linear-gradient(135deg, rgba(24,83,79,0.06), rgba(34,109,104,0.03))` : "#FAFAFA",
                          border: isTop ? `1.5px solid rgba(24,83,79,0.2)` : "1.5px solid #F0F0F0",
                        }} className="rounded-2xl p-4 transition-all hover:shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isTop && <Award size={14} color={C.teal} />}
                              <span style={{ color: C.dark }} className="font-semibold text-sm">{s.specialty}</span>
                              {isTop && (
                                <span style={{ background: C.teal, color: "white" }}
                                  className="text-xs px-2 py-0.5 rounded-full font-semibold">
                                  Recommandé
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp size={12} color={C.mid} />
                              <span style={{ color: C.teal }} className="text-sm font-bold">{pct.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full rounded-full h-2" style={{ background: "rgba(34,109,104,0.1)" }}>
                            <div className="h-2 rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: isTop
                                  ? `linear-gradient(90deg, ${C.teal}, ${C.mid})`
                                  : "rgba(34,109,104,0.35)"
                              }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {sorted.length > 3 && (
                    <button onClick={() => setShowAll(!showAll)}
                      style={{ color: C.mid }}
                      className="w-full text-sm font-medium mt-3 py-2 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-1">
                      <ChevronDown size={14} style={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                      {showAll ? "Voir moins" : `Voir ${sorted.length - 3} de plus`}
                    </button>
                  )}
                </div>
              )}

              {activeTab === "details" && (
                <div className="p-5">
                  {result.best_provider ? (
                    <div className="flex flex-col gap-4">
                      <div style={{ background: C.dark }} className="rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                          style={{ background: C.teal, transform: "translate(30%, -30%)" }} />
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div style={{ background: C.mid }}
                              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <User size={22} color={C.light} />
                            </div>
                            <div>
                              <p style={{ color: "rgba(236,248,246,0.5)" }} className="text-xs font-semibold uppercase tracking-widest mb-0.5">
                                Médecin recommandé
                              </p>
                              <p style={{ color: C.light }} className="font-bold text-lg leading-tight">
                                {result.best_provider}
                              </p>
                            </div>
                          </div>
                          {topSpecialty && (
                            <div className="flex items-center gap-2 mb-3">
                              <Stethoscope size={13} color="rgba(236,248,246,0.5)" />
                              <span style={{ color: "rgba(236,248,246,0.7)" }} className="text-sm">{topSpecialty}</span>
                            </div>
                          )}
                          <p style={{ color: "rgba(236,248,246,0.4)" }} className="text-xs">
                            Sélectionné selon votre localisation, budget et niveau d&apos;urgence
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { icon: <Star size={14} color={C.teal} />, label: "Qualité", value: "Optimale" },
                          { icon: <Clock size={14} color={C.teal} />, label: "Disponibilité", value: "Rapide" },
                          { icon: <MapPin size={14} color={C.teal} />, label: "Distance", value: "Proche" },
                        ].map((chip, i) => (
                          <div key={i} style={{ background: "#F8FAF9", border: "1.5px solid rgba(34,109,104,0.1)" }}
                            className="rounded-xl p-3 flex flex-col items-center gap-1 text-center">
                            {chip.icon}
                            <span style={{ color: "rgba(34,109,104,0.5)" }} className="text-xs">{chip.label}</span>
                            <span style={{ color: C.dark }} className="text-xs font-bold">{chip.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <div style={{ background: "rgba(34,109,104,0.08)" }} className="w-12 h-12 rounded-full flex items-center justify-center">
                        <User size={20} color="rgba(34,109,104,0.4)" />
                      </div>
                      <p style={{ color: "rgba(34,109,104,0.5)" }} className="text-sm">
                        Aucun médecin trouvé.<br />Essayez d&apos;ajouter une localisation.
                      </p>
                      <button onClick={() => router.push("/analyse")}
                        style={{ background: C.teal, color: C.light }}
                        className="text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition mt-1">
                        Réessayer avec localisation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!hasSpecialties && (
            <div style={{ background: "white" }} className="rounded-2xl p-8 shadow-sm flex flex-col items-center gap-3 text-center">
              <div style={{ background: "rgba(34,109,104,0.08)" }} className="w-14 h-14 rounded-full flex items-center justify-center">
                <Stethoscope size={24} color="rgba(34,109,104,0.4)" />
              </div>
              <p style={{ color: C.dark }} className="font-bold">Aucune spécialité recommandée</p>
              <p style={{ color: "rgba(34,109,104,0.5)" }} className="text-sm max-w-xs">
                Le modèle n&apos;a pas pu identifier de spécialité. Essayez de décrire vos symptômes plus précisément.
              </p>
              <button onClick={() => router.push("/analyse")}
                style={{ background: C.teal, color: C.light }}
                className="text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition mt-2">
                Nouvelle analyse
              </button>
            </div>
          )}

          <details style={{ background: "white", border: `1.5px solid rgba(34,109,104,0.1)` }} className="rounded-2xl p-5 shadow-sm">
            <summary style={{ color: "rgba(34,109,104,0.4)" }} className="text-xs cursor-pointer hover:opacity-80 transition select-none font-medium">
              Voir la réponse brute du modèle
            </summary>
            <pre style={{ color: C.mid }} className="mt-3 text-xs whitespace-pre-wrap leading-relaxed font-mono">
              {result.optimization_raw || "Aucune réponse"}
            </pre>
          </details>

        </div>
      </main>
    );
  }

