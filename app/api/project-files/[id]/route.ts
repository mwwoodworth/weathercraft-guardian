import fs from "fs";
import path from "path";
import { Readable } from "stream";

import { NextRequest } from "next/server";

import { getProjectFileById, getProjectManifest } from "@/lib/project-manifest";

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic"
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const file = getProjectFileById(id);
  if (!file) {
    return new Response("File not found", { status: 404 });
  }

  if (file.publicUrl) {
    return Response.redirect(new URL(file.publicUrl, request.url));
  }

  const manifest = getProjectManifest();
  const absolutePath = path.join(manifest.rootPath, file.relativePath);

  if (!fs.existsSync(absolutePath)) {
    return new Response("File not available on server", { status: 404 });
  }

  const stat = fs.statSync(absolutePath);
  const ext = path.extname(absolutePath).toLowerCase().replace(".", "");
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const inline = ["pdf", "jpg", "jpeg", "png", "heic"].includes(ext);

  const stream = fs.createReadStream(absolutePath);

  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": stat.size.toString(),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename=\"${path.basename(absolutePath)}\"`
    }
  });
}
