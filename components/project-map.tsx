"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

// Use the same Mapbox token approach as ERP
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Dynamically import mapbox-gl to avoid SSR issues
let mapboxgl: typeof import("mapbox-gl").default | null = null;

type ProjectMapProps = {
  lat: number;
  lon: number;
  projectName: string;
  location: string;
  systemStatus: "go" | "no-go" | "partial";
  currentTemp?: number;
};

// Building 140 outline (approximate footprint)
const BUILDING_140_OUTLINE: [number, number][] = [
  [-104.71180, 38.82435],
  [-104.71070, 38.82435],
  [-104.71070, 38.82375],
  [-104.71180, 38.82375],
  [-104.71180, 38.82435],
];

export default function ProjectMap({
  lat,
  lon,
  projectName,
  location,
  systemStatus,
  currentTemp
}: ProjectMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<import("mapbox-gl").Map | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Client-only rendering - dynamically import mapbox-gl
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadMapbox = async () => {
      try {
        const mb = await import("mapbox-gl");
        mapboxgl = mb.default;
        if (MAPBOX_TOKEN) {
          mapboxgl.accessToken = MAPBOX_TOKEN;
        }
        setMounted(true);
      } catch (err) {
        console.error("Failed to load Mapbox GL:", err);
        setMapError("Failed to load map library");
      }
    };

    loadMapbox();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!mounted || !mapContainer.current || !MAPBOX_TOKEN || !mapboxgl) return;

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [lon, lat],
        zoom: 17,
        pitch: 45,
        bearing: -17
      });

      const statusColor = systemStatus === "go"
        ? "#22c55e"
        : systemStatus === "partial"
          ? "#f59e0b"
          : "#ef4444";

      map.current.on("load", () => {
        if (!map.current || !mapboxgl) return;
        setMapLoaded(true);

        // Add building outline
        map.current.addSource("building-outline", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [BUILDING_140_OUTLINE]
            }
          }
        });

        // Add fill layer
        map.current.addLayer({
          id: "building-fill",
          type: "fill",
          source: "building-outline",
          paint: {
            "fill-color": statusColor,
            "fill-opacity": 0.3
          }
        });

        // Add outline layer
        map.current.addLayer({
          id: "building-outline-stroke",
          type: "line",
          source: "building-outline",
          paint: {
            "line-color": statusColor,
            "line-width": 3
          }
        });

        // Add marker at center
        const markerEl = document.createElement("div");
        markerEl.className = "custom-marker";
        markerEl.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            background: ${statusColor};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="font-size: 14px;">${systemStatus === "go" ? "✓" : systemStatus === "partial" ? "!" : "✗"}</span>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="color: #333; padding: 8px; font-family: system-ui, sans-serif;">
            <p style="font-weight: bold; margin: 0 0 4px;">${projectName}</p>
            <p style="color: #666; margin: 0 0 8px; font-size: 12px;">${location}</p>
            ${currentTemp !== undefined ? `<p style="margin: 0 0 4px; font-size: 13px;">Temp: <strong>${Math.round(currentTemp)}°F</strong></p>` : ""}
            <p style="margin: 0; font-size: 13px;">
              Status: <strong style="color: ${statusColor}">${systemStatus === "go" ? "GO" : systemStatus === "partial" ? "PARTIAL" : "NO-GO"}</strong>
            </p>
          </div>
        `);

        new mapboxgl.Marker(markerEl)
          .setLngLat([lon, lat])
          .setPopup(popup)
          .addTo(map.current!);
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
        setMapError("Map failed to load");
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");
    } catch (err) {
      console.error("Failed to initialize map:", err);
      setMapError("Failed to initialize map");
    }

    return () => {
      map.current?.remove();
    };
  }, [mounted, lat, lon, projectName, location, systemStatus, currentTemp]);

  if (!MAPBOX_TOKEN) {
    // Static fallback with building info when no token
    const statusColor = systemStatus === "go" ? "bg-emerald-500" : systemStatus === "partial" ? "bg-amber-500" : "bg-rose-500";
    const statusText = systemStatus === "go" ? "GO" : systemStatus === "partial" ? "PARTIAL" : "NO-GO";
    return (
      <div className="relative h-[300px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-border">
        {/* Satellite-like background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>

        {/* Building indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Building outline (simplified) */}
            <div className={`w-32 h-20 border-2 ${statusColor.replace('bg-', 'border-')} rounded-sm opacity-60`}>
              <div className={`absolute inset-0 ${statusColor} opacity-20`} />
            </div>
            {/* Center marker */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 ${statusColor} rounded-full flex items-center justify-center border-2 border-white shadow-lg`}>
              <span className="text-white text-sm font-bold">{systemStatus === "go" ? "✓" : systemStatus === "partial" ? "!" : "✗"}</span>
            </div>
          </div>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold text-sm">{projectName}</div>
              <div className="text-white/60 text-xs">{location}</div>
            </div>
            <div className="text-right">
              {currentTemp !== undefined && <div className="text-white font-mono text-lg">{Math.round(currentTemp)}°F</div>}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-md px-2.5 py-1.5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="text-white text-xs font-medium">{statusText}</span>
          </div>
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-[10px] text-white/60 font-mono">30 m</div>
      </div>
    );
  }

  // Show error state
  if (mapError) {
    const statusColor = systemStatus === "go" ? "bg-emerald-500" : systemStatus === "partial" ? "bg-amber-500" : "bg-rose-500";
    const statusText = systemStatus === "go" ? "GO" : systemStatus === "partial" ? "PARTIAL" : "NO-GO";
    return (
      <div className="relative h-[300px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-rose-500/30">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-rose-400 text-sm mb-2">{mapError}</div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusColor.replace("bg-", "bg-")}/20`}>
              <div className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-white text-xs font-medium">{statusText}</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="text-white font-semibold text-sm">{projectName}</div>
          <div className="text-white/60 text-xs">{location}</div>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-muted-foreground text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Status indicator overlay */}
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-md px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            systemStatus === "go" ? "bg-emerald-500" :
            systemStatus === "partial" ? "bg-amber-500" :
            "bg-rose-500"
          }`} />
          <span className="text-white text-xs font-medium">
            {systemStatus === "go" ? "GO" : systemStatus === "partial" ? "PARTIAL" : "NO-GO"}
          </span>
        </div>
      </div>
    </div>
  );
}
