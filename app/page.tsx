import { getCurrentWeatherServer, getForecastServer, groupForecastByDayServer } from "@/lib/weather-server";
import { PROJECTS } from "@/lib/config";
import { getProjectManifest } from "@/lib/project-manifest";
import MainDashboard from "@/components/main-dashboard";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const defaultProject = PROJECTS[0]; // Peterson SFB - Bldg 140

  // Parallel fetch weather data (server-side)
  const [current, forecast] = await Promise.all([
    getCurrentWeatherServer(defaultProject.lat, defaultProject.lon),
    getForecastServer(defaultProject.lat, defaultProject.lon)
  ]);

  // Group forecast by day for calendar view
  const dailyForecasts = groupForecastByDayServer(forecast);
  const projectManifest = getProjectManifest();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <MainDashboard
          initialWeather={current}
          initialForecast={forecast}
          dailyForecasts={dailyForecasts}
          defaultProject={defaultProject}
          projectManifest={projectManifest}
        />
      </div>
    </main>
  );
}
