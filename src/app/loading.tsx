export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-[#A7D7C5] border-t-[#74B49B] rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading Lily Estudio...</p>
      </div>
    </div>
  );
}