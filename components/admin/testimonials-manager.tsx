"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  service: string | null;
  result: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface NewTestimonial {
  patientName: string;
  rating: number;
  comment: string;
  service: string;
  result: string;
  isFeatured: boolean;
  isVerified: boolean;
}

const EMPTY_FORM: NewTestimonial = {
  patientName: "",
  rating: 5,
  comment: "",
  service: "",
  result: "",
  isFeatured: false,
  isVerified: true,
};

export function TestimonialsManager({
  initialItems,
}: {
  initialItems: Testimonial[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewTestimonial>(EMPTY_FORM);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (form.patientName.trim().length < 2) {
      toast({ variant: "error", title: "Hasta adı eksik" });
      return;
    }
    if (form.comment.trim().length < 10) {
      toast({ variant: "error", title: "Yorum en az 10 karakter olmalı" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: form.patientName.trim(),
          rating: form.rating,
          comment: form.comment.trim(),
          service: form.service.trim() || null,
          result: form.result.trim() || null,
          isFeatured: form.isFeatured,
          isVerified: form.isVerified,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Eklenemedi");

      toast({ variant: "success", title: "Yorum eklendi" });
      setForm(EMPTY_FORM);
      setShowForm(false);
      router.refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: "Eklenemedi",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleFeatured(item: Testimonial) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/testimonials/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !item.isFeatured }),
      });
      if (!res.ok) throw new Error("Güncellenemedi");
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id ? { ...x, isFeatured: !x.isFeatured } : x
        )
      );
    } catch (e) {
      toast({
        variant: "error",
        title: "Güncellenemedi",
        description: e instanceof Error ? e.message : "Hata",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu yorumu silmek istediğinizden emin misiniz?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Silinemedi");
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast({ variant: "info", title: "Yorum silindi" });
    } catch (e) {
      toast({
        variant: "error",
        title: "Silinemedi",
        description: e instanceof Error ? e.message : "Hata",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Yeni yorum formu */}
      {showForm ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Yeni Yorum Ekle
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Danışan Adı (kısa, gizlilik için)</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Örn: Aslı M."
                  value={form.patientName}
                  onChange={(e) =>
                    setForm({ ...form, patientName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Puan</Label>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, rating: n })}
                      className={cn(
                        "rounded p-1",
                        n <= form.rating
                          ? "text-amber-400"
                          : "text-slate-300 hover:text-amber-300"
                      )}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6",
                          n <= form.rating && "fill-amber-400"
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-slate-600">
                    {form.rating}/5
                  </span>
                </div>
              </div>

              <div>
                <Label>Hizmet (opsiyonel)</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Örn: Kilo Yönetimi"
                  value={form.service}
                  onChange={(e) =>
                    setForm({ ...form, service: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Sonuç (opsiyonel)</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Örn: 12 kg kayıp - 5 ayda"
                  value={form.result}
                  onChange={(e) =>
                    setForm({ ...form, result: e.target.value })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Yorum</Label>
                <Textarea
                  rows={4}
                  className="mt-1.5"
                  placeholder="Danışanın yazdığı yorum"
                  value={form.comment}
                  onChange={(e) =>
                    setForm({ ...form, comment: e.target.value })
                  }
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm({ ...form, isFeatured: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  />
                  Öne Çıkan (landing'de göster)
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) =>
                      setForm({ ...form, isVerified: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  />
                  Doğrulanmış
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Yorumu Kaydet
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
              >
                Vazgeç
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Yeni Yorum Ekle
        </Button>
      )}

      {/* Liste */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Henüz yorum eklenmemiş.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {t.patientName}
                      </h3>
                      <div className="flex">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      {t.isFeatured && (
                        <Badge variant="success">Öne Çıkan</Badge>
                      )}
                      {t.isVerified && (
                        <Badge variant="primary">
                          <CheckCircle2 className="h-3 w-3" />
                          Doğrulanmış
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {t.service && <span>{t.service}</span>}
                      {t.result && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="font-medium text-emerald-700">
                            {t.result}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-slate-700">
                      {t.comment}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFeatured(t)}
                      disabled={busyId === t.id}
                    >
                      {busyId === t.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : t.isFeatured ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Gizle
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Öne Çıkar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(t.id)}
                      disabled={busyId === t.id}
                      className="text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Sil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
