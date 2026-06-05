import React, { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../Services/AuthService";
import { useAuth } from "../Context/AuthContext";

type Screen = "login" | "forgot" | "otp" | "reset" | "success" | "otp_login_request" | "otp_login_verify";

interface LoginForm { email: string; password: string; remember: boolean; }
interface ResetForm { newPassword: string; confirmPassword: string; }

/* ── Password rules ── */
interface Rule { label: string; test: (pw: string) => boolean; }
const PW_RULES: Rule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter (a–z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number (0–9)", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character (!@#$…)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];
const getStrength = (pw: string) => PW_RULES.filter((r) => r.test(pw)).length;
const strengthLabel = (n: number) => ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"][n] ?? "Very Strong";
const strengthColor = (n: number) =>
  n <= 1 ? "#ef4444" : n === 2 ? "#f97316" : n === 3 ? "#eab308" : n === 4 ? "#22c55e" : "#16a34a";

/* ─────────── SVG Icons ─────────── */
const VanIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M1 3h15v13H1z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M16 8h4l3 3v5h-7V8z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="5.5" cy="18.5" r="2.5" stroke="white" strokeWidth="1.8" />
    <circle cx="18.5" cy="18.5" r="2.5" stroke="white" strokeWidth="1.8" />
  </svg>
);

const VanIconPurple = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M1 3h15v13H1z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M16 8h4l3 3v5h-7V8z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="5.5" cy="18.5" r="2.5" stroke="white" strokeWidth="1.8" />
    <circle cx="18.5" cy="18.5" r="2.5" stroke="white" strokeWidth="1.8" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="rgba(124,58,237,0.10)" />
    <circle cx="12" cy="11" r="2.5" fill="#7C3AED" />
    <path d="M12 13.5v2.5" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="#94A3B8" strokeWidth="1.8" />
    <path d="m2 7 10 7 10-7" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#94A3B8" strokeWidth="1.8" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const EyeOpen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#94A3B8" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3" stroke="#94A3B8" strokeWidth="1.8" />
  </svg>
);

const EyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="1" y1="1" x2="23" y2="23" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    <polyline points="12 5 19 12 12 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <line x1="19" y1="12" x2="5" y2="12" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
    <polyline points="12 19 5 12 12 5" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckTiny = () => (
  <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin shrink-0">
    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ─────────── Shared primitives ─────────── */
const fw: React.CSSProperties = { fontFamily: "Manrope, sans-serif" };

const FieldWrap = ({ focused, hasError, children }: { focused: boolean; hasError: boolean; children: React.ReactNode }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 13px", background: "white", borderRadius: 9,
    border: `1.5px solid ${hasError ? "#f87171" : focused ? "#7C3AED" : "#e2e8f0"}`,
    boxShadow: hasError ? "0 0 0 3px rgba(248,113,113,0.10)" : focused ? "0 0 0 3px rgba(124,58,237,0.09)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  }}>{children}</div>
);

const iStyle: React.CSSProperties = {
  flex: 1, border: "none", outline: "none", background: "transparent",
  fontSize: 13.5, fontWeight: 500, color: "#1e293b", ...fw,
};

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5, ...fw }}>{children}</label>
);

const Err = ({ msg }: { msg: string }) => (
  <p style={{ fontSize: 11.5, color: "#ef4444", fontWeight: 600, margin: "4px 0 0", ...fw }}>{msg}</p>
);

const PBtn = ({ children, loading, disabled, onClick, type = "submit" }:
  { children: React.ReactNode; loading?: boolean; disabled?: boolean; onClick?: () => void; type?: "submit" | "button" }) => (
  <button
    type={type} disabled={loading || disabled} onClick={onClick}
    className={`w-full flex items-center justify-center gap-2 py-[18px] h-[40px] px-5 rounded-[30px] border-none text-sm font-bold text-white transition-all duration-150 ${loading || disabled
      ? "bg-violet-300 cursor-not-allowed"
      : "bg-[#7C3AED] shadow-[0_3px_14px_rgba(124,58,237,0.28)] cursor-pointer hover:bg-[#6D28D9] hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(124,58,237,0.38)]"
      }`}
    style={fw}
  >
    {loading ? <><Spinner /> Processing…</> : children}
  </button>
);

