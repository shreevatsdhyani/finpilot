"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/ui/shared";
import { getSettings, updateSettings } from "@/lib/api";
import type { UserSettings } from "@/types/api";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSuccess(false);
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!settings) return null;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Locale</Label>
            <Input value={settings.locale} onChange={(e) => setSettings({ ...settings, locale: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notifications"
              checked={settings.notifications}
              onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
            />
            <Label htmlFor="notifications">Enable Notifications</Label>
          </div>
          {success && <p className="text-sm text-green-600">Settings saved!</p>}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
