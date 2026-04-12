"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, ImagePlus, Camera, X, MapPin, Loader2,
  ShieldPlus, ChevronLeft, CheckCircle2, AlertCircle, RotateCcw
} from "lucide-react";
import { analyzeAll, reverseGeocode } from "@/lib/api";

type RecordingState = "idle" | "recording" | "recorded";

const C = {
  dark:   "#212E53",
  teal:   "#18534F",
  mid:    "#226D68",
  light:  "#ECF8F6",
};

export default function AnalysePage() {
  const router = useRouter();

  // Audio
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Camera modal
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Location & budget
  const [location, setLocation] = useState("");
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [budget, setBudget] = useState("");

  // Submit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Camera ───────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: "environment" | "user" = "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Impossible d'accéder à la caméra.");
      setShowCamera(false);
    }
  }, []);

  useEffect(() => {
    if (showCamera) startCamera(cameraFacing);
    else if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, [showCamera, cameraFacing, startCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(blob));
      setShowCamera(false);
    }, "image/jpeg", 0.92);
  };

  const flipCamera = () => {
    setCameraFacing(f => f === "environment" ? "user" : "environment");
  };

  // ── Audio ────────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingState("recording");
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingState("recorded");
  }, []);

  const resetRecording = () => {
    setAudioBlob(null); setAudioUrl(null);
    setRecordingState("idle"); setRecordingSeconds(0);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── GPS ──────────────────────────────────────────────────────────────────────
  const getLocation = () => {
    setLoadingGps(true); setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setLocation(city);
        } catch { setGpsError("Impossible de récupérer la ville."); }
        finally { setLoadingGps(false); }
      },
      () => { setGpsError("Accès à la localisation refusé."); setLoadingGps(false); }
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!audioBlob) { setError("Veuillez enregistrer un message audio."); return; }
    setLoading(true); setError(null);
    try {
      const result = await analyzeAll(audioBlob, imageFile, budget ? parseFloat(budget) : null, location || null);
      sessionStorage.setItem("analysisResult", JSON.stringify(result));
      router.push("/resultats");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen" style={{ background: "#ECF8F6" }}>

      {/* Navbar */}
      <nav style={{ background: C.dark }} className="px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/")} style={{ color: "rgba(236,248,246,0.5)" }} className="hover:opacity-100 transition-opacity">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <ShieldPlus size={18} color={C.light} />
          <span style={{ color: C.light }} className="font-bold tracking-tight">Nouvelle analyse</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-5">

        {/* Step 1 — Audio */}
        <div style={{ background: "white", border: `1.5px solid rgba(34,109,104,0.15)` }} className="rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ background: C.dark, color: C.light }} className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">1</span>
            <h2 style={{ color: C.dark }} className="font-bold">Décrivez vos symptômes</h2>
          </div>
          <p style={{ color: C.mid }} className="text-sm mb-5 ml-8">Enregistrez un message vocal décrivant ce que vous ressentez.</p>

          {recordingState === "idle" && (
            <button
              onClick={startRecording}
              style={{ background: C.teal, color: C.light }}
              className="w-full flex items-center justify-center gap-3 font-semibold py-4 rounded-xl hover:opacity-90 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Mic size={20} />
              Commencer l&apos;enregistrement
            </button>
          )}

          {recordingState === "recording" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span style={{ color: C.dark }} className="font-semibold tabular-nums">{formatTime(recordingSeconds)}</span>
                <span style={{ color: C.mid }} className="text-sm">en cours...</span>
              </div>
              {/* Animated bars */}
              <div className="flex items-end gap-1 h-10">
                {[3,6,9,5,8,4,7,3,6,9,5].map((h, i) => (
                  <div
                    key={i}
                    style={{ background: C.mid, height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}
                    className="w-1.5 rounded-full animate-bounce"
                  />
                ))}
              </div>
              <button
                onClick={stopRecording}
                style={{ background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA" }}
                className="flex items-center gap-2 font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
              >
                <MicOff size={18} />
                Arrêter l&apos;enregistrement
              </button>
            </div>
          )}

          {recordingState === "recorded" && audioUrl && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} color="#16A34A" />
                <span style={{ color: "#16A34A" }} className="font-semibold text-sm">Enregistrement réussi</span>
              </div>
              <audio controls src={audioUrl} className="w-full rounded-xl" />
              <button onClick={resetRecording} style={{ color: C.mid }} className="text-sm underline text-left hover:opacity-70 transition">
                Recommencer
              </button>
            </div>
          )}
        </div>

        {/* Step 2 — Image */}
        <div style={{ background: "white", border: `1.5px solid rgba(34,109,104,0.15)` }} className="rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ background: "rgba(34,109,104,0.12)", color: C.teal }} className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">2</span>
            <h2 style={{ color: C.dark }} className="font-bold">Photo de la blessure</h2>
            <span style={{ background: "rgba(34,109,104,0.1)", color: C.mid }} className="text-xs px-2 py-0.5 rounded-full ml-1">Optionnel</span>
          </div>
          <p style={{ color: C.mid }} className="text-sm mb-5 ml-8">Importez une photo ou prenez-en une directement.</p>

          {!imagePreview ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Upload */}
              <label
                style={{ border: `2px dashed rgba(34,109,104,0.25)`, color: C.mid }}
                className="flex flex-col items-center justify-center gap-2 rounded-xl py-7 cursor-pointer hover:bg-teal-50 transition-colors"
              >
                <ImagePlus size={24} style={{ color: C.mid }} />
                <span className="text-xs font-medium text-center">Importer<br />une photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>

              {/* Camera */}
              <button
                onClick={() => setShowCamera(true)}
                style={{ border: `2px dashed rgba(33,46,83,0.2)`, color: C.dark }}
                className="flex flex-col items-center justify-center gap-2 rounded-xl py-7 hover:bg-blue-50 transition-colors"
              >
                <Camera size={24} style={{ color: C.dark }} />
                <span className="text-xs font-medium text-center">Prendre<br />une photo</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <img src={imagePreview} alt="Aperçu" className="w-full rounded-xl object-cover max-h-56" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                style={{ background: "white", border: "1px solid #e5e7eb" }}
                className="absolute top-2 right-2 rounded-full p-1.5 shadow hover:bg-gray-50 transition"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          )}
        </div>

        {/* Step 3 — Location + Budget */}
        <div style={{ background: "white", border: `1.5px solid rgba(34,109,104,0.15)` }} className="rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ background: "rgba(34,109,104,0.12)", color: C.teal }} className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">3</span>
            <h2 style={{ color: C.dark }} className="font-bold">Localisation & budget</h2>
            <span style={{ background: "rgba(34,109,104,0.1)", color: C.mid }} className="text-xs px-2 py-0.5 rounded-full ml-1">Optionnel</span>
          </div>
          <p style={{ color: C.mid }} className="text-sm mb-5 ml-8">Pour trouver les médecins les plus proches dans votre budget.</p>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ville ou région"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ border: "1.5px solid rgba(34,109,104,0.2)", color: C.dark }}
                className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
              />
              <button
                onClick={getLocation}
                disabled={loadingGps}
                style={{ background: C.dark, color: C.light }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loadingGps ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                GPS
              </button>
            </div>
            {gpsError && <p className="text-xs text-red-500">{gpsError}</p>}
            {location && !gpsError && (
              <p style={{ color: C.teal }} className="text-xs flex items-center gap-1">
                <CheckCircle2 size={12} /> Localisation : {location}
              </p>
            )}

            <input
              type="number"
              placeholder="Budget en DT (ex: 200)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{ border: "1.5px solid rgba(34,109,104,0.2)", color: C.dark }}
              className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !audioBlob}
          style={{ background: audioBlob ? C.teal : "rgba(24,83,79,0.4)", color: C.light }}
          className="w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={20} className="animate-spin" />Analyse en cours...</>
          ) : (
            "Lancer l'analyse"
          )}
        </button>

        {loading && (
          <p style={{ color: C.mid }} className="text-center text-sm animate-pulse">
            Cela peut prendre 30 à 60 secondes. Veuillez patienter...
          </p>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(33,46,83,0.85)" }}>
          <div style={{ background: C.dark }} className="rounded-3xl overflow-hidden w-full max-w-md mx-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <span style={{ color: C.light }} className="font-bold">Prendre une photo</span>
              <button onClick={() => setShowCamera(false)} style={{ color: "rgba(236,248,246,0.5)" }} className="hover:opacity-100 transition">
                <X size={20} />
              </button>
            </div>

            {/* Video */}
            <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Overlay grid */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(rgba(236,248,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(236,248,246,0.07) 1px, transparent 1px)",
                backgroundSize: "33.33% 33.33%"
              }} />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-8 py-6">
              <button
                onClick={flipCamera}
                style={{ background: "rgba(236,248,246,0.1)", color: C.light }}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/20 transition"
              >
                <RotateCcw size={18} />
              </button>

              {/* Capture button */}
              <button
                onClick={capturePhoto}
                style={{ background: C.light, border: `4px solid rgba(236,248,246,0.3)` }}
                className="w-16 h-16 rounded-full hover:scale-105 active:scale-95 transition-transform"
              />

              <div className="w-12" />
            </div>
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </main>
  );
}