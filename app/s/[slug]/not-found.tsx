export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">Not Found</h1>
        <p className="text-muted-foreground">
          This document is not available or the link has expired.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-4">
          Please contact Weathercraft Roofing for assistance.
        </p>
      </div>
    </main>
  );
}