/* ─────────── Password strength ─────────── */
const PwStrength = ({ pw }: { pw: string }) => {
  const s = getStrength(pw);
  return (
    <div style={{ marginTop: 12, padding: "14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 3, background: i <= s ? strengthColor(s) : "#cbd5e1", transition: "background 0.2s" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", ...fw }}>Strength</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: strengthColor(s), ...fw }}>{strengthLabel(s)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {PW_RULES.map((rule) => {
          const ok = rule.test(pw);
          return (
            <div key={rule.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: ok ? "#22c55e" : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                {ok && <CheckTiny />}
              </div>
              <span style={{ fontSize: 12, color: ok ? "#334155" : "#64748b", fontWeight: ok ? 700 : 500, ...fw }}>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────── LEFT PANEL ─────────── */
const LeftPanel = () => (
  <div
    className="hidden lg:flex"
    style={{
      width: "44%", minWidth: 400, flexShrink: 0,
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", padding: "0 48px",
      background: "linear-gradient(155deg, #6D28D9 0%, #7C3AED 40%, #4C1D95 100%)",
    }}
  >
    {/* Dot grid overlay */}
    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "34px 34px", pointerEvents: "none" }} />
    {/* Glow orbs */}
    <div style={{ position: "absolute", top: -120, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", bottom: -100, left: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

    {/* Logo */}
    <div style={{ position: "absolute", top: 32, left: 44, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
        <VanIcon />
      </div>
      <span style={{ fontSize: 19, fontWeight: 800, color: "white", letterSpacing: "-0.2px", ...fw }}>VanLoka</span>
    </div>

    {/* Center hero */}
    <div style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 320 }}>
      <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: "0 0 50px rgba(255,255,255,0.10), 0 8px 28px rgba(0,0,0,0.18)" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M1 3h15v13H1z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(255,255,255,0.1)" />
          <path d="M16 8h4l3 3v5h-7V8z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(255,255,255,0.1)" />
          <circle cx="5.5" cy="18.5" r="2.5" stroke="white" strokeWidth="1.6" fill="rgba(255,255,255,0.15)" />
          <circle cx="18.5" cy="18.5" r="2.5" stroke="white" strokeWidth="1.6" fill="rgba(255,255,255,0.15)" />
        </svg>
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "white", lineHeight: 1.18, margin: "0 0 14px", letterSpacing: "-0.6px", ...fw }}>
        Drive smarter.<br />Manage better.
      </h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.62)", lineHeight: 1.68, margin: "0 0 36px", ...fw }}>
        Your complete fleet operations platform — built for speed, reliability, and scale.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center" }}>
        {["🛰️ GPS Tracking", "📋 Compliance", "📊 Analytics"].map((b) => (
          <span key={b} style={{ padding: "7px 16px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 99, fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.90)", ...fw }}>
            {b}
          </span>
        ))}
      </div>
    </div>
  </div>
);

/* ─────────── MOBILE NAVBAR ─────────── */
const MobileNavbar = () => (
  <div
    className="flex lg:hidden items-center shrink-0"
    style={{ height: 56, padding: "0 20px", background: "white", borderBottom: "1px solid #eef0f5" }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <VanIconPurple />
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px", ...fw }}>VanLoka</span>
    </div>
  </div>
);

/* ─────────── LOGIN FORM ─────────── */
const LoginFormScreen = ({ onForgot, onOtpLogin }: { onForgot: () => void; onOtpLogin: () => void }) => {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "", remember: false });
  const [showPw, setShowPw] = useState(false);
  const [focus, setFocus] = useState<"e" | "p" | null>(null);
  const [errs, setErrs] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setAuthFromMe } = useAuth();

  const handle = (f: keyof LoginForm) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [f]: v }));
    setErrs((p) => ({ ...p, [f]: "", general: "" }));
  };

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login({ email: form.email, password: form.password } as any);
      const userData = result?.data?.user || result?.user || result?.data || {};
      setAuthFromMe({
        id: userData.id || 0,
        name: userData.name || userData.email || form.email,
        email: userData.email || form.email,
        roles: [userData.roleName || userData.role_name || "ORG_ADMIN"],
        permissions: userData.permissions || ["*"],
        tenant_id: String(userData.orgId || userData.org_id || ""),
        organization: userData.organization || null,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setErrs((p) => ({ ...p, general: err.response?.data?.error?.message || err.response?.data?.message || "Invalid credentials. Please verify your email and password." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F3EEFF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <ShieldIcon />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.4px", ...fw }}>Admin Login</h2>
        <p style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 500, margin: 0, ...fw }}>Manage your fleet and logistics operations</p>
      </div>

      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {errs.general && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", background: "#fef2f2", border: "1px solid #fee2e2",
            borderRadius: 10, margin: "0 0 4px",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 12.5, color: "#991b1b", fontWeight: 700, ...fw }}>{errs.general}</span>
          </div>
        )}

        {/* Email */}
        <div>
          <Lbl>Email Address</Lbl>
          <FieldWrap focused={focus === "e"} hasError={!!errs.email}>
            <MailIcon />
            <input type="email" value={form.email} onChange={handle("email")} onFocus={() => setFocus("e")} onBlur={() => setFocus(null)} placeholder="admin@vanloka.com" autoComplete="email" style={iStyle} />
          </FieldWrap>
          {errs.email && <Err msg={errs.email} />}
        </div>

        {/* Password */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <Lbl>Password</Lbl>
            <button type="button" onClick={onForgot} style={{ background: "none", border: "none", fontSize: 12.5, fontWeight: 700, color: "#7C3AED", cursor: "pointer", padding: 0, ...fw }}>
              Forgot Password?
            </button>
          </div>
          <FieldWrap focused={focus === "p"} hasError={!!errs.password}>
            <LockIcon />
            <input type={showPw ? "text" : "password"} value={form.password} onChange={handle("password")} onFocus={() => setFocus("p")} onBlur={() => setFocus(null)} placeholder="••••••••" autoComplete="current-password" style={{ ...iStyle, letterSpacing: showPw ? "normal" : "2px" }} />
            <button type="button" onClick={() => setShowPw((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, borderRadius: 5, display: "flex" }}>
              {showPw ? <EyeOpen /> : <EyeOff />}
            </button>
          </FieldWrap>
          <PwStrength pw={form.password} />
          {errs.password && <Err msg={errs.password} />}
        </div>

        {/* Remember me */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div
            onClick={() => setForm((p) => ({ ...p, remember: !p.remember }))}
            style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${form.remember ? "#7C3AED" : "#cbd5e1"}`, background: form.remember ? "#7C3AED" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", cursor: "pointer" }}
          >
            {form.remember && <CheckTiny />}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#475569", userSelect: "none", ...fw }}>Remember this device</span>
        </label>

        <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 10 }}>
          <PBtn loading={loading}>Sign In to Dashboard <ArrowRight /></PBtn>
          <button 
            type="button" 
            onClick={onOtpLogin} 
            style={{ 
              background: "transparent", 
              border: "1.5px solid #e2e8f0", 
              borderRadius: "30px", 
              padding: "14px", 
              fontSize: 13.5, 
              fontWeight: 700, 
              color: "#475569", 
              cursor: "pointer", 
              transition: "all 0.15s",
              ...fw 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            Or Sign in with OTP
          </button>
        </div>
      </form>
    </>
  );
};

/* ─────────── OTP LOGIN REQUEST SCREEN ─────────── */
const OtpLoginRequestScreen = ({ onBack, onSent }: { onBack: () => void; onSent: (e: string) => void }) => {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!email.trim()) { setErr("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("Enter a valid email."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    onSent(email);
  };

  return (
    <>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#7C3AED", padding: "0 0 18px", ...fw }}>
        <ArrowLeft /> Back to Login
      </button>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="#3B82F6" strokeWidth="1.8" fill="rgba(59,130,246,0.08)" />
            <path d="m2 7 10 7 10-7" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 5px", letterSpacing: "-0.3px", ...fw }}>Sign in with OTP</h2>
        <p style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 500, margin: 0, lineHeight: 1.6, ...fw }}>Enter your email — we'll send a 6-digit secure login code.</p>
      </div>
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <Lbl>Email Address</Lbl>
          <FieldWrap focused={focused} hasError={!!err}>
            <MailIcon />
            <input type="email" value={email} onChange={(ev) => { setEmail(ev.target.value); setErr(""); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="admin@vanloka.com" autoComplete="email" style={iStyle} />
          </FieldWrap>
          {err && <Err msg={err} />}
        </div>
        <PBtn loading={loading}>Send Login Code <ArrowRight /></PBtn>
      </form>
    </>
  );
};

/* ─────────── FORGOT PASSWORD ─────────── */
const ForgotFormScreen = ({ onBack, onSent }: { onBack: () => void; onSent: (e: string) => void }) => {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!email.trim()) { setErr("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("Enter a valid email."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    onSent(email);
  };

  return (
    <>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#7C3AED", padding: "0 0 18px", ...fw }}>
        <ArrowLeft /> Back to Login
      </button>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="#3B82F6" strokeWidth="1.8" fill="rgba(59,130,246,0.08)" />
            <path d="m2 7 10 7 10-7" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 5px", letterSpacing: "-0.3px", ...fw }}>Forgot Password?</h2>
        <p style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 500, margin: 0, lineHeight: 1.6, ...fw }}>Enter your email — we'll send a 6-digit reset code.</p>
      </div>
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <Lbl>Email Address</Lbl>
          <FieldWrap focused={focused} hasError={!!err}>
            <MailIcon />
            <input type="email" value={email} onChange={(ev) => { setEmail(ev.target.value); setErr(""); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="admin@vanloka.com" autoComplete="email" style={iStyle} />
          </FieldWrap>
          {err && <Err msg={err} />}
        </div>
        <PBtn loading={loading}>Send Reset Code <ArrowRight /></PBtn>
      </form>
    </>
  );
};

/* ─────────── OTP SCREEN ─────────── */
const OtpFormScreen = ({ email, onBack, onVerified, isLogin }: { email: string; onBack: () => void; onVerified: () => void; isLogin?: boolean }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [cd, setCd] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    if (cd <= 0) return;
    const t = setTimeout(() => setCd((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cd]);

  const change = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n); setErr("");
    if (v && i < 5) document.getElementById(`vl-otp-${i + 1}`)?.focus();
  };
  const keydown = (i: number, ev: React.KeyboardEvent) => {
    if (ev.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`vl-otp-${i - 1}`)?.focus();
  };
  const paste = (ev: React.ClipboardEvent) => {
    ev.preventDefault();
    const t = ev.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const n = [...otp]; for (let i = 0; i < 6; i++) n[i] = t[i] || ""; setOtp(n);
  };
  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setErr("Enter the complete 6-digit code."); return; }
    if (code !== "123456") { setErr("Invalid code. (Demo: use 123456)"); return; }
    setLoading(true); 
    await new Promise((r) => setTimeout(r, 1200)); 
    setLoading(false); 
    if (isLogin) {
      navigate("/dashboard");
    } else {
      onVerified();
    }
  };

  return (
    <>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#7C3AED", padding: "0 0 18px", ...fw }}>
        <ArrowLeft /> Back
      </button>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="2" width="14" height="20" rx="2" stroke="#F97316" strokeWidth="1.8" fill="rgba(249,115,22,0.08)" />
            <line x1="9" y1="7" x2="15" y2="7" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="9" y1="11" x2="15" y2="11" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="#F97316" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 5px", letterSpacing: "-0.3px", ...fw }}>Enter OTP</h2>
        <p style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 500, margin: 0, lineHeight: 1.6, ...fw }}>
          We sent a code to <strong style={{ color: "#374151" }}>{email}</strong>
        </p>
      </div>
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }} onPaste={paste}>
          {otp.map((d, i) => (
            <input key={i} id={`vl-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={(ev) => change(i, ev.target.value)} onKeyDown={(ev) => keydown(i, ev)}
              style={{ width: 46, height: 52, textAlign: "center", fontSize: 20, fontWeight: 800, color: "#0f172a", borderRadius: 10, outline: "none", ...fw, border: `2px solid ${err ? "#f87171" : d ? "#7C3AED" : "#e2e8f0"}`, background: d ? "#F3EEFF" : "white", transition: "all 0.15s" }}
            />
          ))}
        </div>
        {err && <span style={{ fontSize: 11.5, color: "#ef4444", fontWeight: 600, textAlign: "center", ...fw }}>{err}</span>}
        <PBtn loading={loading}>Verify Code <ArrowRight /></PBtn>
        <p style={{ textAlign: "center", fontSize: 12.5, color: "#94a3b8", margin: 0, ...fw }}>
          Didn't receive it?{" "}
          {cd > 0
            ? <span style={{ fontWeight: 600 }}>Resend in {cd}s</span>
            : <button type="button" onClick={() => setCd(30)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#7C3AED", padding: 0, ...fw }}>Resend Code</button>
          }
        </p>
      </form>
    </>
  );
};

