"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type ProjectMapProps = {
  lat: number;
  lon: number;
  projectName: string;
  location: string;
  systemStatus: "go" | "no-go" | "partial";
  currentTemp?: number;
};

export default function ProjectMap({
  lat,
  lon,
  projectName,
  location,
  systemStatus,
  currentTemp
}: ProjectMapProps) {
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [debugInfo, setDebugInfo] = useState("Initializing...");
  const mapRef = useRef<unknown>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || mapRef.current) return;

    // Initialize map when container is available
    initializeMap(node);
  }, []);

  async function initializeMap(container: HTMLDivElement) {
    setDebugInfo("Container found, importing mapbox-gl...");

    if (!MAPBOX_TOKEN) {
      setMapState("error");
      setErrorMsg("No Mapbox token");
      setDebugInfo("Error: No token");
      return;
    }

    try {
      // Import mapbox-gl
      const mapboxgl = (await import("mapbox-gl")).default;
      setDebugInfo("mapbox-gl imported, loading CSS...");

      // Add CSS
      if (!document.getElementById("mapbox-css")) {
        const link = document.createElement("link");
        link.id = "mapbox-css";
        link.rel = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
        document.head.appendChild(link);
        await new Promise(r => setTimeout(r, 500)); // Wait for CSS
      }

      setDebugInfo(`Creating map... Container: ${container.offsetWidth}x${container.offsetHeight}`);

      // Set token
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Create map
      const map = new mapboxgl.Map({
        container: container,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: [lon, lat],
        zoom: 16
      });

      mapRef.current = map;
      setDebugInfo("Map created, waiting for load event...");

      map.on("load", () => {
        setDebugInfo("Map loaded!");
        setMapState("ready");

        // Add marker
        new mapboxgl.Marker({ color: systemStatus === "go" ? "#22c55e" : "#ef4444" })
          .setLngLat([lon, lat])
          .addTo(map);
      });

      map.on("error", (e) => {
        setDebugInfo(`Map error: ${e.error?.message || "unknown"}`);
        setMapState("error");
        setErrorMsg(e.error?.message || "Map error");
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setDebugInfo(`Init error: ${msg}`);
      setMapState("error");
      setErrorMsg(msg);
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  const statusColor = systemStatus === "go" ? "bg-emerald-500" : systemStatus === "partial" ? "bg-amber-500" : "bg-rose-500";
  const statusText = systemStatus === "go" ? "GO" : systemStatus === "partial" ? "PARTIAL" : "NO-GO";

  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative h-[300px] bg-slate-800 rounded-lg border border-border flex items-center justify-center">
        <div className="text-rose-400">No Mapbox Token</div>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] rounded-lg overflow-hidden border border-border bg-slate-900">
      {/* Map container - MUST have explicit dimensions */}
      <div
        ref={containerRef}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Status badge */}
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-md px-2.5 py-1.5 z-10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-white text-xs font-medium">{statusText}</span>
        </div>
      </div>

      {/* Debug overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 px-3 py-2 z-10">
        <div className="text-[10px] text-yellow-400 font-mono">{debugInfo}</div>
        <div className="text-white text-sm font-medium">{projectName}</div>
        <div className="text-white/60 text-xs">{location}</div>
      </div>

      {/* Loading overlay */}
      {mapState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Error overlay */}
      {mapState === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-20">
          <div className="text-rose-400 text-center">
            <div className="text-lg font-bold">Map Error</div>
            <div className="text-sm">{errorMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
