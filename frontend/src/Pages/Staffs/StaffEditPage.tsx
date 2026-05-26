// src/Pages/Staffs/StaffEditPage.tsx
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../../Components/UI/LoadingSpinner";
import PageHeader from "../../Components/UI/PageHeader";
import EmptyState from "../../Components/UI/EmptyState";
import { useAlert } from "../../Context/AlertContext";
import { useConfirm } from "../../Context/ConfirmContext";
import InfoTooltip from "../../Components/UI/InfoTooltip";
import type { Employee, Role } from "./Staff.types";
import type { BeaconDevice, StateDistrict } from "../../Types/Index";
import tenantApi, { tenantAsset } from "../../Services/ApiService";
import axios from "axios";
import { DUMMY_USER_IMAGE } from "../../Utils/Toolkit";

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

const StaffEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const confirm = useConfirm();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [states, setStates] = useState<StateDistrict[]>([]);
  const [districts, setDistricts] = useState<StateDistrict[]>([]);
  const [beacons, setBeacons] = useState<BeaconDevice[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Employee>({ mode: "onChange" });

  const { fields, append, remove } = useFieldArray({ control, name: "dependants" });
  const selectedState = useWatch({ control, name: "state" });
  const pinCode = useWatch({ control, name: "pin_code" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rolesRes, statesRes, beaconsRes, employeeRes] = await Promise.all([
          tenantApi.get("/roles"),
          tenantApi.get(`/masters/forms/dropdowns/states`),
          tenantApi.get(`/beacon-device/for/dropdown`),
          tenantApi.get(`/employees/${id}`)
        ]);

        const rolesRaw = rolesRes.data.data;
        setAllRoles(Array.isArray(rolesRaw) ? rolesRaw : (rolesRaw?.data || []));
        setStates(Array.isArray(statesRes.data) ? statesRes.data : statesRes.data?.data || []);
        setBeacons(Array.isArray(beaconsRes.data) ? beaconsRes.data : beaconsRes.data?.data || []);

        const emp = employeeRes.data.data;
        if (emp.photo) setPhotoPreview(`${tenantAsset}${emp.photo}`);

        if (emp.state) {
          const districtRes = await tenantApi.get(`/masters/forms/dropdowns/districts/${emp.state}`);
          const d = Array.isArray(districtRes.data) ? districtRes.data : districtRes.data?.data || [];
          setDistricts(d);
        }

        let roleNames: string[] = [];
        try {
           if (typeof emp.roles === 'string') roleNames = JSON.parse(emp.roles);
           else if (Array.isArray(emp.roles)) roleNames = emp.roles;
        } catch { roleNames = []; }

        const formatDate = (dateStr: string) => {
          if (!dateStr) return "";
          try { return new Date(dateStr).toISOString().split('T')[0]; } catch { return ""; }
        };

        reset({
          ...emp,
          date_of_birth: formatDate(emp.date_of_birth || emp.dob),
          joining_date: formatDate(emp.joining_date),
          roles: roleNames,
          dependants: emp.dependants || [],
          photo: undefined,
          aadhaar_card: undefined,
          pan_card: undefined,
          bank_proof: undefined
        });

      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load employee data.");
        showAlert("Failed to load data.", "error");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, reset, showAlert]);

  useEffect(() => {
    if (!selectedState || loading) return;
    tenantApi.get(`/masters/forms/dropdowns/districts/${selectedState}`)
      .then(res => {
        const d = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setDistricts(d);
      })
      .catch(() => {});
  }, [selectedState, loading]);

  useEffect(() => {
    const pinStr = String(pinCode || "").trim();
    if (pinStr.length === 6 && !loading) {
      axios.get(`https://api.postalpincode.in/pincode/${pinStr}`).then(res => {
        if (res.data?.[0]?.Status === "Success") {
          const po = res.data[0].PostOffice[0];
          setValue("city", po.Block || po.District, { shouldValidate: true });
          const match = states.find(s => s.state.toLowerCase() === po.State.toLowerCase())?.state || po.State;
          setValue("state", match, { shouldValidate: true });
        }
      }).catch(() => {});
    }
  }, [pinCode, states, setValue, loading]);

  const onInvalid = () => {
    showAlert("Please fill in all mandatory fields correctly.", "error");
  };

  const onSubmit: SubmitHandler<Employee> = async (data) => {
    if (!(await confirm("Are you sure you want to update this employee record?"))) return;
    
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        const k = key as keyof Employee;
        if (['roles', 'dependants', 'photo', 'aadhaar_card', 'pan_card', 'bank_proof', 'user'].includes(k)) return;
        if (data[k] !== undefined && data[k] !== null) formData.append(k, String(data[k]));
      });

      (data.roles || []).forEach(r => formData.append("roles[]", r));
      if (data.dependants) formData.append("dependants", JSON.stringify(data.dependants));
      if (data.photo?.[0]) formData.append("photo", data.photo[0]);
      if (data.aadhaar_card?.[0]) formData.append("aadhaar_card", data.aadhaar_card[0]);
      if (data.pan_card?.[0]) formData.append("pan_card", data.pan_card[0]);
      if (data.bank_proof?.[0]) formData.append("bank_proof", data.bank_proof[0]);

      await tenantApi.put(`/employees/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      showAlert("Staff updated successfully!", "success");
      navigate("/staff");
    } catch (err: any) {
      showAlert(err.response?.data?.message || "Failed to update staff.", "error");
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <div className="p-12"><EmptyState title="Error" description={error} /></div>;

  return (
    <div className="page-body pb-20">
      <PageHeader 
        title="Edit Employee Identity"
        icon="edit_document"
        breadcrumb="Staff Management / Edit Employee"
        showBackButton={true}
        backButtonLink="/staff"
      />

      <div className="max-w-[860px] mx-auto px-4 sm:px-0">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          
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
                      <span className="text-[9px] font-[800] text-[#94a3b8] mt-1 group-hover:text-[#7c3aed]">UPDATE</span>
                    </>
                  )}
                </div>
                <input id="photo-input" type="file" className="hidden" accept="image/*" {...register("photo", { 
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
                <input {...register("designation")} className="form-input" />
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
                  {states.map(s => <option key={s.id} value={s.state}>{s.state}</option>)}
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
                <textarea {...register("remarks")} className="form-input" rows={3} />
             </div>
          </FormSection>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-8">
            <button type="button" onClick={() => navigate("/staff")} className="btn btn-secondary min-w-[120px]">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary min-w-[200px]">
              <span className="material-symbols-outlined ms">save</span>
              {isSubmitting ? "Saving..." : "Update Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffEditPage;