import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
      <h2 className="text-4xl font-extrabold text-slate-800">404</h2>
      <p className="text-base text-slate-600">This study page does not exist or has moved.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#74B49B] text-white rounded-xl hover:bg-[#5f9c85] transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Safety
      </Link>
    </div>
  );
}