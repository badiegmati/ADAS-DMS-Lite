// src/pages/conducteur/DriverDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  MessageSquare,
  Lightbulb,
  ShieldAlert,
  Car,
  Clock,
  ArrowRight,
  Gauge,
  Sparkles,
} from "lucide-react";
import api from "../../api/axios";
import usePolling from "../../hooks/usePolling";
import ScoreGauge from "../../components/ScoreGauge";
import KpiCard from "../../components/KpiCard";
import CriticalBanner from "../../components/CriticalBanner";
import AiAdviceCard from "../../components/AiAdviceCard";
import AlertTable from "../../components/AlertTable";
import Skeleton from "../../components/Skeleton";
import { toast } from "../../components/Toast";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function useHorlogeLive() {
  const [maintenant, setMaintenant] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setMaintenant(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return maintenant;
}

function formaterRelatif(horodatage) {
  if (!horodatage) return "—";
  const diffSec = Math.floor((Date.now() - new Date(horodatage).getTime()) / 1000);
  if (diffSec < 60) return "à l'instant";
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  return `il y a ${Math.floor(diffSec / 3600)} h`;
}

export default function DriverDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const horloge = useHorlogeLive();

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) setLoading(true);
    try {
      const res = await api.get("/conducteur/me/dashboard");
      setData(res.data);
    } catch {
      if (!silencieux) toast.error("Impossible de charger le tableau de bord.");
    } finally {
      if (!silencieux) setLoading(false);
    }
  }, []);

  // Rafraîchissement initial puis silencieux toutes les 20s (cohérent avec
  // le cache de 5s de calculer_score() côté backend)
  usePolling(() => charger(true), 20000);
  useEffect(() => {
    charger(false);
  }, [charger]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const { profil, score, alertes24h, critiques24h, conseilsNonLus, messagesNonLus, dernieresAlertes, conseilEnAvant } = data;

  const estCritique = score?.niveau === "CRITIQUE" || critiques24h > 0;
  const initiales = `${profil?.prenom?.[0] || ""}${profil?.nom?.[0] || ""}`.toUpperCase();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* En-tête : salutation + horloge live */}
      <motion.div
        variants={item}
        className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 text-xl font-bold text-emerald-300 ring-1 ring-emerald-400/30">
            {initiales || <Car size={22} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Bonjour, {profil?.prenom} {profil?.nom}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-slate-400">
              <Car size={14} className="text-emerald-400" />
              {profil?.vehiculeMatricule || "Aucun véhicule assigné"}
              <span className="mx-1 text-slate-600">•</span>
              Code {profil?.codeConducteur}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-slate-300">
          <Clock size={16} className="text-emerald-400" />
          <span className="font-mono text-sm tabular-nums">
            {horloge.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}
            {" — "}
            {horloge.toLocaleTimeString("fr-FR")}
          </span>
        </div>
      </motion.div>

      {/* Bandeau critique */}
      {estCritique && (
        <motion.div variants={item}>
          <CriticalBanner
            message={
              critiques24h > 0
                ? `${critiques24h} événement${critiques24h > 1 ? "s" : ""} critique${critiques24h > 1 ? "s" : ""} détecté${critiques24h > 1 ? "s" : ""} dans les dernières 24h.`
                : "Votre score de risque est actuellement critique. Restez vigilant."
            }
          />
        </motion.div>
      )}

      {/* Score + KPI */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Jauge de score */}
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 backdrop-blur-xl"
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <Gauge size={16} className="text-emerald-400" />
              Score de risque
            </span>
            <span className="text-xs text-slate-500">MAJ {formaterRelatif(score?.derniereMaj)}</span>
          </div>
          <ScoreGauge value={score?.valeur ?? 0} niveau={score?.niveau} />
          <p className="text-xs text-slate-500">
            {score?.nbAlertes24h ?? 0} alerte(s) prise(s) en compte sur 24h
          </p>
        </motion.div>

        {/* KPI cliquables */}
        <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <button onClick={() => navigate("/conducteur/historique")} className="text-left">
            <KpiCard label="Alertes (24h)" value={alertes24h ?? 0} icon={AlertTriangle} accent="amber" />
          </button>
          <button onClick={() => navigate("/conducteur/historique")} className="text-left">
            <KpiCard label="Événements critiques (24h)" value={critiques24h ?? 0} icon={ShieldAlert} accent="red" />
          </button>
          <button onClick={() => navigate("/conducteur/conseils")} className="text-left">
            <KpiCard label="Conseils non lus" value={conseilsNonLus ?? 0} icon={Lightbulb} accent="violet" />
          </button>
          <button onClick={() => navigate("/conducteur/messages")} className="text-left">
            <KpiCard label="Messages non lus" value={messagesNonLus ?? 0} icon={MessageSquare} accent="cyan" />
          </button>
        </motion.div>
      </div>

      {/* Conseil IA en avant + carte véhicule */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          {conseilEnAvant ? (
            <AiAdviceCard conseil={conseilEnAvant} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <Sparkles className="text-emerald-400" size={28} />
              <p className="text-sm text-slate-400">
                Aucun conseil généré récemment.
              </p>
              <Link
                to="/conducteur/conseils"
                className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 ring-1 ring-emerald-400/40 transition hover:bg-emerald-500/30"
              >
                Générer un conseil
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          variants={item}
          className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <div>
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <Car size={16} className="text-emerald-400" />
              Mon véhicule
            </span>
            <p className="mt-3 text-2xl font-bold text-white">
              {profil?.vehiculeMatricule || "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {profil?.vehiculeMatricule ? "Véhicule actuellement assigné" : "Aucun véhicule assigné"}
            </p>
          </div>
          <Link
            to="/conducteur/profil"
            className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-300 hover:text-emerald-200"
          >
            Voir mon profil
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>

      {/* Alertes récentes */}
      <motion.div variants={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <AlertTriangle size={18} className="text-amber-400" />
            Alertes récentes
          </h2>
          <Link
            to="/conducteur/historique"
            className="flex items-center gap-1 text-sm font-medium text-emerald-300 hover:text-emerald-200"
          >
            Voir tout l'historique
            <ArrowRight size={14} />
          </Link>
        </div>
        <AlertTable alertes={dernieresAlertes || []} />
      </motion.div>
    </motion.div>
  );
}