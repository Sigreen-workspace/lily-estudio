"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"; // Apne project ke Supabase client path ke hisaab se adjust karein
import { QrCode, Upload, Save, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

export interface PaymentSupportConfig {
  enabled: boolean;
  upi_id: string;
  payee_name: string;
  qr_url: string;
  note: string;
}

const DEFAULT_CONFIG: PaymentSupportConfig = {
  enabled: true,
  upi_id: "",
  payee_name: "Gaindlal Kosma",
  qr_url: "",
  note: "100% voluntary contribution to keep Lily Estudio free for students.",
};

export default function PaymentQrManager() {
  const supabase = createClient();
  const [config, setConfig] = useState<PaymentSupportConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "payment_support")
        .single();

      if (data?.value) {
        setConfig({ ...DEFAULT_CONFIG, ...(data.value as Partial<PaymentSupportConfig>) });
      }
      setLoading(false);
    }
    loadConfig();
  }, [supabase]);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMsg(null);

    try {
      const ext = file.name.split(".").pop() || "png";
      const filePath = `payment-qr-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("site-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filePath);

      setConfig((prev) => ({ ...prev, qr_url: publicUrlData.publicUrl }));
      setStatusMsg("QR image uploaded! Click 'Save Settings' to publish.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload QR image.";
      setStatusMsg(`Error: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const { error } = await supabase.from("site_settings").upsert({
        key: "payment_support",
        value: config,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setStatusMsg("Payment & Support QR settings saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings.";
      setStatusMsg(`Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-3xl border border-slate-200 flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading payment settings...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#74B49B]/15 text-[#427563] flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Admin · Support &amp; Payment QR Control
            </h2>
            <p className="text-xs text-slate-500">
              Manage the UPI QR code and donation visibility across the platform.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
            config.enabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {config.enabled ? (
            <>
              <Eye className="w-3.5 h-3.5" /> Publicly Visible
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Hidden from Users
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: QR Upload & Preview */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            UPI QR Code Image
          </label>
          <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col items-center justify-center text-center gap-3">
            {config.qr_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.qr_url}
                alt="Current Payment QR"
                className="w-44 h-44 object-contain rounded-xl bg-white border border-slate-200 p-2"
              />
            ) : (
              <div className="w-44 h-44 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                No QR uploaded yet
              </div>
            )}

            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-[#5C899D]" />
              )}
              <span>{uploading ? "Uploading..." : "Upload / Replace QR"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleQrUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Right: UPI Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              UPI ID
            </label>
            <input
              type="text"
              value={config.upi_id}
              onChange={(e) => setConfig((prev) => ({ ...prev, upi_id: e.target.value }))}
              placeholder="e.g. gaindlal@okicici"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payee / Display Name
            </label>
            <input
              type="text"
              value={config.payee_name}
              onChange={(e) => setConfig((prev) => ({ ...prev, payee_name: e.target.value }))}
              placeholder="e.g. Gaindlal Kosma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Support Message
            </label>
            <textarea
              rows={3}
              value={config.note}
              onChange={(e) => setConfig((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Settings</span>
        </button>
      </div>
    </form>
  );
}