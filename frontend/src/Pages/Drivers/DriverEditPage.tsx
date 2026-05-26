// src/Pages/Drivers/DriverEditPage.tsx
import { useState, useEffect } from "react";
import { useFieldArray, useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../../Components/UI/LoadingSpinner";
import PageHeader from "../../Components/UI/PageHeader";
import tenantApi, { tenantAsset } from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
import { useConfirm } from "../../Context/ConfirmContext";
import InfoTooltip from "../../Components/UI/InfoTooltip";
import type { Driver } from "./Driver.types";
import type { BeaconDevice, FormDropdown, StateDistrict } from "../../Types/Index";
import type { Vehicle } from "../Vehicles/Vehicle.types";

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

type FormInputs = Driver & {
  profile_photo?: FileList;
  driving_license?: FileList;
  aadhaar_card?: FileList;
  pan_card?: FileList;
  police_verification_doc?: FileList;
  medical_fitness_certificate?: FileList;
  address_proof_doc?: FileList;
  training_certificate_doc?: FileList;
};

const DriverEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showAlert } = useAlert();
  const confirm = useConfirm();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({ mode: "onChange" });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "license_insurance" });

  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [dropdowns, setDropdowns] = useState({
    genders: [] as FormDropdown[],
    bloodGroups: [] as FormDropdown[],
    maritalStatuses: [] as FormDropdown[],
    employmentTypes: [] as FormDropdown[],
    fileTypes: [] as FormDropdown[],
    statuses: [] as FormDropdown[],
    states: [] as StateDistrict[],
    vehicles: [] as Vehicle[],
    beacons: [] as BeaconDevice[],
  });
  const [districts, setDistricts] = useState<StateDistrict[]>([]);

  const selectedState = useWatch({ control, name: "state" });
  const pinCode = useWatch({ control, name: "pin_code" });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [driverRes, genders, bloodGroups, maritalStatuses, employmentTypes, statuses, fileTypes, states, vehicles, beacons] = await Promise.all([
          tenantApi.get(`/drivers/${id}`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=gender`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=blood_group`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=marital_status`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=employment_type`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=status`),
          tenantApi.get(`/masters/forms/dropdowns/fields?type=driver&field=file_type`),
          tenantApi.get(`/masters/forms/dropdowns/states`),
          tenantApi.get(`/active-vehicles/for/dropdown`),
          tenantApi.get(`/beacon-device/for/dropdown`),
        ]);

        const driver = driverRes.data.data;
        if (driver.profile_photo) setPhotoPreview(`${tenantAsset}${driver.profile_photo}`);

        const formatDate = (d: string) => d ? new Date(d).toISOString().split('T')[0] : "";
        
        const prepped = {
          ...driver,
          date_of_birth: formatDate(driver.date_of_birth),
          safety_training_completion_date: formatDate(driver.safety_training_completion_date),
          medical_fitness_exp_date: formatDate(driver.medical_fitness_exp_date),
          police_verification_date: formatDate(driver.police_verification_date),
          license_insurance: (driver.license_insurance || []).map((li: any) => ({
             ...li,
             issue_date: formatDate(li.issue_date),
             exp_date: formatDate(li.exp_date),
          }))
        };

        reset(prepped);
        if (prepped.license_insurance) replace(prepped.license_insurance);

        const unwrap = (r: any) => Array.isArray(r.data) ? r.data : r.data?.data || [];
        setDropdowns({
          genders: unwrap(genders),
          bloodGroups: unwrap(bloodGroups),
          maritalStatuses: unwrap(maritalStatuses),
          employmentTypes: unwrap(employmentTypes),
          statuses: unwrap(statuses),
          fileTypes: unwrap(fileTypes),
          states: unwrap(states),
          vehicles: unwrap(vehicles),
          beacons: unwrap(beacons),
        });

        if (driver.state) {
          const dRes = await tenantApi.get(`/masters/forms/dropdowns/districts/${driver.state}`);
          const d = Array.isArray(dRes.data) ? dRes.data : dRes.data?.data || [];
          setDistricts(d);
        }
      } catch (error) {
        showAlert("Failed to load driver data.", "error");
        navigate("/drivers");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, reset, replace, showAlert, navigate]);

  useEffect(() => {
    if (!selectedState || loading) return;
    tenantApi.get(`/masters/forms/dropdowns/districts/${selectedState}`).then(res => {
      const d = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setDistricts(d);
    }).catch(() => {});
  }, [selectedState, loading]);

  useEffect(() => {
    const pinStr = String(pinCode || "").trim();
    if (pinStr.length === 6 && !loading) {
      axios.get(`https://api.postalpincode.in/pincode/${pinStr}`).then(res => {
        if (res.data?.[0]?.Status === "Success") {
          const po = res.data[0].PostOffice[0];
          setValue("city", po.Block || po.District, { shouldValidate: true });
          const matchState = dropdowns.states.find(s => s.state.toLowerCase() === po.State.toLowerCase())?.state || po.State;
          setValue("state", matchState, { shouldValidate: true });
        }
      }).catch(() => {});
    }
  }, [pinCode, dropdowns.states, setValue, loading]);

  const onInvalid = () => {
    showAlert("Please fill in all mandatory fields correctly.", "error");
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    if (!(await confirm("Are you sure you want to update this driver's fleet records?"))) return;
    
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      Object.keys(data).forEach((key) => {
        const k = key as keyof FormInputs;
        if (data[k] instanceof FileList || k === 'license_insurance' || k === 'user') return;
        if (data[k] !== undefined && data[k] !== null && data[k] !== "") formData.append(k, String(data[k]));
      });

      if (data.license_insurance?.length) formData.append("license_insurance", JSON.stringify(data.license_insurance));

      ["profile_photo", "driving_license", "aadhaar_card", "pan_card", "police_verification_doc", "medical_fitness_certificate", "address_proof_doc", "training_certificate_doc"].forEach((field) => {
        const files = (data as any)[field] as FileList | undefined;
        if (files?.[0]) formData.append(field, files[0]);
      });

      await tenantApi.post(`/drivers/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      showAlert("Driver updated successfully!", "success");
      navigate("/drivers");
    } catch (error: any) {
      showAlert(error.response?.data?.message || "Failed to update driver", "error");
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="page-body pb-20">
      <PageHeader 
        title="Edit Driver Identity"
        icon="edit_document"
        breadcrumb="Staff Management / Edit Driver"
        showBackButton={true}
        backButtonLink="/drivers"
      />

      <div className="max-w-[860px] mx-auto px-4 sm:px-0">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          
          <FormSection title="Basic Information" icon="person">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex flex-col items-center flex-shrink-0">
                <label className="form-label">Profile Photo</label>
                <div 
                  className="w-[108px] h-[108px] rounded-[12px] border-2 border-dashed border-[#cbd5e1] bg-[#fafbff] cursor-pointer overflow-hidden flex flex-col items-center justify-center group hover:border-[#7c3aed] transition-all"
                  onClick={() => document.getElementById('photo-input')?.click()}
                >
                  {photoPreview ? (
                     <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[28px] text-[#cbd5e1] group-hover:text-[#7c3aed]">add_a_photo</span>
                      <span className="text-[9px] font-[800] text-[#94a3b8] mt-1 group-hover:text-[#7c3aed]">UPDATE</span>
                    </>
                  )}
                </div>
                <input id="photo-input" type="file" className="hidden" accept="image/*" {...register("profile_photo", { 
                    onChange: (e) => {
                      const file = e.target.files[0];
                      if (file) setPhotoPreview(URL.createObjectURL(file));
                    }
                  })} />
                <div className="text-[9px] text-[#94a3b8] mt-2">JPG, PNG (Max 2MB)</div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">badge</span>
                    Employee ID
                  </label>
                  <input {...register("employee_id", { required: "Employee ID is required" })} className={`form-input ${errors.employee_id ? 'border-red-500 bg-red-50' : ''}`} placeholder="DRV-1001" />
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
                    {dropdowns.genders.map(d => <option key={d.value} value={d.value}>{d.value}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">favorite</span>
                    Marital Status
                  </label>
                  <select {...register("marital_status")} className="form-select">
                    <option value="">Select Status</option>
                    {dropdowns.maritalStatuses.map(d => <option key={d.value} value={d.value}>{d.value}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">bloodtype</span>
                    Blood Group
                  </label>
                  <select {...register("blood_group")} className="form-select">
                    {dropdowns.bloodGroups.map(d => <option key={d.value} value={d.value}>{d.value}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                    Date of Birth
                  </label>
                  <input type="date" {...register("date_of_birth")} className="form-input" />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Professional Info" icon="work">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <span className="material-symbols-outlined text-[14px]">work</span>
                     Employment Type
                   </label>
                   <select {...register("employment_type")} className="form-select">
                     {dropdowns.employmentTypes.map(d => <option key={d.value} value={d.value}>{d.value}</option>)}
                   </select>
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <span className="material-symbols-outlined text-[14px]">mail</span>
                     Official Email
                   </label>
                   <input type="email" {...register("email")} className="form-input" />
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <span className="material-symbols-outlined text-[14px]">call</span>
                     Mobile Number
                   </label>
                   <input {...register("mobile_number", { required: "Mobile number is required", pattern: { value: /^[0-9]{10}$/, message: "Must be exactly 10 digits" } })} type="tel" maxLength={10} pattern="[0-9]{10}" className={`form-input ${errors.mobile_number ? 'border-red-500 bg-red-50' : ''}`} placeholder="Enter 10-digit mobile number" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 10); }} />
                   {errors.mobile_number && <p className="text-[10px] text-red-500 mt-1">{errors.mobile_number.message}</p>}
                </div>
                <div>
                   <label className="form-label flex items-center gap-1.5">
                     <span className="material-symbols-outlined text-[14px]">speed</span>
                     Experience (Years)
                   </label>
                   <input type="number" {...register("driving_experience")} className="form-input" />
                </div>
                <div>
                    <label className="form-label flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                      Vehicle Assignment <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                    </label>
                   <select {...register("vehicle")} className="form-select">
                     <option value="">No Assignment</option>
                     {dropdowns.vehicles.map(v => <option key={v.id} value={v.vehicle_number}>{v.vehicle_number}</option>)}
                   </select>
                </div>
                <div>
                    <label className="form-label flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">sensors</span>
                      Beacon Binding <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">OPT</span>
                    </label>
                   <select {...register("beacon_id")} className="form-select">
                     <option value="">No Binding</option>
                     {dropdowns.beacons.map(b => <option key={b.id} value={b.device_id}>{b.device_id}</option>)}
                   </select>
                </div>
             </div>
          </FormSection>

          <FormSection title="Address Details" icon="home">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-2">
                   <label className="form-label">Address Line 1</label>
                   <input {...register("address_line_1")} className="form-input" />
                </div>
                <div>
                   <label className="form-label">PIN Code</label>
                   <input {...register("pin_code")} className="form-input" maxLength={6} />
                </div>
                <div>
                   <label className="form-label">State</label>
                   <select {...register("state")} className="form-select">
                     <option value="">Select State</option>
                     {dropdowns.states.map(s => <option key={s.id} value={s.state}>{s.state}</option>)}
                   </select>
                </div>
                <div>
                   <label className="form-label">District</label>
                   <select {...register("district")} className="form-select" disabled={!selectedState}>
                      {districts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
                   </select>
                </div>
                <div>
                   <label className="form-label">City</label>
                   <input {...register("city")} className="form-input" />
                </div>
             </div>
          </FormSection>

          <FormSection title="Permits & Licenses" icon="id_card">
             <div className="space-y-4">
                {fields.map((field, index) => (
                   <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-[#fafbff] rounded-[10px] border border-[#f1f5f9] relative">
                      <div className="md:col-span-1">
                        <label className="form-label">Class</label>
                        <select {...register(`license_insurance.${index}.type` as any)} className="form-select">
                           {dropdowns.fileTypes.map(d => <option key={d.value} value={d.value}>{d.value}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">Registry No</label>
                        <input {...register(`license_insurance.${index}.number` as any)} className="form-input" />
                      </div>
                      <div>
                        <label className="form-label">Expiry</label>
                        <input type="date" {...register(`license_insurance.${index}.exp_date` as any)} className="form-input" />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={() => remove(index)} className="p-3 bg-white text-red-500 border border-red-100 rounded-[8px] hover:bg-red-50">
                           <span className="material-symbols-outlined ms">delete</span>
                        </button>
                      </div>
                   </div>
                ))}
                <button type="button" onClick={() => append({ type: "", number: "", issue_date: "", exp_date: "" })} className="w-full py-3 border-2 border-dashed border-[#e2e8f0] rounded-[10px] text-[#64748b] text-[11px] font-[900] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all uppercase tracking-widest">+ Add Permit</button>
             </div>
          </FormSection>

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
                <div className="form-card-header !bg-[#f1f5f9]/50">
                  <span className="material-symbols-outlined ms" style={{ color: '#64748b' }}>contact_support</span>
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

          <FormSection title="Bank Details" icon="account_balance">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                   <label className="form-label">Bank Name</label>
                   <input {...register("bank_name")} className="form-input" />
                </div>
                <div>
                   <label className="form-label">Holder Name</label>
                   <input {...register("account_holder_name")} className="form-input" />
                </div>
                <div>
                   <label className="form-label">Account No</label>
                   <input {...register("account_number")} className="form-input" />
                </div>
                <div>
                   <label className="form-label">IFSC Code</label>
                   <input {...register("ifsc_code")} className="form-input" />
                </div>
             </div>
          </FormSection>

          <FormSection title="Documents" icon="upload_file">
                 {['driving_license', 'aadhaar_card', 'pan_card', 'police_verification_doc', 'medical_fitness_certificate', 'address_proof_doc'].map((docKey) => {
                    const existingPath = (control._defaultValues as any)?.[docKey];
                    const updatedAt = (control._defaultValues as any)?.updated_at;
                    return (
                      <div key={docKey}>
                        <label className="form-label flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">file_present</span>
                            {docKey.replace(/_/g, ' ').replace('doc', '').replace('certificate', 'Cert').toUpperCase()}
                            <InfoTooltip />
                          </span>
                          {existingPath && updatedAt && (
                            <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">verified</span>
                              Synced: {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </label>
                        <input type="file" {...register(docKey as any)} className="form-input h-[45px] file:hidden pt-[11px] cursor-pointer" />
                        {existingPath && (
                          <p className="text-[9px] text-slate-400 mt-1 truncate max-w-[200px]">Existing: {existingPath.split('/').pop()}</p>
                        )}
                      </div>
                    );
                 })}
          </FormSection>

          <FormSection title="Account & Status" icon="shield_person">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                   <label className="form-label">Current Status</label>
                   <select {...register("status")} className="form-select uppercase">
                      {dropdowns.statuses.map(d => <option key={d.value} value={d.value}>{d.value}</option>)}
                   </select>
                </div>
                <div>
                   <label className="form-label">Special Remarks</label>
                   <textarea {...register("remarks")} className="form-input" rows={1} />
                </div>
             </div>
          </FormSection>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-8">
            <button type="button" onClick={() => navigate("/drivers")} className="btn btn-secondary min-w-[120px]">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary min-w-[220px]">
              <span className="material-symbols-outlined ms">save</span>
              {isSubmitting ? "Updating Driver..." : "Update Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverEditPage;