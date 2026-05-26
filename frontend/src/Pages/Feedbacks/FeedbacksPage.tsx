import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type FeedbackEntry,
  INITIAL_FEEDBACKS,
  avatarColor,
  feedbackStatusVariant,
  getInitials,
  priorityVariant,
  targetTypeIcon,
} from "../../data/feedbackData";
import { Badge, Pagination, Stars } from "../../Components/UI/index";
import PageHeader from "../../Components/UI/PageHeader";

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: ".06em",
        color: "#94A3B8",
        marginBottom: 3,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
      {value || "—"}
    </div>
  </div>
);
/* ═══════════════════════════════════════════════════
   VIEW DETAIL OVERLAY
   ═══════════════════════════════════════════════════ */
const ViewOverlay = ({
  entry,
  index,
  onClose,
}: {
  entry: FeedbackEntry;
  index: number;
  onClose: () => void;
}) => {
  const ac = avatarColor(index);

  const isComplaint = entry.type === "complaint";
  const gradientStart = isComplaint ? "#DC2626" : "#059669";
  const gradientEnd = isComplaint ? "#B91C1C" : "#047857";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", duration: 0.3 }}
        style={{
          background: "white",
          borderRadius: 16,
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
            padding: "28px 28px 24px",
            borderRadius: "16px 16px 0 0",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: ac.bg,
              color: ac.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {getInitials(entry.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "white",
                marginBottom: 4,
              }}
            >
              {entry.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "white",
                  opacity: 0.8,
                  fontWeight: 600,
                }}
              >
                #{entry.id}
              </span>
              <Badge variant={isComplaint ? "red" : "green"}>
                {isComplaint ? "Complaint" : "Feedback"}
              </Badge>
              <Badge variant={feedbackStatusVariant(entry.status)}>
                {entry.status}
              </Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              borderRadius: 8,
              width: 36,
              height: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "white", fontSize: 20 }}
            >
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              {
                label: "Category",
                value: entry.category,
                icon: "category",
                bg: "#EDE9FE",
                ic: "#7C3AED",
              },
              {
                label: "Priority",
                value: entry.priority,
                icon: "flag",
                bg:
                  entry.priority === "Critical"
                    ? "#FEE2E2"
                    : entry.priority === "High"
                      ? "#FFEDD5"
                      : "#DBEAFE",
                ic:
                  entry.priority === "Critical"
                    ? "#DC2626"
                    : entry.priority === "High"
                      ? "#EA580C"
                      : "#2563EB",
              },
              {
                label: "Target",
                value: entry.target,
                icon: targetTypeIcon(entry.targetType),
                bg: "#FEF3C7",
                ic: "#D97706",
              },
              {
                label: "Role",
                value: entry.role,
                icon: "badge",
                bg: "#DCFCE7",
                ic: "#059669",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: s.bg,
                  borderRadius: 10,
                  padding: "12px 10px",
                  textAlign: "center",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 20,
                    color: s.ic,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  {s.icon}
                </span>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#64748B",
                    marginTop: 2,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: ".07em",
              color: "var(--primary)",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              person
            </span>
            Contact Info
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Field label="Email" value={entry.email} />
            <Field label="Phone" value={entry.phone} />
            <Field label="Date Submitted" value={entry.date} />
            {entry.rating > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    color: "#94A3B8",
                    marginBottom: 3,
                  }}
                >
                  Rating
                </div>
                <Stars rating={entry.rating} />
              </div>
            )}
          </div>

          {/* Comment */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: ".07em",
              color: "var(--primary)",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              {isComplaint ? "report" : "comment"}
            </span>
            {isComplaint ? "Complaint Details" : "Feedback Comment"}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "#475569",
              background: isComplaint ? "#FEF2F2" : "var(--surface)",
              borderRadius: 10,
              padding: "14px 18px",
              border: `1px solid ${isComplaint ? "#FECACA" : "var(--border)"}`,
              fontStyle: "italic",
            }}
          >
            "{entry.comment}"
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   DELETE CONFIRMATION OVERLAY
   ═══════════════════════════════════════════════════ */
