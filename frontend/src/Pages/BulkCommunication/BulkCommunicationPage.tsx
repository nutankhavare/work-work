import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart4,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  Paperclip,
  Trash2,
  X,
  Search
} from "lucide-react";
import { Badge, Button, Input, Select } from "../../Components/UI/index";
import PageHeader from "../../Components/UI/PageHeader";
import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";

const Label = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label
    style={{
      display: "block",
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: ".06em",
      color: "#64748B",
      marginBottom: 5,
    }}
  >
    {children}
    {required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
  </label>
);

export interface BroadcastItem {
  id: number;
  title: string;
  audience: string;
  channel: string;
  date: string;
  status: string;
  opens?: string;
  body?: string;
}

const containerFade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export const BulkCommunicationPage = () => {
  const { showAlert } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Composer Form State
  const [audience, setAudience] = useState("everyone");
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  // Attachments State (ABS Uploads)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sending States
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Recipient Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [allRecipients, setAllRecipients] = useState<{ id: number; type: "staff" | "drivers"; name: string; email: string }[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<{ id: number; type: "staff" | "drivers"; name: string }[]>([]);
  const [isFetchingRecipients, setIsFetchingRecipients] = useState(false);

  // Analytics & Logs State
  const [stats, setStats] = useState({ totalSent: 0, openRate: 0 });
  const [recentBroadcasts, setRecentBroadcasts] = useState<BroadcastItem[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<BroadcastItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Overlays State
  const [viewItem, setViewItem] = useState<BroadcastItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<BroadcastItem | null>(null);

  // Fetch Stats & Dispatch Logs
  const fetchLogsAndStats = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        tenantApi.get("/broadcasts/stats"),
        tenantApi.get("/broadcasts"),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (logsRes.data.success) {
        const rows = logsRes.data.data.data || [];
        const mapped: BroadcastItem[] = rows.map((b: any) => ({
          id: b.id,
          title: b.subject,
          audience: b.target_audience === "everyone" ? "Everyone" : b.target_audience === "staff" ? "All Staff" : b.target_audience === "drivers" ? "All Drivers" : "Individual",
          channel: b.channel === "email" ? "Email" : b.channel === "sms" ? "SMS" : "Push",
          date: new Date(b.created_at).toLocaleString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: b.status === "sent" ? "Delivered" : "Pending",
          opens: `${b.opened_count || 0} opens`,
          body: b.body,
        }));

        setRecentBroadcasts(mapped.filter((x) => x.status === "Delivered"));
        setScheduledMessages(mapped.filter((x) => x.status === "Pending"));
      }
    } catch (err) {
      console.error("Failed to load logs/stats:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Fetch recipients list for Individual Selection
  const fetchAllRecipients = useCallback(async () => {
    try {
      setIsFetchingRecipients(true);
      const [staffRes, driversRes] = await Promise.all([
        tenantApi.get("/employees", { params: { per_page: 1000 } }),
        tenantApi.get("/drivers", { params: { per_page: 1000 } }),
      ]);

      const staff = (staffRes.data.data?.data || []).map((s: any) => ({
        id: s.id,
        type: "staff" as const,
        name: `${s.first_name} ${s.last_name}`,
        email: s.email,
      }));

      const drivers = (driversRes.data.data?.data || []).map((d: any) => ({
        id: d.id,
        type: "drivers" as const,
        name: `${d.first_name} ${d.last_name}`,
        email: d.email,
      }));

      setAllRecipients([...staff, ...drivers]);
    } catch (err) {
      console.error("Failed to fetch recipients:", err);
    } finally {
      setIsFetchingRecipients(false);
    }
  }, []);

  useEffect(() => {
    if (audience === "individual" && allRecipients.length === 0) {
      fetchAllRecipients();
    }
  }, [audience, allRecipients.length, fetchAllRecipients]);

  useEffect(() => {
    fetchLogsAndStats();
  }, [fetchLogsAndStats]);

  // Handle file uploads to ABS
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await tenantApi.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success && res.data.url) {
        setAttachmentUrl(res.data.url);
        showAlert("Attachment uploaded successfully to Azure Blob Storage!", "success");
      } else {
        throw new Error("Invalid response schema");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      showAlert("Failed to upload attachment", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setRecentBroadcasts((prev) => prev.filter((m) => m.id !== deleteItem.id));
    setScheduledMessages((prev) => prev.filter((m) => m.id !== deleteItem.id));
    setDeleteItem(null);
    showAlert("Log entry removed from display history", "success");
  };

  const handleSend = async () => {
    if (!message) return;
    setSendError(null);

    setIsSending(true);
    try {
      // Append attachment URL to email HTML if present
      let finalBody = message;
      if (attachmentUrl) {
        if (channel === "email") {
          finalBody = `${message}<br/><br/><hr/><br/><strong>Attachment:</strong><br/><a href="${attachmentUrl}" target="_blank" rel="noopener noreferrer"><img src="${attachmentUrl}" alt="Attachment" style="max-width:100%; max-height:300px; border-radius:8px; border:1px solid #e2e8f0; padding:4px;" /></a>`;
        } else {
          finalBody = `${message}\n\nAttachment: ${attachmentUrl}`;
        }
      }

      await tenantApi.post("/broadcasts", {
        target_audience: audience,
        channel,
        subject: channel === "email" ? subject : `Broadcast to ${audience}`,
        body: finalBody,
        recipient_ids: audience === "individual" ? selectedRecipients.map((r) => ({ id: r.id, type: r.type === "drivers" ? "drivers" : "staff" })) : undefined,
      });

      setIsSent(true);
      showAlert("Broadcast dispatched successfully via Azure Communication Services!", "success");

      setTimeout(() => {
        setIsSent(false);
        setSubject("");
        setMessage("");
        setAttachmentUrl(null);
        setSelectedRecipients([]);
        fetchLogsAndStats();
      }, 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send broadcast";
      setSendError(msg);
      showAlert(msg, "error");
    } finally {
      setIsSending(false);
    }
  };

  const channels = [
    { id: "email", icon: <Mail size={16} /> },
    { id: "sms", icon: <MessageSquare size={16} /> },
    { id: "push", icon: <BellRing size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-[var(--font-manrope)]">
      <PageHeader
        title="Bulk Communication"
        icon={<Megaphone size={18} />}
        breadcrumb="Admin / Automated Messaging"
      />

      <motion.div
        className="px-6 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          variants={containerFade}
          initial="hidden"
          animate="show"
          className="flex flex-col lg:flex-row gap-6 items-start pb-10"
        >
          {/* ── LEFT COLUMN: COMPOSER ── */}
          <motion.div
            variants={slideUp}
            className="w-full lg:flex-1 lg:min-w-[500px] xl:min-w-[650px]"
          >
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 24,
                border: "1px solid var(--border)",
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "20px 28px",
                  borderBottom: "1.5px solid var(--border)",
                  background: "var(--surface)",
                }}
              >
                <span
                  className="material-symbols-outlined ms"
                  style={{ fontSize: 20, color: "var(--primary)" }}
                >
                  campaign
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: ".07em",
                    textTransform: "uppercase",
                    color: "var(--text)",
                  }}
                >
                  Create Broadcast
                </span>
              </div>

              <div style={{ padding: "28px" }}>
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  {/* Target Audience */}
                  <div className="flex-1">
                    <Label required>Target Audience</Label>
                    <Select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full"
                    >
                      <option value="everyone">Everyone (Staff & Drivers)</option>
                      <option value="staff">All Staff</option>
                      <option value="drivers">All Drivers</option>
                      <option value="individual">Individual Selection</option>
                    </Select>
                  </div>

                  {/* Channel Toggle */}
                  <div className="flex-1">
                    <Label required>Delivery Channel</Label>
                    <div
                      className="flex p-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]"
                      style={{ height: "46px" }}
                    >
                      {channels.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setChannel(c.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer border-none"
                          style={{
                            background: channel === c.id ? "white" : "transparent",
                            color: channel === c.id ? "var(--primary)" : "var(--muted)",
                            boxShadow: channel === c.id ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                          }}
                        >
                          {c.icon} <span className="hidden xs:inline">{c.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual Selection UI */}
                <AnimatePresence>
                  {audience === "individual" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden mb-6"
                    >
                      <div>
                        <Label required>Select Recipients</Label>
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input
                            placeholder="Search staff or drivers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11"
                          />
                        </div>
                      </div>

                      <div className="max-h-[180px] overflow-y-auto border border-[var(--border)] rounded-xl bg-white p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {isFetchingRecipients ? (
                          <div className="col-span-full py-4 text-center">
                            <Loader2 className="animate-spin text-[var(--primary)] mx-auto" size={24} />
                          </div>
                        ) : (
                          allRecipients
                            .filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((rec) => {
                              const isSelected = selectedRecipients.some((s) => s.id === rec.id && s.type === rec.type);
                              return (
                                <button
                                  key={`${rec.type}-${rec.id}`}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedRecipients((prev) => prev.filter((s) => !(s.id === rec.id && s.type === rec.type)));
                                    } else {
                                      setSelectedRecipients((prev) => [...prev, rec]);
                                    }
                                  }}
                                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                    isSelected ? "bg-[#f5f3ff] border-[#7c3aed]" : "bg-white border-[#f1f5f9] hover:bg-[#fafbff]"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      isSelected ? "bg-[#7c3aed] border-[#7c3aed]" : "border-[#cbd5e1]"
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[12px] font-[800] text-[#1e293b] truncate">{rec.name}</p>
                                    <p className="text-[10px] font-[700] text-[#94a3b8] uppercase">{rec.type}</p>
                                  </div>
                                </button>
                              );
                            })
                        )}
                      </div>

                      {selectedRecipients.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {selectedRecipients.map((s) => (
                            <span
                              key={`tag-${s.type}-${s.id}`}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-[#ede9fe] text-[#7c3aed] text-[10px] font-[900] rounded-lg"
                            >
                              {s.name}
                              <X
                                size={12}
                                className="cursor-pointer hover:text-red-500"
                                onClick={() => setSelectedRecipients((prev) => prev.filter((p) => !(p.id === s.id && p.type === s.type)))}
                              />
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {channel === "email" && (
                  <div className="mb-6">
                    <Label required>Subject Line</Label>
                    <Input
                      placeholder="Enter a compelling subject..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <Label required>Message Body</Label>
                    <span
                      className="text-[10px] font-black tracking-widest px-2 py-1 rounded-md bg-[var(--surface-hover)]"
                      style={{
                        color: message.length > 5000 ? "var(--danger)" : "var(--muted)",
                        marginBottom: 4,
                      }}
                    >
                      {message.length} / 5000
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    placeholder={`Type your ${channel.toLowerCase()} message here...`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="form-input w-full"
                    style={{
                      resize: "vertical",
                      lineHeight: 1.6,
                      borderRadius: "16px",
                      padding: "16px",
                      minHeight: "180px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>

                {/* Attachment Preview (ABS Image Url) */}
                {attachmentUrl && (
                  <div className="mb-6 p-4 rounded-xl border border-dashed border-[#e2e8f0] bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={attachmentUrl}
                        alt="Upload Preview"
                        className="w-16 h-16 rounded-lg object-cover border border-[#e2e8f0] flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">Uploaded Attachment</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Azure Blob Storage Link</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="p-2 text-rose-600 hover:bg-rose-50"
                      onClick={() => setAttachmentUrl(null)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}

                {/* Hidden input for File Uploads */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                />

                {/* Toolbar & Actions */}
                <div
                  className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      onClick={handleAttachClick}
                      disabled={isUploading}
                      className="flex-1 sm:flex-none justify-center gap-2"
                    >
                      {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                      {isUploading ? "Uploading..." : "Attach File"}
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 sm:flex-none justify-center gap-2"
                    >
                      <CalendarClock size={16} /> Schedule
                    </Button>
                  </div>

                  <Button
                    onClick={handleSend}
                    disabled={!message || isSent || isSending || isUploading}
                    variant={isSent ? "secondary" : "default"}
                    className="justify-center gap-2 shadow-primary/20"
                  >
                    <AnimatePresence mode="wait">
                      {isSent ? (
                        <motion.div
                          key="sent"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="flex items-center gap-2 font-black"
                        >
                          <CheckCircle2 size={18} /> Dispatched
                        </motion.div>
                      ) : isSending ? (
                        <motion.div
                          key="sending"
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="flex items-center gap-2 font-black"
                        >
                          <Loader2 size={18} className="animate-spin" /> Sending...
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="flex items-center gap-2 font-black"
                        >
                          <Megaphone size={18} /> Send Broadcast
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>

                {sendError && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(220, 38, 38, 0.08)",
                      border: "1px solid rgba(220, 38, 38, 0.2)",
                      color: "#DC2626",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {sendError}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT COLUMN: HISTORY & STATS ── */}
          <motion.div
            variants={slideUp}
            className="w-full lg:w-[340px] flex flex-col gap-6 shrink-0"
          >
            {/* Analytics Stats */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 24,
                border: "1px solid var(--border)",
                padding: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  margin: "0 0 20px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <BarChart4 size={16} color="var(--primary)" /> Analytics Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div
                  style={{
                    background: "var(--surface-hover)",
                    padding: "16px 12px",
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--muted)",
                      marginBottom: 4,
                    }}
                  >
                    TOTAL SENT
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "var(--text)",
                    }}
                  >
                    {stats.totalSent}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.05)",
                    padding: "16px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(16, 185, 129, 0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--success)",
                      marginBottom: 4,
                    }}
                  >
                    OPEN RATE
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "var(--success)",
                    }}
                  >
                    {stats.openRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduled Queue */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 24,
                border: "1px solid var(--border)",
                padding: "24px",
              }}
            >
              <div className="flex justify-between items-center mb-5">
                <h3
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Clock size={16} color="var(--warning)" /> Scheduled
                </h3>
                <Badge variant="amber">
                  {scheduledMessages.length} PENDING
                </Badge>
              </div>
              <div className="flex flex-col gap-3">
                {scheduledMessages.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[var(--muted)] font-bold">
                    No scheduled items.
                  </div>
                ) : (
                  scheduledMessages.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: "16px",
                        borderRadius: 14,
                        border: "1px dashed var(--border)",
                        background: "var(--surface-hover)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 900,
                          color: "var(--text)",
                          marginBottom: 6,
                        }}
                      >
                        {s.title}
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-[var(--muted)]">
                          To: <span className="text-[var(--text)]">{s.audience}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[var(--warning)]">
                          <CalendarClock size={12} /> {s.date}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                        <button
                          className="act-btn act-delete"
                          onClick={() => setDeleteItem(s)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dispatch Logs */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 24,
                border: "1px solid var(--border)",
                padding: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  margin: "0 0 20px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} color="var(--success)" /> Dispatch Logs
              </h3>
              <div className="flex flex-col gap-5">
                {isLoadingHistory ? (
                  <div className="flex justify-center py-6 text-[var(--muted)]">
                    <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
                  </div>
                ) : recentBroadcasts.length === 0 ? (
                  <div className="text-center py-6 text-xs font-bold text-[var(--muted)]">
                    No recent broadcasts found.
                  </div>
                ) : (
                  recentBroadcasts.map((r, idx) => (
                    <div
                      key={r.id}
                      className="flex flex-col gap-4 relative"
                      style={{
                        paddingBottom: idx !== recentBroadcasts.length - 1 ? "20px" : "0",
                        borderBottom: idx !== recentBroadcasts.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div className="flex flex-row gap-4 items-start">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background:
                              r.channel === "Email"
                                ? "var(--info-light)"
                                : r.channel === "SMS"
                                  ? "var(--warning-light)"
                                  : "var(--primary-light)",
                            color:
                              r.channel === "Email"
                                ? "var(--info)"
                                : r.channel === "SMS"
                                  ? "var(--warning)"
                                  : "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {r.channel === "Email" ? (
                            <Mail size={16} />
                          ) : r.channel === "SMS" ? (
                            <MessageSquare size={16} />
                          ) : (
                            <BellRing size={16} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 900,
                              color: "var(--text)",
                              marginBottom: 2,
                            }}
                            className="truncate"
                          >
                            {r.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--muted)",
                              fontWeight: 600,
                              marginBottom: 8,
                            }}
                          >
                            {r.audience} • {r.date}
                          </div>
                          <div className="flex flex-row items-center gap-3">
                            <Badge variant="green">
                              {r.status}
                            </Badge>
                            <span className="flex items-center gap-1 text-[11px] font-black text-[var(--success)]">
                              <Eye size={12} /> {r.opens}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          marginTop: 4,
                          width: "100%",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="p-1.5 rounded-lg text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] transition-all"
                          onClick={() => setViewItem(r)}
                        >
                          <span className="material-symbols-outlined ms" style={{ fontSize: 16 }}>
                            visibility
                          </span>
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-[#64748b] hover:text-red-500 hover:bg-red-50 transition-all"
                          onClick={() => setDeleteItem(r)}
                        >
                          <span className="material-symbols-outlined ms" style={{ fontSize: 16 }}>
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* OVERLAY: VIEW ITEM */}
      <AnimatePresence>
        {viewItem && (
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
            onClick={() => setViewItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              style={{
                background: "white",
                borderRadius: 24,
                width: "100%",
                maxWidth: 500,
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
                  padding: "24px",
                  borderRadius: "24px 24px 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {viewItem.channel === "Email" ? (
                    <Mail size={24} />
                  ) : viewItem.channel === "SMS" ? (
                    <MessageSquare size={24} />
                  ) : (
                    <BellRing size={24} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "white",
                      marginBottom: 4,
                    }}
                    className="truncate"
                  >
                    {viewItem.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,.8)",
                      fontWeight: 600,
                    }}
                  >
                    ID: #{viewItem.id} • {viewItem.channel}
                  </div>
                </div>
                <button
                  onClick={() => setViewItem(null)}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    color: "white",
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    alignSelf: "flex-start",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: "24px" }}>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>AUDIENCE</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{viewItem.audience}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>SENT DATE</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{viewItem.date}</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 900, color: "var(--primary)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                  Message Content
                </div>
                <div
                  style={{
                    padding: "16px",
                    background: "#F8FAFC",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 13,
                    color: "var(--text)",
                    lineHeight: 1.6,
                    maxHeight: 200,
                    overflowY: "auto",
                    marginBottom: 20
                  }}
                  dangerouslySetInnerHTML={{ __html: viewItem.body || "" }}
                />

                <div style={{ fontSize: 11, fontWeight: 900, color: "var(--primary)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                  Performance
                </div>
                <div className="flex gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]">
                  <div className="flex-1">
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>STATUS</div>
                    <Badge variant={viewItem.status === "Pending" ? "amber" : "green"}>{viewItem.status}</Badge>
                  </div>
                  {viewItem.opens && (
                    <div className="flex-1 border-l pl-4 border-[var(--border)]">
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>ENGAGEMENT</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "var(--success)" }}>{viewItem.opens}</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: DELETE CONFIRMATION */}
      <AnimatePresence>
        {deleteItem && (
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
            onClick={() => setDeleteItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              style={{
                background: "white",
                borderRadius: 24,
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
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#DC2626" }}>
                  delete_forever
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#DC2626", marginBottom: 8 }}>
                Delete Communication Log?
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16, lineHeight: 1.6 }}>
                You are about to permanently remove this delivery log from history.
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 24 }} className="truncate">
                {deleteItem.title}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <Button variant="outline" onClick={() => setDeleteItem(null)} style={{ minWidth: 100 }}>
                  Cancel
                </Button>
                <Button onClick={handleDelete} style={{ minWidth: 100, background: "#DC2626" }}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkCommunicationPage;
