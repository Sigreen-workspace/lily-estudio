import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";

export default function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#A7D7C5]/30 flex items-center justify-center text-[#5C899D]">
        <Clock className="w-7 h-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{title}</h1>
        <p className="text-sm sm:text-base text-slate-600">{description}</p>
      </div>
      <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Scheduled for future phases
      </div>
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#5C899D] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Homepage
        </Link>
      </div>
    </div>
  );
}