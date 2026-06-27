import Link from "next/link";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export default function RootLanguageSelection() {
  return (
    <main className={`relative min-h-screen overflow-hidden bg-stone-950 ${outfit.className}`}>
      <div className="absolute inset-0">
        <img
          src="/images/lastarria-boutique-hotel.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/48 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-5 py-8">
        <header className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-xs font-black tracking-tight backdrop-blur-xl">
              HB
            </span>
            <span className="text-sm font-black tracking-tight">Hoteles Boutique</span>
          </div>
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-white/55 sm:block">
            Curated stays
          </span>
        </header>

        <section className="grid items-end gap-10 py-16 md:grid-cols-[1fr_360px]">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gold-shine)] backdrop-blur-xl">
              Boutique hotel platform
            </p>
            <h1 className="text-5xl font-black leading-[0.94] tracking-tight text-white md:text-7xl">
              Boutique Hotels
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium leading-7 text-white/72 md:text-lg">
              Elige tu idioma y entra a una experiencia de reservas mas cuidada, visual y directa.
            </p>
          </div>

          <div className="grid gap-3 rounded-xl border border-white/15 bg-white/12 p-3 shadow-2xl backdrop-blur-2xl">
            <Link href="/es" className="group rounded-lg border border-white/12 bg-white/92 p-5 text-stone-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--gold-lighter)] text-sm font-black">ES</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-black">Espanol</h2>
                  <p className="text-sm font-medium text-stone-500">Continuar en espanol</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            <Link href="/en" className="group rounded-lg border border-white/12 bg-white/8 p-5 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/14">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-sm font-black">EN</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-black">English</h2>
                  <p className="text-sm font-medium text-white/55">Continue in English</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-white/45 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          </div>
        </section>

        <footer className="flex flex-col gap-2 text-xs font-medium text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Boutique Hotels Platform</span>
          <span>Experiencias exclusivas en Chile y Latinoamerica</span>
        </footer>
      </div>
    </main>
  );
}
