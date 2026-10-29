import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

const MAX_IMAGES = 6;

export default function ImageListField({ value = [], onChange, label = "Reference images" }) {
  const [busy, setBusy] = useState(false);

  async function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (value.length >= MAX_IMAGES) {
      toast.error(`Up to ${MAX_IMAGES} images per look`);
      return;
    }
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange([...value, file_url]);
      toast.success("Image uploaded");
    } catch {
      toast.error("That image could not be uploaded. Try a JPG or PNG under 8 MB.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="label-eyebrow text-black/45">{label}</p>
        <p className="text-[10px] text-black/35">
          {value.length}/{MAX_IMAGES}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative aspect-[3/4] overflow-hidden border border-brand-line bg-brand-bone">
            <Image src={url} alt="" className="h-full w-full" fittingType="fill" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < MAX_IMAGES && (
          <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-brand-line bg-white text-black/35 transition hover:border-brand-purple hover:text-brand-purple">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            <span className="text-[9px] uppercase tracking-[0.14em]">{busy ? "Uploading" : "Add"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
          </label>
        )}
      </div>
    </div>
  );
}