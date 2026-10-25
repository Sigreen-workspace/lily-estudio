import React from "react";
import { AlertTriangle, RotateCcw, Ban, UserX, Trash2 } from "lucide-react";
import RoleBadge from "@/components/RoleBadge";
import { UserProfile, MentorProfile } from "@/lib/supabase";

interface UsersTabProps {
  usersList: UserProfile[];
  mentorsList: MentorProfile[];
  processingId: string | null;
  onModerate: (userId: string, status: "active" | "warned" | "suspended", hours?: number) => void;
  onDemote: (userId: string, name: string) => void;
  onDelete: (userId: string, name: string) => void;
}

export default function UsersRegistryTab({ usersList, mentorsList, processingId, onModerate, onDemote, onDelete }: UsersTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-800">User Accounts &amp; Moderation Registry</h2>
        <p className="text-xs text-slate-500">Role assignments and safety controls.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
              <th className="py-2.5 px-3">User Name</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersList.map((u) => {
              const matchedMentor = mentorsList.find((m) => m.user_id === u.id);
              const isMentorApproved = matchedMentor?.verification_status === "approved" || matchedMentor?.is_verified;

              return (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{u.full_name || "Anonymous Scholar"}</td>
                  <td className="py-2.5 px-3">
                    <RoleBadge role={u.role} isVerified={u.is_teacher_verified || isMentorApproved} />
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {u.account_status || "active"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {u.role !== "admin" ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button type="button" onClick={() => onModerate(u.id, "warned")} disabled={processingId === u.id} className="px-2 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-50">
                          <AlertTriangle className="w-3 h-3 inline" /> Warn
                        </button>
                        {u.account_status === "suspended" ? (
                          <button type="button" onClick={() => onModerate(u.id, "active")} disabled={processingId === u.id} className="px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-50">
                            <RotateCcw className="w-3 h-3 inline" /> Unblock
                          </button>
                        ) : (
                          <button type="button" onClick={() => onModerate(u.id, "suspended", 24)} disabled={processingId === u.id} className="px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-50">
                            <Ban className="w-3 h-3 inline" /> Suspend
                          </button>
                        )}
                        {(u.role === "teacher" || u.role === "mentor") && (
                          <button type="button" onClick={() => onDemote(u.id, u.full_name || "")} disabled={processingId === u.id} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-50">
                            <UserX className="w-3 h-3 inline" /> {processingId === u.id ? "..." : "Demote"}
                          </button>
                        )}
                        <button type="button" onClick={() => onDelete(u.id, u.full_name || "")} disabled={processingId === u.id} className="px-2 py-1 bg-rose-700 text-white text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-50">
                          <Trash2 className="w-3 h-3 inline" /> Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">Root Admin</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}