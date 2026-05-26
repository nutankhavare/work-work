// src/Pages/Vehicles/VehicleFormPage.tsx
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../../Components/UI/LoadingSpinner";
import PageHeader from "../../Components/UI/PageHeader";
import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
import { useConfirm } from "../../Context/ConfirmContext";
import InfoTooltip from "../../Components/UI/InfoTooltip";
import type { Vehicle } from "./Vehicle.types";
import type { FormDropdown, BeaconDevice } from "../../Types/Index";
import { 
  Truck, 
  IdCard, 
  MapPin, 
  ShieldCheck, 
  User, 
  UploadCloud, 
  Settings, 
  PlusCircle, 
  FileEdit, 
  Save, 
  Hash, 
  Layers, 
  Building2, 
  Bus, 
  Calendar, 
  Fuel,
  Info,
  History,
  AlertCircle,
  FileText,
  Tag,
  Search,
  Phone,
  Layout,
  Briefcase
} from "lucide-react";

const FormSection = ({ title, icon, children, color = "var(--primary)" }: any) => {
  const Icon = icon;
  return (
    <div className="form-card overflow-hidden">
      <div className="form-card-header flex items-center gap-2">
        {typeof icon === "string" ? (
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color, fontWeight: 'normal' }}>{icon}</span>
        ) : (
          Icon && <Icon size={18} style={{ color }} strokeWidth={2.5} />
        )}
        <span className="text-[11px] font-[900] tracking-[0.07em] uppercase text-[#1e293b]">{title}</span>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

type FormInputs = Vehicle & {
  insurance_doc?: FileList;
  rc_book_doc?: FileList;
  puc_doc?: FileList;
  fitness_certificate?: FileList;
  permit_copy?: FileList;
  gps_installation_proof?: FileList;
  vendor_pan?: FileList;
  vendor_adhaar?: FileList;
  vendor_bank_proof?: FileList;
  vendor_contract_proof?: FileList;
  vedor_company_registration_doc?: FileList;
  saftey_certificate?: FileList;
  owner_id_proof?: FileList;
  vendor_agreement?: FileList;
};

type VehicleFormPageProps = {
  mode: "create" | "edit";
  vehicleId?: string;
};

