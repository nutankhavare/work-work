import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Headset, 
  MessageSquarePlus, 
  Inbox, 
  Clock, 
  RefreshCcw, 
  CheckCircle2, 
  Contact, 
  Phone, 
  Headphones, 
  MessageCircle, 
  Mail, 
  AlertCircle, 
  Globe, 
  Lightbulb,
  Copy,
  Check,
  Send,
  X,
  Plus,
  ArrowRight,
  Truck,
  MapPin
} from "lucide-react";
import PageHeader from "../../Components/UI/PageHeader";

const containerFade = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

/* ══════════════════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════════════════ */
const HD = {
  name: "Vanloka Technologies Pvt. Ltd.",
  tagline: "Your parent organisation & onboarding partner",
  address:
    "4th Floor, Prestige Tech Park, Whitefield, Bengaluru – 560066, Karnataka",
  supportEmail: "support@vanloka.com",
  escalationEmail: "escalations@vanloka.com",
  phone: "+91 80 4567 8900",
  tollfree: "1800-123-4567",
  whatsapp: "+91 98765 43210",
  workingHours: "Mon – Sat · 9 AM – 7 PM IST",
  sla: "Within 24 business hours",
  portal: "https://help.vanloka.com",
};

const TIPS = [
  "Include your MDS Organisation ID in every support message.",
  "For billing disputes, attach the invoice PDF / screenshot.",
  "For platform bugs, mention your browser name and OS version.",
  "Critical issues? Use the Escalation Email for faster triage.",
];

const CATEGORIES = [
  "Billing & Subscription",
  "Platform / Software Issue",
  "Onboarding Support",
  "License & Compliance",
  "Vendor Coordination",
  "Feature Request",
  "Data / Report Discrepancy",
  "Other",
];

const PL = "#ede9fe"; // primary-light
const SL = "#d1fae5"; // success-light
const WL = "#fef3c7"; // warning-light
const DL = "#fee2e2"; // danger-light
const IL = "#dbeafe"; // info-light

type Ticket = {
  id: string;
  category: string;
  subject: string;
  status: string;
  severity: string;
  date: string;
};

const MOCK: Ticket[] = [
  {
    id: "VNK-2026-001",
    category: "Billing & Subscription",
    subject: "Double charge on March invoice",
    status: "In Progress",
    severity: "high",
    date: "2026-03-08",
  },
  {
    id: "VNK-2026-002",
    category: "Platform / Software Issue",
    subject: "Session report export returns blank PDF",
    status: "Resolved",
    severity: "medium",
    date: "2026-03-05",
  },
  {
    id: "VNK-2026-003",
    category: "Onboarding Support",
    subject: "New branch registration still pending approval",
    status: "Open",
    severity: "low",
    date: "2026-03-01",
  },
];

const statusBadge = (s: string) =>
  s === "Resolved"
    ? { c: "#059669", b: SL }
    : s === "In Progress"
      ? { c: "#d97706", b: WL }
      : { c: "#7c3aed", b: PL };
const sevBadge = (s: string) =>
  s === "high"
    ? { c: "#dc2626", b: DL }
    : s === "medium"
      ? { c: "#d97706", b: WL }
      : { c: "#059669", b: SL };

/* ── Shared tiny pieces ── */
const Pill = ({ label, c, b }: { label: string; c: string; b: string }) => (
  <span
    style={{
      fontSize: 9,
      fontWeight: 800,
      padding: "3px 10px",
      borderRadius: 20,
      background: b,
      color: c,
      textTransform: "capitalize" as const,
      whiteSpace: "nowrap" as const,
    }}
  >
    {label}
  </span>
);