const DeleteOverlay = ({
  entry,
  onConfirm,
  onCancel,
}: {
  entry: FeedbackEntry;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(0,0,0,.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 10 }}
      transition={{ type: "spring", duration: 0.3 }}
      style={{
        background: "white",
        borderRadius: 16,
        width: "100%",
        maxWidth: 420,
        padding: "36px 32px 28px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,.15)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#FEE2E2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 36, color: "#DC2626" }}
        >
          delete_forever
        </span>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: "#DC2626",
          marginBottom: 8,
        }}
      >
        Delete {entry.type === "complaint" ? "Complaint" : "Feedback"}?
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#64748B",
          marginBottom: 6,
          lineHeight: 1.6,
        }}
      >
        You are about to permanently delete
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: "var(--text)",
          marginBottom: 4,
        }}
      >
        {entry.name}'s {entry.type}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--muted)",
          marginBottom: 24,
        }}
      >
        ID: #{entry.id} · {entry.category}
      </div>
      <div
        style={{
          background: "#FEF2F2",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 24,
          border: "1px solid #FECACA",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>
          ⚠ This action cannot be undone. The{" "}
          {entry.type === "complaint"
            ? "complaint and its resolution history"
            : "feedback record"}{" "}
          will be permanently removed.
        </span>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          style={{ minWidth: 120 }}
        >
          Cancel
        </button>
        <button
          className="btn"
          onClick={onConfirm}
          style={{
            minWidth: 120,
            background: "#DC2626",
            color: "white",
            border: "none",
            fontWeight: 800,
          }}
        >
          <span className="material-symbols-outlined ms">delete</span>
          Delete
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════
   REPLY OVERLAY (for feedbacks — acknowledge/reply)
   ═══════════════════════════════════════════════════ */
const ReplyOverlay = ({
  entry,
  onSend,
  onCancel,
}: {
  entry: FeedbackEntry;
  onSend: (msg: string) => void;
  onCancel: () => void;
}) => {
  const [msg, setMsg] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", duration: 0.3 }}
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 20px 60px rgba(0,0,0,.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}
            >
              Reply to {entry.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              #{entry.id} · {entry.category}
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: "#64748B" }}
            >
              close
            </span>
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Original comment */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
              border: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--text)",
              fontStyle: "italic",
            }}
          >
            "{entry.comment}"
          </div>

          <label
            style={{
              display: "block",
              fontSize: 10,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              color: "var(--muted)",
              marginBottom: 6,
            }}
          >
            Your Reply <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Write your acknowledgment or reply…"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            style={{ width: "100%", resize: "vertical" }}
          />
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!msg.trim()}
              onClick={() => onSend(msg)}
              style={{ minWidth: 120, opacity: msg.trim() ? 1 : 0.5 }}
            >
              <span className="material-symbols-outlined ms">send</span>
              Send Reply
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   FEEDBACKS & COMPLAINTS PAGE
   ═══════════════════════════════════════════════════ */

type FeedbackTab = "all" | "feedbacks" | "complaints";

