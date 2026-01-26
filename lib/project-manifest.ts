import "server-only";

import fs from "fs";
import path from "path";

import type {
  AsBuiltCollection,
  ProjectFile,
  ProjectFileCategory,
  ProjectManifest
} from "./project-types";

const DEFAULT_ROOT = "/home/matt-woodworth/Desktop/250001 - PSFB Building 140";
const PUBLIC_ROOT = path.join(process.cwd(), "public", "project", "library");
const PUBLIC_URL_BASE = "/project/library";

const EXCLUDE_EXTENSIONS = new Set(["db", "lnk", "bak"]);

const INTERNAL_PATTERNS = [
  /badging/i,
  /estimate/i,
  /prevwage/i,
  /price/i,
  /billing/i,
  /purchase orders?/i,
  /proposal/i,
  /takeoff/i,
  /tapercheck/i
];

const FILE_OVERRIDES: Record<string, Partial<ProjectFile> & { category: ProjectFileCategory }> = {
  "Estimating/07 52 00 Modified Bituminous Membrane Roofing.docx": {
    title: "Spec Section 07 52 00 - Modified Bituminous Membrane Roofing",
    category: "spec",
    tags: ["spec", "mod-bit"]
  },
  "Estimating/07 61 14.00 20 Steel Standing Seam Roofing.docx": {
    title: "Spec Section 07 61 14 - Steel Standing Seam Roofing",
    category: "spec",
    tags: ["spec", "metal"]
  },
  "Estimating/Garland Base-FlexBase_Plus80_data_sheet.pdf": {
    title: "Garland Base-FlexBase Plus80 Data Sheet",
    category: "data_sheet",
    tags: ["data sheet", "garland"]
  },
  "Estimating/Am 01/Attachment 1 - TDKA 24-2510 - SOW_20241015.pdf": {
    title: "Statement of Work (SOW) - Amendment 01",
    category: "scope",
    tags: ["SOW", "amendment"]
  },
  "Estimating/Am 01/Attachment 2_Drawings_20241015.pdf": {
    title: "Issued Drawings - Amendment 01",
    category: "drawings",
    tags: ["drawings", "amendment"]
  },
  "Estimating/Am 01/Attachment 11 - RFI Responses_20241015.xlsx": {
    title: "RFI Responses Log - Amendment 01",
    category: "rfi",
    tags: ["rfi", "log"]
  },
  "Estimating/Am 01/FRMACC LPTA FOPR_Bldg 140_Amd1.pdf": {
    title: "FRMACC LPTA FOPR - Amendment 01",
    category: "contract",
    tags: ["contract", "fopr"]
  },
  "REV052825-SUB_007a Government Comments.pdf": {
    title: "SUB 007a - Government Comments",
    category: "submittal",
    tags: ["submittal", "government comments"]
  },
  "detail - question - cap sheet.pdf": {
    title: "RFI Detail Question - Cap Sheet",
    category: "rfi",
    tags: ["rfi", "detail"]
  },
  "image - header sheet psfb 140.pdf": {
    title: "Header Sheet - PSFB 140 (PDF)",
    category: "drawings",
    tags: ["drawings", "cover"]
  },
  "image - header sheet psfb 140.jpg": {
    title: "Header Sheet - PSFB 140",
    category: "photo",
    tags: ["cover", "site"]
  },
  "image - wind scouring - example.PNG": {
    title: "Wind Scouring Reference Photo",
    category: "reference",
    tags: ["reference", "weather"]
  },
  "response letter - PSFB 140 - osc 11-14-25.pdf": {
    title: "Response Letter - OSC (11-14-25)",
    category: "communication",
    tags: ["response", "osc"]
  },
  "response letter - PSFB 140 - osc 11-14-25.doc": {
    title: "Response Letter Draft - OSC (11-14-25)",
    category: "communication",
    tags: ["response", "osc"]
  }
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

function isInternal(relPath: string) {
  return INTERNAL_PATTERNS.some(pattern => pattern.test(relPath));
}

function toSizeMb(bytes: number) {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function makeFileId(relPath: string) {
  const base = slugify(relPath);
  const hash = hashString(relPath);
  return `${base}-${hash}`;
}

function toPublicUrl(relPath: string) {
  return `${PUBLIC_URL_BASE}/${relPath.split(path.sep).join("/")}`;
}

function buildFileEntry(relPath: string, stats: fs.Stats): ProjectFile | null {
  const ext = path.extname(relPath).toLowerCase().replace(".", "");
  if (EXCLUDE_EXTENSIONS.has(ext)) return null;
  if (isInternal(relPath)) return null;

  const override = FILE_OVERRIDES[relPath];
  const fileName = path.basename(relPath);

  const category = override?.category ?? inferCategory(relPath, ext);
  if (!category) return null;

  return {
    id: makeFileId(relPath),
    title: override?.title ?? fileName.replace(/\.[^/.]+$/, ""),
    category,
    fileType: ext || "file",
    sizeMb: toSizeMb(stats.size),
    date: toIsoDate(stats.mtime),
    relativePath: relPath,
    tags: override?.tags,
    description: override?.description,
    previewUrl: override?.previewUrl
  };
}

function inferCategory(relPath: string, ext: string): ProjectFileCategory | null {
  const lower = relPath.toLowerCase();

  if (lower.includes("project management")) {
    if (lower.includes("/rfi")) return "rfi";
    if (lower.includes("/submittals")) return "submittal";
    if (lower.includes("/communication")) return "communication";
    if (lower.includes("/contract")) return "contract";
    if (lower.includes("/photos")) return "photo";
  }

  if (lower.includes("attachment 1") || lower.includes("sow")) return "scope";
  if (lower.includes("attachment 2") || lower.includes("drawings")) return "drawings";
  if (lower.includes("fopr")) return "contract";
  if (lower.includes("spec") || lower.includes("modified bituminous") || lower.includes("standing seam")) return "spec";
  if (lower.includes("data_sheet") || lower.includes("data sheet")) return "data_sheet";
  if (lower.includes("response letter")) return "communication";
  if (lower.includes("rfi")) return "rfi";
  if (lower.includes("sub")) return "submittal";

  if (["jpg", "jpeg", "png", "heic"].includes(ext)) return "photo";
  if (["pdf", "doc", "docx", "xlsx", "xls"].includes(ext)) return "reference";

  return null;
}

function collectAsBuiltCollections(rootPath: string): AsBuiltCollection[] {
  const asBuiltRoot = path.join(rootPath, "Estimating/Am 01/B140 As-Builts");
  if (!fs.existsSync(asBuiltRoot)) return [];

  const groups = new Map<string, AsBuiltCollection>();

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const rel = path.relative(asBuiltRoot, full);
        const group = rel.split(path.sep)[0] || "root";
        const ext = path.extname(entry.name).toLowerCase().replace(".", "") || "none";

        if (!groups.has(group)) {
          groups.set(group, {
            name: group,
            count: 0,
            path: path.join("Estimating/Am 01/B140 As-Builts", group),
            types: {}
          });
        }

        const groupItem = groups.get(group)!;
        groupItem.count += 1;
        groupItem.types[ext] = (groupItem.types[ext] || 0) + 1;
      }
    }
  }

  walk(asBuiltRoot);

  return [...groups.values()]
    .filter(group => group.name !== "Thumbs.db")
    .sort((a, b) => b.count - a.count);
}

