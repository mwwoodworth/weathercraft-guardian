"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type ProjectMapProps = {
  lat: number;
  lon: number;
  projectName: string;
  location: string;
  systemStatus: "go" | "no-go" | "partial";
  currentTemp?: number;
};

// Build OSM-based raster style (no token required)
function buildMapStyle() {
  return {
    version: 8 as const,
    sources: {
      "osm-tiles": {
        type: "raster" as const,
        tiles: ["https://tile.openstreetmap.de/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "osm-tiles",
        type: "raster" as const,
        source: "osm-tiles",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

export default function ProjectMap({
  lat,
  lon,
  projectName,
  location,
  systemStatus,
}: ProjectMapProps) {
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const mapRef = useRef<unknown>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || mapRef.current) return;
    initializeMap(node);
  }, []);

  async function initializeMap(container: HTMLDivElement) {
    try {
      // Import maplibre-gl (open-source, no token needed)
      const maplibregl = (await import("maplibre-gl")).default;

      // Add CSS
      if (!document.getElementById("maplibre-css")) {
        const link = document.createElement("link");
        link.id = "maplibre-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css";
        document.head.appendChild(link);
        await new Promise(r => setTimeout(r, 300));
      }

      // Create map with OSM tiles (no token required!)
      const map = new maplibregl.Map({
        container: container,
        style: buildMapStyle(),
        center: [lon, lat],
        zoom: 16,
      });

      mapRef.current = map;

      map.on("load", () => {
        setMapState("ready");

        // Add marker
        new maplibregl.Marker({
          color: systemStatus === "go" ? "#22c55e" : systemStatus === "partial" ? "#f59e0b" : "#ef4444"
        })
          .setLngLat([lon, lat])
          .addTo(map);
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        // Don't fail on tile errors - those are recoverable
        if (e.error?.message?.includes("tile")) return;
        setMapState("error");
        setErrorMsg(e.error?.message || "Map error");
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Map init error:", msg);
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

  return (
    <div className="relative h-[300px] rounded-lg overflow-hidden border border-border bg-slate-900">
      {/* Map container */}
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

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-3 py-2 z-10">
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
