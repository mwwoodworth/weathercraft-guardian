import { PROJECTS } from "@/lib/config";
import WinterWorkPlan from "@/components/winter-work-plan";
import { notFound } from "next/navigation";

// Map short slugs to project IDs (keeps URLs clean and unexposable)
const SHARE_SLUGS: Record<string, string> = {
  "b140": "peterson-sfb-b140",
  "psfb": "peterson-sfb-b140",
  "peterson": "peterson-sfb-b140",
  // Add more as needed - these are the ONLY accessible slugs
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const projectId = SHARE_SLUGS[slug.toLowerCase()];
  const project = PROJECTS.find((p) => p.id === projectId);

  return {
    title: project ? `${project.name} - Winter Work Plan` : "Winter Work Plan",
    description: "Product constraints by roofing system for temperature-sensitive operations.",
    // Prevent indexing of share pages
    robots: "noindex, nofollow",
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Only allow explicitly mapped slugs - no guessing
  const projectId = SHARE_SLUGS[slug.toLowerCase()];
  if (!projectId) {
    notFound();
  }

  const project = PROJECTS.find((p) => p.id === projectId);
  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Clean header - no navigation, no system info */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.location}</p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Prepared by Weathercraft Roofing
          </p>
        </div>

        {/* Planning disclaimer */}
        <div className="mb-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Planning Notice:</span>{" "}
            This document serves as a planning tool to support informed scheduling decisions, not a
            guarantee of work execution. While every effort will be made to perform work within scope
            requirements and manufacturer specifications, weather conditions are inherently variable.
            Isolated work windows (e.g., a single favorable day within an otherwise unfavorable week)
            may not warrant crew mobilization. Conversely, split operations—such as tear-off during
            morning windows and installation during afternoon temperature compliance—may be considered
            when conditions allow. Final scheduling decisions are made on-site based on real-time
            conditions, crew availability, and practical feasibility.
          </p>
        </div>

        {/* The winter work plan component - product constraints by system */}
        <WinterWorkPlan />

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground/60">
            This document is provided for review purposes.
          </p>
        </div>
      </div>
    </main>
  );
}
