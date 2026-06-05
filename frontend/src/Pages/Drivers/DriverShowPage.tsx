// src/Pages/Drivers/DriverShowPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

// Icons (Using common SaaS icons)
import {
  User,
  MapPin,
  Briefcase,
  FileText,
  IdCard,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  Edit,
  Mail,
  Phone,
  Truck,
  Heart,
  Download,
  Cpu
} from "lucide-react";

// Components
import { Loader } from "../../Components/UI/Loader";
import DocumentItem from "../../Components/UI/DocumentItem";
import tenantApi, { tenantAsset } from "../../Services/ApiService";
import type { Driver } from "../Drivers/Driver.types";
import { DUMMY_USER_IMAGE, formatDate } from "../../Utils/Toolkit";
import EmptyState from "../../Components/UI/EmptyState";
import ExportOverlay from "../../Components/UI/ExportOverlay";

/* ── Section Card Helper ── */
const SectionCard = ({ icon: Icon, title, colorClass, children }: any) => (
  <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-sm overflow-hidden">
    <div className={`flex items-center gap-2.5 px-6 py-4 border-b border-[#f1f5f9] ${colorClass}`}>
      <Icon size={17} strokeWidth={2.5} />
      <h3 className="text-[11.5px] font-[900] text-[#1e293b] uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ── Field Row Helper ── */
const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="py-3 border-b border-[#f8fafc] last:border-0">
    <p className="text-[10px] font-[900] text-[#94a3b8] uppercase tracking-[0.08em] mb-1">{label}</p>
    <p className="text-[13px] font-[800] text-[#1e293b]">{value || "—"}</p>
  </div>
);

const DriverShowPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [driver, setDriver] = useState<Driver | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'professional' | 'documents' | 'beacon'>('details');
    const [showExport, setShowExport] = useState(false);

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                setLoading(true);
                const response = await tenantApi.get<{ success: boolean; data: Driver }>(`/drivers/${id}`);
                if (response.data.success) setDriver(response.data.data);
            } catch (err: any) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDriver();
    }, [id]);

    const buildIndividualPdf = useCallback((d: Driver) => (opts: any) => {
        const doc = new jsPDF();
        const pw = doc.internal.pageSize.getWidth();
        
        doc.setFillColor(124, 58, 237);
        doc.rect(0, 0, pw, 45, "F");

        if (opts.logo) {
          try { doc.addImage(opts.logo, "PNG", 14, 10, 25, 25); } catch(e){}
        }
        
        const x = opts.logo ? 45 : 20;
        doc.setFontSize(22);
        doc.setTextColor(255);
        doc.text(opts.companyName || `${d.first_name} ${d.last_name}`, x, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(220, 210, 255);
        doc.text(opts.subtitle || `Driving Professional · ID: ${d.employee_id}`, x, 32);

        let y = 60;
        const field = (label: string, value: any) => {
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184);
          doc.text(label, 20, y);
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          doc.text(String(value || "—"), 75, y);
          y += 10;
        };

        field("Full Name:", `${d.first_name} ${d.last_name}`);
        field("Professional ID:", d.employee_id);
        field("Primary Contact:", d.mobile_number);
        field("Email Identity:", d.email);
        field("Locality:", d.city);
        field("Employment Type:", d.employment_type);
        field("Current Status:", (d.status || "").toUpperCase());

        const ph = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(opts.footerText || "Professional Credential Record", 20, ph - 15);
        return doc;
      }, []);

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#fafbff]"><Loader /></div>;

    if (!driver) return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fafbff] p-8">
        <EmptyState title="Driver Not Found" description="The fleet records for this ID are either missing or inaccessible." />
        <button onClick={() => navigate("/drivers")} className="mt-4 text-[#7c3aed] font-[800] uppercase text-[11px] hover:underline transition-all">Go Back</button>
      </div>
    );

    return (
        <div className="min-h-screen bg-[#fafbff] font-[var(--font-manrope)]">
            
            {/* ── Top Navigation ── */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#eef2f6] px-6 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <button onClick={() => navigate("/drivers")} className="flex items-center gap-2 text-[#64748b] hover:text-[#7c3aed] font-[800] text-[13px] group transition-colors">
                  <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                  Back to Fleet
                </button>
                <div className="flex items-center gap-3">
                   <button onClick={() => setShowExport(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#475569] border border-[#e2e8f0] rounded-[10px] text-[12.5px] font-[800] hover:bg-[#f8fafc] transition-all">
                      <Download size={16} />
                      Export Report
                   </button>
                   <button onClick={() => navigate(`/drivers/edit/${id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-[10px] text-[12.5px] font-[800] shadow-[0_4px_14px_rgba(124,58,237,0.25)] hover:translate-y-[-1px] transition-all">
                      <Edit size={16} />
                      Edit Records
                   </button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                
                {/* ── Driver Profile Header ── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[24px] border border-[#eef2f6] shadow-[0_4px_24px_rgba(124,58,237,0.06)] overflow-hidden mb-8">
                    <div className="h-28 bg-gradient-to-r from-[#7c3aed] to-[#4338ca] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    </div>

                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-14">
                            <div className="relative">
                                <img src={driver.profile_photo ? (driver.profile_photo.startsWith('http') ? driver.profile_photo : `${tenantAsset}${driver.profile_photo}`) : DUMMY_USER_IMAGE} alt={driver.first_name} className="w-28 h-28 rounded-[20px] object-cover border-4 border-white shadow-xl bg-[#ede9fe]" />
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${driver.status === 'active' ? 'bg-[#059669]' : 'bg-[#94a3b8]'}`} />
                            </div>

                            <div className="flex-1">
                                <h1 className="text-[22px] font-[900] text-[#1e293b]">{driver.first_name} <span className="text-[#7c3aed]">{driver.last_name}</span></h1>
                                <p className="text-[#64748b] font-[700] text-[13px] mt-1 flex items-center gap-2 uppercase tracking-wide">
                                    <IdCard size={14} className="text-[#cbd5e1]" />
                                    Fleet ID: {driver.employee_id || "N/A"}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <span className={`px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider border shadow-sm ${driver.status?.toLowerCase() === 'active' ? 'bg-[#ecfdf5] text-[#059669] border-[#d1fae5]' : 'bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]'}`}>
                                        {driver.status || "active"}
                                    </span>
                                    <span className="px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider bg-[#eff6ff] text-[#3b82f6] border border-[#dbeafe]">
                                        {driver.employment_type || "Contract"}
                                    </span>
                                    {driver.vehicle && (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracing-wider bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]">
                                            <Truck size={12} /> {driver.vehicle}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="hidden lg:flex flex-col items-end gap-2 text-right">
                                <div className="flex items-center gap-2 text-[12.5px] font-[700] text-[#64748b]">
                                   <Mail size={14} className="text-[#cbd5e1]" />
                                   {driver.email || "no-email@registry.com"}
                                </div>
                                <div className="flex items-center gap-2 text-[12.5px] font-[700] text-[#64748b]">
                                   <Phone size={14} className="text-[#cbd5e1]" />
                                   {driver.mobile_number}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Nav */}
                    <div className="border-t border-[#f1f5f9] px-4 sm:px-8 flex gap-1 overflow-x-auto custom-scrollbar">
                        {[
                          { key: 'details', label: 'Identity & Contacts', icon: User },
                          { key: 'professional', label: 'Compliance & Permits', icon: ShieldCheck },
                          { key: 'documents', label: 'Fleet Vault', icon: FileText },
                          { key: 'beacon', label: 'Beacon Assigned', icon: Cpu }
                        ].map((tab) => (
                           <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`flex items-center gap-2 px-5 py-4 text-[11px] font-[800] uppercase tracking-wider transition-all relative border-b-[3px] whitespace-nowrap ${activeTab === tab.key ? "text-[#7c3aed] border-[#7c3aed]" : "text-[#94a3b8] border-transparent hover:text-[#475569]"}`}>
                              <tab.icon size={15} />
                              {tab.label}
                           </button>
                        ))}
                    </div>
                </motion.div>

                {/* ── Content Area ── */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                        
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <SectionCard icon={User} title="Basic Information" colorClass="bg-[#fafbff] text-[#7c3aed]">
                                   <Field label="Full Name" value={`${driver.first_name} ${driver.last_name}`} />
                                   <Field label="Date of Birth" value={formatDate(driver.date_of_birth)} />
                                   <Field label="Gender" value={driver.gender} />
                                   <Field label="Blood Group" value={driver.blood_group} />
                                   <Field label="Mobile" value={driver.mobile_number} />
                                </SectionCard>

                                <SectionCard icon={Heart} title="Guardian Registry" colorClass="bg-[#fafbff] text-[#dc2626]">
                                   <p className="text-[10px] font-[900] text-[#dc2626] uppercase opacity-60 mb-2 tracking-widest">Primary Emergency</p>
                                   <Field label="Guardian Name" value={driver.primary_person_name} />
                                   <Field label="Phone Protocol" value={driver.primary_person_phone_1} />
                                   <div className="h-px bg-[#f1f5f9] my-4" />
                                   <p className="text-[10px] font-[900] text-[#64748b] uppercase opacity-60 mb-2 tracking-widest">Secondary Contact</p>
                                   <Field label="Person Name" value={driver.secondary_person_name} />
                                   <Field label="Registry No" value={driver.secondary_person_phone_1} />
                                </SectionCard>

                                <SectionCard icon={CreditCard} title="Bank Registry" colorClass="bg-[#fafbff] text-[#0ea5e9]">
                                   <Field label="Account Holder" value={driver.account_holder_name} />
                                   <Field label="Bank Provider" value={driver.bank_name} />
                                   <Field label="Registry No" value={driver.account_number} />
                                   <Field label="IFSC Protocol" value={driver.ifsc_code} />
                                </SectionCard>

                                <div className="lg:col-span-3">
                                   <SectionCard icon={MapPin} title="Geographic Coordinates" colorClass="bg-[#fafbff] text-[#059669]">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                         <div className="md:col-span-2">
                                            <Field label="Fleet Residence" value={`${driver.address_line_1}, ${driver.address_line_2 || ''}`} />
                                         </div>
                                         <Field label="City Hub" value={driver.city} />
                                         <Field label="State / Zone" value={driver.state} />
                                      </div>
                                   </SectionCard>
                                </div>
                            </div>
                        )}

                        {activeTab === 'professional' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SectionCard icon={Briefcase} title="Career Snapshot" colorClass="bg-[#fafbff] text-[#6366f1]">
                                       <Field label="Experience (Years)" value={String(driver.driving_experience || 0)} />
                                       <Field label="Employment Archetype" value={driver.employment_type} />
                                       <Field label="Active Vehicle" value={driver.vehicle || "Unaligned"} />
                                       <Field label="Beacon IMEI" value={driver.beacon_id || "Unbound"} />
                                    </SectionCard>

                                    <SectionCard icon={ShieldCheck} title="Compliance Status" colorClass="bg-[#fafbff] text-[#059669]">
                                       <div className="space-y-4">
                                          <div className="flex items-center justify-between py-2 border-b border-[#f1f5f9]">
                                             <span className="text-[11px] font-[900] text-[#64748b] uppercase tracking-wide">Safety Induction</span>
                                             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${driver.safety_training_completion === 'YES' ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#f8fafc] text-[#94a3b8]'}`}>{driver.safety_training_completion === 'YES' ? 'CERTIFIED' : 'PENDING'}</span>
                                          </div>
                                          <div className="flex items-center justify-between py-2 border-b border-[#f1f5f9]">
                                             <span className="text-[11px] font-[900] text-[#64748b] uppercase tracking-wide">Medical Clearance</span>
                                             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${driver.medical_fitness === 'YES' ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#f8fafc] text-[#94a3b8]'}`}>{driver.medical_fitness === 'YES' ? 'FIT' : 'EXPIRED'}</span>
                                          </div>
                                          <div className="flex items-center justify-between py-2">
                                             <span className="text-[11px] font-[900] text-[#64748b] uppercase tracking-wide">Police Protocol</span>
                                             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${driver.police_verification === 'YES' ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#f8fafc] text-[#94a3b8]'}`}>{driver.police_verification === 'YES' ? 'VERIFIED' : 'PENDING'}</span>
                                          </div>
                                       </div>
                                    </SectionCard>
                                </div>

                                <SectionCard icon={IdCard} title="Certification Matrix" colorClass="bg-[#fafbff] text-[#7c3aed]">
                                   {driver.license_insurance && driver.license_insurance.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                         {driver.license_insurance.map((li, i) => (
                                            <div key={i} className="p-4 rounded-[14px] bg-[#f8faff] border border-[#e2e8f0] flex items-center justify-between hover:border-[#7c3aed] transition-colors group">
                                               <div>
                                                  <p className="text-[10px] font-black text-[#7c3aed] uppercase mb-1">{li.type || 'PERMIT'}</p>
                                                  <p className="text-[13px] font-[900] text-[#1e293b]">{li.number}</p>
                                               </div>
                                               <div className="text-right">
                                                  <p className="text-[9px] font-[800] text-[#94a3b8] uppercase">Expires</p>
                                                  <p className="text-[11px] font-[900] text-[#475569]">{formatDate(li.exp_date)}</p>
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                   ) : (
                                      <div className="py-8 text-center bg-[#fafbff] rounded-[16px] border border-dashed border-[#e2e8f0]">
                                         <p className="text-[11px] font-[900] text-[#94a3b8] uppercase tracking-widest">No active permits in registry</p>
                                      </div>
                                   )}
                                </SectionCard>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <SectionCard icon={FileText} title="Document Vault" colorClass="bg-[#fafbff] text-[#dc2626]">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {driver.driving_license && <DocumentItem label="Registry License" path={driver.driving_license} updatedAt={driver.updated_at} />}
                                  {driver.aadhaar_card && <DocumentItem label="Identity Proof (AADHAAR)" path={driver.aadhaar_card} updatedAt={driver.updated_at} />}
                                  {driver.pan_card && <DocumentItem label="Tax Registry (PAN)" path={driver.pan_card} updatedAt={driver.updated_at} />}
                                  {driver.police_verification_doc && <DocumentItem label="Verification Seal" path={driver.police_verification_doc} updatedAt={driver.updated_at} />}
                                  {driver.medical_fitness_certificate && <DocumentItem label="Medical Fitness Cert" path={driver.medical_fitness_certificate} updatedAt={driver.updated_at} />}
                                  {driver.address_proof_doc && <DocumentItem label="Address Registry" path={driver.address_proof_doc} updatedAt={driver.updated_at} />}
                               </div>
                            </SectionCard>
                        )}

                        {activeTab === 'beacon' && (
                            <SectionCard icon={Cpu} title="Beacon Hardware Binding" colorClass="bg-[#fafbff] text-[#10b981]">
                                {driver.beacon_id ? (
                                    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-[#ecfdf5] text-[#10b981] rounded-full flex items-center justify-center mb-4 relative">
                                            <Cpu size={32} />
                                            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#10b981]"></span>
                                            </span>
                                        </div>
                                        <h4 className="text-[16px] font-[900] text-[#1e293b] mb-1 uppercase tracking-tight">Active Beacon Linked</h4>
                                        <p className="text-[12px] text-[#64748b] mb-6">This driver is currently assigned to a physical tracking device.</p>
                                        
                                        <div className="w-full bg-[#fafbff] rounded-xl border border-[#f1f5f9] p-4 text-left space-y-3">
                                            <div>
                                                <span className="text-[9px] font-[900] text-[#94a3b8] uppercase tracking-wider block mb-0.5">Device ID / Serial</span>
                                                <span className="text-[13.5px] font-[800] text-[#1e293b]">{driver.beacon_id}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-[900] text-[#94a3b8] uppercase tracking-wider block mb-0.5">Hardware Status</span>
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-[800] bg-[#ecfdf5] text-[#059669] border border-[#d1fae5] uppercase tracking-wide">
                                                    ONLINE & TRANSMITTING
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-16 text-center max-w-sm mx-auto">
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Cpu size={32} />
                                        </div>
                                        <h3 className="text-[15px] font-[900] text-[#1e293b] mb-1">No Beacon Assigned</h3>
                                        <p className="text-[12.5px] text-[#94a3b8] mb-6">This driver does not have any physical beacon linked to them yet.</p>
                                        <button
                                            onClick={() => navigate(`/drivers/edit/${id}`)}
                                            className="btn btn-primary justify-center w-full"
                                        >
                                            Assign Beacon Device
                                        </button>
                                    </div>
                                )}
                            </SectionCard>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showExport && driver && (
                  <ExportOverlay 
                    onClose={() => setShowExport(false)} 
                    buildPdf={buildIndividualPdf(driver)}
                    title={`Export Driver Personnel Profile`}
                    defaultTitle={`${driver.first_name} ${driver.last_name}`}
                    defaultSubtitle={`Personnel Identity · ID: ${driver.employee_id}`}
                    fileName={`driver-${driver.employee_id}.pdf`}
                  />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverShowPage;
