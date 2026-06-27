import Link from "next/link";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export default function RootLanguageSelection() {
  return (
    <main className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-black ${outfit.className}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-xl p-8 mx-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl mb-6 shadow-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Boutique Hotels
          </h1>
          <p className="text-stone-400 text-lg max-w-sm mx-auto">
            Choose your language / Elige tu idioma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/en" className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-4xl mb-4 block">🇬🇧</span>
              <h2 className="text-xl font-semibold text-white mb-2">English</h2>
              <p className="text-sm text-stone-400">Continue in English</p>
            </div>
          </Link>

          <Link href="/es" className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-4xl mb-4 block">🇪🇸</span>
              <h2 className="text-xl font-semibold text-white mb-2">Español</h2>
              <p className="text-sm text-stone-400">Continuar en Español</p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} Boutique Hotels Platform. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}