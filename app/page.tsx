import { getCurrentWeather, getForecast, groupForecastByDay } from "@/lib/weather";
import { PROJECTS } from "@/lib/config";
import MainDashboard from "@/components/main-dashboard";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const defaultProject = PROJECTS[0]; // Peterson SFB - Bldg 140

  // Parallel fetch weather data
  const [current, forecast] = await Promise.all([
    getCurrentWeather(defaultProject.lat, defaultProject.lon),
    getForecast(defaultProject.lat, defaultProject.lon)
  ]);

  // Group forecast by day for calendar view
  const dailyForecasts = groupForecastByDay(forecast);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <MainDashboard
          initialWeather={current}
          initialForecast={forecast}
          dailyForecasts={dailyForecasts}
          defaultProject={defaultProject}
        />
      </div>
    </main>
  );
}