/* ══════════════════════════════════════════════════════
   RAISE COMPLAINT OVERLAY
══════════════════════════════════════════════════════ */
const RaiseOverlay = ({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (t: Ticket) => void;
}) => {
  const [f, setF] = useState({
    subject: "",
    category: CATEGORIES[0],
    description: "",
    severity: "medium",
    file: "",
  });
  const [done, setDone] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!f.subject.trim() || !f.description.trim()) return;
    setDone(true);
    const t: Ticket = {
      id: `VNK-${Date.now()}`,
      category: f.category,
      subject: f.subject,
      status: "Open",
      severity: f.severity,
      date: new Date().toISOString().split("T")[0],
    };
    setTimeout(() => {
      onSubmit(t);
      onClose();
    }, 2200);
  };

  const severities = [
    {
      val: "low",
      label: "Low",
      sub: "General query",
      c: "#059669",
      b: SL,
    },
    {
      val: "medium",
      label: "Medium",
      sub: "Ops impacted",
      c: "#d97706",
      b: WL,
    },
    {
      val: "high",
      label: "High",
      sub: "Critical / urgent",
      c: "#dc2626",
      b: DL,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-5"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        style={{
          background: "white",
          borderRadius: 18,
          width: "100%",
          maxWidth: 520,
          maxHeight: "92vh",
          overflow: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #7c3aed, #5b21b6)",
            padding: "22px 26px",
            borderRadius: "18px 18px 0 0",
            display: "flex",
            justifyContent: "between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div className="flex-1">
            <div style={{ fontSize: 16, fontWeight: 900, color: "white" }}>
              Raise a Complaint
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.65)",
                marginTop: 2,
              }}
            >
              Sent to Vanloka Support · SLA: 24 business hours
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="white" />
          </button>
        </div>

        {done ? (
          <div style={{ padding: "52px 32px", textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: SL,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle2 size={30} color="#059669" />
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#1e293b",
                marginBottom: 8,
              }}
            >
              Ticket Submitted!
            </div>
            <div
              style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}
            >
              Your complaint has been logged with Vanloka Support. Expect a
              reply within 24 business hours.
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "22px 26px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <label className="text-[11px] font-[800] text-[#64748b] uppercase tracking-wider mb-1.5 block">Subject *</label>
              <input
                className="w-full px-4 py-[11px] bg-slate-50 border border-slate-200 rounded-[10px] text-[13px] font-[500] focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all"
                placeholder="One-line summary of the issue"
                value={f.subject}
                onChange={(e) => set("subject", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-[800] text-[#64748b] uppercase tracking-wider mb-1.5 block">Category</label>
                <select
                  className="w-full px-4 py-[11px] bg-slate-50 border border-slate-200 rounded-[10px] text-[13px] font-[700] text-slate-700 focus:outline-none focus:border-[#7c3aed] cursor-pointer"
                  value={f.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-[800] text-[#64748b] uppercase tracking-wider mb-1.5 block">Severity</label>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  {severities.map((s) => (
                    <label
                      key={s.val}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        padding: "7px 10px",
                        borderRadius: 9,
                        background:
                          f.severity === s.val ? s.b : "#f8fafc",
                        border: `1.5px solid ${f.severity === s.val ? s.c : "#e2e8f0"}`,
                        transition: "all 0.15s",
                      }}
                    >
                      <input
                        type="radio"
                        name="sev"
                        value={s.val}
                        checked={f.severity === s.val}
                        onChange={() => set("severity", s.val)}
                        style={{ accentColor: s.c, flexShrink: 0 }}
                      />
                      <div>
                        <div
                          style={{ fontSize: 11, fontWeight: 800, color: s.c }}
                        >
                          {s.label}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          {s.sub}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-[800] text-[#64748b] uppercase tracking-wider mb-1.5 block">Description *</label>
              <textarea
                className="w-full px-4 py-[11px] bg-slate-50 border border-slate-200 rounded-[10px] text-[13px] font-[500] focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all min-h-[100px]"
                placeholder="Steps to reproduce, impact, expected behaviour…"
                rows={4}
                value={f.description}
                onChange={(e) => set("description", e.target.value)}
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div>
              <label className="text-[11px] font-[800] text-[#64748b] uppercase tracking-wider mb-1.5 block">Attachment (optional)</label>
              <div
                style={{
                  border: "2px dashed #e2e8f0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#f8fafc",
                }}
                onClick={() => document.getElementById("cc-file")?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) set("file", file.name);
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <RefreshCcw size={20} className="text-[#94a3b8]" />
                  <span
                    style={{
                      fontSize: 11,
                      color: f.file ? "#7c3aed" : "#94a3b8",
                      fontWeight: f.file ? 700 : 500,
                    }}
                  >
                    {f.file || "Click or drag PDF / PNG / JPG"}
                  </span>
                </div>
                <input
                  id="cc-file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      set("file", e.target.files[0].name);
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, paddingTop: 2 }}>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-[11px] bg-white border border-slate-200 rounded-[10px] text-[13px] font-[800] text-slate-600 hover:bg-slate-50 transition-all"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-[11px] bg-[#7c3aed] border border-[#7c3aed] rounded-[10px] text-[13px] font-[800] text-white hover:bg-[#6d28d9] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={submit}
                disabled={!f.subject.trim() || !f.description.trim()}
              >
                <Send size={15} />
                Submit to Vanloka
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════
   CUSTOMER CARE PAGE — BENTO GRID
══════════════════════════════════════════════════════ */
export const CustomerCarePage = () => {
  const [showForm, setShowForm] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>(MOCK);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const addTicket = (t: Ticket) => setTickets((p) => [t, ...p]);

  const stats = [
    {
      label: "Total",
      val: tickets.length,
      icon: <Inbox size={20} />,
      col: "#7c3aed",
      bg: PL,
    },
    {
      label: "Open",
      val: tickets.filter((t) => t.status === "Open").length,
      icon: <AlertCircle size={20} />,
      col: "#3b82f6",
      bg: IL,
    },
    {
      label: "In Progress",
      val: tickets.filter((t) => t.status === "In Progress").length,
      icon: <RefreshCcw size={20} />,
      col: "#d97706",
      bg: WL,
    },
    {
      label: "Resolved",
      val: tickets.filter((t) => t.status === "Resolved").length,
      icon: <CheckCircle2 size={20} />,
      col: "#059669",
      bg: SL,
    },
  ];

  const contacts = [
    { icon: <Phone size={15} />, label: "Helpline", val: HD.phone, key: "p" },
    { icon: <Headphones size={15} />, label: "Toll-Free", val: HD.tollfree, key: "tf" },
    { icon: <MessageCircle size={15} />, label: "WhatsApp", val: HD.whatsapp, key: "wa" },
    { icon: <Mail size={15} />, label: "Support", val: HD.supportEmail, key: "em" },
    { icon: <AlertCircle size={15} />, label: "Escalation", val: HD.escalationEmail, key: "es" },
  ];

  /* ── card shared style ── */
  const card: React.CSSProperties = {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    overflow: "hidden",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AnimatePresence>
        {showForm && (
          <RaiseOverlay
            onClose={() => setShowForm(false)}
            onSubmit={addTicket}
          />
        )}
      </AnimatePresence>

      {/* PAGE HEADER */}
      <PageHeader
        title="Customer Care"
        icon={<Headset size={18} />}
        breadcrumb="Admin / Support / Customer Care"
      >
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <MessageSquarePlus size={16} />
          Raise a Complaint
        </button>
      </PageHeader>

      {/* ─────────────── BENTO GRID ─────────────── */}
      <div className="px-4 lg:px-6 pb-8">
        <motion.div variants={containerFade} initial="hidden" animate="show" className="space-y-[14px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[300px_1fr_1fr_1fr_1fr] gap-[14px] items-stretch">
            
            {/* ── [A] Vanloka brand card ── */}
            <motion.div
              variants={slideUp}
              className="col-span-1 md:col-span-1 lg:row-span-2 flex flex-col"
              style={card}
            >
              {/* Gradient header */}
              <div
                style={{
                  background:
                    "linear-gradient(150deg, #7c3aed 0%, #5b21b6 100%)",
                  padding: "24px 20px",
                  position: "relative",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -28,
                    right: -28,
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 13,
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
                        flexShrink: 0,
                      }}
                    >
                      <Truck size={24} color="white" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: "white",
                          letterSpacing: "1.2px",
                          lineHeight: 1,
                        }}
                      >
                        VANLOKA
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.6)",
                          marginTop: 3,
                        }}
                      >
                        Technologies Pvt. Ltd.
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.68)",
                      lineHeight: 1.55,
                      marginBottom: 14,
                    }}
                  >
                    {HD.tagline}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      flexWrap: "wrap" as const,
                    }}
                  >
                    {["ISO Certified", "DPIIT Startup"].map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: "rgba(255,255,255,0.88)",
                          background: "rgba(255,255,255,0.12)",
                          padding: "3px 9px",
                          borderRadius: 20,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Detail rows */}
              <div
                style={{
                  padding: "4px 18px 12px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                {[
                  { icon: <MapPin size={14} />, label: "Address", val: HD.address },
                  {
                    icon: <RefreshCcw size={14} />,
                    label: "Working Hours",
                    val: HD.workingHours,
                  },
                  { icon: <RefreshCcw size={14} />, label: "SLA Response", val: HD.sla },
                  {
                    icon: <Globe size={14} />,
                    label: "Help Portal",
                    val: HD.portal,
                    href: HD.portal,
                  },
                ].map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: PL,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                        color: "#7c3aed"
                      }}
                    >
                      {r.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.08em",
                          color: "#94a3b8",
                          marginBottom: 2,
                        }}
                      >
                        {r.label}
                      </div>
                      {r.href ? (
                        <a
                          href={r.href}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#7c3aed",
                            wordBreak: "break-all" as const,
                            textDecoration: "none",
                          }}
                        >
                          {r.val}
                        </a>
                      ) : (
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#1e293b",
                            lineHeight: 1.45,
                            wordBreak: "break-word" as const,
                          }}
                        >
                          {r.val}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── [B] Four stat chips ── */}
            {stats.map((s) => (
              <motion.div
                variants={slideUp}
                key={s.label}
                className="col-span-1 flex items-center justify-start gap-3 p-4 xl:p-5"
                style={card}
              >
                <div style={{ 
                  width: 42, 
                  height: 42, 
                  borderRadius: 12, 
                  background: s.bg, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: s.col 
                }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <div
                    style={{ 
                      fontSize: 11, 
                      fontWeight: 800, 
                      color: "#94a3b8", 
                      textTransform: "uppercase", 
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap" 
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#1e293b" }}>{s.val}</div>
                </div>
              </motion.div>
            ))}

            {/* ── [C] Ticket table ── */}
            <motion.div
              variants={slideUp}
              className="col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-2 flex flex-col"
              style={card}
            >
              <div
                className="flex flex-col sm:flex-row items-center justify-between border-b gap-3"
                style={{
                  padding: "14px 20px",
                  borderColor: "#f1f5f9",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <Inbox size={18} className="text-[#7c3aed]" />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#1e293b",
                      flex: 1,
                    }}
                  >
                    My Complaint Tickets
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: PL,
                      color: "#7c3aed",
                      borderRadius: 20,
                      padding: "2px 9px",
                    }}
                  >
                    {tickets.length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto w-full flex-1 flex flex-col">
                <div className="min-w-[660px] flex flex-col h-full flex-1">
                  {/* col header */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr 110px 100px 100px",
                      padding: "12px 20px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #f1f5f9",
                      flexShrink: 0,
                    }}
                  >
                    {[
                      "Ticket ID",
                      "Subject & Category",
                      "Date Raised",
                      "Severity",
                      "Status",
                    ].map((h) => (
                      <div
                        key={h}
                        style={{
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.09em",
                          color: "#64748b",
                        }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  {/* rows */}
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {tickets.length === 0 ? (
                      <div
                        style={{ padding: "56px 24px", textAlign: "center" }}
                      >
                        <Inbox size={44} className="text-[#e2e8f0] mx-auto mb-3" />
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#94a3b8",
                          }}
                        >
                          No tickets yet — click <b>Raise a Complaint</b> to get
                          started.
                        </div>
                      </div>
                    ) : (
                      tickets.map((t, i) => {
                        const ss = statusBadge(t.status);
                        const sv = sevBadge(t.severity);
                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={t.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "160px 1fr 110px 100px 100px",
                              padding: "13px 20px",
                              borderBottom: "1px solid #f1f5f9",
                              background:
                                i % 2 === 0 ? "white" : "#f8fafc",
                              alignItems: "center",
                              transition: "background 0.13s",
                              cursor: "default",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                              }}
                            >
                              <div
                                style={{
                                  width: 3,
                                  height: 30,
                                  borderRadius: 2,
                                  background: "#7c3aed",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: "#7c3aed",
                                  fontFamily: "monospace",
                                }}
                              >
                                {t.id}
                              </span>
                            </div>
                            <div style={{ minWidth: 0, paddingRight: 10 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#1e293b",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {t.subject}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#64748b",
                                  fontWeight: 600,
                                  marginTop: 2,
                                }}
                              >
                                {t.category}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#64748b",
                                fontWeight: 600,
                              }}
                            >
                              {t.date}
                            </div>
                            <div>
                              <Pill label={t.severity} c={sv.c} b={sv.b} />
                            </div>
                            <div>
                              <Pill label={t.status} c={ss.c} b={ss.b} />
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── [D] Contacts ── */}
            <motion.div
              variants={slideUp}
              className="col-span-1 md:col-span-1 flex flex-col"
              style={card}
            >
              <div
                style={{
                  padding: "16px 18px 10px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <Contact size={16} className="text-[#7c3aed]" />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.07em",
                      color: "#1e293b",
                    }}
                  >
                    Contact Channels
                  </span>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 18px" }}>
                {contacts.map((c, i) => (
                  <div
                    key={c.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 0",
                      borderBottom:
                        i < contacts.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: PL,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "#7c3aed"
                      }}
                    >
                      {c.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.08em",
                          color: "#94a3b8",
                        }}
                      >
                        {c.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#1e293b",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: 1,
                        }}
                      >
                        {c.val}
                      </div>
                    </div>
                    <button
                      onClick={() => copy(c.val, c.key)}
                      title="Copy"
                      style={{
                        background: copied === c.key ? SL : "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 7,
                        width: 26,
                        height: 26,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}
                    >
                      {copied === c.key ? <Check size={13} className="text-[#059669]" /> : <Copy size={13} className="text-[#94a3b8]" />}
                    </button>
                  </div>
                ))}
              </div>
              {/* CTA strip pinned at bottom */}
              <div
                style={{
                  padding: "12px 18px",
                  borderTop: "1px solid #f1f5f9",
                  background: "#f8fafc",
                  display: "flex",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <a
                  href={`tel:${HD.phone}`}
                  style={{ flex: 1, textDecoration: "none" }}
                >
                  <button
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-[800] text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <Phone size={14} />
                    Call
                  </button>
                </a>
                <a
                  href={`mailto:${HD.supportEmail}`}
                  style={{ flex: 2, textDecoration: "none" }}
                >
                  <button
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-[#7c3aed] border border-[#7c3aed] rounded-lg text-[11px] font-[800] text-white hover:bg-[#6d28d9] transition-all"
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </a>
              </div>
            </motion.div>
          </div>

          {/* ── Tips + Support Banner ── */}
          <motion.div
            variants={slideUp}
            className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-[14px]"
          >
            {/* Tips */}
            <div
              style={{
                ...card,
                borderLeft: "4px solid #7c3aed",
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 12,
                }}
              >
                <Lightbulb size={16} className="text-[#7c3aed]" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.07em",
                    color: "#1e293b",
                  }}
                >
                  Tips Before Raising a Ticket
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {TIPS.map((tip, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 9,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#7c3aed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <span
                        style={{ fontSize: 9, fontWeight: 900, color: "white" }}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#4c1d95",
                        lineHeight: 1.55,
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support CTA banner */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center gap-5"
              style={{
                background:
                  "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
                borderRadius: 14,
                padding: "20px 24px",
                boxShadow: "0 6px 24px rgba(124,58,237,0.22)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Headset size={28} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: "white",
                    marginBottom: 4,
                  }}
                >
                  Vanloka Support Desk
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.55,
                  }}
                >
                  Available {HD.workingHours} · SLA: {HD.sla}
                  <br />
                  Escalations:{" "}
                  <span
                    style={{ color: "rgba(255,255,255,0.92)", fontWeight: 700 }}
                  >
                    {HD.escalationEmail}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-[10px] shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    color: "white",
                    border: "1.5px solid rgba(255,255,255,0.28)",
                    borderRadius: 10,
                    padding: "9px 16px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s",
                  }}
                >
                  <MessageSquarePlus size={15} />
                  Raise Complaint
                </button>
                <a
                  href={`mailto:${HD.supportEmail}`}
                  style={{ textDecoration: "none" }}
                >
                  <button
                    style={{
                      background: "white",
                      color: "#7c3aed",
                      border: "none",
                      borderRadius: 10,
                      padding: "9px 18px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Mail size={15} />
                    Email Support
                  </button>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerCarePage;
