"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldPlus, ChevronLeft, AlertTriangle, CheckCircle2,
  Stethoscope, User, Mic, ImageOff, RefreshCw, Activity
} from "lucide-react";
import { AnalysisResult } from "@/lib/api";

const C = { dark: "#212E53", teal: "#18534F", mid: "#226D68", light: "#ECF8F6" };

const riskConfig = (level: string) => {
  switch (level.toUpperCase()) {
    case "CRITICAL": return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", label: "Critique" };
    case "HIGH":     return { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA", label: "Élevé" };
    case "MEDIUM":   return { bg: "#FEFCE8", text: "#CA8A04", border: "#FEF08A", label: "Modéré" };
    case "LOW":      return { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0", label: "Faible" };
    default:         return { bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB", label: "Inconnu" };
  }
};

export default function ResultatsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("analysisResult");
    if (!raw) { router.push("/analyse"); return; }
    setResult(JSON.parse(raw));
  }, [router]);

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.light }}>
      <div style={{ color: C.mid }} className="animate-pulse">Chargement...</div>
    </div>
  );

  const hasWound = result.wound_conditions?.length > 0;
  const hasSpecialties = result.recommended_specialties?.length > 0;
  const risk = riskConfig(result.risk_level);

  return (
    <main className="min-h-screen" style={{ background: C.light }}>

      {/* Navbar */}
      <nav style={{ background: C.dark }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/analyse")} style={{ color: "rgba(236,248,246,0.5)" }} className="hover:opacity-100 transition">
            <ChevronLeft size={20} />
          </button>
          <ShieldPlus size={18} color={C.light} />
          <span style={{ color: C.light }} className="font-bold tracking-tight">Résultats</span>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem("analysisResult"); router.push("/analyse"); }}
          style={{ color: "rgba(236,248,246,0.6)", border: "1px solid rgba(236,248,246,0.15)" }}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-80 transition"
        >
          <RefreshCw size={12} />
          Nouvelle analyse
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-5">

        {/* Urgency banner */}
        {result.auto_urgent && (
          <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }} className="flex items-center gap-3 rounded-2xl px-5 py-4">
            <AlertTriangle size={20} color="#DC2626" className="flex-shrink-0" />
            <div>
              <p style={{ color: "#DC2626" }} className="font-bold text-sm">Situation urgente détectée</p>
              <p style={{ color: "#EF4444" }} className="text-xs mt-0.5">Consultez un médecin ou appelez le 190 immédiatement.</p>
            </div>
          </div>
        )}

        {/* Transcript */}
        <div style={{ background: "white", border: `1.5px solid rgba(34,109,104,0.15)` }} className="rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mic size={15} color={C.mid} />
              <span style={{ color: C.dark }} className="font-bold text-sm">Transcription vocale</span>
            </div>
            <span style={{ background: "rgba(33,46,83,0.08)", color: C.dark }} className="text-xs px-2.5 py-1 rounded-full font-medium">
              {result.age_group === "child" ? "Enfant" : result.age_group === "senior" ? "Senior" : "Adulte"}
            </span>
          </div>
          <p style={{ background: C.light, color: C.dark, borderLeft: `3px solid ${C.mid}` }} className="text-sm leading-relaxed rounded-xl px-4 py-3 italic">
            &ldquo;{result.transcript || "Aucune transcription disponible"}&rdquo;
          </p>
        </div>

        {/* Wound detection */}
        <div style={{ background: "white", border: `1.5px solid rgba(34,109,104,0.15)` }} className="rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} color={C.mid} />
            <span style={{ color: C.dark }} className="font-bold text-sm">Détection visuelle</span>
          </div>

          {hasWound ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  style={{ background: risk.bg, color: risk.text, border: `1px solid ${risk.border}` }}
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                >
                  Risque {risk.label}
                </span>
                <span style={{ color: C.mid }} className="text-xs">Score : {(result.risk_score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.wound_conditions.map((c) => (
                  <span key={c} style={{ background: "rgba(34,109,104,0.08)", color: C.teal, border: `1px solid rgba(34,109,104,0.2)` }} className="text-xs px-3 py-1 rounded-full font-medium">
                    {c}
                  </span>
                ))}
              </div>
              {result.annotated_image && (
                <img
                  src={`data:image/jpeg;base64,${result.annotated_image}`}
                  alt="Image annotée"
                  className="w-full rounded-xl mt-1 max-h-52 object-cover"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(34,109,104,0.5)" }}>
              <ImageOff size={16} />
              Aucune image fournie ou aucune condition détectée
            </div>
          )}
        </div>

        {/* Specialties */}
        <div style={{ background: "white", border: `1.5px solid rgba(34,109,104,0.15)` }} className="rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Stethoscope size={15} color={C.mid} />
            <span style={{ color: C.dark }} className="font-bold text-sm">Spécialités recommandées</span>
          </div>

          {hasSpecialties ? (
            <div className="flex flex-col gap-4">
              {result.recommended_specialties.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {i === 0 && <CheckCircle2 size={14} color="#16A34A" />}
                      <span style={{ color: C.dark }} className="text-sm font-semibold">{s.specialty}</span>
                    </div>
                    <span style={{ color: C.mid }} className="text-xs font-medium">{s.score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: "rgba(34,109,104,0.12)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(s.score, 100)}%`, background: i === 0 ? C.teal : C.mid, opacity: i === 0 ? 1 : 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "rgba(34,109,104,0.5)" }} className="text-sm">Aucune spécialité recommandée.</p>
          )}
        </div>

        {/* Best provider */}
        {result.best_provider && (
          <div style={{ background: C.dark }} className="rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <User size={15} color="rgba(236,248,246,0.6)" />
              <span style={{ color: "rgba(236,248,246,0.6)" }} className="text-xs font-semibold uppercase tracking-widest">Médecin recommandé</span>
            </div>
            <p style={{ color: C.light }} className="text-2xl font-bold mb-1">{result.best_provider}</p>
            <p style={{ color: "rgba(236,248,246,0.4)" }} className="text-xs">Sélectionné selon votre localisation, budget et urgence</p>
          </div>
        )}

        {/* Raw output */}
        <details style={{ background: "white", border: `1.5px solid rgba(34,109,104,0.12)` }} className="rounded-2xl p-5">
          <summary style={{ color: "rgba(34,109,104,0.5)" }} className="text-sm cursor-pointer hover:opacity-80 transition select-none">
            Voir la réponse complète du modèle
          </summary>
          <pre style={{ color: C.mid }} className="mt-3 text-xs whitespace-pre-wrap leading-relaxed">
            {result.optimization_raw || "Aucune réponse"}
          </pre>
        </details>

      </div>
    </main>
  );
}