/* ─────────── RESET PASSWORD ─────────── */
const ResetFormScreen = ({ onDone }: { onDone: () => void }) => {
  const [form, setForm] = useState<ResetForm>({ newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ n: false, c: false });
  const [focus, setFocus] = useState<"n" | "c" | null>(null);
  const [errs, setErrs] = useState<{ np?: string; cp?: string }>({});
  const [loading, setLoading] = useState(false);
  const s = getStrength(form.newPassword);

  const handle = (f: keyof ResetForm) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [f]: e.target.value }));
    setErrs((p) => ({ ...p, [f === "newPassword" ? "np" : "cp"]: "" }));
  };
  const validate = () => {
    const e: { np?: string; cp?: string } = {};
    if (!form.newPassword) e.np = "New password is required.";
    else if (s < 5) e.np = "Password does not meet all requirements.";
    if (!form.confirmPassword) e.cp = "Please confirm your password.";
    else if (form.newPassword !== form.confirmPassword) e.cp = "Passwords do not match.";
    setErrs(e);
    return !Object.keys(e).length;
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); await new Promise((r) => setTimeout(r, 1400)); setLoading(false); onDone();
  };

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#22c55e" strokeWidth="1.8" fill="rgba(34,197,94,0.08)" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="#22c55e" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.3px", ...fw }}>Set New Password</h2>
        <p style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 500, margin: 0, ...fw }}>Must meet all requirements below</p>
      </div>
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <Lbl>New Password</Lbl>
          <FieldWrap focused={focus === "n"} hasError={!!errs.np}>
            <LockIcon />
            <input type={show.n ? "text" : "password"} value={form.newPassword} onChange={handle("newPassword")} onFocus={() => setFocus("n")} onBlur={() => setFocus(null)} placeholder="Create a strong password" style={{ ...iStyle, letterSpacing: show.n ? "normal" : "2px" }} />
            <button type="button" onClick={() => setShow((s) => ({ ...s, n: !s.n }))} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, borderRadius: 5, display: "flex" }}>
              {show.n ? <EyeOpen /> : <EyeOff />}
            </button>
          </FieldWrap>
          <PwStrength pw={form.newPassword} />
          {errs.np && <Err msg={errs.np} />}
        </div>
        <div>
          <Lbl>Confirm Password</Lbl>
          <FieldWrap focused={focus === "c"} hasError={!!errs.cp}>
            <LockIcon />
            <input type={show.c ? "text" : "password"} value={form.confirmPassword} onChange={handle("confirmPassword")} onFocus={() => setFocus("c")} onBlur={() => setFocus(null)} placeholder="Re-enter your password" style={{ ...iStyle, letterSpacing: show.c ? "normal" : "2px" }} />
            <button type="button" onClick={() => setShow((s) => ({ ...s, c: !s.c }))} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, borderRadius: 5, display: "flex" }}>
              {show.c ? <EyeOpen /> : <EyeOff />}
            </button>
          </FieldWrap>
          {form.confirmPassword.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: form.newPassword === form.confirmPassword ? "#22c55e" : "#ef4444" }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: form.newPassword === form.confirmPassword ? "#22c55e" : "#ef4444", ...fw }}>
                {form.newPassword === form.confirmPassword ? "Passwords match" : "Passwords do not match"}
              </span>
            </div>
          )}
          {errs.cp && <Err msg={errs.cp} />}
        </div>
        <div style={{ marginTop: 2 }}>
          <PBtn loading={loading} disabled={s < 5}>Reset Password <ArrowRight /></PBtn>
        </div>
      </form>
    </>
  );
};

