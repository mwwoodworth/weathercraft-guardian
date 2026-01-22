"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WeatherData } from "@/lib/weather";
import { cn } from "@/lib/utils";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Sunrise,
  Sunset,
} from "lucide-react";

// ========== TYPES ==========
type WeatherVizProps = {
  current: WeatherData;
  hourlyForecast: WeatherData[];
  sunrise?: number; // Unix timestamp
  sunset?: number;  // Unix timestamp
};

type WeatherType = "clear" | "clouds" | "rain" | "snow" | "thunderstorm" | "drizzle" | "mist";

// ========== PRE-COMPUTED RANDOM VALUES (stable across renders) ==========
// Rain drop positions and animations
const RAIN_DROPS = Array.from({ length: 12 }, (_, i) => ({
  height: 12 + (i % 3) * 4,
  leftOffset: 0.2 + (i * 0.05),
  duration: 0.6 + (i % 4) * 0.1,
  delay: i * 0.07,
}));

// Drizzle drop positions
const DRIZZLE_DROPS = Array.from({ length: 8 }, (_, i) => ({
  leftOffset: 0.25 + (i * 0.06),
  duration: 0.8 + (i % 3) * 0.15,
  delay: i * 0.12,
}));

// Snow flake positions
const SNOW_FLAKES = Array.from({ length: 15 }, (_, i) => ({
  size: 4 + (i % 4),
  leftOffset: 0.15 + (i * 0.047),
  xDrift: ((i % 2) - 0.5) * 20,
  duration: 2 + (i % 3) * 0.5,
  delay: i * 0.13,
}));

// Storm rain drops
const STORM_DROPS = Array.from({ length: 8 }, (_, i) => ({
  leftOffset: 0.2 + (i * 0.075),
  delay: i * 0.08,
}));

// ========== UTILITY FUNCTIONS ==========
function getWeatherType(description: string): WeatherType {
  const desc = description.toLowerCase();
  if (desc.includes("thunder") || desc.includes("storm")) return "thunderstorm";
  if (desc.includes("snow")) return "snow";
  if (desc.includes("rain")) return "rain";
  if (desc.includes("drizzle")) return "drizzle";
  if (desc.includes("cloud") || desc.includes("overcast")) return "clouds";
  if (desc.includes("mist") || desc.includes("fog") || desc.includes("haze")) return "mist";
  return "clear";
}

function getTempGradient(temp: number): string {
  // Temperature gradient based on Fahrenheit
  if (temp < 20) return "from-blue-900 via-blue-700 to-blue-500"; // Frigid
  if (temp < 32) return "from-blue-700 via-blue-500 to-cyan-400"; // Freezing
  if (temp < 45) return "from-cyan-600 via-cyan-400 to-teal-300"; // Cold
  if (temp < 55) return "from-teal-500 via-emerald-400 to-green-300"; // Cool
  if (temp < 70) return "from-emerald-400 via-green-300 to-lime-200"; // Comfortable
  if (temp < 80) return "from-yellow-400 via-amber-300 to-orange-200"; // Warm
  if (temp < 90) return "from-orange-500 via-orange-400 to-red-300"; // Hot
  return "from-red-600 via-red-500 to-orange-400"; // Very Hot
}

