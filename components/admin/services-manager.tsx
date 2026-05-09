"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Edit2,
  X,
  Save,
  Scale,
  Dumbbell,
  Apple,
  Heart,
  Activity,
  Leaf,
  Video,
  Sprout,
  Stethoscope,
  Salad,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  slug: string;
  name: string;
  iconName: string;
  description: string;
  durationMin: number;
  category: string;
  priceFromTRY: number | null;
  isActive: boolean;
  sortOrder: number;
}

const ICON_OPTIONS: { name: string; icon: React.ElementType }[] = [
  { name: "Scale", icon: Scale },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Apple", icon: Apple },
  { name: "Heart", icon: Heart },
  { name: "Activity", icon: Activity },
  { name: "Leaf", icon: Leaf },
  { name: "Video", icon: Video },
  { name: "Sprout", icon: Sprout },
  { name: "Stethoscope", icon: Stethoscope },
  { name: "Salad", icon: Salad },
  { name: "Sparkles", icon: Sparkles },
];

const ICON_MAP: Record<string, React.ElementType> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.name, o.icon])
);

const CATEGORY_LABELS: Record<string, string> = {
  WEIGHT: "Kilo Yönetimi",
  SPORTS: "Sporcu",
  MEDICAL: "Medikal",
  LIFESTYLE: "Yaşam Tarzı",
};

