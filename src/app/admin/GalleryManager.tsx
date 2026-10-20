"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, Images, Loader2, Plus, Trash2, Upload } from "lucide-react";
import type { Rally } from "@/lib/rallies";

export default function GalleryManager({ isDark }: { isDark: boolean }) {
  const [rallies, setRallies] = useState<Rally[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const panel = isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm";
  const heading = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-white/50" : "text-gray-500";
  const input = `w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/40 ${isDark ? "bg-white/5 border-white/15 text-white placeholder-white/30" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`;

  const loadRallies = async () => {
    const response = await fetch("/api/admin/rallies", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load rally galleries");
    const data = await response.json() as Rally[];
    setRallies(data);
    setSelectedId((current) => data.some((rally) => rally.id === current) ? current : data[0]?.id ?? "");
  };

  useEffect(() => { loadRallies().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load galleries")); }, []);

  const createRally = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/rallies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, date, location, description }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create rally");
      await loadRallies(); setSelectedId(data.id); setTitle(""); setDate(""); setLocation(""); setDescription("");
      setNotice("Rally gallery created.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create rally"); }
    finally { setBusy(false); }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length || !selectedId) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const form = new FormData();
      Array.from(files).forEach((file) => form.append("images", file));
      const response = await fetch(`/api/admin/rallies/${encodeURIComponent(selectedId)}/images`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed");
      await loadRallies(); setNotice(`${files.length} image${files.length === 1 ? "" : "s"} uploaded.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed"); }
    finally { setBusy(false); if (uploadRef.current) uploadRef.current.value = ""; }
  };

  const deleteImage = async (imageId: string) => {
    if (!selectedId || !window.confirm("Remove this image from the public gallery?")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/rallies/${encodeURIComponent(selectedId)}/images`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not remove image");
      await loadRallies();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not remove image"); }
    finally { setBusy(false); }
  };

  const selected = rallies.find((rally) => rally.id === selectedId);

  return (
    <section className="space-y-5">
      <div>
        <h2 className={`font-heading text-xl font-bold ${heading}`}>Gallery</h2>
        <p className={`mt-1 text-sm ${muted}`}>Create rally archives and manage the photos displayed on the public website.</p>
      </div>
      {(error || notice) && <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-400/30 bg-red-500/10 text-red-400" : "border-sage/30 bg-sage/10 text-sage"}`}>{error && <AlertCircle size={15} />}{error || notice}</div>}

      <form onSubmit={createRally} className={`rounded-2xl border p-4 sm:p-6 ${panel}`}>
        <div className="mb-4 flex items-center gap-2"><Plus size={17} className="text-sage" /><h3 className={`font-semibold ${heading}`}>Create a rally entry</h3></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`space-y-1 text-xs ${muted}`}>Rally name<input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className={input} placeholder="e.g. 10th Rotary Indian Summer Rally" /></label>
          <label className={`space-y-1 text-xs ${muted}`}>Event date<input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} /></label>
          <label className={`space-y-1 text-xs ${muted}`}>Location<input required maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} className={input} placeholder="Luxembourg" /></label>
          <label className={`space-y-1 text-xs ${muted}`}>Description<input maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} className={input} placeholder="A short event summary" /></label>
        </div>
        <button disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-forest disabled:opacity-50"><Plus size={15} />Create Rally</button>
      </form>

      <div className={`rounded-2xl border p-4 sm:p-6 ${panel}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h3 className={`font-semibold ${heading}`}>Rally galleries</h3><p className={`mt-1 text-xs ${muted}`}>Select an event, then upload photos for its public gallery.</p></div>
          <select aria-label="Choose rally" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={input}>
            {rallies.map((rally) => <option key={rally.id} value={rally.id}>{rally.title} · {new Date(`${rally.date}T12:00:00`).getFullYear()}</option>)}
          </select>
        </div>
        {selected ? <>
          <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-gray-100 bg-gray-50"}`}>
            <div><p className={`font-medium ${heading}`}>{selected.title}</p><p className={`text-xs ${muted}`}>{new Date(`${selected.date}T12:00:00`).toLocaleDateString()} · {selected.location} · {selected.images.length} photos</p></div>
            <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(event) => uploadImages(event.target.files)} />
            <button type="button" onClick={() => uploadRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-forest disabled:opacity-50"><Upload size={15} />{busy ? "Working…" : "Upload photos"}</button>
          </div>
          <p className={`mb-4 text-xs ${muted}`}>JPEG, PNG, WebP or AVIF · max 10 MB each · up to 20 per upload.</p>
          {selected.images.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{selected.images.map((image) => <div key={image.id} className={`group relative aspect-[4/3] overflow-hidden rounded-xl border ${isDark ? "border-white/10" : "border-gray-200"}`}><Image src={image.url} alt={image.alt} fill unoptimized className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" /><button type="button" onClick={() => deleteImage(image.id)} disabled={busy} aria-label="Remove photo" className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={14} /></button></div>)}</div> : <div className={`rounded-xl border border-dashed px-6 py-12 text-center ${isDark ? "border-white/15" : "border-gray-300"}`}><Images className="mx-auto mb-3 text-sage/70" size={30} /><p className={`text-sm ${muted}`}>No photos uploaded to this rally yet.</p></div>}
        </> : <p className={`rounded-xl border border-dashed px-6 py-12 text-center text-sm ${muted} ${isDark ? "border-white/15" : "border-gray-300"}`}>{busy ? <Loader2 className="mx-auto animate-spin" /> : "No rally entries yet. Create one above."}</p>}
      </div>
    </section>
  );
}