export const FeedbacksPage = () => {
  const navigate = useNavigate();

  const [entries, setEntries] = useState<FeedbackEntry[]>(INITIAL_FEEDBACKS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FeedbackTab>("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [viewEntry, setViewEntry] = useState<{
    entry: FeedbackEntry;
    idx: number;
  } | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<FeedbackEntry | null>(null);
  const [replyEntry, setReplyEntry] = useState<FeedbackEntry | null>(null);

  /* ── Filtering ── */
  const filtered = entries.filter((e) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.comment.toLowerCase().includes(q) ||
      e.target.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q);
    const matchTab =
      activeTab === "all" ||
      (activeTab === "complaints" && e.type === "complaint") ||
      (activeTab === "feedbacks" && e.type === "feedback");
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    const matchPriority =
      priorityFilter === "All" || e.priority === priorityFilter;
    return matchSearch && matchTab && matchStatus && matchPriority;
  });

  /* ── Dynamic stats ── */
  const totalEntries = entries.length;
  const feedbackCount = entries.filter((e) => e.type === "feedback").length;
  const openComplaints = entries.filter(
    (e) => e.type === "complaint" && e.status === "Open",
  ).length;
  const resolvedCount = entries.filter((e) => e.status === "Resolved").length;
  const avgRating =
    entries.filter((e) => e.rating > 0).length > 0
      ? (
          entries
            .filter((e) => e.rating > 0)
            .reduce((s, e) => s + e.rating, 0) /
          entries.filter((e) => e.rating > 0).length
        ).toFixed(1)
      : "—";

  /* ── Handlers ── */
  const handleDelete = () => {
    if (!deleteEntry) return;
    setEntries((prev) => prev.filter((e) => e.id !== deleteEntry.id));
    setDeleteEntry(null);
  };

  const handleReply = (_msg: string) => {
    // In real app, this would send the reply. Here we just close the overlay.
    setReplyEntry(null);
  };

  const tabBtn = (tab: FeedbackTab, label: React.ReactNode) => (
    <button
      className={activeTab === tab ? "btn btn-primary" : "btn btn-secondary"}
      style={{ fontSize: 12, padding: "8px 14px" }}
      onClick={() => setActiveTab(tab)}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader
        title="Feedbacks & Complaints"
        icon="chat_bubble"
        breadcrumb="Admin / Feedbacks & Complaints"
      />

      <motion.div
        className="px-4 lg:px-6 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Mobile Actions - Below page header and above stat cards */}
        <div className="lg:hidden flex flex-col w-full gap-2 mb-4">
          <button className="btn btn-secondary w-full justify-center">
            <span className="material-symbols-outlined ms">download</span>
            Export
          </button>
        </div>

        {/* ── Stat cards ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          {[
            {
              bg: "#FEF3C7",
              ic: "#D97706",
              icon: "star",
              label: "Average Rating",
              val: String(avgRating),
              trend: "From feedbacks",
              tc: "text-amber-600",
            },
            {
              bg: "#EDE9FE",
              ic: "#7C3AED",
              icon: "chat_bubble",
              label: "Total Submissions",
              val: String(totalEntries),
              trend: `${feedbackCount} feedbacks`,
              tc: "text-indigo-600",
            },
            {
              bg: "#FEE2E2",
              ic: "#DC2626",
              icon: "flag",
              label: "Open Complaints",
              val: String(openComplaints).padStart(2, "0"),
              trend: "Requires action",
              tc: "text-rose-600",
            },
            {
              bg: "#DCFCE7",
              ic: "#059669",
              icon: "check_circle",
              label: "Resolved",
              val: String(resolvedCount),
              trend: "Closing tickets",
              tc: "text-emerald-600",
            },
          ].map((s) => (
            <motion.div
              key={s.label}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                <span
                  className="material-symbols-outlined ms"
                  style={{ color: s.ic }}
                >
                  {s.icon}
                </span>
              </div>
              <div>
                <div className="text-[11px] font-[800] text-slate-400 uppercase tracking-wider">{s.label}</div>
                <div className="text-2xl font-[900] text-slate-800 leading-tight">{s.val}</div>
                {s.trend && (
                  <div className={`text-[10px] font-[700] mt-1 ${s.tc}`}>{s.trend}</div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Filter bar ── */}
        <div className="flex flex-col lg:flex-row items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <span
              className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none"
            >
              search
            </span>
            <input
              className="w-full pl-11 pr-4 py-[11px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#7c3aed] text-[13px] font-[600] transition-all"
              placeholder="Search comments, users or IDs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div
            className="flex items-center gap-2 w-full lg:w-auto"
          >
            {tabBtn("all", "All")}
            {tabBtn("feedbacks", "Feedbacks")}
            {tabBtn(
              "complaints",
              <div className="flex items-center gap-2">
                Complaints
                {openComplaints > 0 && (
                  <Badge variant="red">
                    {openComplaints}
                  </Badge>
                )}
              </div>,
            )}
          </div>

          {/* Status filter */}
          <div className="relative w-full lg:w-40">
            <select
              className="w-full pl-4 pr-10 py-[11px] bg-white border border-slate-200 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-slate-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Priority filter */}
          <div className="relative w-full lg:w-40">
            <select
              className="w-full pl-4 pr-10 py-[11px] bg-white border border-slate-200 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-slate-700"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-4 text-[10px] font-[900] text-slate-400 uppercase tracking-wider">Reviewer</th>
                  <th className="px-5 py-4 text-[10px] font-[900] text-slate-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-5 py-4 text-[10px] font-[900] text-slate-400 uppercase tracking-wider hidden xl:table-cell">Rating</th>
                  <th className="px-5 py-4 text-[10px] font-[900] text-slate-400 uppercase tracking-wider hidden sm:table-cell">Comment</th>
                  <th className="px-5 py-4 text-[10px] font-[900] text-slate-400 uppercase tracking-wider hidden lg:table-cell">Target</th>
                  <th className="px-5 py-4 text-[10px] font-[900] text-slate-400 uppercase tracking-wider hidden xl:table-cell">Priority</th>
                  <th className="px-5 py-4 text-[10px] font-[900] text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-[10px] font-[900] text-slate-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="px-5 py-4 text-[10px] font-[900] text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-16 text-center text-slate-400 font-[600] text-[13px]"
                    >
                      <span
                        className="material-symbols-outlined text-slate-200 text-5xl block mb-3"
                      >
                        search_off
                      </span>
                      No entries found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => {
                    const globalIdx = entries.findIndex((x) => x.id === e.id);
                    const ac = avatarColor(globalIdx);
                    return (
                      <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div
                            className="flex items-center gap-3"
                          >
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center font-[800] text-[12px] shrink-0 shadow-sm"
                              style={{
                                background: ac.bg,
                                color: ac.color,
                              }}
                            >
                              {getInitials(e.name)}
                            </div>
                            <div>
                              <div className="text-[13px] font-[800] text-slate-700">{e.name}</div>
                              <div
                                className="text-[11px] font-[700] text-slate-400"
                              >
                                {e.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {e.type === "complaint" ? (
                            <Badge variant="red">Complaint</Badge>
                          ) : (
                            <Badge variant="green">Feedback</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden xl:table-cell">
                          <Stars rating={e.rating} />
                        </td>
                        <td
                          className="px-5 py-4 hidden sm:table-cell max-w-[200px]"
                        >
                          <div className="text-[12px] font-[600] text-slate-500 truncate" title={e.comment}>
                            {e.comment}
                          </div>
                        </td>
                        <td
                          className="px-5 py-4 hidden lg:table-cell"
                        >
                          <div
                            className="flex items-center gap-2 max-w-[150px]"
                          >
                            <span
                              className="material-symbols-outlined text-[16px] text-slate-400 shrink-0"
                            >
                              {targetTypeIcon(e.targetType)}
                            </span>
                            <span
                              className="text-[12px] font-[700] text-slate-600 truncate"
                            >
                              {e.target}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden xl:table-cell">
                          <Badge variant={priorityVariant(e.priority)}>
                            {e.priority}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={feedbackStatusVariant(e.status)}>
                            {e.status}
                          </Badge>
                        </td>
                        <td
                          className="px-5 py-4 hidden lg:table-cell text-[12px] font-[700] text-slate-400 whitespace-nowrap"
                        >
                          {e.date}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 transition-all"
                              title="View Details"
                              onClick={() =>
                                setViewEntry({ entry: e, idx: globalIdx })
                              }
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                visibility
                              </span>
                            </button>
                            {e.type === "complaint" && e.status !== "Resolved" && e.status !== "Dismissed" && (
                              <button
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-all"
                                title="Resolve Complaint"
                                onClick={() =>
                                  navigate(`/feedbacks/resolve/${e.id}`)
                                }
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  check_circle
                                </span>
                              </button>
                            )}
                            {e.type === "feedback" && (
                              <button
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-all"
                                title="Reply"
                                onClick={() => setReplyEntry(e)}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  reply
                                </span>
                              </button>
                            )}
                            <button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-all"
                              title="Delete"
                              onClick={() => setDeleteEntry(e)}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            info={`Showing ${filtered.length} of ${entries.length} entries`}
            pages={[1]}
            current={1}
          />
        </div>
      </motion.div>

      {/* ── View overlay ── */}
      <AnimatePresence>
        {viewEntry && (
          <ViewOverlay
            entry={viewEntry.entry}
            index={viewEntry.idx}
            onClose={() => setViewEntry(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {deleteEntry && (
          <DeleteOverlay
            entry={deleteEntry}
            onConfirm={handleDelete}
            onCancel={() => setDeleteEntry(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Reply overlay ── */}
      <AnimatePresence>
        {replyEntry && (
          <ReplyOverlay
            entry={replyEntry}
            onSend={handleReply}
            onCancel={() => setReplyEntry(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbacksPage;
