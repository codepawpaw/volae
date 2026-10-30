import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOAD_DIR, UPLOAD_FILE_PATTERN } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_request: Request, ctx: RouteContext<"/media/[file]">) {
  const { file } = await ctx.params;
  // The strict pattern also rules out path traversal ("../").
  if (!UPLOAD_FILE_PATTERN.test(file)) return new Response("Not found", { status: 404 });

  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, file));
    return new Response(data, {
      headers: {
        "Content-Type": CONTENT_TYPES[file.split(".").pop()!],
        // File names are random UUIDs and never reused, so they can be cached forever.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
