// src/pages/conducteur/CartePage.jsx
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, AlertTriangle, Clock, Navigation, Filter } from "lucide-react";
import api from "../../api/axios";
import AlertMap, { severiteVersNiveau } from "../../components/AlertMap";
import RiskBadge from "../../components/RiskBadge";
import KpiCard from "../../components/KpiCard";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import { toast } from "../../components/Toast";

const FILTRES = [
  { value: "TOUS", label: "Toutes" },
  { value: "CRITIQUE", label: "Critique" },
  { value: "ELEVE", label: "Élevé" },
  { value: "MODERE", label: "Modéré" },
  { value: "FAIBLE", label: "Faible" },
];

function formaterRelatif(horodatage) {
  if (!horodatage) return "—";
  const diffMs = Date.now() - new Date(horodatage).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export default function CartePage() {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState("TOUS");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    api
      .get("/conducteur/me/carte")
      .then((res) => {
        if (!annule) setAlertes(res.data || []);
      })
      .catch(() => {
        if (!annule) toast.error("Impossible de charger les alertes géolocalisées.");
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, []);

  const alertesGeolocalisees = useMemo(
    () => alertes.filter((a) => typeof a.latitude === "number" && typeof a.longitude === "number"),
    [alertes]
  );

  const alertesFiltrees = useMemo(() => {
    const triees = [...alertesGeolocalisees].sort(
      (a, b) => new Date(b.horodatage) - new Date(a.horodatage)
    );
    if (filtre === "TOUS") return triees;
    return triees.filter((a) => severiteVersNiveau(a) === filtre);
  }, [alertesGeolocalisees, filtre]);

  const nbCritiques = alertesGeolocalisees.filter((a) => severiteVersNiveau(a) === "CRITIQUE").length;

  const typeFrequent = useMemo(() => {
    if (alertesGeolocalisees.length === 0) return "—";
    const compte = {};
    alertesGeolocalisees.forEach((a) => {
      compte[a.type] = (compte[a.type] || 0) + 1;
    });
    return Object.entries(compte).sort((a, b) => b[1] - a[1])[0][0];
  }, [alertesGeolocalisees]);

  const derniereAlerte = alertesFiltrees[0];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Skeleton className="h-28" count={4} />
        </div>
        <Skeleton className="h-[520px]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* En-tête */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <MapPin className="text-emerald-400" />
          Localisation des alertes
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Visualisez où vos événements de conduite ont été détectés.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Alertes géolocalisées" value={alertesGeolocalisees.length} accent="emerald" icon={MapPin} />
        <KpiCard label="Alertes critiques" value={nbCritiques} accent="red" icon={AlertTriangle} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-500/10 to-slate-500/5 p-5 backdrop-blur-xl"
        >
          <span className="text-sm font-medium text-slate-300">Type le plus fréquent</span>
          <p className="mt-2 truncate text-xl font-bold text-white">{typeFrequent}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-500/10 to-slate-500/5 p-5 backdrop-blur-xl"
        >
          <span className="text-sm font-medium text-slate-300">Dernière alerte</span>
          <p className="mt-2 text-xl font-bold text-white">
            {derniereAlerte ? formaterRelatif(derniereAlerte.horodatage) : "—"}
          </p>
        </motion.div>
      </div>

      {alertesGeolocalisees.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Aucune alerte géolocalisée"
          description="Les alertes détectées ne contiennent pas encore de coordonnées GPS exploitables."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Carte */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <AlertMap
              alertes={alertesFiltrees}
              selectedId={selectedId}
              onSelect={setSelectedId}
              height="560px"
            />
          </motion.div>

          {/* Liste latérale */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/10 p-4">
              <Filter size={16} className="text-slate-400" />
              <div className="flex flex-wrap gap-1.5">
                {FILTRES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFiltre(f.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      filtre === f.value
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50"
                        : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[480px] space-y-2 overflow-y-auto p-3">
              <AnimatePresence initial={false}>
                {alertesFiltrees.length === 0 && (
                  <p className="p-4 text-center text-sm text-slate-500">
                    Aucune alerte pour ce filtre.
                  </p>
                )}
                {alertesFiltrees.map((a, i) => {
                  const niveau = severiteVersNiveau(a);
                  const estSelectionnee = a.id === selectedId;
                  return (
                    <motion.button
                      key={a.id}
                      layout
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25, delay: i * 0.02 }}
                      onClick={() => setSelectedId(a.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        estSelectionnee
                          ? "border-emerald-400/50 bg-emerald-500/10"
                          : "border-white/5 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{a.type}</span>
                        <RiskBadge niveau={niveau} />
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                        {a.description || "Aucune description"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock size={11} />
                        {formaterRelatif(a.horodatage)}
                        <Navigation size={11} className="ml-2" />
                        {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}