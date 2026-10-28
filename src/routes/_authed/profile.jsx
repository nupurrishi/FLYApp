import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import FormField from "@/components/common/FormField";
import ImageField from "@/components/common/ImageField";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import StatusPill from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/manage-fns";
import { getProfileData } from "@/lib/server-fns";
import { formatRange } from "@/lib/show-time";

export const Route = createFileRoute("/_authed/profile")({
  head: () => ({ meta: [{ title: "Profile · Fly Showcase" }] }),
  component: ProfilePage,
});

const inputClass = "h-11 rounded-none border-brand-line bg-white";
const ROLE_LABEL = { admin: "Admin / Manager", designer: "Designer", model: "Model" };

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileData(),
  });
  const [form, setForm] = useState({});

  useEffect(() => {
    if (data?.user) setForm(data.user);
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        data: {
          full_name: form.full_name,
          phone: form.phone || "",
          city: form.city || "",
          bio: form.bio || "",
          avatar_url: form.avatar_url || "",
          brand_name: form.brand_name || "",
          website: form.website || "",
          instagram: form.instagram || "",
          height: form.height || "",
          bust: form.bust || "",
          waist: form.waist || "",
          hips: form.hips || "",
          shoe_size: form.shoe_size || "",
          hair_color: form.hair_color || "",
          eye_color: form.eye_color || "",
          emergency_contact: form.emergency_contact || "",
        },
      }),
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error?.message || "Your profile could not be saved"),
  });

  if (isLoading) return <Loading label="Loading your profile" />;

  const user = data?.user || {};
  const role = data?.role || "model";
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" description="Your details, your role and the events you're part of." />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="border border-brand-line bg-white p-5 text-center">
            <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-brand-bone">
              {form.avatar_url ? (
                <Image src={form.avatar_url} alt="" className="h-full w-full" fittingType="fill" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-heading text-3xl text-black/25">
                  {(user.full_name || user.email || "F")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <p className="font-heading text-[22px] leading-tight text-brand-black">{user.full_name || "Your name"}</p>
            <p className="mt-0.5 truncate text-[12px] text-black/45">{user.email}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 border border-brand-purple/25 bg-brand-purple/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-brand-purple">
              <ShieldCheck className="h-3 w-3" /> {ROLE_LABEL[role]}
            </p>
            <div className="mt-4">
              <ImageField label="Profile photo" value={form.avatar_url} onChange={(url) => setForm((p) => ({ ...p, avatar_url: url }))} />
            </div>
          </div>

          <div className="border border-brand-line bg-white p-5">
            <p className="label-eyebrow text-black/40">Event memberships</p>
            {data?.memberships?.length ? (
              <ul className="mt-3 space-y-2.5">
                {data.memberships.map((membership) => (
                  <li key={membership.id} className="border-b border-brand-line pb-2.5 last:border-b-0 last:pb-0">
                    <p className="text-[13px] text-brand-black">{membership.event?.name || "Event"}</p>
                    <p className="text-[11px] text-black/40">
                      {membership.event ? formatRange(membership.event.start_date, membership.event.end_date) : ""}
                    </p>
                    <div className="mt-1 flex gap-1.5">
                      <StatusPill status={membership.role === "designer" ? "published" : "active"} />
                      <StatusPill status={membership.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[12.5px] text-black/45">No event memberships yet.</p>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-black/35">
              Roles and event access are managed by the production team.
            </p>
          </div>
        </aside>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.full_name?.trim()) {
              toast.error("Your name cannot be empty");
              return;
            }
            save.mutate();
          }}
        >
          <section className="border border-brand-line bg-white p-5">
            <h2 className="font-heading text-[20px] text-brand-black">Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" required>
                <Input className={inputClass} value={form.full_name || ""} onChange={set("full_name")} />
              </FormField>
              <FormField label="Email" hint="Contact the production team to change your sign-in email">
                <Input className={`${inputClass} bg-brand-bone/60`} value={user.email || ""} disabled />
              </FormField>
              <FormField label="Phone">
                <Input className={inputClass} value={form.phone || ""} onChange={set("phone")} />
              </FormField>
              <FormField label="City">
                <Input className={inputClass} value={form.city || ""} onChange={set("city")} />
              </FormField>
              <FormField label="Emergency contact" className="sm:col-span-2">
                <Input className={inputClass} value={form.emergency_contact || ""} onChange={set("emergency_contact")} />
              </FormField>
              <FormField label="About you" className="sm:col-span-2">
                <Textarea className="min-h-20 rounded-none border-brand-line bg-white" value={form.bio || ""} onChange={set("bio")} />
              </FormField>
            </div>
          </section>

          {role === "designer" && (
            <section className="border border-brand-line bg-white p-5">
              <h2 className="font-heading text-[20px] text-brand-black">Brand</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Brand name">
                  <Input className={inputClass} value={form.brand_name || ""} onChange={set("brand_name")} />
                </FormField>
                <FormField label="Website">
                  <Input className={inputClass} value={form.website || ""} onChange={set("website")} />
                </FormField>
                <FormField label="Instagram">
                  <Input className={inputClass} value={form.instagram || ""} onChange={set("instagram")} placeholder="@studio" />
                </FormField>
              </div>
            </section>
          )}

          {role !== "designer" && (
            <section className="border border-brand-line bg-white p-5">
              <h2 className="font-heading text-[20px] text-brand-black">Measurements</h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-black/45">
                Private to you and the event's admin team — used for fittings only.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <FormField label="Height">
                  <Input className={inputClass} value={form.height || ""} onChange={set("height")} placeholder="5'7&quot;" />
                </FormField>
                <FormField label="Bust">
                  <Input className={inputClass} value={form.bust || ""} onChange={set("bust")} />
                </FormField>
                <FormField label="Waist">
                  <Input className={inputClass} value={form.waist || ""} onChange={set("waist")} />
                </FormField>
                <FormField label="Hips">
                  <Input className={inputClass} value={form.hips || ""} onChange={set("hips")} />
                </FormField>
                <FormField label="Shoe size">
                  <Input className={inputClass} value={form.shoe_size || ""} onChange={set("shoe_size")} />
                </FormField>
                <FormField label="Hair colour">
                  <Input className={inputClass} value={form.hair_color || ""} onChange={set("hair_color")} />
                </FormField>
                <FormField label="Eye colour">
                  <Input className={inputClass} value={form.eye_color || ""} onChange={set("eye_color")} />
                </FormField>
              </div>
            </section>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={save.isPending} className="rounded-none bg-brand-black hover:bg-brand-purple">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}