import { del, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { verifyToken } from "@/lib/auth";
import { isTokenRevoked } from "@/lib/admin-config";
import { addRallyImage, readRallies, removeRallyImage } from "@/lib/rallies";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

async function authenticated(): Promise<boolean> {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token || !(await verifyToken(token))) return false;
  return !(await isTokenRevoked(token));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ rallyId: string }> }) {
  if (!(await authenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rallyId } = await params;
  const rally = (await readRallies()).find((item) => item.id === rallyId);
  if (!rally) return NextResponse.json({ error: "Rally not found" }, { status: 404 });
  const form = await request.formData();
  const files = form.getAll("images").filter((item): item is File => item instanceof File);
  if (!files.length) return NextResponse.json({ error: "Select at least one image" }, { status: 400 });
  if (files.length > 20) return NextResponse.json({ error: "Upload up to 20 images at a time" }, { status: 400 });

  if (process.env.NODE_ENV === "production" && !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Gallery image storage is not configured. Set BLOB_READ_WRITE_TOKEN in deployment settings." }, { status: 503 });
  }

  const uploaded = [];
  for (const file of files) {
    const extension = ALLOWED_TYPES[file.type];
    if (!extension || file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Images must be JPEG, PNG, WebP, or AVIF and no larger than 10 MB each" }, { status: 400 });
    }
  }

  try {
    for (const file of files) {
      const id = randomUUID();
      const storageKey = `rally-gallery/${rallyId}/${id}.${ALLOWED_TYPES[file.type]}`;
      const stored = process.env.BLOB_READ_WRITE_TOKEN
        ? await put(storageKey, file, {
            access: "public",
            addRandomSuffix: false,
            contentType: file.type,
          })
        : await (async () => {
            const localName = `${id}.${ALLOWED_TYPES[file.type]}`;
            const directory = path.join(process.cwd(), "public", "gallery-upload");
            await fs.mkdir(directory, { recursive: true });
            await fs.writeFile(path.join(directory, localName), Buffer.from(await file.arrayBuffer()));
            return { url: `/gallery-upload/${localName}`, pathname: `local:${localName}` };
          })();
      uploaded.push(await addRallyImage(rallyId, {
        id,
        url: stored.url,
        alt: `${rally.title} — ${file.name.replace(/[<>"'&]/g, "").slice(0, 120)}`,
        uploadedAt: new Date().toISOString(),
        storageKey: stored.pathname,
      }));
    }
    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    console.error("[gallery] Image upload failed:", error);
    return NextResponse.json({ error: "One or more images could not be uploaded" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ rallyId: string }> }) {
  if (!(await authenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rallyId } = await params;
  const { imageId } = await request.json().catch(() => ({}));
  if (typeof imageId !== "string" || !imageId) return NextResponse.json({ error: "Image ID required" }, { status: 400 });
  const image = await removeRallyImage(rallyId, imageId);
  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });
  if (image.storageKey?.startsWith("local:")) {
    try { await fs.unlink(path.join(process.cwd(), "public", "gallery-upload", path.basename(image.storageKey.slice(6)))); } catch (error) { console.error("[gallery] Local image deletion failed:", error); }
  } else if (image.storageKey && process.env.BLOB_READ_WRITE_TOKEN) {
    try { await del(image.storageKey); } catch (error) { console.error("[gallery] Blob deletion failed:", error); }
  }
  return NextResponse.json({ ok: true });
}
