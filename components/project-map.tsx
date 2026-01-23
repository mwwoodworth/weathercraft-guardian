"use client";

import { useEffect, useRef, useState } from "react";

// Use the same Mapbox token approach as ERP
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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
  const mapInstance = useRef<unknown>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) {
      if (!MAPBOX_TOKEN) {
        setMapError("No Mapbox token configured");
      }
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initMap = async () => {
      try {
        // Dynamically import mapbox-gl only on client
        const mapboxgl = (await import("mapbox-gl")).default;

        // Inject CSS if not already present
        if (!document.getElementById("mapbox-gl-css")) {
          const link = document.createElement("link");
          link.id = "mapbox-gl-css";
          link.rel = "stylesheet";
          link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
          document.head.appendChild(link);
        }

        if (!isMounted || !mapContainer.current) return;

        // Set access token
        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Initialize map
        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [lon, lat],
          zoom: 17,
          pitch: 45,
          bearing: -17
        });

        mapInstance.current = map;

        const statusColor = systemStatus === "go"
          ? "#22c55e"
          : systemStatus === "partial"
            ? "#f59e0b"
            : "#ef4444";

        map.on("load", () => {
          if (!isMounted) return;
          setIsLoading(false);

          // Add building outline
          map.addSource("building-outline", {
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
          map.addLayer({
            id: "building-fill",
            type: "fill",
            source: "building-outline",
            paint: {
              "fill-color": statusColor,
              "fill-opacity": 0.3
            }
          });

          // Add outline layer
          map.addLayer({
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
            .addTo(map);
        });

        map.on("error", (e) => {
          console.error("Mapbox error:", e);
          if (isMounted) {
            setMapError("Map failed to load tiles");
            setIsLoading(false);
          }
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.addControl(new mapboxgl.ScaleControl(), "bottom-left");

      } catch (err) {
        console.error("Failed to initialize map:", err);
        if (isMounted) {
          setMapError(err instanceof Error ? err.message : "Failed to load map");
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance.current && typeof (mapInstance.current as { remove?: () => void }).remove === 'function') {
        (mapInstance.current as { remove: () => void }).remove();
      }
    };
  }, [lat, lon, projectName, location, systemStatus, currentTemp]);

  // Debug info
  const debugInfo = `Token: ${MAPBOX_TOKEN ? "YES (" + MAPBOX_TOKEN.substring(0, 10) + "...)" : "NO"}, Loading: ${isLoading}, Error: ${mapError || "none"}`;

  // Static fallback when no token
  if (!MAPBOX_TOKEN) {
    const statusColor = systemStatus === "go" ? "bg-emerald-500" : systemStatus === "partial" ? "bg-amber-500" : "bg-rose-500";
    const statusText = systemStatus === "go" ? "GO" : systemStatus === "partial" ? "PARTIAL" : "NO-GO";
    return (
      <div className="relative h-[300px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-border">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className={`w-32 h-20 border-2 ${statusColor.replace('bg-', 'border-')} rounded-sm opacity-60`}>
              <div className={`absolute inset-0 ${statusColor} opacity-20`} />
            </div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 ${statusColor} rounded-full flex items-center justify-center border-2 border-white shadow-lg`}>
              <span className="text-white text-sm font-bold">{systemStatus === "go" ? "✓" : systemStatus === "partial" ? "!" : "✗"}</span>
            </div>
          </div>
        </div>
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
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-md px-2.5 py-1.5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="text-white text-xs font-medium">{statusText}</span>
          </div>
        </div>
        <div className="absolute top-3 right-3 bg-rose-500/20 border border-rose-500/50 rounded-md px-2 py-1">
          <span className="text-rose-400 text-xs">No Map Token</span>
        </div>
      </div>
    );
  }

  // Error state
  if (mapError) {
    const statusColor = systemStatus === "go" ? "bg-emerald-500" : systemStatus === "partial" ? "bg-amber-500" : "bg-rose-500";
    const statusText = systemStatus === "go" ? "GO" : systemStatus === "partial" ? "PARTIAL" : "NO-GO";
    return (
      <div className="relative h-[300px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-rose-500/30">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-rose-400 text-sm mb-2">{mapError}</div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusColor}/20`}>
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

  // Loading state
  if (isLoading) {
    return (
      <div className="relative h-[300px] bg-slate-900 rounded-lg overflow-hidden border border-border">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground text-sm">Loading satellite view...</span>
          </div>
        </div>
        {/* Debug overlay */}
        <div className="absolute bottom-12 left-3 right-3 bg-black/80 rounded px-2 py-1 text-[10px] text-yellow-400 font-mono">
          {debugInfo}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="text-white font-semibold text-sm">{projectName}</div>
          <div className="text-white/60 text-xs">{location}</div>
        </div>
      </div>
    );
  }

  // Map container
  return (
    <div className="relative h-[300px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="w-full h-full" />
      {/* Debug overlay */}
      <div className="absolute bottom-12 left-3 right-3 bg-black/80 rounded px-2 py-1 text-[10px] text-green-400 font-mono">
        {debugInfo}
      </div>
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
