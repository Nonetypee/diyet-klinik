"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Pencil,
  Loader2,
  ShieldCheck,
  AtSign,
  KeyRound,
  UserPlus,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLES,
  type Role,
} from "@/lib/permissions";

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  fullName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Props {
  currentUserId: string;
  currentRole: Role;
  initialUsers: UserRow[];
}

/**
 * Rol görsel stilleri — `DEVELOPER` paneldemiş gibi gösterilmez (görünmez).
 * Yine de muhtemel teorik durumlar için ADMIN gibi stilenir.
 */
const ROLE_BADGE_STYLE: Record<
  Role,
  { bg: string; text: string }
> = {
  DEVELOPER: { bg: "bg-emerald-100", text: "text-emerald-800" },
  ADMIN: { bg: "bg-emerald-100", text: "text-emerald-800" },
  STAFF: { bg: "bg-slate-100", text: "text-slate-800" },
};

export function UsersManager({
  currentUserId,
  currentRole,
  initialUsers,
}: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) return;
      const data = (await res.json()) as UserRow[];
      setUsers(data);
      router.refresh();
    } catch {
      // sessizce geç
    }
  }

  async function handleDelete(u: UserRow) {
    if (
      !confirm(
        `${u.fullName} (${u.username ?? u.email ?? u.id}) silinsin mi?\n\nBu işlem geri alınamaz.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Silinemedi");
      toast({
        variant: "success",
        title: "Silindi",
        description: u.username ?? u.fullName,
      });
      await refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    }
  }

  async function handleToggleActive(u: UserRow) {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Güncellenemedi");
      toast({
        variant: "success",
        title: u.isActive ? "Pasifleştirildi" : "Aktifleştirildi",
      });
      await refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Rol açıklamaları — sadece atanabilir roller */}
      <div className="grid gap-3 md:grid-cols-2">
        {ASSIGNABLE_ROLES.map((r) => {
          const style = ROLE_BADGE_STYLE[r];
          return (
            <div
              key={r}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
                >
                  {ROLE_LABELS[r]}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Toplam <strong className="text-slate-900">{users.length}</strong>{" "}
          kullanıcı
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Yeni Kullanıcı
        </Button>
      </div>

      {/* Liste */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-3">Kullanıcı</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">2FA</th>
                  <th className="px-4 py-3">Son Giriş</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Henüz kullanıcı yok.
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const style = ROLE_BADGE_STYLE[u.role];
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {u.fullName}
                          {isSelf && (
                            <span className="ml-2 text-xs font-normal text-slate-500">
                              (siz)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <AtSign className="h-3 w-3" />{" "}
                          {u.username ?? u.email ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
                        >
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <Badge variant="success">Aktif</Badge>
                        ) : (
                          <Badge variant="default">Pasif</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.totpEnabled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <ShieldCheck className="h-4 w-4" /> Aktif
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {u.lastLoginAt
                          ? new Intl.DateTimeFormat("tr-TR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(u.lastLoginAt))
                          : "Hiç"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                            title={
                              isSelf
                                ? "Kendinizi pasifleştiremezsiniz"
                                : u.isActive
                                  ? "Pasifleştir"
                                  : "Aktifleştir"
                            }
                          >
                            {u.isActive ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditing(u)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
                            title="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={isSelf}
                            className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:hover:bg-transparent"
                            title={isSelf ? "Kendinizi silemezsiniz" : "Sil"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {createOpen && (
        <CreateUserDialog
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            refresh();
          }}
        />
      )}

      {editing && (
        <EditUserDialog
          user={editing}
          currentUserId={currentUserId}
          currentRole={currentRole}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// =============================================================
// Create dialog
// =============================================================

function CreateUserDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    password: "",
    role: ROLES.STAFF as Role,
  });
  const [saving, setSaving] = useState(false);

  const usernameValid = /^[a-z0-9_.-]{3,32}$/.test(form.username);

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          username: form.username.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Oluşturulamadı");
      toast({
        variant: "success",
        title: "Kullanıcı oluşturuldu",
        description: form.username,
      });
      onCreated();
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell title="Yeni Kullanıcı" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Ad Soyad">
          <Input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Ad Soyad"
          />
        </Field>
        <Field label="Kullanıcı Adı (giriş için)">
          <Input
            value={form.username}
            onChange={(e) =>
              setForm({
                ...form,
                username: e.target.value.toLowerCase().replace(/\s+/g, ""),
              })
            }
            placeholder="kullanici_adi"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-slate-500">
            3-32 karakter; küçük harf, rakam ve <code>_ . -</code> kullanılabilir.
          </p>
        </Field>
        <Field label="Telefon (opsiyonel)">
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0532 ..."
          />
        </Field>
        <Field label="Şifre (en az 8 karakter)">
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Rol">
          <RoleSelector
            value={form.role}
            onChange={(r) => setForm({ ...form, role: r })}
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button
          variant="primary"
          onClick={submit}
          disabled={
            saving ||
            !form.fullName ||
            !usernameValid ||
            form.password.length < 8
          }
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Oluştur"}
        </Button>
      </div>
    </DialogShell>
  );
}

// =============================================================
// Edit dialog
// =============================================================

function EditUserDialog({
  user,
  currentUserId,
  onClose,
  onSaved,
}: {
  user: UserRow;
  currentUserId: string;
  currentRole: Role;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isSelf = user.id === currentUserId;
  const [form, setForm] = useState({
    fullName: user.fullName,
    phone: user.phone ?? "",
    role: user.role,
    password: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        fullName: form.fullName,
        phone: form.phone || null,
      };
      if (!isSelf && form.role !== user.role) body.role = form.role;
      if (form.password.length >= 8) body.password = form.password;

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Kaydedilemedi");
      toast({ variant: "success", title: "Güncellendi" });
      onSaved();
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell
      title={`Düzenle: ${user.username ?? user.fullName}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field label="Kullanıcı Adı">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {user.username ?? "—"}
            <span className="ml-1 text-xs text-slate-500">
              (değiştirilemez)
            </span>
          </div>
        </Field>
        <Field label="Ad Soyad">
          <Input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </Field>
        <Field label="Telefon">
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="Rol">
          {isSelf ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {ROLE_LABELS[form.role]}{" "}
              <span className="ml-1 text-xs text-slate-500">
                (kendi rolünüzü değiştiremezsiniz)
              </span>
            </div>
          ) : (
            <RoleSelector
              value={form.role}
              onChange={(r) => setForm({ ...form, role: r })}
            />
          )}
        </Field>
        <Field label="Yeni Şifre (boş bırak → değişmez)">
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button variant="primary" onClick={submit} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Kaydet
        </Button>
      </div>
    </DialogShell>
  );
}

// =============================================================
// Helpers
// =============================================================

function RoleSelector({
  value,
  onChange,
}: {
  value: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <div className="grid gap-2">
      {ASSIGNABLE_ROLES.map((r) => {
        const style = ROLE_BADGE_STYLE[r];
        const active = value === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
              active
                ? "border-emerald-400 bg-emerald-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <span
              className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
            >
              {ROLE_LABELS[r]}
            </span>
            <span className="flex-1 text-xs text-slate-600">
              {ROLE_DESCRIPTIONS[r]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
