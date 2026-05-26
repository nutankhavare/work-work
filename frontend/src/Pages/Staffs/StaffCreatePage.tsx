// src/Pages/Staffs/StaffCreatePage.tsx
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

// Components
import LoadingSpinner from "../../Components/UI/LoadingSpinner";
import PageHeader from "../../Components/UI/PageHeader";
import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
import { useConfirm } from "../../Context/ConfirmContext";
import InfoTooltip from "../../Components/UI/InfoTooltip";
import type { Dependant, Employee, Role } from "./Staff.types";
import type { BeaconDevice, StateDistrict } from "../../Types/Index";

const FormSection = ({ title, icon, children, color = "var(--primary)" }: any) => (
  <div className="form-card">
    <div className="form-card-header">
      <span className="material-symbols-outlined ms" style={{ color }}>{icon}</span>
      <span className="text-[11px] font-[900] tracking-[0.07em] uppercase text-[#1e293b]">{title}</span>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const StaffCreatePage = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const confirm = useConfirm();

  // State
  const [loading, setLoading] = useState(true);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [states, setStates] = useState<StateDistrict[]>([]);
  const [districts, setDistricts] = useState<StateDistrict[]>([]);
  const [beacons, setBeacons] = useState<BeaconDevice[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Employee>({
    mode: "onChange",
    defaultValues: {
      status: "active",
      roles: [],
      marital_status: "",
      dependants: []
    },
  });

  const { fields, replace, append, remove } = useFieldArray({ control, name: "dependants" });
  const maritalStatus = useWatch({ control, name: "marital_status" });
  const selectedState = useWatch({ control, name: "state" });
  const pinCode = useWatch({ control, name: "pin_code" });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [rolesRes, statesRes, beaconsRes] = await Promise.all([
          tenantApi.get("/roles"),
          tenantApi.get(`/masters/forms/dropdowns/states`),
          tenantApi.get(`/beacon-device/for/dropdown`)
        ]);
        const rolesRaw = rolesRes.data.data;
        setAllRoles(Array.isArray(rolesRaw) ? rolesRaw : (rolesRaw?.data || []));
        setStates(Array.isArray(statesRes.data) ? statesRes.data : statesRes.data?.data || []);
        setBeacons(Array.isArray(beaconsRes.data) ? beaconsRes.data : beaconsRes.data?.data || []);
      } catch (err) {
        showAlert("Failed to load form data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [showAlert]);

  useEffect(() => {
    const emptyDep = { fullname: "", relation: "", age: 0, phone: "", email: "" };
    if (maritalStatus === "Married") replace([emptyDep, emptyDep]);
    else if (maritalStatus === "Single") replace([emptyDep]);
    else replace([]);
  }, [maritalStatus, replace]);

  useEffect(() => {
    if (!selectedState) { setDistricts([]); return; }
    tenantApi.get(`/masters/forms/dropdowns/districts/${selectedState}`)
      .then(res => {
        const d = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setDistricts(d);
      })
      .catch(() => {});
  }, [selectedState]);

  useEffect(() => {
    const pinStr = String(pinCode || "").trim();
    if (pinStr.length === 6) {
      axios.get(`https://api.postalpincode.in/pincode/${pinStr}`).then(res => {
        if (res.data?.[0]?.Status === "Success") {
          const po = res.data[0].PostOffice[0];
          setValue("city", po.Block || po.District, { shouldValidate: true });
          const match = states.find(s => s.state.toLowerCase() === po.State.toLowerCase())?.state || po.State;
          setValue("state", match, { shouldValidate: true });
        }
      }).catch(() => {});
    }
  }, [pinCode, states, setValue]);

  const onInvalid = () => {
    showAlert("Please fill in all mandatory fields correctly.", "error");
  };

  const onSubmit: SubmitHandler<Employee> = async (data) => {
    if (!(await confirm("Are you sure you want to save this employee record?"))) return;
    
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        const k = key as keyof Employee;
        if (['roles', 'dependants', 'photo', 'aadhaar_card', 'pan_card', 'bank_proof'].includes(k)) return;
        if (data[k] !== undefined && data[k] !== null) formData.append(k, String(data[k]));
      });

      (data.roles || []).forEach(r => formData.append("roles[]", r));
      if (data.dependants?.length) formData.append("dependants", JSON.stringify(data.dependants));
      if (data.photo?.[0]) formData.append("photo", data.photo[0]);
      if (data.aadhaar_card?.[0]) formData.append("aadhaar_card", data.aadhaar_card[0]);
      if (data.pan_card?.[0]) formData.append("pan_card", data.pan_card[0]);
      if (data.bank_proof?.[0]) formData.append("bank_proof", data.bank_proof[0]);

      await tenantApi.post("/employees", formData, { headers: { "Content-Type": "multipart/form-data" } });
      showAlert("Staff created successfully!", "success");
      navigate("/staff");
    } catch (err: any) {
      showAlert(err.response?.data?.message || "Failed to create staff.", "error");
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="page-body pb-20">
      <PageHeader 
        title="Add New Employee"
        icon="person_add"
        breadcrumb="Staff Management / Add New Employee"
        showBackButton={true}
        backButtonLink="/staff"
      />

      <div className="max-w-[860px] mx-auto px-4 sm:px-0">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          
          {/* BASIC INFO */}
          <FormSection title="Basic Information" icon="person">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex flex-col items-center flex-shrink-0">
                <label className="form-label flex items-center gap-1">Profile Photo <InfoTooltip message="Max 2MB. JPG, PNG" /></label>
                <div 
                  className="w-[108px] h-[108px] rounded-[12px] border-2 border-dashed border-[#cbd5e1] bg-[#fafbff] cursor-pointer overflow-hidden flex flex-col items-center justify-center group hover:border-[#7c3aed] transition-all"
                  onClick={() => document.getElementById('photo-input')?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[28px] text-[#cbd5e1] group-hover:text-[#7c3aed]">add_a_photo</span>
                      <span className="text-[9px] font-[800] text-[#94a3b8] mt-1 group-hover:text-[#7c3aed]">UPLOAD</span>
                    </>
                  )}
                </div>
                <input 
                  id="photo-input" 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  {...register("photo", { 
                    onChange: (e) => {
                      const file = e.target.files[0];
                      if (file) setPhotoPreview(URL.createObjectURL(file));
                    }
                  })} 
                />
                <div className="text-[9px] text-[#94a3b8] mt-2">JPG, PNG (Max 2MB)</div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">badge</span>
                    Employee ID
                  </label>
                  <input {...register("employee_id", { required: "Employee ID is required" })} className={`form-input ${errors.employee_id ? 'border-red-500 bg-red-50' : ''}`} placeholder="EMP-1001" />
                  {errors.employee_id && <p className="text-[10px] text-red-500 mt-1">{errors.employee_id.message}</p>}
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    First Name
                  </label>
                  <input {...register("first_name", { required: "First name is required" })} className={`form-input ${errors.first_name ? 'border-red-500 bg-red-50' : ''}`} placeholder="John" />
                  {errors.first_name && <p className="text-[10px] text-red-500 mt-1">{errors.first_name.message}</p>}
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    Last Name
                  </label>
                  <input {...register("last_name", { required: "Last name is required" })} className={`form-input ${errors.last_name ? 'border-red-500 bg-red-50' : ''}`} placeholder="Doe" />
                  {errors.last_name && <p className="text-[10px] text-red-500 mt-1">{errors.last_name.message}</p>}
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">wc</span>
                    Gender
                  </label>
                  <select {...register("gender")} className="form-select">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">favorite</span>
                    Marital Status
                  </label>
                  <select {...register("marital_status")} className="form-select">
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                    Date of Birth
                  </label>
                  <input type="date" {...register("date_of_birth")} className="form-input" />
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">event_available</span>
                    Joining Date
                  </label>
                  <input type="date" {...register("joining_date")} className="form-input" />
                </div>
              </div>
            </div>
          </FormSection>

          {/* PROFESSIONAL INFO */}
          <FormSection title="Professional Info" icon="work">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">work</span>
                  Employment Type
                </label>
                <select {...register("employment_type")} className="form-select">
                  <option value="Full-Time">Full Time</option>
                  <option value="Part-Time">Part Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">assignment_ind</span>
                  Designation
                </label>
                <input {...register("designation")} className="form-input" placeholder="Operations Manager" />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">mail</span>
                  Official Email
                </label>
                <input type="email" {...register("email")} className="form-input" placeholder="john.doe@org.com" />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  Mobile Number
                </label>
                <input {...register("phone", { required: "Phone number is required", pattern: { value: /^[0-9]{10}$/, message: "Must be exactly 10 digits" } })} type="tel" maxLength={10} pattern="[0-9]{10}" className={`form-input ${errors.phone ? 'border-red-500 bg-red-50' : ''}`} placeholder="Enter 10-digit mobile number" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 10); }} />
                {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                 <label className="form-label flex items-center gap-1.5">
                   <span className="material-symbols-outlined text-[14px]">sensors</span>
                   Beacon Binding <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                 </label>
                 <select {...register("beacon_id")} className="form-select">
                   <option value="">No Binding</option>
                   {beacons.map(b => <option key={b.id} value={b.device_id}>{b.device_id}</option>)}
                 </select>
              </div>
            </div>
          </FormSection>

          {/* ADDRESS DETAILS */}
          <FormSection title="Address Details" icon="home">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">home</span>
                  Address Line 1
                </label>
                <input {...register("address_line_1")} className="form-input" placeholder="Building/Flat No, Street" />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                  PIN Code
                </label>
                <input {...register("pin_code")} className="form-input" placeholder="400XXX" maxLength={6} />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">map</span>
                  State
                </label>
                <select {...register("state")} className="form-select">
                  <option value="">Select State</option>
                  {states.map(s => <option key={s.id} value={s.state}>{s.state}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">location_city</span>
                  District
                </label>
                <select {...register("district")} className="form-select" disabled={!selectedState}>
                   {districts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  City
                </label>
                <input {...register("city")} className="form-input" placeholder="City" />
              </div>
            </div>
          </FormSection>

          {/* EMERGENCY CONTACTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
             <div className="form-card !mb-0">
                <div className="form-card-header !bg-[#f0f9ff]/50">
                  <span className="material-symbols-outlined ms" style={{ color: '#0ea5e9' }}>emergency</span>
                  <span className="text-[11px] font-[900] tracking-[0.07em] uppercase text-[#1e293b]">Primary Contact</span>
                </div>
                <div className="p-5 space-y-4">
                   <div>
                     <label className="form-label">Name</label>
                     <input {...register("primary_person_name")} className="form-input" />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Phone</label>
                        <input {...register("primary_person_phone_1")} type="tel" maxLength={10} pattern="[0-9]{10}" className="form-input" placeholder="Enter 10-digit number" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 10); }} />
                      </div>
                      <div>
                        <label className="form-label">Email</label>
                        <input type="email" {...register("primary_person_email")} className="form-input" />
                      </div>
                   </div>
                </div>
             </div>
             <div className="form-card !mb-0">
                <div className="form-card-header !bg-[#f0f9ff]/50">
                  <span className="material-symbols-outlined ms" style={{ color: '#2563eb' }}>location_on</span>
                  <span className="text-[11px] font-[900] tracking-[0.07em] uppercase text-[#1e293b]">Secondary Contact</span>
                </div>
                <div className="p-5 space-y-4">
                   <div>
                     <label className="form-label">Name</label>
                     <input {...register("secondary_person_name")} className="form-input" />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Phone</label>
                        <input {...register("secondary_person_phone_1")} type="tel" maxLength={10} pattern="[0-9]{10}" className="form-input" placeholder="Enter 10-digit number" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 10); }} />
                      </div>
                      <div>
                        <label className="form-label">Email</label>
                        <input type="email" {...register("secondary_person_email")} className="form-input" />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* BANK DETAILS */}
          <FormSection title="Bank Details" icon="account_balance" color="#3b82f6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">account_balance</span>
                  Bank Name
                </label>
                <input {...register("bank_name")} className="form-input" placeholder="State Bank of India" />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  Holder Name
                </label>
                <input {...register("account_holder_name")} className="form-input" placeholder="John Doe" />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">numbers</span>
                  Account No
                </label>
                <input {...register("account_number")} className="form-input" placeholder="000000000000" />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">qr_code</span>
                  IFSC Code
                </label>
                <input {...register("ifsc_code")} className="form-input" placeholder="SBIN000XXXX" />
              </div>
            </div>
          </FormSection>

          {/* DOCUMENTS */}
          <FormSection title="Document Uploads" icon="upload_file">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['aadhaar_card', 'pan_card', 'bank_proof'].map((doc) => (
                  <div key={doc}>
                    <label className="form-label flex items-center gap-1">{doc.replace('_', ' ').toUpperCase()} <InfoTooltip /></label>
                    <label className="flex flex-col items-center justify-center h-24 rounded-[10px] bg-[#fafbff] border-[1.5px] border-dashed border-[#cbd5e1] cursor-pointer hover:border-[#7c3aed] transition-all group gap-1">
                      <span className="material-symbols-outlined text-[24px] text-[#cbd5e1] group-hover:text-[#7c3aed]">cloud_upload</span>
                      <span className="text-[10px] font-[700] text-[#94a3b8] group-hover:text-[#7c3aed]">Click to Upload</span>
                      <input type="file" className="hidden" {...register(doc as any)} />
                    </label>
                  </div>
                ))}
             </div>
          </FormSection>

          {/* SYSTEM ROLES */}
          <FormSection title="System Roles & Status" icon="shield_person">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="form-label">Account Status</label>
                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" {...register("status")} value="active" className="w-4 h-4 accent-[#7c3aed]" />
                      <span className="text-[13px] font-[700] text-[#475569]">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" {...register("status")} value="inactive" className="w-4 h-4 accent-[#7c3aed]" />
                      <span className="text-[13px] font-[700] text-[#475569]">Inactive / Hold</span>
                    </label>
                  </div>
                </div>

                <div>
                   <label className="form-label">Assign Roles</label>
                   <Controller
                      name="roles"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-4 mt-2">
                          {allRoles.map(role => (
                            <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-[#7c3aed]"
                                checked={field.value?.includes(role.name)}
                                onChange={(e) => {
                                  const next = e.target.checked 
                                    ? [...(field.value || []), role.name]
                                    : (field.value || []).filter(r => r !== role.name);
                                  field.onChange(next);
                                }}
                              />
                              <span className="text-[13px] font-[700] text-[#475569]">{role.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                   />
                </div>
             </div>
             <div className="mt-6">
                <label className="form-label">Remarks</label>
                <textarea {...register("remarks")} className="form-input" rows={3} placeholder="Additional notes..." />
             </div>
          </FormSection>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-8">
            <button type="button" onClick={() => navigate("/staff")} className="btn btn-secondary min-w-[120px]">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary min-w-[200px]">
              <span className="material-symbols-outlined ms">save</span>
              {isSubmitting ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffCreatePage;