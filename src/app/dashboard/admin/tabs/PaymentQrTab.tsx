"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { QrCode, Upload, Save, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

export interface PaymentSupportSettings {
  enabled: boolean;
  upi_id: string;
  payee_name: string;
  qr_url: string;
  note: string;
}

interface PaymentQrTabProps {
  paymentSettings: PaymentSupportSettings;
  setPaymentSettings: React.Dispatch<React.SetStateAction<PaymentSupportSettings>>;
  onSave: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  savedMsg: boolean;
}

export default function PaymentQrTab({
  paymentSettings,
  setPaymentSettings,
  onSave,
  saving,
  savedMsg,
}: PaymentQrTabProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadErr(null);

    try {
      const ext = file.name.split(".").pop() || "png";
      const filePath = `payment-qr-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filePath);

      setPaymentSettings((prev) => ({
        ...prev,
        qr_url: urlData.publicUrl,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload QR image.";
      setUploadErr(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={onSave}
      className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#427563] flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">
              Payment &amp; Voluntary Support QR
            </h2>
            <p className="text-xs text-slate-500">
              Upload your UPI QR code, set UPI ID, and toggle public visibility on /support.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setPaymentSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
          }
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
            paymentSettings.enabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {paymentSettings.enabled ? (
            <>
              <Eye className="w-3.5 h-3.5" /> Visible to Users
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Hidden from Users
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* QR Upload & Preview */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            UPI QR Code Image
          </label>
          <div className="p-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col items-center justify-center text-center gap-3">
            {paymentSettings.qr_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={paymentSettings.qr_url}
                alt="Payment QR Preview"
                className="w-48 h-48 object-contain rounded-xl bg-white border border-slate-200 p-2"
              />
            ) : (
              <div className="w-48 h-48 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                No QR uploaded yet
              </div>
            )}

            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer">
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

            {uploadErr && (
              <p className="text-[11px] text-rose-600 font-medium">{uploadErr}</p>
            )}
          </div>
        </div>

        {/* UPI Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              UPI ID
            </label>
            <input
              type="text"
              value={paymentSettings.upi_id}
              onChange={(e) =>
                setPaymentSettings((prev) => ({ ...prev, upi_id: e.target.value }))
              }
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
              value={paymentSettings.payee_name}
              onChange={(e) =>
                setPaymentSettings((prev) => ({ ...prev, payee_name: e.target.value }))
              }
              placeholder="Gaindlal Kosma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Support Note
            </label>
            <textarea
              rows={3}
              value={paymentSettings.note}
              onChange={(e) =>
                setPaymentSettings((prev) => ({ ...prev, note: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>
        </div>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Payment QR &amp; Support settings updated live!</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Payment Settings</span>
        </button>
      </div>
    </form>
  );
}