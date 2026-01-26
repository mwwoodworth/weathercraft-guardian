import { getForecastServer, groupForecastByDayServer } from "@/lib/weather-server";
import { PROJECTS } from "@/lib/config";
import WinterWorkPlan from "@/components/winter-work-plan";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 300; // Revalidate every 5 minutes

export const metadata = {
  title: "Winter Work Plan | Weathercraft Guardian",
  description: "Printable winter work plan for temperature-sensitive roofing operations.",
};

export default async function WinterWorkPlanPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await searchParams (required in Next.js 15+)
  const params = await searchParams;

  const requestedProjectId =
    (typeof params?.project === "string" && params.project) ||
    (typeof params?.projectId === "string" && params.projectId) ||
    process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID ||
    process.env.WEATHERCRAFT_GUARDIAN_PROJECT_ID ||
    undefined;

  // Share mode: hide all navigation for GC/external sharing
  const isShareMode = params?.share === "true" || params?.readonly === "true";

  const project =
    PROJECTS.find((p) => p.id === requestedProjectId) ?? PROJECTS[0];

  const forecast = await getForecastServer(project.lat, project.lon);
  const dailyForecasts = groupForecastByDayServer(forecast);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Back link - hidden on print AND in share mode */}
        {!isShareMode && (
          <div className="mb-6 no-print">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Project selector info - hidden on print AND in share mode */}
        {!isShareMode && (
          <div className="mb-4 p-4 rounded-lg border border-border/50 bg-card/50 no-print">
            <div className="text-sm text-muted-foreground">
              Viewing plan for: <span className="font-semibold text-foreground">{project.name}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {project.location}
            </div>
            {PROJECTS.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {PROJECTS.map((p) => (
                  <Link
                    key={p.id}
                    href={`/winter-work-plan?project=${p.id}`}
                    className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                      p.id === project.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Share mode header - clean project title only */}
        {isShareMode && (
          <div className="mb-6 text-center no-print">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{project.location}</p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Prepared by Weathercraft Roofing
            </p>
          </div>
        )}

        {/* The winter work plan component */}
        <WinterWorkPlan
          dailyForecasts={dailyForecasts}
          hourlyForecast={forecast}
        />

        {/* Share mode footer */}
        {isShareMode && (
          <div className="mt-8 pt-6 border-t border-border/30 text-center no-print">
            <p className="text-xs text-muted-foreground/60">
              This document is provided for review purposes. Weather data updates every 5 minutes.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
