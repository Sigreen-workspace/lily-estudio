import React from "react";
import { Plus, Pencil, Trash2, User } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image_url: string;
  bio: string;
  display_order: number;
}

interface TeamTabProps {
  teamList: TeamMember[];
  showAddTeam: boolean;
  setShowAddTeam: (val: boolean) => void;
  editingTeamId: string | null;
  teamName: string;
  setTeamName: (v: string) => void;
  teamRole: string;
  setTeamRole: (v: string) => void;
  teamImage: string;
  setTeamImage: (v: string) => void;
  teamBio: string;
  setTeamBio: (v: string) => void;
  teamOrder: string;
  setTeamOrder: (v: string) => void;
  isSubmittingTeam: boolean;
  onSave: (e: React.FormEvent) => void;
  onEdit: (m: TeamMember) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
}

export default function TeamManagementTab({
  teamList,
  showAddTeam,
  setShowAddTeam,
  editingTeamId,
  teamName,
  setTeamName,
  teamRole,
  setTeamRole,
  teamImage,
  setTeamImage,
  teamBio,
  setTeamBio,
  teamOrder,
  setTeamOrder,
  isSubmittingTeam,
  onSave,
  onEdit,
  onDelete,
  onReset,
}: TeamTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">About Us / Team Management</h2>
          <p className="text-xs text-slate-500">Manage founders and leadership displayed on the public About Us page.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showAddTeam) onReset();
            else {
              onReset();
              setShowAddTeam(true);
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-2xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {showAddTeam ? "Close Form" : "Add Team Member"}
        </button>
      </div>

      {showAddTeam && (
        <form onSubmit={onSave} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm">
            {editingTeamId ? "Edit Team Member Profile" : "Add New Team Member Profile"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role / Designation *</label>
              <input
                type="text"
                required
                value={teamRole}
                onChange={(e) => setTeamRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Display Order</label>
              <input
                type="number"
                min="1"
                value={teamOrder}
                onChange={(e) => setTeamOrder(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Image URL</label>
            <input
              type="url"
              value={teamImage}
              onChange={(e) => setTeamImage(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Short Biography</label>
            <textarea
              rows={2}
              value={teamBio}
              onChange={(e) => setTeamBio(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onReset} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-200/60 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSubmittingTeam} className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl shadow-xs cursor-pointer">
              {isSubmittingTeam ? "Saving..." : editingTeamId ? "Update Member" : "Save Member"}
            </button>
          </div>
        </form>
      )}

      {teamList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No team members added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamList.map((m) => (
            <div key={m.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col items-center text-center space-y-3">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/30 bg-slate-100 flex items-center justify-center">
                {m.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{m.name}</h4>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {m.role}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{m.bio}</p>
              <div className="w-full pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Order: #{m.display_order}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => onEdit(m)} className="p-1.5 text-slate-500 hover:text-emerald-600 cursor-pointer">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => onDelete(m.id)} className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}