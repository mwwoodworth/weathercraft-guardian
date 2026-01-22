"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Use the same Mapbox token approach as ERP
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

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
  const map = useRef<mapboxgl.Map | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapContainer.current || !MAPBOX_TOKEN) return;

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
      if (!map.current) return;

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

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");

    return () => {
      map.current?.remove();
    };
  }, [mounted, lat, lon, projectName, location, systemStatus, currentTemp]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Map requires MAPBOX_TOKEN</span>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">Loading map...</span>
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
