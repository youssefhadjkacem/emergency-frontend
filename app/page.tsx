"use client";
import Link from "next/link";
import { Activity, Mic, ImagePlus, Stethoscope, ChevronRight, ShieldPlus, Heart } from "lucide-react";

const C = { dark: "#212E53", teal: "#18534F", mid: "#226D68", light: "#ECF8F6" };

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: C.light, fontFamily: "'Georgia', serif" }}>

      <nav style={{ background: C.dark }} className="px-8 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div style={{ background: C.mid }} className="w-9 h-9 rounded-xl flex items-center justify-center">
            <ShieldPlus size={18} color={C.light} />
          </div>
          <span style={{ color: C.light }} className="font-bold text-lg tracking-tight">Emergency Savior</span>
        </div>
        <Link href="/analyse" style={{ background: C.mid, color: C.light }}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          Commencer →
        </Link>
      </nav>

      {/* Hero — video background */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 flex-1 overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-0" style={{ background: "rgba(33,46,83,0.62)" }} />

        <div className="relative z-10 flex flex-col items-center">
          <div style={{ background: C.dark, color: C.light }}
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            <Heart size={12} fill={C.light} />
            Assistance médicale intelligente
          </div>

          <h1 style={{ color: C.light }} className="text-5xl md:text-6xl font-bold max-w-2xl leading-tight mb-6 drop-shadow-lg">
            Une urgence ?<br />
            <span style={{ color: "#7EDDD7" }}>Nous sommes là.</span>
          </h1>

          <p style={{ color: "rgba(236,248,246,0.85)" }} className="text-lg max-w-lg mb-12 leading-relaxed drop-shadow">
            Décrivez vos symptômes par la voix, partagez une photo si nécessaire,
            et obtenez une recommandation médicale en quelques secondes.
          </p>

          <Link href="/analyse" style={{ background: C.teal, color: C.light }}
            className="inline-flex items-center gap-3 font-bold px-10 py-5 rounded-2xl text-base hover:opacity-90 transition-all hover:scale-105 shadow-lg">
            Lancer l&apos;analyse
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: C.dark }} className="px-8 py-20">
        <p style={{ color: C.light, opacity: 0.4 } as React.CSSProperties}
          className="text-xs font-semibold tracking-widest uppercase text-center mb-12">
          Comment ça fonctionne
        </p>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Mic size={20} color={C.light} />, title: "Analyse vocale", desc: "Décrivez vos symptômes à voix haute. Notre IA Whisper transcrit et analyse votre message instantanément." },
            { icon: <ImagePlus size={20} color={C.light} />, title: "Détection visuelle", desc: "Ajoutez une photo de la blessure pour une évaluation visuelle automatique par YOLO." },
            { icon: <Stethoscope size={20} color={C.light} />, title: "Recommandation NSGA-II", desc: "Obtenez les spécialités adaptées et le meilleur médecin selon votre budget et localisation." },
          ].map((f, i) => (
            <div key={i}
              style={{ background: "rgba(236,248,246,0.05)", border: "1px solid rgba(236,248,246,0.1)" }}
              className="rounded-2xl p-7 hover:bg-white/10 transition-colors group">
              <div style={{ background: C.mid }}
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 style={{ color: C.light }} className="font-bold mb-2">{f.title}</h3>
              <p style={{ color: "rgba(236,248,246,0.55)" }} className="text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: C.teal }} className="px-8 py-16 text-center">
        <h2 style={{ color: C.light }} className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
        <p style={{ color: "rgba(236,248,246,0.6)" }} className="mb-8 text-sm">Aucune inscription requise. Résultat en moins d&apos;une minute.</p>
        <Link href="/analyse" style={{ background: C.light, color: C.teal }}
          className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all hover:scale-105">
          <Activity size={18} />
          Démarrer l&apos;analyse
        </Link>
      </section>

      <footer style={{ background: C.dark, color: "rgba(236,248,246,0.3)" }} className="px-8 py-5 text-center text-xs">
        Emergency Savior — Projet académique ENSI 2026
      </footer>
    </main>
  );
}