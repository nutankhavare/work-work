import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  BarChart2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Menu,
} from "lucide-react";
import PageHeader from "../../Components/UI/PageHeader";

/* ──────────────────────────────────────────────
   ANIMATION VARIANTS
─────────────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 24 },
  },
};

/* ──────────────────────────────────────────────
   TIER DATA
─────────────────────────────────────────────── */
const tiers = [
  {
    id: "basic",
    route: "/reports/basic",
    label: "Basic Report",
    subtitle: "Monthly School Snapshot",
    Icon: BarChart2,
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    glowColor: "rgba(34, 63, 109, 0.25)",
    bgLight: "#EFF6FF",
    accentColor: "#2563EB",
    badgeText: "Owner · Manager",
    description:
      "A clear overview of core performance metrics.",
    features: [
      "New Enrollments & Active Trainees",
      "Session Attendance Snapshot",
      "AI Insights",
    ],
    pages: "3 Pages",
  },
  {
    id: "advanced",
    route: "/reports/advanced",
    label: "Advanced Report",
    subtitle: "Quarterly Deep-Dive Analytics",
    Icon: TrendingUp,
    gradient: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
    glowColor: "rgba(124,58,237,0.28)",
    bgLight: "#F5F3FF",
    accentColor: "#7C3AED",
    badgeText: "Owner · Operations Manager · HR",
    description:
      "Expanded analytics for performance tracking and growth.",
    features: [
      "All Basic Report content",
      "Growth & Conversion Funnel",
      "Instructor Utilization & Ratings",
      "Vehicle Fleet Utilization Heatmap",
    ],
    pages: "3 Pages",
    recommended: true,
  },
  {
    id: "compliance",
    route: "/reports/compliance",
    label: "Compliance Report",
    subtitle: "Regulatory & Audit-Ready",
    Icon: ShieldCheck,
    gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    glowColor: "rgba(5,150,105,0.25)",
    bgLight: "#ECFDF5",
    accentColor: "#059669",
    badgeText: "CA · RTO Authority · Audit",
    description:
      "Comprehensive reporting for compliance and audits.",
    features: [
      "All Advanced Report content",
      "RTO Compliance Dashboard",
      "Instructor & Vehicle License Status",
      "Audit Trail with AI Anomaly Detection",
    ],
    pages: "4 Pages",
  },
];

/* ──────────────────────────────────────────────
   REPORT HUB PAGE
─────────────────────────────────────────────── */
export const ReportHub = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* PAGE HEADER */}
      <PageHeader
        title="Institute Reports (AI-Powered)"
        icon={<BarChart2 size={18} />}
        breadcrumb="Admin / Intelligence / Reports"
      />

      {/* PAGE BODY */}
      <div className="px-4 lg:px-6 pb-8">
        <div className="space-y-6">
          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background:
                "linear-gradient(135deg, #6458dfff 0%, hsla(242, 44%, 66%, 1.00) 50%, #a384d3ff 100%)",
              borderRadius: 20,
              padding: "36px 32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative blobs */}
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "rgba(167,139,250,0.12)",
                filter: "blur(40px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -30,
                left: "30%",
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: "rgba(96,165,250,0.1)",
                filter: "blur(30px)",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <Sparkles size={13} color="#fbbf24" />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#fbbf24",
                      letterSpacing: "0.06em",
                    }}
                  >
                    AI-POWERED
                  </span>
                </div>
              </div>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "white",
                  margin: "0 0 8px",
                  lineHeight: 1.2,
                }}
              >
                Institute– Analytics & Insights
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                  margin: "0 0 20px",
                  maxWidth: 520,
                }}
              >
                Select a report tier below to view auto-generated analytics, AI
                insights, graphs, and KPI summaries (March 2026).
              </p>
              {/* Quick stats row */}
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Active Trainees", val: "142" },
                  { label: "Sessions Conducted", val: "1,120" },
                  { label: "Pass Rate", val: "76%" },
                  { label: "Attendance", val: "87%" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: "white",
                        lineHeight: 1,
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.5)",
                        marginTop: 4,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Section label */}
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Choose Report Tier
            </p>
          </div>

          {/* TIER CARDS */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {tiers.map((tier) => (
              <motion.div
                key={tier.id}
                variants={cardVariants}
                whileHover={{ y: -6, boxShadow: `0 20px 48px ${tier.glowColor}` }}
                style={{
                  background: "white",
                  borderRadius: 20,
                  border: `1.5px solid ${tier.bgLight}`,
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  transition: "box-shadow 0.25s, transform 0.2s",
                }}
                onClick={() => navigate(tier.route)}
              >
                {/* Recommended badge */}
                {tier.recommended && (
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      background: tier.gradient,
                      color: "white",
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      padding: "3px 10px",
                      borderRadius: 20,
                      boxShadow: `0 4px 12px ${tier.glowColor}`,
                      zIndex: 2,
                    }}
                  >
                    RECOMMENDED
                  </div>
                )}

                {/* Card Header */}
                <div
                  style={{
                    background: tier.gradient,
                    padding: "28px 24px 22px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  />
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <tier.Icon size={26} color="white" strokeWidth={2} />
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.6)",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    {tier.pages}
                  </div>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: "white",
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {tier.label}
                  </h2>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.75)",
                      margin: "4px 0 0",
                    }}
                  >
                    {tier.subtitle}
                  </p>
                </div>

                {/* Card Body */}
                <div style={{ padding: "20px 24px 24px" }}>
                  {/* Audience badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: tier.bgLight,
                      color: tier.accentColor,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 20,
                      marginBottom: 14,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {tier.badgeText}
                  </div>

                  <p
                    style={{
                      fontSize: 12.5,
                      color: "#64748B",
                      lineHeight: 1.65,
                      marginBottom: 16,
                    }}
                  >
                    {tier.description}
                  </p>

                  {/* Feature list */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginBottom: 22,
                    }}
                  >
                    {tier.features.map((f) => (
                      <div
                        key={f}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <CheckCircle2
                          size={14}
                          color={tier.accentColor}
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      borderRadius: 12,
                      background: tier.gradient,
                      color: "white",
                      fontWeight: 800,
                      fontSize: 13,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: `0 6px 18px ${tier.glowColor}`,
                      transition: "opacity 0.15s",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(tier.route);
                    }}
                  >
                    Open {tier.label}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer note */}
          <div
            style={{
              textAlign: "center",
              padding: "16px 0 8px",
              fontSize: 11,
              color: "#94A3B8",
              fontWeight: 600,
            }}
          >
            All data shown is mock/assumed data for demonstration purposes (March
            2026).
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportHub;
