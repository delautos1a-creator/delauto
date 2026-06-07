"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const inviteSchema = z.object({
  email: z.string().email("Unesite validan email"),
  password: z.string().min(8, "Minimalno 8 karaktera"),
  name: z.string().min(1, "Obavezno"),
  role: z.enum(["admin", "staff"]),
});

type InviteForm = z.infer<typeof inviteSchema>;

export default function AdminUsers() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "staff" },
  });

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: InviteForm) => {
    setSaving(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, role: data.role } },
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Korisnik kreiran. Provjeri email za potvrdu.");
    reset();
    setOpen(false);
    setTimeout(load, 1500);
  };

  const updateRole = async (id: string | null, role: string) => {
    if (!id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("profiles").update({ role } as any).eq("id", id);
    if (error) { toast.error("Greška"); return; }
    toast.success("Rola ažurirana");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Korisnici</h1>
          <p className="text-sm text-muted-foreground">{users.length} korisnika</p>
        </div>
        <Button onClick={() => { reset({ role: "staff" }); setOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novi korisnik
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nema korisnika.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{u.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Select value={u.role ?? "staff"} onValueChange={(v) => updateRole(u.id ?? "", v ?? "")}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novi korisnik</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Ime *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input {...register("email")} type="email" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Lozinka *</Label>
              <Input {...register("password")} type="password" />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Rola</Label>
              <Controller name="role" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Kreiranje..." : "Kreiraj korisnika"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Odustani</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
