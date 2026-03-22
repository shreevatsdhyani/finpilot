"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, Skeleton } from "@/components/ui/shared";
import { getMe, getSettings, updateMe, updateSettings } from "@/lib/api";
import type { User, UserSettings } from "@/types/api";
import { AlertCircle, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<UserSettings | null>(null);
  const [initialDisplayName, setInitialDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isDirty = (
    displayName !== initialDisplayName ||
    !!settings && !!initialSettings && (
      settings.theme !== initialSettings.theme ||
      settings.notifications !== initialSettings.notifications ||
      (settings as any).risk_profile !== (initialSettings as any).risk_profile ||
      (settings as any).store_salary_files !== (initialSettings as any).store_salary_files ||
      (settings as any).store_voice_transcripts !== (initialSettings as any).store_voice_transcripts
    )
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, settingsRes] = await Promise.all([getMe(), getSettings()]);
        setUser(userRes);
        setDisplayName(userRes.name || "");
        setInitialDisplayName(userRes.name || "");
        setSettings(settingsRes);
        setInitialSettings(settingsRes);
      } catch (e) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError("");
    try {
      // Update user name if changed
      if (displayName !== initialDisplayName) {
        const updatedUser = await updateMe({ name: displayName });
        setUser(updatedUser);
        setInitialDisplayName(displayName);
        toast.success("Display name updated");
      }

      // Update settings if changed
      if (settings && (
        settings.theme !== initialSettings?.theme ||
        settings.notifications !== initialSettings?.notifications ||
        (settings as any).risk_profile !== (initialSettings as any).risk_profile ||
        (settings as any).store_salary_files !== (initialSettings as any).store_salary_files ||
        (settings as any).store_voice_transcripts !== (initialSettings as any).store_voice_transcripts
      )) {
        const updated = await updateSettings(settings);
        setSettings(updated);
        setInitialSettings(updated);
        
        // Apply theme change in real-time
        if (updated.theme !== initialSettings?.theme) {
          setTheme(updated.theme);
        }
        
        toast.success("Settings updated");
      }

      setLastSaved(new Date());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save settings";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [displayName, initialDisplayName, settings, initialSettings, setTheme]);

  const handleDeleteLocalData = useCallback(async () => {
    setShowDeleteConfirm(false);
    setSaving(true);
    try {
      // TODO: Implement DELETE /v1/settings/local-data endpoint
      toast.success("Local data deleted (endpoint pending)");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete data");
    } finally {
      setSaving(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || !settings) {
    return <ErrorState message="Failed to load settings" />;
  }

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Status line */}
      {lastSaved ? (
        <div className="text-xs text-muted-foreground">
          Saved • {formatTimestamp(lastSaved)}
        </div>
      ) : saveError ? (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          Failed to save — {saveError}
        </div>
      ) : null}

      {/* A) Account */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-4">Account</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-xs font-medium">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B) Appearance */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-4">Appearance</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-xs font-medium">Theme</Label>
              <select
                id="theme"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <p className="text-[10px] text-muted-foreground">Affects display only.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* C) Planning Defaults */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-4">Planning Defaults</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="risk-profile" className="text-xs font-medium">Risk profile</Label>
              <select
                id="risk-profile"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                value={(settings as any).risk_profile || "balanced"}
                onChange={(e) => setSettings({ ...settings, risk_profile: e.target.value } as any)}
              >
                <option value="conservative">🛡️ Conservative — FDs, liquid funds, stable returns</option>
                <option value="balanced">⚖️ Balanced — Mix of growth and stability</option>
                <option value="aggressive">📈 Aggressive — Equities, mutual funds, high growth</option>
              </select>
              <p className="text-[10px] text-muted-foreground">Used to tailor projections, investment recommendations, and risk buckets. Changes apply to all future planning outputs.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D) Data & Privacy */}
      <Card className="border-border/70">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-4">Data & Privacy</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="store-salary"
                checked={(settings as any).store_salary_files ?? true}
                onChange={(e) => setSettings({ ...settings, store_salary_files: e.target.checked } as any)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor="store-salary" className="text-xs font-medium cursor-pointer">Store salary files locally</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Keeps uploaded documents on your device for instant access.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="store-voice"
                checked={(settings as any).store_voice_transcripts ?? true}
                onChange={(e) => setSettings({ ...settings, store_voice_transcripts: e.target.checked } as any)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor="store-voice" className="text-xs font-medium cursor-pointer">Store voice transcripts</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Retains chat history and conversation data on this device.</p>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 mt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Danger Zone</p>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete all local data
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2">You control what FinPilot retains.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        size="lg"
        onClick={handleSave}
        disabled={!isDirty || saving}
        className="w-full"
      >
        {saving ? "Saving…" : isDirty ? "Save Settings" : "No changes"}
      </Button>

      {/* Delete confirmation modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all local data?</DialogTitle>
            <DialogDescription>
              This will permanently delete:
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-1.5 text-foreground">
            <p>• Salary documents</p>
            <p>• Expense entries</p>
            <p>• Goals and targets</p>
            <p>• Forecasts and scenarios</p>
            <p>• Recommendations</p>
            <p>• Audit logs</p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLocalData}
              disabled={saving}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
