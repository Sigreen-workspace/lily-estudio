import React from "react";
import Link from "next/link";
import { AlertCircle, FolderSearch, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
}: EmptyStateProps) {
  return (
    <div className="w-full bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {(actionLabel && actionHref) && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl shadow-2xs transition"
        >
          {actionLabel}
        </Link>
      )}
      {(actionLabel && onActionClick) && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl shadow-2xs transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorStateCard({
  message = "Unable to fetch academic records. Please verify your connection.",
  onRetry,
}: ErrorCardProps) {
  return (
    <div className="w-full bg-rose-50/70 border border-rose-200/80 rounded-3xl p-6 text-rose-900 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-rose-600" />
        </div>
        <div className="text-left space-y-0.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">Sync Error</h4>
          <p className="text-xs text-rose-700">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-xl transition shadow-2xs shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

export function CardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-28 bg-slate-100/90 rounded-3xl animate-pulse border border-slate-200/50"
        />
      ))}
    </div>
  );
}