import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

// Uploads are stored outside public/ because Next.js only serves files that were in
// public/ at build time. They are served by src/app/media/[file]/route.ts.
export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_FILE_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

const MEDIA_PREFIX = "/media/";

/** Detects the image type from the file's first bytes rather than trusting the browser. */
function detectImageType(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/** Returns an error message if the file is not acceptable, otherwise null. */
export async function validateImage(file: File): Promise<string | null> {
  if (file.size > MAX_UPLOAD_BYTES) return `"${file.name}" lebih dari 5MB.`;
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!detectImageType(head)) return `"${file.name}" harus berupa gambar JPG, PNG, atau WEBP.`;
  return null;
}

/** Saves a validated image and returns its public URL. */
export async function saveImage(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) throw new Error("Unsupported image type");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${type}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  return `${MEDIA_PREFIX}${name}`;
}

/** Deletes uploaded images. URLs that are not uploads (e.g. seed placeholders) are ignored. */
export async function deleteImages(urls: string[]) {
  await Promise.all(
    urls.map(async (url) => {
      if (!url.startsWith(MEDIA_PREFIX)) return;
      const name = url.slice(MEDIA_PREFIX.length);
      if (!UPLOAD_FILE_PATTERN.test(name)) return;
      await fs.rm(path.join(UPLOAD_DIR, name), { force: true });
    }),
  );
}

/** Non-empty files from a multi-file input. */
export function filesFrom(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((v): v is File => typeof v === "object" && v !== null && "size" in v && v.size > 0);
}
