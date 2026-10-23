// src/components/AlertMap.jsx
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, MapPin } from "lucide-react";

// Palette de risque cohérente avec RiskBadge dans toute l'application
const NIVEAU_STYLE = {
  CRITIQUE: { couleur: "#f87171", glow: "rgba(248,113,113,0.65)", label: "Critique" },
  ELEVE: { couleur: "#fb923c", glow: "rgba(251,146,60,0.55)", label: "Élevé" },
  MODERE: { couleur: "#facc15", glow: "rgba(250,204,21,0.5)", label: "Modéré" },
  FAIBLE: { couleur: "#34d399", glow: "rgba(52,211,153,0.5)", label: "Faible" },
};

/** Déduit un niveau de risque lisible à partir des champs réels d'AlerteDto. */
export function severiteVersNiveau(alerte) {
  if (alerte?.critique) return "CRITIQUE";
  if (alerte?.severite >= 3) return "ELEVE";
  if (alerte?.severite === 2) return "MODERE";
  return "FAIBLE";
}

// Icône divIcon colorée, avec halo pulsant pour les alertes critiques
function construireIcone(niveau, estSelectionnee) {
  const style = NIVEAU_STYLE[niveau] || NIVEAU_STYLE.FAIBLE;
  const taille = estSelectionnee ? 26 : 18;
  const pulse = niveau === "CRITIQUE" ? "adas-marker-pulse" : "";

  return L.divIcon({
    className: "adas-marker-wrapper",
    html: `
      <div class="${pulse}" style="
        width:${taille}px;height:${taille}px;border-radius:9999px;
        background:${style.couleur};
        box-shadow:0 0 0 4px ${style.glow}, 0 0 14px ${style.glow};
        border:2px solid rgba(15,23,42,0.85);
      "></div>
    `,
    iconSize: [taille, taille],
    iconAnchor: [taille / 2, taille / 2],
  });
}

// Ajuste automatiquement la vue de la carte sur l'ensemble des points fournis
function AjusterVue({ points, cibleActive }) {
  const map = useMap();

  useEffect(() => {
    if (cibleActive) {
      map.flyTo([cibleActive.latitude, cibleActive.longitude], 15, { duration: 0.8 });
      return;
    }
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 14);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, cibleActive, map]);

  return null;
}

function formaterDate(horodatage) {
  if (!horodatage) return "—";
  return new Date(horodatage).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Carte des alertes géolocalisées — fond sombre CartoDB, marqueurs colorés
 * selon le niveau de risque, popup détaillé, marqueur sélectionné mis en avant.
 */
export default function AlertMap({ alertes = [], selectedId = null, onSelect, height = "100%" }) {
  const markerRefs = useRef({});

  const points = useMemo(
    () =>
      (alertes || []).filter(
        (a) => typeof a.latitude === "number" && typeof a.longitude === "number"
      ),
    [alertes]
  );

  const cibleActive = points.find((p) => p.id === selectedId) || null;

  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      markerRefs.current[selectedId].openPopup();
    }
  }, [selectedId]);

  const centreParDefaut = points[0]
    ? [points[0].latitude, points[0].longitude]
    : [36.8065, 10.1815]; // Tunis par défaut si aucune alerte géolocalisée

  return (
    <div style={{ height }} className="relative w-full overflow-hidden rounded-2xl border border-white/10">
      <MapContainer
        center={centreParDefaut}
        zoom={12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", background: "#0b1120" }}
      >
        <TileLayer
  className="adas-tuiles-sombres"
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
/>
        <AjusterVue points={points} cibleActive={cibleActive} />

        {points.map((a) => {
          const niveau = severiteVersNiveau(a);
          const estSelectionnee = a.id === selectedId;

          return (
            <Marker
              key={a.id}
              position={[a.latitude, a.longitude]}
              icon={construireIcone(niveau, estSelectionnee)}
              eventHandlers={{ click: () => onSelect?.(a.id) }}
              ref={(ref) => {
                if (ref) markerRefs.current[a.id] = ref;
              }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1 text-sm">
                  <div
                    className="flex items-center gap-1 font-semibold"
                    style={{ color: NIVEAU_STYLE[niveau].couleur }}
                  >
                    <AlertTriangle size={14} />
                    {a.type}
                  </div>
                  <p className="text-slate-600">{a.description || "Aucune description"}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={12} />
                    {formaterDate(a.horodatage)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} />
                    {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Légende */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-3 left-3 z-[1000] flex gap-3 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 backdrop-blur-md"
      >
        {Object.entries(NIVEAU_STYLE).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.couleur }} />
            {s.label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}