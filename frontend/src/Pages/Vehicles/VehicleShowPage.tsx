// src/Pages/Vehicles/VehicleShowPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

// Icons
import {
  Truck,
  Edit,
  MapPin,
  Gauge,
  ShieldCheck,
  FileText,
  ChevronLeft,
  Settings,
  Battery,
  Zap,
  Info,
  Calendar,
  Fuel,
  Users,
  Download
} from "lucide-react";

// Components
import { Loader } from "../../Components/UI/Loader";
import EmptyState from "../../Components/UI/EmptyState";
import tenantApi from "../../Services/ApiService";
import type { Vehicle } from "./Vehicle.types";
import { formatDateTime } from "../../Utils/Toolkit";
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
const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="py-3 border-b border-[#f8fafc] last:border-0 grow">
    <p className="text-[10px] font-[900] text-[#94a3b8] uppercase tracking-[0.08em] mb-1">{label}</p>
    <p className="text-[13px] font-[800] text-[#1e293b]">{value !== undefined && value !== null && value !== "" ? value : "—"}</p>
  </div>
);

const VehicleShowPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'telemetry' | 'compliance'>('specs');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const response = await tenantApi.get<{ success: boolean; data: Vehicle }>(`/vehicles/${id}`);
        if (response.data.success) setVehicle(response.data.data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVehicle();
  }, [id]);

  const buildIndividualPdf = useCallback((v: Vehicle) => (opts: any) => {
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
    doc.text(opts.companyName || `Asset: ${v.vehicle_number}`, x, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(220, 210, 255);
    doc.text(opts.subtitle || `${v.make} ${v.model} · ${v.vehicle_type}`, x, 32);

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

    field("Vehicle Name:", v.vehicle_name);
    field("Registration #:", v.vehicle_number);
    field("Make / Manufacturer:", v.make);
    field("Model Designation:", v.model);
    field("Asset Category:", v.vehicle_type);
    field("Seating Capacity:", v.seating_capacity);
    field("Current Condition:", (v.status || "").toUpperCase());

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Fleet Management Technical Specification", 20, ph - 15);
    return doc;
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#fafbff]"><Loader /></div>;

  if (!vehicle) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#fafbff] p-8">
      <EmptyState title="Vehicle Not Found" description="The asset records for this unit are either missing or decommissioned." />
      <button onClick={() => navigate("/vehicles")} className="mt-4 text-[#7c3aed] font-[800] uppercase text-[11px] hover:underline">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafbff] font-[var(--font-manrope)]">
      
      {/* ── Top Navigation ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#eef2f6] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/vehicles")} className="flex items-center gap-2 text-[#64748b] hover:text-[#7c3aed] font-[800] text-[13px] group transition-colors">
            <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />
            Back to Fleet
          </button>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowExport(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#475569] border border-[#e2e8f0] rounded-[10px] text-[12.5px] font-[800] hover:bg-[#f8fafc] transition-all">
                <Download size={16} />
                Export Asset Report
             </button>
             <button onClick={() => navigate(`/vehicles/edit/${id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-[10px] text-[12.5px] font-[800] shadow-[0_4px_14px_rgba(124,58,237,0.25)] hover:translate-y-[-1px] transition-all">
                <Edit size={16} />
                Manage Asset
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* ── Vehicle Identity Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[24px] border border-[#eef2f6] shadow-[0_4px_24px_rgba(124,58,237,0.06)] overflow-hidden mb-8">
          <div className="h-28 bg-[#1e293b] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
            <div className="absolute top-6 left-8 flex items-center gap-3">
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                   <Truck className="text-white" size={24} />
                </div>
                <div>
                   <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">ASSET ID: {vehicle.id}</p>
                   <h1 className="text-white text-xl font-black uppercase tracking-wider">{vehicle.vehicle_number}</h1>
                </div>
            </div>
          </div>

          <div className="px-8 pb-8 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-6">
                  <div className="flex-1">
                      <h2 className="text-[20px] font-[900] text-[#1e293b] uppercase leading-tight">{vehicle.vehicle_name || 'Fleet Unit'}</h2>
                      <p className="text-[#64748b] font-[700] text-[13px] mt-1 flex items-center gap-2 uppercase tracking-wide">
                          {vehicle.make} {vehicle.model} • {vehicle.manufacturing_year} Registry
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                          <span className={`px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider border shadow-sm ${vehicle.status?.toLowerCase() === 'active' ? 'bg-[#ecfdf5] text-[#059669] border-[#d1fae5]' : 'bg-[#fffbeb] text-[#d97706] border-[#fef3c7]'}`}>
                              {vehicle.status || "active"}
                          </span>
                          <span className="px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]">
                              Type: {vehicle.vehicle_type || "Commercial"}
                          </span>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase bg-[#eff6ff] text-[#3b82f6] border border-[#dbeafe]">
                              <Fuel size={12} /> {vehicle.fuel_type || "DIESEL"}
                          </span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-right">
                      <div>
                        <p className="text-[10px] font-black text-[#94a3b8] uppercase">ODOMETER</p>
                        <p className="text-[16px] font-black text-[#1e293b]">{vehicle.kilometers_driven || 0} <span className="text-[10px] text-[#94a3b8]">KM</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#94a3b8] uppercase">CAPACITY</p>
                        <p className="text-[16px] font-black text-[#1e293b]">{vehicle.seating_capacity || 0} <span className="text-[10px] text-[#94a3b8]">STR</span></p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="border-t border-[#f1f5f9] px-4 sm:px-8 flex gap-1 overflow-x-auto custom-scrollbar">
              {[
                { key: 'specs', label: 'Technical Specs', icon: Settings },
                { key: 'telemetry', label: 'Telemetry & ODB', icon: Zap },
                { key: 'compliance', label: 'Compliance & Permits', icon: ShieldCheck }
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
                
                {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <SectionCard icon={Info} title="Asset Identity" colorClass="bg-[#f8faff] text-[#7c3aed]">
                           <Field label="Vehicle Name" value={vehicle.vehicle_name} />
                           <Field label="Registration No" value={vehicle.vehicle_number} />
                           <Field label="Chassis / RC No" value={vehicle.rc_number} />
                           <Field label="Manufacturer" value={vehicle.manufacturer} />
                           <Field label="Model Variant" value={vehicle.vehicle_model} />
                        </SectionCard>

                        <SectionCard icon={Calendar} title="Operational Lifecycle" colorClass="bg-[#fcfdf2] text-[#d97706]">
                           <Field label="Mfg Year" value={vehicle.manufacturing_year} />
                           <Field label="RC Issue Date" value={formatDateTime(vehicle.rc_isued_date)} />
                           <Field label="RC Expiry" value={formatDateTime(vehicle.rc_expiry_date)} />
                           <Field label="Fleet Entry" value={formatDateTime(vehicle.rc_isued_date)} />
                        </SectionCard>

                        <SectionCard icon={Users} title="Ownership Protocol" colorClass="bg-[#fdf2f2] text-[#dc2626]">
                           <Field label="Ownership Type" value={vehicle.ownership_type?.toUpperCase()} />
                           {vehicle.vendor_name && (
                             <>
                               <Field label="Vendor Partner" value={vehicle.vendor_name} />
                               <Field label="Organization" value={vehicle.vendor_organization_name} />
                               <Field label="Partner Phone" value={vehicle.vendor_contact_number} />
                             </>
                           )}
                           <div className="mt-4 p-3 bg-white rounded-lg border border-[#f1f5f9]">
                              <p className="text-[10px] font-black text-[#94a3b8] uppercase mb-1">Assigned Route</p>
                              <p className="text-[13px] font-black text-[#1e293b]">{vehicle.route || 'Global Roaming'}</p>
                           </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'telemetry' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SectionCard icon={Zap} title="Live Telemetry" colorClass="bg-[#f8fafc] text-[#0ea5e9]">
                           <div className="grid grid-cols-2 gap-6">
                              <div className="p-4 bg-white rounded-[15px] border border-[#f1f5f9] shadow-sm">
                                 <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-[#94a3b8] uppercase pb-1">Battery</span>
                                    <Battery size={14} className={Number(vehicle.battery || 0) > 20 ? 'text-[#059669]' : 'text-[#dc2626]'} />
                                 </div>
                                 <p className="text-[24px] font-black text-[#1e293b]">{vehicle.battery || 0}%</p>
                              </div>
                              <div className="p-4 bg-white rounded-[15px] border border-[#f1f5f9] shadow-sm">
                                 <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-[#94a3b8] uppercase pb-1">Live Speed</span>
                                    <Zap size={14} className="text-[#f59e0b]" />
                                 </div>
                                 <p className="text-[24px] font-black text-[#1e293b]">{vehicle.speed || 0} <span className="text-[12px] text-[#94a3b8]">KM/H</span></p>
                              </div>
                           </div>
                           <div className="mt-6 p-4 rounded-[15px] bg-[#f8fafc] border border-blue-50">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">GPS Device binding</p>
                              <div className="flex items-center justify-between">
                                 <Field label="Device ID" value={vehicle.gps_device_id || 'NOT_BOUND'} />
                                 <Field label="IMEI Protocol" value={vehicle.gps_device_id || 'U_IMEI_000'} />
                                 <Field label="Sync Date" value={formatDateTime(vehicle.lastGpsUpdate ?? null)} />
                              </div>
                           </div>
                        </SectionCard>

                        <SectionCard icon={MapPin} title="Geospatial Coordinates" colorClass="bg-[#f0fdf4] text-[#059669]">
                           <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                 <Field label="Latitude" value={vehicle.lat} />
                                 <Field label="Longitude" value={vehicle.lng} />
                              </div>
                              <div className="h-28 bg-[#f8fafc] rounded-xl border border-dashed border-[#e2e8f0] flex flex-col items-center justify-center">
                                 <MapPin size={24} className="text-[#cbd5e1] mb-2" />
                                 <p className="text-[10px] font-black text-[#94a3b8] uppercase">Map rendering offline</p>
                              </div>
                              <button onClick={() => navigate(`/vehicles/track/${vehicle.vehicle_number}`)} className="w-full py-3 bg-white border border-[#e2e8f0] rounded-[10px] text-[11px] font-black text-[#1e293b] uppercase tracking-wider hover:bg-[#fafbff] active:scale-95 transition-all">
                                 Enter Tracking Command Center
                              </button>
                           </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'compliance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SectionCard icon={ShieldCheck} title="Regulatory Compliance" colorClass="bg-[#fafbff] text-[#059669]">
                           <div className="grid grid-cols-2 gap-6 mb-6">
                              <Field label="PUC Protocol" value={vehicle.pollution_certificate_number} />
                              <Field label="PUC Expiry" value={formatDateTime(vehicle.pollution_expiry_date)} />
                              <Field label="Fitness Registry" value={vehicle.fitness_certificate_number} />
                              <Field label="Fitness Expiry" value={formatDateTime(vehicle.fitness_expiry_date)} />
                           </div>
                           <div className="p-4 rounded-xl bg-[#f0f9ff] border border-blue-50">
                              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Insurance Matrix</p>
                              <Field label="Provider" value={vehicle.insurance_provider_name} />
                              <Field label="Policy Protocol" value={vehicle.insurance_policy_number} />
                              <div className="flex gap-4">
                                 <Field label="Issued" value={formatDateTime(vehicle.insurance_issued_date)} />
                                 <Field label="Expires" value={formatDateTime(vehicle.insurance_expiry_date)} />
                              </div>
                           </div>
                        </SectionCard>

                        <SectionCard icon={FileText} title="Fleet Vault" colorClass="bg-[#fcfdf2] text-[#ea580c]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {['rc_book_doc', 'insurance_doc', 'permit_copy', 'fitness_certificate', 'puc_doc'].map(doc => {
                                  const path = (vehicle as any)[doc];
                                  return (
                                    <div key={doc} className={`p-4 rounded-xl border border-[#f1f5f9] flex items-center justify-between ${path ? 'bg-white opacity-100' : 'bg-[#fafbff] opacity-50'}`}>
                                       <div className="flex-1">
                                          <p className="text-[9px] font-black text-[#94a3b8] uppercase mb-0.5">{doc.split('_')[0]}</p>
                                          <p className="text-[12px] font-black text-[#1e293b] uppercase tracking-tighter">{doc.replace(/_/g, ' ')}</p>
                                          {path && vehicle.updated_at && (
                                            <p className="text-[9px] font-bold text-[#059669] mt-1 flex items-center gap-1">
                                              <Calendar size={10} />
                                              SYNCED: {new Date(vehicle.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                          )}
                                       </div>
                                       {path ? (
                                          <a 
                                            href={path.startsWith('http') ? path : `${centralUrl}/storage/${path}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                          >
                                            <FileText size={18} />
                                          </a>
                                       ) : (
                                          <span className="p-2 text-[#cbd5e1]"><ShieldCheck size={18} /></span>
                                       )}
                                    </div>
                                  )
                               })}
                            </div>
                        </SectionCard>
                    </div>
                )}

            </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
          {showExport && vehicle && (
            <ExportOverlay 
              onClose={() => setShowExport(false)} 
              buildPdf={buildIndividualPdf(vehicle)}
              title={`Export Asset Specification Report`}
              defaultTitle={`Vehicle: ${vehicle.vehicle_number}`}
              defaultSubtitle={`Technical Profile · ${vehicle.vehicle_name}`}
              fileName={`vehicle-${vehicle.vehicle_number}.pdf`}
            />
          )}
      </AnimatePresence>
    </div>
  );
};

export default VehicleShowPage;
