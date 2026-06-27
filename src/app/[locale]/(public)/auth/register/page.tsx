"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Mayúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["bg-red-400", "bg-amber-400", "bg-emerald-400"];
  if (!password) return null;
  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : "bg-[var(--border)]"}`} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map(c => (
          <span key={c.label} className={`text-[10px] font-bold transition-colors ${c.ok ? "text-emerald-600" : "text-[var(--text-muted)]"}`}>
            {c.ok ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "es";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error === "Email already registered"
          ? "Este correo ya tiene una cuenta. ¿Quieres iniciar sesión?"
          : data.error ?? "Error al registrar";
        toast.error(msg);
        return;
      }
      toast.success("¡Cuenta creada! Inicia sesión para continuar.", {
        description: "Bienvenido a Hoteles Boutique.",
      });
      router.push(`/${locale}/auth/login`);
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex bg-[var(--background)] overflow-hidden">

      {/* ── Left Panel: Decorative ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative aurora-bg noise items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[25%] right-[10%] w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[100px] animate-orb" />
          <div className="absolute bottom-[15%] left-[15%] w-[250px] h-[250px] rounded-full bg-[var(--gold)]/10 blur-[80px] animate-orb" style={{ animationDelay: "2s" }} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full border border-white/5 animate-spin-slow" />
        </div>

        <div className="absolute top-[18%] left-[22%] w-2 h-2 rounded-full bg-[var(--gold)]/30 animate-particle" />
        <div className="absolute top-[55%] right-[18%] w-1.5 h-1.5 rounded-full bg-white/20 animate-particle-d1" />
        <div className="absolute bottom-[25%] left-[35%] w-1 h-1 rounded-full bg-emerald-400/30 animate-particle-d2" />

        <div className="relative z-10 max-w-sm text-center px-8">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center mx-auto mb-8 animate-glow-ring">
            <span className="text-3xl font-black text-[var(--gold-shine)]">HB</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-4 leading-tight animate-text-reveal">
            Únete a la<br />
            <span className="text-[var(--gold-shine)]">experiencia</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-10 animate-text-reveal-d1">
            Crea tu cuenta y accede a cientos de hoteles boutique exclusivos en toda Latinoamérica.
          </p>

          <div className="grid grid-cols-3 gap-3 animate-text-reveal-d2">
            {[
              { icon: "🔐", label: "Cuenta segura" },
              { icon: "🏨", label: "411+ hoteles" },
              { icon: "⭐", label: "Sin comisiones" },
            ].map(b => (
              <div key={b.label} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-lg mb-1">{b.icon}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Register Form ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px] animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--text-primary)] rounded-2xl mb-4">
              <span className="text-lg font-black text-[var(--gold-shine)]">HB</span>
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Hoteles<span className="text-[var(--gold)]">Boutique</span>
            </h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2">
              Crear cuenta
            </h1>
            <p className="text-sm text-[var(--text-muted)] font-medium">
              Regístrate gratis y accede a experiencias exclusivas.
            </p>
          </div>

          {/* Google SSO */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: `/${locale}/hotels` })}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-white py-3.5 text-sm font-bold text-[var(--text-primary)] transition-all hover:border-[var(--gold)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] group mb-6"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Registrarse con Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-[var(--background)] px-4 text-[var(--text-muted)] font-bold uppercase tracking-widest">
                o continúa con email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                Nombre completo
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--gold)] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ingrid Torres"
                  className="w-full border border-[var(--border)] rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all bg-[var(--surface-2)] focus:bg-white placeholder:text-[var(--text-muted)]/50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                Correo electrónico
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--gold)] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full border border-[var(--border)] rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all bg-[var(--surface-2)] focus:bg-white placeholder:text-[var(--text-muted)]/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--gold)] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-[var(--border)] rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all bg-[var(--surface-2)] focus:bg-white placeholder:text-[var(--text-muted)]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Terms */}
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Al registrarte aceptas nuestros{" "}
              <a href="#" className="text-[var(--gold-dark)] font-bold hover:underline">Términos de Servicio</a>
              {" "}y{" "}
              <a href="#" className="text-[var(--gold-dark)] font-bold hover:underline">Política de Privacidad</a>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-dark rounded-2xl py-4 text-[12px] font-black tracking-[0.1em] uppercase disabled:opacity-50 group"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Creando cuenta...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Crear cuenta gratis
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-[var(--text-muted)] mt-8 font-medium">
            ¿Ya tienes cuenta?{" "}
            <a href={`/${locale}/auth/login`} className="text-[var(--gold-dark)] font-bold hover:text-[var(--gold)] transition-colors">
              Iniciar sesión
            </a>
          </p>

          <p className="text-center text-[10px] text-[var(--text-muted)]/50 mt-10 font-medium uppercase tracking-widest">
            © {new Date().getFullYear()} HotelesBoutique
          </p>
        </div>
      </div>
    </main>
  );
}