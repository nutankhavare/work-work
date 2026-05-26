import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { INITIAL_FEEDBACKS } from "../../data/feedbackData";
import { Badge } from "../../Components/UI/index";
import PageHeader from "../../Components/UI/PageHeader";

/* ── Types ─────────────────────────────────── */
interface ResolveForm {
  complaintId: string;
  category: string;
  resolutionSummary: string;
  closingRemarks: string;
}

type Errs = Partial<Record<keyof ResolveForm, string>>;

const CATEGORIES = [
  "Vehicle Issue",
  "Driver Behaviour",
  "Route / Navigation",
  "Safety Concern",
  "Billing / Payment",
  "App / Technical",
  "Other",
];

/* ── Helpers ────────────────────────────────── */
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
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: ".08em",
      color: "#64748B",
      marginBottom: 6,
    }}
  >
    {children}
    {required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
  </label>
);

const Err = ({ msg }: { msg?: string }) =>
  msg ? (
    <div
      style={{
        fontSize: 10,
        color: "#DC2626",
        fontWeight: 700,
        marginTop: 3,
      }}
    >
      ⚠ {msg}
    </div>
  ) : null;

/* ── Component ──────────────────────────────── */
export const FeedbackResolve = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  /* Look up complaint from shared data */
  const complaint = id
    ? INITIAL_FEEDBACKS.find((f) => f.id === id && f.type === "complaint")
    : INITIAL_FEEDBACKS.find((f) => f.type === "complaint");

  const [form, setForm] = useState<ResolveForm>({
    complaintId: complaint?.id || "CMP-UNKNOWN",
    category: complaint?.category || "",
    resolutionSummary: "",
    closingRemarks: "",
  });
  const [errs, setErrs] = useState<Errs>({});
  const [resolved, setResolved] = useState(false);

  const f =
    (key: keyof ResolveForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((v) => ({ ...v, [key]: e.target.value }));
      setErrs((v) => ({ ...v, [key]: undefined }));
    };

  const validate = (): boolean => {
    const e: Errs = {};
    if (!form.category) e.category = "Select a category";
    if (!form.resolutionSummary.trim())
      e.resolutionSummary = "Resolution summary is required";
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const handleResolve = () => {
    if (!validate()) {
      const first = document.querySelector('[data-err="1"]');
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setResolved(true);
  };

  /* ── Success screen ── */
  if (resolved) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <PageHeader
          title="Feedbacks & Complaints"
          icon="chat_bubble"
          breadcrumb="Admin / Feedbacks / Resolve"
        />
        <div
          className="px-4 lg:px-6 pb-8 flex items-center justify-center min-h-[60vh]"
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg w-full shadow-xl shadow-slate-200/50"
          >
            <div
              className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6"
            >
              <span
                className="material-symbols-outlined text-5xl text-emerald-500"
              >
                check_circle
              </span>
            </div>
            <div
              className="text-2xl font-[900] text-slate-800 mb-2"
            >
              Complaint Resolved
            </div>
            <div className="text-[13px] font-[600] text-emerald-600 mb-1">
              Complaint <b>{form.complaintId}</b> has been successfully closed.
            </div>
            <div
              className="text-[12px] font-[700] text-slate-400 mb-8"
            >
              Category:{" "}
              <span className="text-[#7c3aed]">
                {form.category}
              </span>{" "}
              · Status:{" "}
              <span className="text-emerald-500">
                Resolved
              </span>
            </div>
            <div
              className="flex justify-center"
            >
              <button
                className="px-8 py-3 bg-[#7c3aed] text-white rounded-xl font-[800] text-[13px] hover:bg-[#6d28d9] transition-all flex items-center gap-2 shadow-lg shadow-[#7c3aed]/20"
                onClick={() => navigate("/feedbacks")}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>{" "}
                Back to Feedbacks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PageHeader
        title="Resolve Complaint"
        icon="chat_bubble"
        breadcrumb="Admin / Feedbacks / Resolve"
        showBackButton={true}
        backButtonLink="/feedbacks"
      />

      <div className="px-4 lg:px-6 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ── ORIGINAL COMPLAINT DETAILS ── */}
          {complaint && (
            <div
              className="bg-rose-50/50 border border-rose-100 rounded-2xl overflow-hidden"
            >
              <div
                className="px-6 py-4 border-b border-rose-100 flex items-center justify-between"
              >
                <span
                  className="text-[10px] font-[900] text-rose-500 uppercase tracking-widest"
                >
                  Original Complaint Details
                </span>
                <div className="flex gap-2">
                  <Badge variant="red">{complaint.priority}</Badge>
                  <Badge variant="amber">{complaint.status}</Badge>
                </div>
              </div>
              <div className="p-6">
                <div
                  className="flex items-start gap-5"
                >
                  <div
                    className="w-12 h-12 rounded-xl bg-white border border-rose-100 flex items-center justify-center shrink-0 shadow-sm"
                  >
                    <span
                      className="material-symbols-outlined text-rose-500 text-2xl"
                    >
                      report
                    </span>
                  </div>
                  <div className="flex-1">
                    <div
                      className="flex items-center gap-2 mb-2"
                    >
                      <span
                        className="text-[15px] font-[900] text-slate-800"
                      >
                        {complaint.name}
                      </span>
                      <span
                        className="text-[11px] font-[700] text-slate-400"
                      >
                        ({complaint.role})
                      </span>
                    </div>
                    <div
                      className="text-[13px] font-[600] text-slate-600 leading-relaxed mb-4 italic bg-white/50 p-4 rounded-xl border border-rose-100/50"
                    >
                      "{complaint.comment}"
                    </div>
                    <div
                      className="flex items-center gap-6 flex-wrap"
                    >
                      <div
                        className="flex items-center gap-2 text-[11px] font-[800] text-slate-400"
                      >
                        <span
                          className="material-symbols-outlined text-[14px]"
                        >
                          directions_bus
                        </span>
                        {complaint.target}
                      </div>
                      <div
                        className="flex items-center gap-2 text-[11px] font-[800] text-slate-400"
                      >
                        <span
                          className="material-symbols-outlined text-[14px]"
                        >
                          calendar_today
                        </span>
                        {complaint.date}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── RESOLVE FORM CARD ── */}
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div
              className="px-8 py-6 border-b border-slate-100"
            >
              <div
                className="flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"
                >
                  <span
                    className="material-symbols-outlined text-emerald-600"
                  >
                    check_circle
                  </span>
                </div>
                <div>
                  <div
                    className="text-lg font-[900] text-slate-800"
                  >
                    Resolution Form
                  </div>
                  <div
                    className="text-[12px] font-[600] text-slate-400"
                  >
                    Please provide the details of the resolution taken.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label>Complaint ID</Label>
                  <input
                    className="w-full px-4 py-[11px] bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-[700] text-slate-500 cursor-not-allowed"
                    value={form.complaintId}
                    readOnly
                  />
                </div>
                <div data-err={errs.category ? "1" : undefined}>
                  <Label required>Category</Label>
                  <select
                    className="w-full px-4 py-[11px] bg-white border border-slate-200 rounded-xl text-[13px] font-[700] text-slate-700 focus:outline-none focus:border-[#7c3aed] appearance-none cursor-pointer"
                    value={form.category}
                    onChange={f("category")}
                    style={{
                      borderColor: errs.category ? "#DC2626" : undefined,
                    }}
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <Err msg={errs.category} />
                </div>
              </div>

              <div
                className="mb-6"
                data-err={errs.resolutionSummary ? "1" : undefined}
              >
                <Label required>Resolution Summary</Label>
                <textarea
                  className="w-full px-4 py-[11px] bg-white border border-slate-200 rounded-xl text-[13px] font-[600] text-slate-700 focus:outline-none focus:border-[#7c3aed] min-h-[120px] resize-none"
                  placeholder="Describe the steps taken to resolve the complaint..."
                  value={form.resolutionSummary}
                  onChange={f("resolutionSummary")}
                  style={{
                    borderColor: errs.resolutionSummary ? "#DC2626" : undefined,
                  }}
                />
                <Err msg={errs.resolutionSummary} />
              </div>

              <div className="mb-8">
                <Label>Closing Remarks</Label>
                <textarea
                  className="w-full px-4 py-[11px] bg-white border border-slate-200 rounded-xl text-[13px] font-[600] text-slate-700 focus:outline-none focus:border-[#7c3aed] min-h-[80px] resize-none"
                  placeholder="Additional notes for internal records..."
                  value={form.closingRemarks}
                  onChange={f("closingRemarks")}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  className="px-6 py-[11px] bg-white border border-slate-200 rounded-xl text-[13px] font-[800] text-slate-600 hover:bg-slate-50 transition-all"
                  onClick={() => navigate("/feedbacks")}
                >
                  Cancel
                </button>
                <button
                  className="px-8 py-[11px] bg-[#7c3aed] text-white rounded-xl font-[800] text-[13px] hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-2"
                  onClick={handleResolve}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  Resolve &amp; Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackResolve;