let cachedManifest: ProjectManifest | null = null;

export function getProjectManifest(): ProjectManifest {
  if (cachedManifest) return cachedManifest;

  const localRoot = process.env.LOCAL_PROJECT_ROOT || DEFAULT_ROOT;
  const rootPath = fs.existsSync(localRoot) ? localRoot : PUBLIC_ROOT;
  const publicAvailable = fs.existsSync(PUBLIC_ROOT);
  const files: ProjectFile[] = [];
  let totalFiles = 0;

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        totalFiles += 1;
        const rel = path.relative(rootPath, full);

        if (rel.startsWith(path.join("Estimating", "Am 01", "B140 As-Builts"))) {
          continue;
        }

        if (EXCLUDE_EXTENSIONS.has(path.extname(rel).toLowerCase().replace(".", ""))) {
          continue;
        }

        if (isInternal(rel)) {
          continue;
        }

        const entryStats = fs.statSync(full);
        const fileEntry = buildFileEntry(rel, entryStats);
        if (fileEntry) {
          if (publicAvailable) {
            const publicPath = path.join(PUBLIC_ROOT, rel);
            if (fs.existsSync(publicPath)) {
              fileEntry.publicUrl = toPublicUrl(rel);
              if (!fileEntry.previewUrl && ["jpg", "jpeg", "png", "webp"].includes(fileEntry.fileType)) {
                fileEntry.previewUrl = fileEntry.publicUrl;
              }
            }
          }
          if (fileEntry.title === "Header Sheet - PSFB 140") {
            fileEntry.previewUrl = "/project/header-sheet.jpg";
          }
          files.push(fileEntry);
        }
      }
    }
  }

  if (fs.existsSync(rootPath)) {
    walk(rootPath);
  }

  const asBuiltCollections = collectAsBuiltCollections(rootPath);

  const documents = files.filter(file => ["spec", "scope", "drawings", "contract", "data_sheet"].includes(file.category));
  const rfis = files.filter(file => file.category === "rfi");
  const submittals = files.filter(file => file.category === "submittal");
  const communications = files.filter(file => file.category === "communication");
  const photos = files.filter(file => file.category === "photo");
  const references = files.filter(file => file.category === "reference");

  cachedManifest = {
    projectName: "PSFB Building 140",
    projectId: "250001",
    location: "Peterson Space Force Base, Colorado Springs, CO",
    rootPath,
    updatedAt: new Date().toISOString(),
    documents,
    rfis,
    submittals,
    communications,
    photos,
    references,
    asBuiltCollections,
    counts: {
      totalFilesScanned: totalFiles,
      totalGCSafeFiles: files.length
    }
  };

  return cachedManifest;
}

export function getProjectFileById(id: string): ProjectFile | null {
  const manifest = getProjectManifest();
  const all = [
    ...manifest.documents,
    ...manifest.rfis,
    ...manifest.submittals,
    ...manifest.communications,
    ...manifest.photos,
    ...manifest.references
  ];

  return all.find(file => file.id === id) ?? null;
}
