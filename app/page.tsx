import { getCurrentWeather, getForecast } from "@/lib/weather";
import { PROJECTS } from "@/lib/config";
import Dashboard from "@/components/dashboard";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const defaultProject = PROJECTS[0]; // Peterson SFB
  
  // Parallel fetch
  const [current, forecast] = await Promise.all([
    getCurrentWeather(defaultProject.lat, defaultProject.lon),
    getForecast(defaultProject.lat, defaultProject.lon)
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">WEATHERCRAFT GUARDIAN</h1>
            <p className="text-muted-foreground font-mono uppercase text-sm mt-1">
              Active Operation: {defaultProject.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-card border border-border rounded text-xs font-mono">
              STATUS: ONLINE
            </div>
            <div className="px-3 py-1 bg-card border border-border rounded text-xs font-mono">
              V 1.0.0
            </div>
          </div>
        </header>

        <Dashboard 
          initialWeather={current} 
          initialForecast={forecast} 
          defaultProject={defaultProject} 
        />
      </div>
    </main>
  );
}