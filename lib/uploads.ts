import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { RuleError } from "./rules";

const DIR = () => path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/** Stores an uploaded image/PDF under data/uploads and returns its private URL. Type is taken from the bytes' declared MIME and size is capped. */
export async function saveUpload(userId: string, file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new RuleError("file_type", "Upload a JPG, PNG, WebP or PDF file.");
  if (file.size > MAX_UPLOAD_BYTES) throw new RuleError("file_too_large", "Files must be under 3 MB.");
  fs.mkdirSync(DIR(), { recursive: true });
  const name = `${userId}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(DIR(), name), Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/${name}`;
}

export function readUpload(name: string): { data: Buffer; type: string } | null {
  if (!/^[\w.-]+$/.test(name) || name.includes("..")) return null;
  const p = path.join(DIR(), name);
  if (!fs.existsSync(p)) return null;
  const ext = name.split(".").pop()!;
  const type = Object.entries(TYPES).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
  return { data: fs.readFileSync(p), type };
}
