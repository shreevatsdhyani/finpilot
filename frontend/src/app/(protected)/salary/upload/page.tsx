"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadSalary } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SalaryUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const doc = await uploadSalary(file);
      router.push(`/salary/verify/${doc.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Upload Salary Slip</h1>
      <Card>
        <CardHeader>
          <CardTitle>Select File</CardTitle>
          <CardDescription>Upload a PDF or image of your salary slip for OCR extraction.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="file">Salary Slip</Label>
              <Input id="file" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button type="submit" disabled={!file || loading} className="w-full">
              {loading ? "Uploading…" : "Upload & Extract"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