/* ─────────── SUCCESS ─────────── */
const PasswordSuccessFormScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div style={{ textAlign: "center", paddingTop: 8 }}>
    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.3px", ...fw }}>Password Reset!</h2>
    <p style={{ fontSize: 13.5, color: "#64748b", marginBottom: 28, lineHeight: 1.65, ...fw }}>
      Your password has been successfully reset.<br />You can now log in with your new password.
    </p>
    <PBtn onClick={onLogin} type="button">Back to Login <ArrowRight /></PBtn>
  </div>
);

/* ─────────── ROOT ─────────── */
export default function LoginPage() {
  const [screen, setScreen] = useState<Screen>("login");
  const [resetEmail, setResetEmail] = useState("");

  return (
    <>
      <style>
        {`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>
      <div style={{ position: "fixed", inset: 0, display: "flex", overflow: "hidden", ...fw }}>

      {/* ── Desktop: side-by-side layout ── */}
      <LeftPanel />

      {/* ── Right side (desktop: form panel | mobile: full screen) ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Mobile branding — visible only below lg */}
        <MobileNavbar />

        {/* Desktop topbar — hidden on mobile */}
        <div
          className="hidden lg:flex"
          style={{ height: 56, flexShrink: 0, alignItems: "center", justifyContent: "flex-end", padding: "0 40px", gap: 24, background: "white", borderBottom: "1px solid #eef0f5" }}
        >
          {["Support", "Documentation"].map((link) => (
            <a key={link} href="#"
              style={{ fontSize: 13, fontWeight: 500, color: "#64748b", textDecoration: "none", transition: "color 0.15s", ...fw }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7C3AED")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Scrollable form area — fills all remaining height on both mobile & desktop */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", background: "#F7F8FC", display: "flex", flexDirection: "column", padding: "24px 20px" }}>
          <div style={{ width: "100%", maxWidth: 420, margin: "auto", flexShrink: 0 }}>
            {/* Floating card */}
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #eef0f5", boxShadow: "0 4px 28px rgba(124,58,237,0.07), 0 1px 4px rgba(0,0,0,0.04)", padding: "32px 36px 28px" }}>
              {screen === "login" && <LoginFormScreen onForgot={() => setScreen("forgot")} onOtpLogin={() => setScreen("otp_login_request")} />}
              {screen === "otp_login_request" && <OtpLoginRequestScreen onBack={() => setScreen("login")} onSent={(e) => { setResetEmail(e); setScreen("otp_login_verify"); }} />}
              {screen === "otp_login_verify" && <OtpFormScreen email={resetEmail} onBack={() => setScreen("otp_login_request")} onVerified={() => {}} isLogin={true} />}
              {screen === "forgot" && <ForgotFormScreen onBack={() => setScreen("login")} onSent={(e) => { setResetEmail(e); setScreen("otp"); }} />}
              {screen === "otp" && <OtpFormScreen email={resetEmail} onBack={() => setScreen("forgot")} onVerified={() => setScreen("reset")} />}
              {screen === "reset" && <ResetFormScreen onDone={() => setScreen("success")} />}
              {screen === "success" && <PasswordSuccessFormScreen onLogin={() => setScreen("login")} />}
            </div>

            <p style={{ textAlign: "center", fontSize: 11.5, color: "#94a3b8", fontWeight: 500, marginTop: 16, lineHeight: 1.8, ...fw }}>
              © 2026 VanLoka. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
