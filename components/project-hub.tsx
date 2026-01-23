"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  FileText,
  FolderOpen,
  MessageSquare,
  ClipboardList,
  Shield,
  Camera,
  FileCheck,
  Download,
  ImageIcon,
  Paperclip,
  Layers
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectManifest, ProjectFile } from "@/lib/project-types";

const CATEGORY_LABELS: Record<ProjectFile["category"], string> = {
  spec: "Spec",
  scope: "Scope",
  drawings: "Drawings",
  contract: "Contract",
  data_sheet: "Data Sheet",
  rfi: "RFI",
  submittal: "Submittal",
  communication: "Communication",
  photo: "Photo",
  reference: "Reference"
};

const CATEGORY_STYLES: Record<ProjectFile["category"], string> = {
  spec: "bg-blue-500/20 text-blue-200 border-blue-500/40",
  scope: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  drawings: "bg-purple-500/20 text-purple-200 border-purple-500/40",
  contract: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  data_sheet: "bg-cyan-500/20 text-cyan-200 border-cyan-500/40",
  rfi: "bg-rose-500/20 text-rose-200 border-rose-500/40",
  submittal: "bg-orange-500/20 text-orange-200 border-orange-500/40",
  communication: "bg-indigo-500/20 text-indigo-200 border-indigo-500/40",
  photo: "bg-slate-500/20 text-slate-200 border-slate-500/40",
  reference: "bg-sky-500/20 text-sky-200 border-sky-500/40"
};

