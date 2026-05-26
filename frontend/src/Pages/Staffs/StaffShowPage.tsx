// src/Pages/Staffs/StaffShowPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

// Icons
import {
  User,
  Briefcase,
  Landmark,
  Phone,
  Edit,
  Users,
  FileText,
  MapPin,
  ChevronLeft,
  Download,
  Mail,
  Hash,
  AlertCircle,
  Heart
} from "lucide-react";

// Components
import { Loader } from "../../Components/UI/Loader";
import DocumentItem from "../../Components/UI/DocumentItem";
import tenantApi, { tenantAsset } from "../../Services/ApiService";
import type { Employee } from "./Staff.types";
import { DUMMY_USER_IMAGE, formatDate } from "../../Utils/Toolkit";
import EmptyState from "../../Components/UI/EmptyState";
import { useAlert } from "../../Context/AlertContext";
import ExportOverlay from "../../Components/UI/ExportOverlay";

/* ── Section Card ── */
const SectionCard = ({
  icon: Icon,
  title,
  colorClass,
  children,
}: {
  icon: any;
  title: string;
  colorClass: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-sm overflow-hidden">
    <div className={`flex items-center gap-2.5 px-6 py-4 border-b border-[#f1f5f9] ${colorClass}`}>
      <Icon size={17} strokeWidth={2.5} />
      <h3 className="text-[11.5px] font-[900] text-[#1e293b] uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ── Field Row ── */
const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="py-3 border-b border-[#f8fafc] last:border-0">
    <p className="text-[10px] font-[900] text-[#94a3b8] uppercase tracking-[0.08em] mb-1">{label}</p>
    <p className="text-[13.5px] font-[700] text-[#1e293b]">{value || "—"}</p>
  </div>
);

type TabKey = "details" | "dependants" | "documents";

// --- Main Component ---
const StaffShowPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [staff, setStaff] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await tenantApi.get<{ success: boolean; data: Employee }>(`/employees/${id}`);
        if (response.data.success) setStaff(response.data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load staff member.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStaff();
  }, [id]);

  /* ── PDF Export Builder ── */
  const buildIndividualPdf = useCallback((emp: Employee) => (opts: any) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pw, 45, "F");

    if (opts.logo) {
      try { doc.addImage(opts.logo, "PNG", 14, 10, 25, 25); } catch(e){}
    }
    
    const startX = opts.logo ? 45 : 20;
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text(opts.companyName || `${emp.first_name} ${emp.last_name}`, startX, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(220, 210, 255);
    doc.text(opts.subtitle || `Employee ID: ${emp.employee_id || 'N/A'}  |  ${emp.designation || 'Staff Member'}`, startX, 32);

    let y = 60;
    const field = (label: string, value: string) => {
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(label, 20, y);
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(value || "—", 70, y);
      y += 10;
    };

    field("Full Name:", `${emp.first_name} ${emp.last_name}`);
    field("Employee ID:", emp.employee_id || "-");
    field("Email Address:", emp.email || "-");
    field("Department:", emp.department || "-");
    field("Designation:", emp.designation || "-");
    field("Phone Number:", emp.phone || "-");
    field("Status:", (emp.status || "-").toUpperCase());

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Personnel Record", 20, ph - 15);

    return doc;
  }, []);

  /* ─── Loading / Error States ─── */
  if (loading)
    return (
      <div className="min-h-screen bg-[#fafbff] flex items-center justify-center">
        <Loader />
      </div>
    );

  if (error || !staff)
    return (
      <div className="min-h-screen bg-[#fafbff] flex flex-col items-center justify-center gap-6 p-8">
        <AlertCircle size={64} className="text-[#e2e8f0]" strokeWidth={1.5} />
        <EmptyState title="Staff Member Not Found" description={error || "Data unavailable"} />
        <button
          onClick={() => navigate("/staff")}
          className="px-6 py-3 bg-[#7c3aed] text-white rounded-[12px] text-[13px] font-[800]"
        >
          Back to Staff List
        </button>
      </div>
    );

  /* ─── Tabs Config ─── */
  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "details", label: "Details", icon: User },
    { key: "dependants", label: "Dependants & Emergency", icon: Users },
    { key: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#fafbff] font-[var(--font-manrope)]">

      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#eef2f6] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/staff")}
            className="flex items-center gap-2 text-[#64748b] hover:text-[#7c3aed] font-[800] text-[13px] group transition-colors"
          >
            <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />
            Back to Staff
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e2e8f0] text-[#475569] rounded-[10px] text-[12.5px] font-[800] hover:bg-[#f8fafc] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
            >
              <Download size={16} />
              Preview Report
            </button>
            <button
              onClick={() => navigate(`/staff/edit/${id}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-[10px] text-[12.5px] font-[800] shadow-[0_4px_14px_rgba(124,58,237,0.25)] hover:translate-y-[-1px] transition-all"
            >
              <Edit size={16} />
              Edit Employee
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] border border-[#eef2f6] shadow-[0_4px_24px_rgba(124,58,237,0.06)] overflow-hidden mb-8"
        >
          {/* Gradient Banner */}
          <div className="h-28 bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a855f7] relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 0%, transparent 50%)" }} />
          </div>

          <div className="px-8 pb-8 relative">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-14">
              <div className="relative">
                <img
                  src={staff.photo ? (staff.photo.startsWith('http') ? staff.photo : `${tenantAsset}${staff.photo}`) : DUMMY_USER_IMAGE}
                  alt={staff.first_name}
                  className="w-28 h-28 rounded-[20px] object-cover border-4 border-white shadow-xl bg-[#ede9fe]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${staff.first_name}+${staff.last_name}&background=ede9fe&color=7c3aed&bold=true&size=112`;
                  }}
                />
                <div
                  className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white ${
                    staff.status?.toLowerCase() === "active" ? "bg-[#059669]" : "bg-[#94a3b8]"
                  }`}
                />
              </div>

              <div className="flex-1 pt-2 sm:pt-0">
                <h1 className="text-[22px] font-[900] text-[#1e293b] leading-tight">
                  {staff.first_name}{" "}
                  <span className="text-[#7c3aed]">{staff.last_name}</span>
                </h1>
                <p className="text-[#64748b] font-[700] text-[13px] mt-1">{staff.designation || "Staff Member"}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span
                    className={`px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider border ${
                      staff.status?.toLowerCase() === "active"
                        ? "bg-[#ecfdf5] text-[#059669] border-[#d1fae5]"
                        : "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]"
                    }`}
                  >
                    {staff.status || "Active"}
                  </span>
                  {staff.employment_type && (
                    <span className="px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider bg-[#eff6ff] text-[#3b82f6] border border-[#dbeafe]">
                      {staff.employment_type}
                    </span>
                  )}
                  {staff.roles && staff.roles.length > 0 && (
                    <span className="px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider bg-[#ede9fe] text-[#7c3aed] border border-[#ddd6fe]">
                      {staff.roles.length} Role{staff.roles.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end gap-2 text-right">
                <div className="flex items-center gap-2 text-[12.5px] font-[700] text-[#64748b]">
                  <Hash size={14} className="text-[#cbd5e1]" />
                  {staff.employee_id || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] font-[700] text-[#64748b]">
                  <Mail size={14} className="text-[#cbd5e1]" />
                  {staff.email}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] font-[700] text-[#64748b]">
                  <Phone size={14} className="text-[#cbd5e1]" />
                  {staff.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Nav */}
          <div className="border-t border-[#f1f5f9] px-4 sm:px-8 flex gap-1 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-[12px] font-[800] uppercase tracking-wide transition-all relative border-b-[3px] whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-[#7c3aed] border-[#7c3aed]"
                    : "text-[#94a3b8] border-transparent hover:text-[#475569]"
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >

            {/* TAB 1 — DETAILS */}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Info */}
                <SectionCard icon={User} title="Personal Information" colorClass="bg-[#fafbff] text-[#7c3aed]">
                  <Field label="First Name" value={staff.first_name} />
                  <Field label="Last Name" value={staff.last_name} />
                  <Field label="Gender" value={staff.gender} />
                  <Field label="Date of Birth" value={staff.date_of_birth ? formatDate(staff.date_of_birth) : undefined} />
                  <Field label="Marital Status" value={staff.marital_status} />
                  <Field label="Mobile" value={staff.phone} />
                  <Field label="Official Email" value={staff.email} />
                  <Field label="Assigned Beacon ID" value={staff.beacon_id} />
                </SectionCard>

                {/* Professional Info */}
                <SectionCard icon={Briefcase} title="Professional Info" colorClass="bg-[#fafbff] text-[#3b82f6]">
                  <Field label="Employee ID" value={staff.employee_id} />
                  <Field label="Designation" value={staff.designation} />
                  <Field label="Employment Type" value={staff.employment_type} />
                  <Field label="Joining Date" value={staff.joining_date ? formatDate(staff.joining_date) : undefined} />
                  <Field label="Account Status" value={staff.status ? staff.status.toUpperCase() : undefined} />
                  {staff.roles && staff.roles.length > 0 && (
                    <div className="pt-4 mt-2 border-t border-[#f1f5f9]">
                      <p className="text-[10px] font-[900] text-[#94a3b8] uppercase tracking-wider mb-3">Assigned Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {staff.roles.map((role, i) => (
                          <span key={i} className="px-3 py-1.5 bg-[#ede9fe] text-[#7c3aed] text-[11px] font-[900] rounded-[8px] uppercase border border-[#ddd6fe]">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* Bank Details */}
                <SectionCard icon={Landmark} title="Bank Details" colorClass="bg-[#fafbff] text-[#d97706]">
                  <Field label="Bank Name" value={staff.bank_name} />
                  <Field label="Account Holder" value={staff.account_holder_name} />
                  <Field label="Account Number" value={staff.account_number} />
                  <Field label="IFSC Code" value={staff.ifsc_code} />
                </SectionCard>

                {/* Address — Full Width */}
                <div className="lg:col-span-3">
                  <SectionCard icon={MapPin} title="Address Details" colorClass="bg-[#fafbff] text-[#059669]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6">
                      <Field label="Address Line 1" value={staff.address_line_1} />
                      <Field label="Address Line 2" value={staff.address_line_2} />
                      <Field label="Landmark" value={staff.landmark} />
                      <Field label="City" value={staff.city} />
                      <Field label="District" value={staff.district} />
                      <Field label="State" value={staff.state} />
                      <Field label="PIN Code" value={staff.pin_code} />
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* TAB 2 — DEPENDANTS */}
            {activeTab === "dependants" && (
              <div className="space-y-6">
                {/* Dependants */}
                <SectionCard icon={Heart} title="Dependants" colorClass="bg-[#fafbff] text-[#f43f5e]">
                  {staff.dependants && staff.dependants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {staff.dependants.map((dep, i) => (
                        <div key={i} className="p-5 bg-[#fafbff] rounded-[14px] border border-[#f1f5f9]">
                          <p className="text-[10px] font-[900] text-[#7c3aed] uppercase tracking-wider mb-3">Dependant {i + 1}</p>
                          <Field label="Name" value={dep.fullname} />
                          <Field label="Relation" value={dep.relation} />
                          <Field label="Age" value={String(dep.age || "—")} />
                          <Field label="Phone" value={dep.phone} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-[12px] font-[800] text-[#cbd5e1] uppercase">No dependants listed</p>
                    </div>
                  )}
                </SectionCard>

                {/* Emergency Contacts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SectionCard icon={Phone} title="Primary Emergency Contact" colorClass="bg-[#fafbff] text-[#3b82f6]">
                    <Field label="Name" value={staff.primary_person_name} />
                    <Field label="Email" value={staff.primary_person_email} />
                    <Field label="Phone 1" value={staff.primary_person_phone_1} />
                    <Field label="Phone 2" value={staff.primary_person_phone_2} />
                  </SectionCard>
                  <SectionCard icon={Phone} title="Secondary Emergency Contact" colorClass="bg-[#fafbff] text-[#7c3aed]">
                    <Field label="Name" value={staff.secondary_person_name} />
                    <Field label="Email" value={staff.secondary_person_email} />
                    <Field label="Phone 1" value={staff.secondary_person_phone_1} />
                    <Field label="Phone 2" value={staff.secondary_person_phone_2} />
                  </SectionCard>
                </div>
              </div>
            )}

            {/* TAB 3 — DOCUMENTS */}
            {activeTab === "documents" && (
              <SectionCard icon={FileText} title="Uploaded Documents" colorClass="bg-[#fafbff] text-[#ea580c]">
                {staff.aadhaar_card || staff.pan_card || staff.bank_proof ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {staff.aadhaar_card && <DocumentItem label="Aadhaar Card" path={staff.aadhaar_card} updatedAt={staff.updated_at} />}
                    {staff.pan_card && <DocumentItem label="PAN Card" path={staff.pan_card} updatedAt={staff.updated_at} />}
                    {staff.bank_proof && <DocumentItem label="Bank Proof" path={staff.bank_proof} updatedAt={staff.updated_at} />}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <FileText size={48} className="text-[#e2e8f0] mx-auto mb-4" strokeWidth={1.5} />
                    <p className="text-[12px] font-[800] text-[#cbd5e1] uppercase">No documents attached</p>
                  </div>
                )}
              </SectionCard>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showExport && staff && (
          <ExportOverlay 
            onClose={() => setShowExport(false)} 
            buildPdf={buildIndividualPdf(staff)}
            title={`Export Employee Profile`}
            defaultTitle={`${staff.first_name} ${staff.last_name}`}
            defaultSubtitle={`Staff Registry · ID: ${staff.employee_id}`}
            fileName={`employee-${staff.employee_id}.pdf`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffShowPage;
