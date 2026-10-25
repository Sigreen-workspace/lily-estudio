import React from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { SocialContactsSettings } from "@/lib/supabase";

interface SocialSettingsTabProps {
  socials: SocialContactsSettings;
  setSocials: React.Dispatch<React.SetStateAction<SocialContactsSettings>>;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
  savedMsg: boolean;
}

export default function SocialSettingsTab({
  socials,
  setSocials,
  onSave,
  saving,
  savedMsg,
}: SocialSettingsTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-800">Dynamic Social Media &amp; Support Contacts</h2>
        <p className="text-xs text-slate-500">
          Update your channels and contact details at any time. Blank fields will be automatically hidden.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Social media links and contact details updated successfully across the platform!</span>
        </div>
      )}

      <form onSubmit={onSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Official Support Email</label>
            <input
              type="email"
              required
              value={socials.email}
              onChange={(e) => setSocials({ ...socials, email: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Project Lead / Contact Email</label>
            <input
              type="email"
              required
              value={socials.lead_email}
              onChange={(e) => setSocials({ ...socials, lead_email: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">YouTube Channel URL</label>
            <input
              type="url"
              value={socials.youtube}
              onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Instagram Profile / Page URL</label>
            <input
              type="url"
              value={socials.instagram || ""}
              onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">LinkedIn Profile / Page URL</label>
            <input
              type="url"
              value={socials.linkedin}
              onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">GitHub Repository / Org URL</label>
            <input
              type="url"
              value={socials.github}
              onChange={(e) => setSocials({ ...socials, github: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Settings..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}