function getWindDirection(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// ========== ANIMATED WEATHER ICON COMPONENT ==========
function AnimatedWeatherIcon({ type, size = 120 }: { type: WeatherType; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <AnimatePresence mode="wait">
        {type === "clear" && <AnimatedSun key="sun" size={size} />}
        {type === "clouds" && <AnimatedClouds key="clouds" size={size} />}
        {type === "rain" && <AnimatedRain key="rain" size={size} />}
        {type === "drizzle" && <AnimatedDrizzle key="drizzle" size={size} />}
        {type === "snow" && <AnimatedSnow key="snow" size={size} />}
        {type === "thunderstorm" && <AnimatedThunderstorm key="thunderstorm" size={size} />}
        {type === "mist" && <AnimatedMist key="mist" size={size} />}
      </AnimatePresence>
    </div>
  );
}

// Animated Sun with rotating rays
function AnimatedSun({ size }: { size: number }) {
  const rayCount = 8;
  const innerSize = size * 0.35;
  const rayLength = size * 0.2;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full bg-yellow-300/30"
        style={{ width: size * 0.8, height: size * 0.8 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rotating rays */}
      <motion.div
        className="absolute"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: rayCount }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-t from-yellow-400 to-yellow-200 rounded-full"
            style={{
              width: 4,
              height: rayLength,
              left: "50%",
              top: "50%",
              marginLeft: -2,
              marginTop: -innerSize / 2 - rayLength - 4,
              transformOrigin: `center ${innerSize / 2 + rayLength + 4}px`,
              transform: `rotate(${(360 / rayCount) * i}deg)`,
            }}
            animate={{
              height: [rayLength, rayLength * 1.3, rayLength],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
          />
        ))}
      </motion.div>

      {/* Sun core */}
      <motion.div
        className="rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 shadow-lg shadow-yellow-500/50"
        style={{ width: innerSize, height: innerSize }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

// Animated Clouds
function AnimatedClouds({ size }: { size: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background cloud */}
      <motion.div
        className="absolute"
        animate={{ x: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Cloud
          className="text-slate-300 fill-slate-200"
          style={{ width: size * 0.7, height: size * 0.7 }}
        />
      </motion.div>

      {/* Foreground cloud */}
      <motion.div
        className="absolute"
        style={{ marginTop: size * 0.15, marginLeft: size * 0.1 }}
        animate={{ x: [5, -5, 5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Cloud
          className="text-slate-400 fill-slate-300"
          style={{ width: size * 0.6, height: size * 0.6 }}
        />
      </motion.div>
    </motion.div>
  );
}

// Animated Rain
function AnimatedRain({ size }: { size: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Cloud */}
      <motion.div
        className="absolute"
        style={{ top: size * 0.1 }}
        animate={{ x: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <CloudRain
          className="text-slate-500 fill-slate-400"
          style={{ width: size * 0.6, height: size * 0.6 }}
        />
      </motion.div>

      {/* Rain drops */}
      {RAIN_DROPS.map((drop, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 bg-gradient-to-b from-blue-400 to-blue-200 rounded-full"
          style={{
            height: drop.height,
            left: size * drop.leftOffset,
            top: size * 0.4,
          }}
          animate={{
            y: [0, size * 0.5],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: drop.duration,
            repeat: Infinity,
            ease: "linear",
            delay: drop.delay,
          }}
        />
      ))}
    </motion.div>
  );
}

// Animated Drizzle (lighter rain)
function AnimatedDrizzle({ size }: { size: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute"
        style={{ top: size * 0.1 }}
        animate={{ x: [-2, 2, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Cloud
          className="text-slate-400 fill-slate-300"
          style={{ width: size * 0.55, height: size * 0.55 }}
        />
      </motion.div>

      {DRIZZLE_DROPS.map((drop, i) => (
        <motion.div
          key={i}
          className="absolute w-px bg-blue-300 rounded-full"
          style={{
            height: 8,
            left: size * drop.leftOffset,
            top: size * 0.45,
          }}
          animate={{
            y: [0, size * 0.4],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: drop.duration,
            repeat: Infinity,
            ease: "linear",
            delay: drop.delay,
          }}
        />
      ))}
    </motion.div>
  );
}

// Animated Snow
function AnimatedSnow({ size }: { size: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute"
        style={{ top: size * 0.05 }}
        animate={{ x: [-2, 2, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <CloudSnow
          className="text-slate-400 fill-slate-300"
          style={{ width: size * 0.55, height: size * 0.55 }}
        />
      </motion.div>

      {SNOW_FLAKES.map((flake, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white shadow-sm"
          style={{
            width: flake.size,
            height: flake.size,
            left: size * flake.leftOffset,
            top: size * 0.35,
          }}
          animate={{
            y: [0, size * 0.55],
            x: [0, flake.xDrift],
            opacity: [0.9, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: flake.duration,
            repeat: Infinity,
            ease: "linear",
            delay: flake.delay,
          }}
        />
      ))}
    </motion.div>
  );
}

// Animated Thunderstorm
function AnimatedThunderstorm({ size }: { size: number }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const flashInterval = setInterval(() => {
      // Deterministic flash based on time
      const shouldFlash = Date.now() % 3000 < 150;
      if (shouldFlash && !flash) {
        setFlash(true);
        setTimeout(() => setFlash(false), 150);
      }
    }, 2000);

    return () => clearInterval(flashInterval);
  }, [flash]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            className="absolute inset-0 bg-yellow-100/50 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="absolute"
        style={{ top: size * 0.05 }}
        animate={{ x: [-3, 3, -3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <CloudLightning
          className="text-slate-600 fill-slate-500"
          style={{ width: size * 0.6, height: size * 0.6 }}
        />
      </motion.div>

      {/* Lightning bolt */}
      <motion.svg
        className="absolute"
        style={{ top: size * 0.45, left: size * 0.35 }}
        width={size * 0.3}
        height={size * 0.4}
        viewBox="0 0 24 32"
        animate={{
          opacity: flash ? [0, 1, 0] : 0,
        }}
        transition={{ duration: 0.15 }}
      >
        <path
          d="M13 1L3 18h8l-2 13 10-17h-8l2-13z"
          fill="#facc15"
          stroke="#eab308"
          strokeWidth="1"
        />
      </motion.svg>

      {/* Rain drops */}
      {STORM_DROPS.map((drop, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"
          style={{
            height: 10,
            left: size * drop.leftOffset,
            top: size * 0.5,
          }}
          animate={{
            y: [0, size * 0.4],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "linear",
            delay: drop.delay,
          }}
        />
      ))}
    </motion.div>
  );
}

// Animated Mist/Fog
function AnimatedMist({ size }: { size: number }) {
  const mistLayers = [0.2, 0.35, 0.5, 0.65];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {mistLayers.map((top, i) => (
        <motion.div
          key={i}
          className="absolute h-2 rounded-full bg-gradient-to-r from-transparent via-slate-300 to-transparent"
          style={{
            width: size * (0.6 + i * 0.1),
            top: size * top,
            left: (size - size * (0.6 + i * 0.1)) / 2,
          }}
          animate={{
            x: [i % 2 === 0 ? -10 : 10, i % 2 === 0 ? 10 : -10],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </motion.div>
  );
}

// ========== WIND COMPASS COMPONENT ==========
function WindCompass({ degrees, speed }: { degrees: number; speed: number }) {
  return (
    <div className="relative w-24 h-24">
      {/* Compass ring */}
      <div className="absolute inset-0 rounded-full border-2 border-slate-600 bg-slate-800/50">
        {/* Cardinal directions */}
        {(["N", "E", "S", "W"] as const).map((dir) => (
          <span
            key={dir}
            className="absolute text-[10px] font-bold text-slate-400"
            style={{
              top: dir === "N" ? 2 : dir === "S" ? "auto" : "50%",
              bottom: dir === "S" ? 2 : "auto",
              left: dir === "W" ? 4 : dir === "E" ? "auto" : "50%",
              right: dir === "E" ? 4 : "auto",
              transform: dir === "N" || dir === "S" ? "translateX(-50%)" : "translateY(-50%)",
            }}
          >
            {dir}
          </span>
        ))}
      </div>

      {/* Animated arrow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: degrees }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <div className="relative h-16 w-4">
          {/* Arrow body */}
          <div className="absolute top-0 left-1/2 w-0.5 h-6 bg-gradient-to-b from-primary to-primary/50 -translate-x-1/2" />
          {/* Arrow head */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "10px solid hsl(var(--primary))",
            }}
          />
          {/* Arrow tail */}
          <div className="absolute bottom-2 left-1/2 w-1 h-3 bg-slate-500 -translate-x-1/2 rounded-b" />
        </div>
      </motion.div>

      {/* Center info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{Math.round(speed)}</span>
        <span className="text-[10px] text-slate-400">mph</span>
      </div>
    </div>
  );
}

// ========== HUMIDITY GAUGE COMPONENT ==========
function HumidityGauge({ humidity }: { humidity: number }) {
  const fillHeight = (humidity / 100) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-12 h-20 rounded-full border-2 border-slate-600 bg-slate-800/50 overflow-hidden">
        {/* Fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 via-blue-400 to-cyan-300"
          initial={{ height: 0 }}
          animate={{ height: `${fillHeight}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Bubbles */}
          {humidity > 30 && (
            <>
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-white/30"
                style={{ bottom: "20%", left: "20%" }}
                animate={{ y: [-5, 5, -5], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
                style={{ bottom: "40%", right: "25%" }}
                animate={{ y: [5, -5, 5], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </motion.div>

        {/* Droplet icon at top */}
        <Droplets className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 text-slate-500" />
      </div>

      <div className="text-center">
        <span className="text-lg font-bold text-white">{humidity}%</span>
        <div className="text-[10px] text-slate-400">Humidity</div>
      </div>
    </div>
  );
}

// ========== TEMPERATURE SPARKLINE COMPONENT ==========
function TemperatureSparkline({
  hourlyData,
  sunrise,
  sunset,
}: {
  hourlyData: WeatherData[];
  sunrise?: number;
  sunset?: number;
}) {
  // Get next 24 hours of data
  const data = hourlyData.slice(0, 24);

  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const temps = data.map((d) => d.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const range = maxTemp - minTemp || 1;

    const width = 280;
    const height = 80;
    const padding = { top: 10, bottom: 20, left: 10, right: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Generate path
    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartWidth,
      y: padding.top + chartHeight - ((d.temp - minTemp) / range) * chartHeight,
      temp: d.temp,
      time: d.dt,
    }));

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    // Find work windows (temp > 40F)
    const workWindowRanges: { start: number; end: number }[] = [];
    let currentStart: number | null = null;

    points.forEach((p, i) => {
      if (p.temp > 40 && currentStart === null) {
        currentStart = i;
      } else if (p.temp <= 40 && currentStart !== null) {
        workWindowRanges.push({ start: currentStart, end: i - 1 });
        currentStart = null;
      }
    });
    if (currentStart !== null) {
      workWindowRanges.push({ start: currentStart, end: points.length - 1 });
    }

    // Find sunrise/sunset positions
    const sunrisePos = sunrise
      ? points.find((p) => Math.abs(p.time - sunrise) < 1800)
      : null;
    const sunsetPos = sunset
      ? points.find((p) => Math.abs(p.time - sunset) < 1800)
      : null;

    // 40F line position
    const line40FY = minTemp < 40 && maxTemp > 40
      ? padding.top + chartHeight - ((40 - minTemp) / range) * chartHeight
      : null;

    return {
      points,
      pathD,
      workWindowRanges,
      sunrisePos,
      sunsetPos,
      line40FY,
      minTemp,
      maxTemp,
      width,
      height,
      padding,
      chartHeight,
    };
  }, [data, sunrise, sunset]);

  if (!chartData) return null;

  const { points, pathD, workWindowRanges, sunrisePos, sunsetPos, line40FY, minTemp, maxTemp, width, height, padding, chartHeight } = chartData;

  return (
    <div className="w-full">
      <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
        <TrendingUpIcon className="w-3 h-3" />
        24-Hour Temperature Trend
      </div>
      <svg width={width} height={height} className="overflow-visible">
        {/* Work window zones (green) */}
        {workWindowRanges.map((range, i) => (
          <rect
            key={i}
            x={points[range.start].x}
            y={padding.top}
            width={points[range.end].x - points[range.start].x}
            height={chartHeight}
            fill="rgba(34, 197, 94, 0.15)"
            rx={2}
          />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="rgb(234, 179, 8)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" />
            <stop offset="50%" stopColor="rgb(168, 85, 247)" />
            <stop offset="100%" stopColor="rgb(236, 72, 153)" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <motion.path
          d={`${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`}
          fill="url(#tempGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* 40F threshold line */}
        {line40FY !== null && (
          <line
            x1={padding.left}
            y1={line40FY}
            x2={width - padding.right}
            y2={line40FY}
            stroke="rgb(34, 197, 94)"
            strokeWidth={1}
            strokeDasharray="4 2"
            opacity={0.5}
          />
        )}

        {/* Sunrise marker */}
        {sunrisePos && (
          <g>
            <line
              x1={sunrisePos.x}
              y1={padding.top}
              x2={sunrisePos.x}
              y2={padding.top + chartHeight}
              stroke="rgb(251, 191, 36)"
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.6}
            />
            <Sunrise
              x={sunrisePos.x - 6}
              y={padding.top + chartHeight + 2}
              width={12}
              height={12}
              className="text-amber-400"
            />
          </g>
        )}

        {/* Sunset marker */}
        {sunsetPos && (
          <g>
            <line
              x1={sunsetPos.x}
              y1={padding.top}
              x2={sunsetPos.x}
              y2={padding.top + chartHeight}
              stroke="rgb(249, 115, 22)"
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.6}
            />
            <Sunset
              x={sunsetPos.x - 6}
              y={padding.top + chartHeight + 2}
              width={12}
              height={12}
              className="text-orange-500"
            />
          </g>
        )}

        {/* Data points */}
        {points.filter((_, i) => i % 4 === 0).map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="white"
            stroke="url(#lineGradient)"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        ))}

        {/* Min/Max labels */}
        <text
          x={padding.left}
          y={padding.top + chartHeight + 14}
          className="text-[9px] fill-slate-500"
        >
          {Math.round(minTemp)}°
        </text>
        <text
          x={width - padding.right - 16}
          y={padding.top + chartHeight + 14}
          className="text-[9px] fill-slate-500"
        >
          {Math.round(maxTemp)}°
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
          Work OK (&gt;40°F)
        </span>
        {sunrise && (
          <span className="flex items-center gap-1">
            <Sunrise className="w-3 h-3 text-amber-400" />
            Sunrise
          </span>
        )}
        {sunset && (
          <span className="flex items-center gap-1">
            <Sunset className="w-3 h-3 text-orange-500" />
            Sunset
          </span>
        )}
      </div>
    </div>
  );
}

// Simple trending up icon for the sparkline label
function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

// ========== PRECIPITATION RADAR COMPONENT ==========
function PrecipitationRadar({ probability }: { probability: number }) {
  const rings = 3;
  const isLikely = probability > 40;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Radar rings */}
      {Array.from({ length: rings }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-slate-600"
          style={{
            width: 30 + i * 28,
            height: 30 + i * 28,
          }}
          animate={
            isLikely
              ? {
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.5, 0.3],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Probability fill arc */}
      <svg className="absolute" width={96} height={96} viewBox="0 0 96 96">
        <defs>
          <linearGradient id="precipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" />
            <stop offset="100%" stopColor="rgb(147, 51, 234)" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={48}
          cy={48}
          r={40}
          fill="none"
          stroke="rgb(51, 65, 85)"
          strokeWidth={6}
        />
        {/* Animated arc */}
        <motion.circle
          cx={48}
          cy={48}
          r={40}
          fill="none"
          stroke="url(#precipGradient)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 40}
          initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
          animate={{
            strokeDashoffset: 2 * Math.PI * 40 * (1 - probability / 100),
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          transform="rotate(-90 48 48)"
        />
      </svg>

      {/* Animated sweep if precipitation likely */}
      {isLikely && (
        <motion.div
          className="absolute w-1 h-10 bg-gradient-to-t from-blue-500 to-transparent origin-bottom"
          style={{ bottom: "50%" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Center percentage */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.span
          className={cn(
            "text-xl font-bold",
            probability > 70
              ? "text-blue-400"
              : probability > 40
                ? "text-amber-400"
                : "text-emerald-400"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {probability}%
        </motion.span>
        <span className="text-[9px] text-slate-400">Precip</span>
      </div>
    </div>
  );
}

// ========== MAIN WEATHER VISUALIZATION COMPONENT ==========
export default function WeatherVisualization({
  current,
  hourlyForecast,
  sunrise,
  sunset,
}: WeatherVizProps) {
  const weatherType = getWeatherType(current.description);
  const tempGradient = getTempGradient(current.temp);
  const precipProbability = Math.round((current.pop || 0) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-sm">
      {/* Background gradient based on temperature */}
      <div
        className={cn(
          "absolute inset-0 opacity-20 bg-gradient-to-br",
          tempGradient
        )}
      />

      <div className="relative p-6">
        {/* Top section: Icon + Temp */}
        <div className="flex items-start justify-between mb-6">
          {/* Left: Weather icon and main info */}
          <div className="flex items-center gap-6">
            <AnimatedWeatherIcon type={weatherType} size={100} />
            <div>
              <motion.div
                className="text-6xl font-black tracking-tighter text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {Math.round(current.temp)}°
                <span className="text-2xl font-normal text-slate-400">F</span>
              </motion.div>
              <div className="flex items-center gap-2 mt-1">
                <Thermometer className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">
                  Feels like {Math.round(current.feels_like)}°F
                </span>
              </div>
              <div className="text-sm text-slate-500 capitalize mt-1">
                {current.description}
              </div>
            </div>
          </div>

          {/* Right: Wind compass */}
          <div className="flex flex-col items-center gap-2">
            <WindCompass degrees={current.wind_deg} speed={current.wind_speed} />
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Wind className="w-3 h-3" />
              {getWindDirection(current.wind_deg)}
            </div>
          </div>
        </div>

        {/* Middle section: Gauges */}
        <div className="flex items-center justify-around py-4 border-y border-slate-700/50">
          <HumidityGauge humidity={current.humidity} />
          <div className="w-px h-16 bg-slate-700" />
          <PrecipitationRadar probability={precipProbability} />
          <div className="w-px h-16 bg-slate-700" />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Wind className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {Math.round(current.wind_speed)}
                </div>
                <div className="text-[10px] text-slate-400">mph</div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Gusts: {Math.round(current.wind_speed * 1.4)} mph
            </div>
          </div>
        </div>

        {/* Bottom section: Temperature sparkline */}
        <div className="mt-4">
          <TemperatureSparkline
            hourlyData={hourlyForecast}
            sunrise={sunrise}
            sunset={sunset}
          />
        </div>
      </div>
    </div>
  );
}

// ========== COMPACT VERSION FOR SMALLER DISPLAYS ==========
export function WeatherVizCompact({
  current,
  precipProbability,
}: {
  current: WeatherData;
  precipProbability: number;
}) {
  const weatherType = getWeatherType(current.description);
  const tempGradient = getTempGradient(current.temp);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80 backdrop-blur-sm">
      <div className={cn("absolute inset-0 opacity-15 bg-gradient-to-br", tempGradient)} />

      <div className="relative p-4 flex items-center gap-4">
        <AnimatedWeatherIcon type={weatherType} size={60} />

        <div className="flex-1">
          <div className="text-3xl font-bold text-white">
            {Math.round(current.temp)}°F
          </div>
          <div className="text-xs text-slate-400 capitalize">{current.description}</div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-sm">
            <Wind className="w-3 h-3 text-slate-400" />
            <span className="text-white">{Math.round(current.wind_speed)} mph</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span className="text-white">{current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <CloudRain className="w-3 h-3 text-purple-400" />
            <span className="text-white">{precipProbability}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