export default function ProjectHub({ manifest }: { manifest: ProjectManifest }) {
  const stats = useMemo(() => ({
    documents: manifest.documents.length,
    rfis: manifest.rfis.length,
    submittals: manifest.submittals.length,
    communications: manifest.communications.length,
    photos: manifest.photos.length,
    asBuilts: manifest.asBuiltCollections.length
  }), [manifest]);
  const hasLibrary = useMemo(() => {
    const all = [
      ...manifest.documents,
      ...manifest.rfis,
      ...manifest.submittals,
      ...manifest.communications,
      ...manifest.photos,
      ...manifest.references
    ];
    return all.some(file => Boolean(file.publicUrl));
  }, [manifest]);

  const downloadIndex = () => {
    const rows = [
      ["Title", "Category", "Date", "Size (MB)", "Path"]
    ];

    const all = [
      ...manifest.documents,
      ...manifest.rfis,
      ...manifest.submittals,
      ...manifest.communications,
      ...manifest.photos,
      ...manifest.references
    ];

    for (const file of all) {
      rows.push([file.title, CATEGORY_LABELS[file.category], file.date, String(file.sizeMb), file.relativePath]);
    }

    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "psfb-140-document-index.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/30">
        <div className="relative h-48 w-full">
          <Image
            src="/project/header-sheet.jpg"
            alt="PSFB Building 140"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <div className="text-xs uppercase tracking-[0.3em] text-white/70">Project Hub</div>
            <div className="text-2xl font-black text-white font-display">{manifest.projectName}</div>
            <div className="text-sm text-white/70">Job {manifest.projectId} • {manifest.location}</div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-6">
            <StatCard icon={<FileText className="w-5 h-5" />} label="Docs" value={stats.documents} />
            <StatCard icon={<ClipboardList className="w-5 h-5" />} label="RFIs" value={stats.rfis} />
            <StatCard icon={<FileCheck className="w-5 h-5" />} label="Submittals" value={stats.submittals} />
            <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Comms" value={stats.communications} />
            <StatCard icon={<Camera className="w-5 h-5" />} label="Photos" value={stats.photos} />
            <StatCard icon={<Layers className="w-5 h-5" />} label="As-Builts" value={stats.asBuilts} />
          </div>
          <div className="mt-6 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <div className="flex items-center gap-2 text-sm text-amber-200">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Project Hub - Demo Mode</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              This hub demonstrates document management capabilities including specs, drawings, RFIs, submittals, photo logs, and as-built tracking.
              Full document library integration coming soon.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-400" />
              {manifest.counts.totalGCSafeFiles} indexed files from {manifest.counts.totalFilesScanned} scanned.
            </div>
            <div className="flex items-center gap-2">
              <FileText className={`w-4 h-4 ${hasLibrary ? "text-emerald-400" : "text-amber-400"}`} />
              {hasLibrary ? "Public document library published." : "Document library not published yet."}
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={downloadIndex} className="gap-2">
              <Download className="w-4 h-4" /> Export Document Index
            </Button>
          </div>
        </CardContent>
      </Card>

      <Section title="Key Documents" icon={<FileText className="w-5 h-5 text-primary" />}>
        {manifest.documents.length === 0 ? (
          <EmptyState label="No key documents available yet." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {manifest.documents.map(file => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Submittals" icon={<FileCheck className="w-5 h-5 text-orange-400" />}>
          <div className="space-y-3">
            {manifest.submittals.length === 0 ? (
              <EmptyState label="No submittals indexed yet." />
            ) : (
              manifest.submittals.map(file => <FileCard key={file.id} file={file} compact />)
            )}
          </div>
        </Section>

        <Section title="RFIs" icon={<ClipboardList className="w-5 h-5 text-rose-400" />}>
          <div className="space-y-3">
            {manifest.rfis.length === 0 ? (
              <EmptyState label="No RFIs indexed yet." />
            ) : (
              manifest.rfis.map(file => <FileCard key={file.id} file={file} compact />)
            )}
          </div>
        </Section>
      </div>


      <Section title="Photo Log" icon={<Camera className="w-5 h-5 text-slate-200" />}>
        {manifest.photos.length === 0 ? (
          <EmptyState label="No photos uploaded yet." />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {manifest.photos.map(photo => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </Section>

      {manifest.references.length > 0 && (
        <Section title="Reference Library" icon={<Paperclip className="w-5 h-5 text-sky-300" />}>
          <div className="grid gap-3 md:grid-cols-2">
            {manifest.references.map(file => (
              <FileCard key={file.id} file={file} compact />
            ))}
          </div>
        </Section>
      )}

      <Section title="As-Builts Library" icon={<Layers className="w-5 h-5 text-primary" />}>
        {manifest.asBuiltCollections.length === 0 ? (
          <EmptyState label="As-built library is not published to the portal." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {manifest.asBuiltCollections.map(collection => (
              <Card key={collection.name} className="bg-muted/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{collection.name}</div>
                      <div className="text-xs text-muted-foreground">{collection.count} files</div>
                    </div>
                    <Badge variant="outline" className="text-xs">As-Built</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(collection.types).map(([ext, count]) => (
                      <Badge key={ext} className="bg-white/5 border border-white/10 text-[10px]">{ext.toUpperCase()} • {count}</Badge>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Stored in {collection.path}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-muted/20 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-primary">{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function FileCard({ file, compact }: { file: ProjectFile; compact?: boolean }) {
  const href = file.publicUrl ? encodeURI(file.publicUrl) : `/api/project-files/${file.id}`;
  return (
    <Card className="bg-muted/20">
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-[10px] border ${CATEGORY_STYLES[file.category]}`}>
                {CATEGORY_LABELS[file.category]}
              </Badge>
              <span className="text-xs text-muted-foreground">{file.date}</span>
            </div>
            <div className="font-semibold text-sm truncate">{file.title}</div>
            <div className="text-xs text-muted-foreground">{file.fileType.toUpperCase()} • {file.sizeMb} MB</div>
            {file.tags && (
              <div className="flex flex-wrap gap-1">
                {file.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-muted-foreground bg-white/5 rounded px-1.5 py-0.5">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <Button asChild size="sm" variant="secondary">
            <a href={href} target="_blank" rel="noreferrer">Open</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PhotoCard({ photo }: { photo: ProjectFile }) {
  const href = photo.publicUrl ? encodeURI(photo.publicUrl) : `/api/project-files/${photo.id}`;
  return (
    <Card className="bg-muted/20 overflow-hidden">
      <div className="relative h-36 w-full bg-gradient-to-br from-slate-800 to-slate-900">
        {photo.previewUrl ? (
          <Image src={photo.previewUrl} alt={photo.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{photo.date}</div>
            <div className="text-sm font-semibold truncate">{photo.title}</div>
            <div className="text-[10px] text-muted-foreground">{photo.fileType.toUpperCase()} • {photo.sizeMb} MB</div>
          </div>
          <Button asChild size="sm" variant="secondary">
            <a href={href} target="_blank" rel="noreferrer">View</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-sm text-muted-foreground border border-dashed border-white/10 rounded-lg p-4">
      {label}
    </div>
  );
}