interface FormState {
  slug: string;
  name: string;
  iconName: string;
  description: string;
  durationMin: number;
  category: string;
  priceFromTRY: string; // Form içinde string, gönderirken parseInt
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  iconName: "Leaf",
  description: "",
  durationMin: 45,
  category: "LIFESTYLE",
  priceFromTRY: "",
  isActive: true,
  sortOrder: 0,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ServicesManager({
  initialServices,
}: {
  initialServices: Service[];
}) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(s: Service) {
    setEditingId(s.id);
    setForm({
      slug: s.slug,
      name: s.name,
      iconName: s.iconName,
      description: s.description,
      durationMin: s.durationMin,
      category: s.category,
      priceFromTRY: s.priceFromTRY != null ? String(s.priceFromTRY) : "",
      isActive: s.isActive,
      sortOrder: s.sortOrder,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    // Basit validation
    if (form.name.trim().length < 2) {
      toast({ variant: "error", title: "Hizmet adı en az 2 karakter olmalı" });
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      toast({
        variant: "error",
        title: "Geçersiz slug",
        description: "Sadece küçük harf, rakam ve tire kullanın.",
      });
      return;
    }
    if (form.description.trim().length < 5) {
      toast({ variant: "error", title: "Açıklama en az 5 karakter" });
      return;
    }
    if (form.durationMin < 10 || form.durationMin > 240) {
      toast({ variant: "error", title: "Süre 10-240 dakika arası olmalı" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: form.slug,
        name: form.name.trim(),
        iconName: form.iconName,
        description: form.description.trim(),
        durationMin: form.durationMin,
        category: form.category,
        priceFromTRY: form.priceFromTRY ? parseInt(form.priceFromTRY, 10) : null,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };

      const res = editingId
        ? await fetch(`/api/services/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? `Kaydedilemedi (${res.status})`);
      }

      toast({
        variant: "success",
        title: editingId ? "Hizmet güncellendi" : "Yeni hizmet eklendi",
      });
      closeForm();
      router.refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: "Kaydedilemedi",
        description: e instanceof Error ? e.message : "Hata oluştu",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(s: Service) {
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      if (!res.ok) throw new Error("Güncellenemedi");
      setServices((prev) =>
        prev.map((x) =>
          x.id === s.id ? { ...x, isActive: !x.isActive } : x
        )
      );
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(s: Service) {
    if (
      !confirm(
        `"${s.name}" hizmetini silmek istediğinizden emin misiniz?\n\nEğer bu hizmete bağlı geçmiş randevular varsa, silinmek yerine pasif yapılacaktır.`
      )
    )
      return;

    setBusyId(s.id);
    try {
      const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Silinemedi");

      if (data.softDeleted) {
        toast({
          variant: "info",
          title: "Hizmet pasif yapıldı",
          description: data.message ?? "Bağlı randevular nedeniyle silinmedi.",
        });
        setServices((prev) =>
          prev.map((x) => (x.id === s.id ? { ...x, isActive: false } : x))
        );
      } else {
        toast({
          variant: "info",
          title: "Hizmet silindi",
        });
        setServices((prev) => prev.filter((x) => x.id !== s.id));
      }
      router.refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: "Silinemedi",
        description: e instanceof Error ? e.message : "Hata oluştu",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Form */}
      {showForm ? (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                {editingId ? "Hizmeti Düzenle" : "Yeni Hizmet Ekle"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>
                  Hizmet Adı <span className="text-red-500">*</span>
                </Label>
                <Input
                  className="mt-1.5"
                  placeholder="Örn: Kilo Yönetimi"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      // Yeni kayıt ise slug'ı isimden otomatik üret
                      slug: !editingId ? slugify(name) : f.slug,
                    }));
                  }}
                />
              </div>
              <div>
                <Label>
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  className="mt-1.5 font-mono"
                  placeholder="kilo-yonetimi"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: e.target.value.toLowerCase() })
                  }
                />
                <p className="mt-1 text-xs text-slate-500">
                  URL ve form değeri olarak kullanılır. Sadece a-z, 0-9 ve tire.
                </p>
              </div>

              <div>
                <Label>İkon</Label>
                <Select
                  value={form.iconName}
                  onValueChange={(v) => setForm({ ...form, iconName: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.name} value={opt.name}>
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            {opt.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Süre (dakika)</Label>
                <Input
                  type="number"
                  min={10}
                  max={240}
                  className="mt-1.5"
                  value={form.durationMin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationMin: parseInt(e.target.value || "0", 10),
                    })
                  }
                />
              </div>

              <div>
                <Label>Sıralama (küçük → önce)</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sortOrder: parseInt(e.target.value || "0", 10),
                    })
                  }
                />
              </div>

              <div>
                <Label>Başlangıç Fiyatı (TL, opsiyonel)</Label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1.5"
                  placeholder="örn: 1500"
                  value={form.priceFromTRY}
                  onChange={(e) =>
                    setForm({ ...form, priceFromTRY: e.target.value })
                  }
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  />
                  Aktif (sitede görünür)
                </label>
              </div>

              <div className="sm:col-span-2">
                <Label>
                  Açıklama <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  rows={3}
                  className="mt-1.5"
                  placeholder="Hizmetin landing page'de ve formda gösterilecek açıklaması"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingId ? "Değişiklikleri Kaydet" : "Hizmeti Ekle"}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Vazgeç
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="primary" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Yeni Hizmet Ekle
        </Button>
      )}

      {/* Liste */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Henüz hizmet eklenmemiş.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => {
            const Icon = ICON_MAP[s.iconName] ?? Leaf;
            return (
              <Card
                key={s.id}
                className={cn(
                  "overflow-hidden",
                  !s.isActive && "border-slate-200 bg-slate-50/50 opacity-70"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {s.name}
                        </h3>
                        {s.isActive ? (
                          <Badge variant="success">Aktif</Badge>
                        ) : (
                          <Badge variant="default">Pasif</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                          {s.slug}
                        </code>
                        <span>{CATEGORY_LABELS[s.category] ?? s.category}</span>
                        <span>{s.durationMin} dk</span>
                        {s.priceFromTRY != null && (
                          <span>{s.priceFromTRY} TL</span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {s.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(s)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(s)}
                      disabled={busyId === s.id}
                    >
                      {busyId === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : s.isActive ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Pasif
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Aktif
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(s)}
                      disabled={busyId === s.id}
                      className="text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
