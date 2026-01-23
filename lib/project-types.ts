export type ProjectFileCategory =
  | "spec"
  | "scope"
  | "drawings"
  | "contract"
  | "data_sheet"
  | "rfi"
  | "submittal"
  | "communication"
  | "photo"
  | "reference";

export type ProjectFile = {
  id: string;
  title: string;
  category: ProjectFileCategory;
  fileType: string;
  sizeMb: number;
  date: string; // YYYY-MM-DD
  relativePath: string;
  tags?: string[];
  description?: string;
  previewUrl?: string;
  publicUrl?: string;
};

export type AsBuiltCollection = {
  name: string;
  count: number;
  path: string;
  types: Record<string, number>;
};

export type ProjectManifest = {
  projectName: string;
  projectId: string;
  location: string;
  rootPath: string;
  updatedAt: string;
  documents: ProjectFile[];
  rfis: ProjectFile[];
  submittals: ProjectFile[];
  communications: ProjectFile[];
  photos: ProjectFile[];
  references: ProjectFile[];
  asBuiltCollections: AsBuiltCollection[];
  counts: {
    totalFilesScanned: number;
    totalGCSafeFiles: number;
  };
};