const VehicleFormPage = ({ mode, vehicleId }: VehicleFormPageProps) => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const confirm = useConfirm();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({
    mode: "onChange",
    defaultValues: { status: "active" },
  });

  const [vehicleTypes, setVehicleTypes] = useState<FormDropdown[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FormDropdown[]>([]);
  const [permitTypes, setPermitTypes] = useState<FormDropdown[]>([]);
  const [ownershipTypes, setOwnershipTypes] = useState<FormDropdown[]>([]);
  const [statuses, setStatuses] = useState<FormDropdown[]>([]);
  const [gps, setBeacons] = useState<BeaconDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const ownershipType = useWatch({ control, name: "ownership_type" });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [vt, ft, pt, ot, st, gd] = await Promise.all([
          tenantApi.get(`/masters/forms/dropdowns/fields?type=vehicle&field=vehicle_type`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=vehicle&field=fuel_type`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=vehicle&field=permit_type`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=vehicle&field=ownership_type`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=status`),
          tenantApi.get(`/gps-device/for/dropdown`),
        ]);

        setVehicleTypes(Array.isArray(vt.data) ? vt.data : vt.data?.data || []);
        setFuelTypes(Array.isArray(ft.data) ? ft.data : ft.data?.data || []);
        setPermitTypes(Array.isArray(pt.data) ? pt.data : pt.data?.data || []);
        setOwnershipTypes(Array.isArray(ot.data) ? ot.data : ot.data?.data || []);
        setStatuses(Array.isArray(st.data) ? st.data : st.data?.data || []);
        setBeacons(Array.isArray(gd.data) ? gd.data : gd.data?.data || []);
      } catch (error) {
        showAlert("Failed to load vehicle form data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [showAlert]);

  useEffect(() => {
    if (mode === "edit" && vehicleId) {
      tenantApi.get(`/vehicles/${vehicleId}`).then(res => {
        if (res.data.success) {
          const data = res.data.data;
          const formatDate = (d: string) => d ? new Date(d).toISOString().split('T')[0] : "";
          reset({
            ...data,
            rc_isued_date: formatDate(data.rc_isued_date),
            rc_expiry_date: formatDate(data.rc_expiry_date),
            gps_installation_date: formatDate(data.gps_installation_date),
            permit_issue_date: formatDate(data.permit_issue_date),
            permit_expiry_date: formatDate(data.permit_expiry_date),
            insurance_issued_date: formatDate(data.insurance_issued_date),
            insurance_expiry_date: formatDate(data.insurance_expiry_date),
            fitness_issued_date: formatDate(data.fitness_issued_date),
            fitness_expiry_date: formatDate(data.fitness_expiry_date),
            pollution_issued_date: formatDate(data.pollution_issued_date),
            pollution_expiry_date: formatDate(data.pollution_expiry_date),
            last_service_date: formatDate(data.last_service_date),
            next_service_due_date: formatDate(data.next_service_due_date),
            tyre_replacement_due_date: formatDate(data.tyre_replacement_due_date),
            battery_replacement_due_date: formatDate(data.battery_replacement_due_date),
          });
        }
      });
    }
  }, [mode, vehicleId, reset]);

  const onInvalid = () => {
    showAlert("Please fill in all mandatory fields correctly.", "error");
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    const action = mode === "create" ? "register" : "update";
    if (!(await confirm(`Are you sure you want to ${action} this vehicle in the fleet?`))) return;

    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        const k = key as keyof FormInputs;
        if (data[k] instanceof FileList || k.includes('_doc') || k.includes('_certificate') || k.includes('_proof')) return;
        if (data[k] !== undefined && data[k] !== null && data[k] !== "") formData.append(k, String(data[k]));
      });

      if (data.status) formData.append("status", data.status);
      if (data.remarks) formData.append("vehicle_remarks", data.remarks);

      const fileFields: Array<keyof FormInputs> = ["insurance_doc", "rc_book_doc", "puc_doc", "fitness_certificate", "permit_copy", "gps_installation_proof", "vendor_pan", "vendor_adhaar", "vendor_bank_proof", "vendor_contract_proof", "vedor_company_registration_doc", "saftey_certificate", "owner_id_proof", "vendor_agreement"];
      fileFields.forEach((f) => {
        const files = data[f] as FileList | undefined;
        if (files?.[0]) formData.append(f, files[0]);
      });

      const response = mode === "create"
        ? await tenantApi.post("/vehicles", formData, { headers: { "Content-Type": "multipart/form-data" } })
        : await tenantApi.put(`/vehicles/${vehicleId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });

      if (response.data.success) {
        showAlert(response.data.message || `Vehicle ${action}ed successfully!`, "success");
        navigate("/vehicles");
      }
    } catch (error: any) {
      showAlert(error.response?.data?.message || `Failed to ${action} vehicle`, "error");
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="page-body pb-20">
      <PageHeader 
        title={mode === 'create' ? "Add New Vehicle" : "Edit Vehicle Identity"}
        icon={mode === 'create' ? <PlusCircle size={20} /> : <FileEdit size={20} />}
        breadcrumb={`Fleet Management / ${mode === 'create' ? 'Add New' : 'Edit'} Vehicle`}
        showBackButton={true}
        backButtonLink="/vehicles"
      />

      <div className="max-w-[860px] mx-auto px-4 sm:px-0">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          
          <FormSection title="Basic Vehicle Information" icon="directions_bus">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Hash size={14} className="text-slate-400" />
                     Vehicle Number*
                   </label>
                   <input {...register("vehicle_number", { required: "Vehicle number is required" })} className={`form-input ${errors.vehicle_number ? 'border-red-500 bg-red-50' : ''}`} placeholder="e.g. MH12AB1234" />
                   {errors.vehicle_number && <p className="text-[10px] text-red-500 mt-1">{errors.vehicle_number.message}</p>}
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Layers size={14} className="text-slate-400" />
                     Vehicle Type*
                   </label>
                    <select {...register("vehicle_type", { required: "Vehicle type is required" })} className={`form-select ${errors.vehicle_type ? 'border-red-500 bg-red-50' : ''}`}>
                       <option value="">Select Type</option>
                       {vehicleTypes.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                    </select>
                    {errors.vehicle_type && <p className="text-[10px] text-red-500 mt-1">{errors.vehicle_type.message}</p>}
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Building2 size={14} className="text-slate-400" />
                     Manufacturer (OEM)*
                   </label>
                   <input {...register("manufacturer", { required: "Manufacturer is required" })} className={`form-input ${errors.manufacturer ? 'border-red-500 bg-red-50' : ''}`} placeholder="e.g. Tata, Ashok Leyland" />
                   {errors.manufacturer && <p className="text-[10px] text-red-500 mt-1">{errors.manufacturer.message}</p>}
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Bus size={14} className="text-slate-400" />
                     Vehicle Model*
                   </label>
                   <input {...register("vehicle_model", { required: "Vehicle model is required" })} className={`form-input ${errors.vehicle_model ? 'border-red-500 bg-red-50' : ''}`} placeholder="e.g. Eicher 20.15" />
                   {errors.vehicle_model && <p className="text-[10px] text-red-500 mt-1">{errors.vehicle_model.message}</p>}
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Calendar size={14} className="text-slate-400" />
                     Manufacturing Year*
                   </label>
                   <input type="text" maxLength={4} {...register("manufacturing_year", { required: true })} className="form-input" placeholder="e.g. 2021" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Fuel size={14} className="text-slate-400" />
                     Fuel Type*
                   </label>
                   <select {...register("fuel_type", { required: true })} className="form-select">
                      <option value="">Select Fuel Type</option>
                      {fuelTypes.map(f => <option key={f.value} value={f.value}>{f.value}</option>)}
                   </select>
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <User size={14} className="text-slate-400" />
                     Seating Capacity*
                   </label>
                   <input type="number" {...register("seating_capacity", { required: true })} className="form-input" placeholder="e.g. 40" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Tag size={14} className="text-slate-400" />
                     Vehicle Color <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                   </label>
                   <input {...register("vehicle_color")} className="form-input" placeholder="e.g. White" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Hash size={14} className="text-slate-400" />
                     Kilometers Driven*
                   </label>
                   <input type="number" {...register("kilometers_driven", { required: true })} className="form-input" placeholder="e.g. 45000" />
                </div>
             </div>
          </FormSection>

          <FormSection title="Registration Details" icon={IdCard}>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <FileText size={14} className="text-slate-400" />
                     RC Number
                   </label>
                   <input {...register("rc_number")} className="form-input" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Calendar size={14} className="text-slate-400" />
                     RC Issued Date
                   </label>
                   <input type="date" {...register("rc_isued_date")} className="form-input" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Calendar size={14} className="text-slate-400" />
                     RC Expiry Date
                   </label>
                   <input type="date" {...register("rc_expiry_date")} className="form-input" />
                </div>
             </div>
          </FormSection>

          <FormSection title="GPS & Tracking" icon="gps_fixed" color="#dc2626">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Settings size={14} className="text-slate-400" />
                      GPS Device ID <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                    </label>
                    <select {...register("gps_device_id")} className="form-select">
                      <option value="">Select Device</option>
                      {gps.map(g => <option key={g.id} value={g.device_id}>{g.device_id} ({g.sim_number})</option>)}
                   </select>
                </div>
                <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400" />
                      SIM Number (GPS) <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                    </label>
                    <input {...register("gps_sim_number")} className="form-input" placeholder="GPS SIM Number" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Layers size={14} className="text-slate-400" />
                     Beacon Count <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                   </label>
                   <input type="number" {...register("beacon_count")} className="form-input" placeholder="e.g. 2" />
                </div>
                <div>
                    <label className="form-label flex items-center gap-1.5">
                      <History size={14} className="text-slate-400" />
                      GPS Installation Date <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                    </label>
                    <input type="date" {...register("gps_installation_date")} className="form-input" />
                </div>
             </div>
          </FormSection>

          <FormSection title="Assignment" icon="assignment_ind" color="#6366f1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="form-label flex items-center gap-1.5">
                      <User size={14} className="text-slate-400" />
                      Assigned Driver ID <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                    </label>
                    <input {...register("assigned_driver_id")} className="form-input" placeholder="e.g. DRV-1024" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <MapPin size={14} className="text-slate-400" />
                     Assigned Route ID <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                   </label>
                   <input {...register("assigned_route_id")} className="form-input" placeholder="e.g. RT-005" />
                </div>
             </div>
          </FormSection>

          <FormSection title="Permit Details" icon="verified" color="#059669">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                   <label className="form-label flex items-center gap-1.5">
                      <Layers size={14} className="text-slate-400" />
                      Permit Type*
                   </label>
                   <select {...register("permit_type", { required: true })} className="form-select uppercase">
                      <option value="">Select Type</option>
                      {permitTypes.map(p => <option key={p.value} value={p.value}>{p.value}</option>)}
                   </select>
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                      <Tag size={14} className="text-slate-400" />
                      Permit Number*
                   </label>
                   <input {...register("permit_number", { required: true })} className="form-input" placeholder="RTO Permit ID" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      Permit Issue Date*
                   </label>
                   <input type="date" {...register("permit_issue_date", { required: true })} className="form-input" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      Permit Expiry Date*
                   </label>
                   <input type="date" {...register("permit_expiry_date", { required: true })} className="form-input" />
                </div>
             </div>
          </FormSection>

          <FormSection title="Insurance & Compliance" icon="security" color="#0ea5e9">
             <div className="space-y-6">
                <div>
                    <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-3">Insurance</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="form-label">Insurance Provider*</label>
                            <input {...register("insurance_provider_name", { required: true })} className="form-input" placeholder="e.g. New India Assurance" />
                        </div>
                        <div>
                            <label className="form-label">Policy Number*</label>
                            <input {...register("insurance_policy_number", { required: true })} className="form-input" placeholder="Policy No." />
                        </div>
                        <div>
                            <label className="form-label">Insurance Expiry Date*</label>
                            <input type="date" {...register("insurance_expiry_date", { required: true })} className="form-input" />
                        </div>
                    </div>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-3">Fitness Certificate</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">Certificate Number*</label>
                                <input {...register("fitness_certificate_number", { required: true })} className="form-input" placeholder="RTO Fitness ID" />
                            </div>
                            <div>
                                <label className="form-label">Expiry Date*</label>
                                <input type="date" {...register("fitness_expiry_date", { required: true })} className="form-input" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-3">Pollution Certificate</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">Certificate Number*</label>
                                <input {...register("pollution_certificate_number", { required: true })} className="form-input" placeholder="Pollution Cert No." />
                            </div>
                            <div>
                                <label className="form-label">Expiry Date*</label>
                                <input type="date" {...register("pollution_expiry_date", { required: true })} className="form-input" />
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          </FormSection>

          <FormSection title="Ownership Details" icon="badge" color="#f59e0b">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Layout size={14} className="text-slate-400" />
                     Ownership Type*
                   </label>
                   <select {...register("ownership_type", { required: true })} className="form-select uppercase">
                      <option value="">Select Type</option>
                      {ownershipTypes.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                   </select>
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <User size={14} className="text-slate-400" />
                     Owner Name*
                   </label>
                   <input {...register("owner_name", { required: true })} className="form-input" placeholder="Legal owner name" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <Phone size={14} className="text-slate-400" />
                     Owner Contact Number*
                   </label>
                   <input {...register("owner_contact_number", { required: true })} className="form-input" placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                    <label className="form-label flex items-center gap-1.5">
                        <Briefcase size={14} className="text-slate-400" />
                        Vendor Name <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                    </label>
                    <input {...register("vendor_name")} className="form-input" placeholder="Vendor / Agency Name" disabled={ownershipType !== "contract"} style={{ opacity: ownershipType === "contract" ? 1 : 0.45 }} />
                </div>
                <div>
                    <label className="form-label flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400" />
                        Vendor Contact <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                    </label>
                    <input {...register("vendor_contact_number")} className="form-input" placeholder="+91 XXXXX XXXXX" disabled={ownershipType !== "contract"} style={{ opacity: ownershipType === "contract" ? 1 : 0.45 }} />
                </div>
                <div>
                    <label className="form-label flex items-center gap-1.5">
                        <Building2 size={14} className="text-slate-400" />
                        Organisation / Fleet Name <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                    </label>
                    <input {...register("organisation_fleet_name")} className="form-input" placeholder="e.g. ABC School Fleet" />
                </div>
             </div>
          </FormSection>
          <FormSection title="Document Uploads" icon="upload_file" color="#64748b">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { key: 'rc_book_doc', label: 'RC Book / Registration*', required: true },
                   { key: 'permit_copy', label: 'Permit Copy*', required: true },
                   { key: 'insurance_doc', label: 'Insurance Certificate*', required: true },
                   { key: 'fitness_certificate', label: 'Fitness Certificate*', required: true },
                   { key: 'puc_doc', label: 'Pollution Certificate*', required: true },
                   { key: 'gps_installation_proof', label: 'GPS Installation Proof*', required: true },
                   { key: 'owner_id_proof', label: 'Owner ID Proof*', required: true },
                   { key: 'vendor_agreement', label: 'Vendor Agreement', required: false, note: 'Only required when Ownership Type is "Contract"' }
                 ].map((doc) => {
                    const existingPath = (control._defaultValues as any)?.[doc.key];
                    const updatedAt = (control._defaultValues as any)?.updated_at;
                    return (
                      <div key={doc.key} className="flex flex-col">
                        <label className="form-label flex items-center justify-between mb-1.5">
                           <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
                             {doc.label}
                           </span>
                        </label>
                        
                        <div className="relative group">
                          <input 
                            type="file" 
                            {...register(doc.key as any)} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          />
                          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 group-hover:bg-white group-hover:border-primary/50 transition-all duration-200 h-[110px] text-center">
                            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors duration-200 text-[28px]">cloud_upload</span>
                            <span className="text-[11px] font-bold text-slate-600 mt-1">Click to Upload</span>
                            <span className="text-[9px] text-slate-400">PDF / JPG / PNG</span>
                          </div>
                          
                          {existingPath && (
                            <div className="absolute top-2 right-2">
                               <div className="bg-emerald-500 text-white rounded-full p-0.5 shadow-sm" title="File Synced">
                                 <span className="material-symbols-outlined text-[12px] block">check</span>
                               </div>
                            </div>
                          )}
                        </div>

                        {existingPath && (
                          <div className="mt-2 flex items-center justify-between px-1">
                             <p className="text-[9px] text-slate-400 truncate max-w-[120px]">
                               {existingPath.split('/').pop()}
                             </p>
                             {updatedAt && (
                               <span className="text-[8px] font-bold text-emerald-600 uppercase">
                                 Synced
                               </span>
                             )}
                          </div>
                        )}
                        
                        {doc.note && (
                           <p className="text-[8px] text-amber-600 mt-1 italic font-medium leading-tight">
                             ⚠ {doc.note}
                           </p>
                        )}
                      </div>
                    );
                 })}
             </div>
          </FormSection>

          <FormSection title="Maintenance" icon="build" color="#64748b">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="form-label">Last Service Date <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span></label>
                    <input type="date" {...register("last_service_date")} className="form-input" />
                </div>
                <div>
                    <label className="form-label">Next Service Due <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span></label>
                    <input type="date" {...register("next_service_due_date")} className="form-input" />
                </div>
                <div>
                    <label className="form-label">Tyre Replacement Due <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span></label>
                    <input type="date" {...register("tyre_replacement_due_date")} className="form-input" />
                </div>
                <div>
                    <label className="form-label">Battery Replacement Due <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span></label>
                    <input type="date" {...register("battery_replacement_due_date")} className="form-input" />
                    <p className="text-[8px] text-slate-400 mt-1">For EV / Hybrid only</p>
                </div>
             </div>
          </FormSection>

          <FormSection title="Safety Equipment" icon="health_and_safety" color="#ef4444">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="form-label">Fire Extinguisher <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span></label>
                    <select {...register("fire_extinguisher")} className="form-select">
                        <option value="">Select Status</option>
                        <option value="Installed">Installed</option>
                        <option value="Not Installed">Not Installed</option>
                        <option value="Expired">Expired</option>
                    </select>
                </div>
                <div>
                    <label className="form-label">First Aid Kit <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span></label>
                    <select {...register("first_aid_kit")} className="form-select">
                        <option value="">Select Status</option>
                        <option value="Available">Available</option>
                        <option value="Missing">Missing</option>
                        <option value="Expired">Expired</option>
                    </select>
                </div>
                <div>
                    <label className="form-label">CCTV Installed <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span></label>
                    <select {...register("cctv_installed")} className="form-select">
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>
                <div>
                    <label className="form-label">Panic Button <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span></label>
                    <select {...register("panic_button_installed")} className="form-select">
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>
             </div>
          </FormSection>

          <FormSection title="Vehicle Remarks" icon="notes">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                   <label className="form-label">Fleet Status</label>
                   <select {...register("status")} className="form-select uppercase">
                      {statuses.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
                   </select>
                </div>
                <div className="md:col-span-2">
                   <label className="form-label">Remarks / Special Instructions <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span></label>
                   <textarea {...register("remarks")} className="form-input" rows={3} placeholder="Add any additional notes, special conditions or instructions about this vehicle…" />
                </div>
             </div>
          </FormSection>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-8">
            <button type="button" onClick={() => navigate("/vehicles")} className="btn btn-secondary min-w-[120px]">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary min-w-[220px]">
              <Save size={18} />
              {isSubmitting ? "Saving Vehicle..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleFormPage;