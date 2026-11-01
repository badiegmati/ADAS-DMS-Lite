import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { dateTime } from '../../lib/format'
import { typeLabel } from '../../design/tokens'
import DataTableToggle from '../data/DataTableToggle'
import EmptyState from '../feedback/EmptyState'
import { MapPin } from 'lucide-react'

const TUNIS = [36.8065, 10.1815]

/** Carte OpenStreetMap au rendu sombre (filtre CSS, sans clé API) + alternative en tableau. */
export default function AlertMap({ alertes = [], height = 380 }) {
  const pts = alertes.filter((a) => a.latitude != null && a.longitude != null)
  if (!pts.length) {
    return <EmptyState icon={MapPin} title="Aucune position enregistrée" text="Les positions apparaîtront dès que des alertes géolocalisées seront reçues." />
  }
  return (
    <div>
      <div
        className="map-dark overflow-hidden rounded-xl border border-line"
        style={{ height }}
        role="region"
        aria-label={`Carte des alertes : ${pts.length} positions`}
      >
        <MapContainer center={[pts[0].latitude ?? TUNIS[0], pts[0].longitude ?? TUNIS[1]]} zoom={12}
                      scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pts.map((a) => {
            const color = a.critique ? '#F87171' : a.severite >= 10 ? '#FB923C' : '#FBBF24'
            return (
              <CircleMarker key={a.id} center={[a.latitude, a.longitude]}
                            radius={a.critique ? 10 : 7}
                            pathOptions={{ color, fillColor: color, fillOpacity: 0.55, weight: 2 }}>
                <Popup>
                  <strong>{typeLabel(a.type)}</strong><br />
                  {a.critique ? 'Gravité : critique' : 'Gravité : standard'} · sévérité {a.severite}<br />
                  {dateTime(a.horodatage)}
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-muted">Grand cercle = alerte critique. Les positions sont simulées autour de Tunis.</p>
      <DataTableToggle
        caption="Positions des alertes"
        columns={['Date', 'Type', 'Gravité', 'Latitude', 'Longitude']}
        rows={pts.map((a) => [dateTime(a.horodatage), typeLabel(a.type), a.critique ? 'Critique' : 'Standard',
          a.latitude.toFixed(4), a.longitude.toFixed(4)])}
      />
    </div>
  )
}
