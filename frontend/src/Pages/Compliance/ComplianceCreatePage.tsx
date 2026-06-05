import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
import InfoTooltip from "../../Components/UI/InfoTooltip";
import PageHeader from "../../Components/UI/PageHeader";

const categories = [
  "License", "Insurance", "Safety", "Environmental", 
  "Tax & Finance", "Labour", "Vehicle Certification", 
  "Penalty", "Driving Rules", "Other"
];

const authorities = [
  "Regional Transport Office (RTO)", "Traffic Police", 
  "Traffic Police / RTO", "IRDAI", "IRDAI / RTO", 
  "Fire Department", "Ministry of Transport", 
  "State Transport Authority", "State Pollution Control Board", 
  "Municipal Corporation", "MSME Board", 
  "Labour Department", "Other"
];

const applicabilityOptions = [
  "All Vehicles", "All Instructors", "All Staff", 
  "All Trainees", "Premises / Infrastructure", "Management"
];

const ComplianceCreatePage = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      document_name: "",
      sub_law_reference: "",
      registration_number: "",
      category: "",
      authority_name: "",
      authority_contact: "",
      date_recorded: new Date().toISOString().split('T')[0],
      status: "Pending Review",
      applies_to: [] as string[],
      remarks: "",
      consent_certified: false
    }
  });

  const selectedStatus = watch("status");
  const selectedAppliesTo = watch("applies_to");

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'applies_to') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      });

      // Handle file upload
      const fileInput = document.getElementById('compliance-file') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append("document", fileInput.files[0]);
      }

      await tenantApi.post("/compliance", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      showAlert("Compliance record added successfully!", "success");
      navigate("/compliance");
    } catch (error: any) {
      showAlert(error.response?.data?.message || "Failed to add compliance record.", "error");
    }
  };

  return (
    <div className="page">
      <PageHeader 
        title="Add Compliance Record"
        icon="add_circle"
        breadcrumb="Admin / Compliance / Create"
        showBackButton={true}
        backButtonLink="/compliance"
      />

        <div style={{ maxWidth: "960px", width: "100%", margin: "0px auto" }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Document Identity */}
            <div className="form-card">
              <div className="form-card-header">
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>description</span>
                <span style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>Document / Rule Identity</span>
              </div>
              <div style={{ padding: "24px" }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">Document / Rule Name<span style={{ color: "rgb(220, 38, 38)", marginLeft: "2px" }}>*</span></label>
                    <input {...register("document_name", { required: true })} className="form-input" placeholder="e.g. Driving School License" />
                  </div>
                  <div>
                    <label className="form-label">
                      Sub-Law / Act Reference 
                      <span style={{ fontSize: "9px", fontWeight: 800, color: "rgb(148, 163, 184)", background: "rgb(241, 245, 249)", borderRadius: "4px", padding: "2px 6px", marginLeft: "6px", verticalAlign: "middle" }}>OPTIONAL</span>
                    </label>
                    <input {...register("sub_law_reference")} className="form-input" placeholder="e.g. Motor Vehicles Act 1988" />
                  </div>
                  <div>
                    <label className="form-label">Registration / Record Number<span style={{ color: "rgb(220, 38, 38)", marginLeft: "2px" }}>*</span></label>
                    <input {...register("registration_number", { required: true })} className="form-input" placeholder="e.g. RTO-2024-001" />
                  </div>
                  <div>
                    <label className="form-label">Category<span style={{ color: "rgb(220, 38, 38)", marginLeft: "2px" }}>*</span></label>
                    <select {...register("category", { required: true })} className="form-select">
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Issuing Authority */}
            <div className="form-card">
              <div className="form-card-header">
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>account_balance</span>
                <span style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>Issuing Authority</span>
              </div>
              <div style={{ padding: "24px" }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">Authority / Issuing Body<span style={{ color: "rgb(220, 38, 38)", marginLeft: "2px" }}>*</span></label>
                    <select {...register("authority_name", { required: true })} className="form-select">
                      <option value="">Select Authority</option>
                      {authorities.map(auth => <option key={auth} value={auth}>{auth}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">
                      Authority Contact / Reference 
                      <span style={{ fontSize: "9px", fontWeight: 800, color: "rgb(148, 163, 184)", background: "rgb(241, 245, 249)", borderRadius: "4px", padding: "2px 6px", marginLeft: "6px", verticalAlign: "middle" }}>OPTIONAL</span>
                    </label>
                    <input {...register("authority_contact")} className="form-input" placeholder="Phone, email or reference ID" />
                  </div>
                </div>
              </div>
            </div>

            {/* Record Date */}
            <div className="form-card">
              <div className="form-card-header">
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>calendar_today</span>
                <span style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>Record Date</span>
              </div>
              <div style={{ padding: "24px" }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">Date Recorded<span style={{ color: "rgb(220, 38, 38)", marginLeft: "2px" }}>*</span></label>
                    <input type="date" {...register("date_recorded", { required: true })} className="form-input" />
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Applicability */}
            <div className="form-card">
              <div className="form-card-header">
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>verified_user</span>
                <span style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>Status & Applicability</span>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ marginBottom: "28px" }}>
                  <label className="form-label">Compliance Status<span style={{ color: "rgb(220, 38, 38)", marginLeft: "2px" }}>*</span></label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {["Compliant", "Non-Compliant", "Pending Review"].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setValue("status", status)}
                        className="btn"
                        style={{
                          padding: "10px 24px",
                          borderRadius: "8px",
                          border: "1.5px solid var(--border)",
                          background: selectedStatus === status ? "var(--primary)" : "var(--surface)",
                          color: selectedStatus === status ? "white" : "rgb(71, 85, 105)",
                          fontWeight: 800,
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "0.15s"
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label">Applies To<span style={{ color: "rgb(220, 38, 38)", marginLeft: "2px" }}>*</span></label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {applicabilityOptions.map(option => (
                      <label 
                        key={option}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "1.5px solid var(--border)",
                          background: selectedAppliesTo.includes(option) ? "var(--primary-light)" : "var(--surface)",
                          borderColor: selectedAppliesTo.includes(option) ? "var(--primary)" : "var(--border)",
                          transition: "0.15s"
                        }}
                      >
                        <input 
                          type="checkbox" 
                          value={option}
                          checked={selectedAppliesTo.includes(option)}
                          onChange={(e) => {
                            const val = e.target.value;
                            const currentArr = [...selectedAppliesTo];
                            if (e.target.checked) {
                              setValue("applies_to", [...currentArr, val]);
                            } else {
                              setValue("applies_to", currentArr.filter(i => i !== val));
                            }
                          }}
                          style={{ accentColor: "var(--primary)", width: "14px", height: "14px" }} 
                        />
                        <span style={{ fontSize: "13px", fontWeight: 700, color: selectedAppliesTo.includes(option) ? "var(--primary)" : "rgb(71, 85, 105)" }}>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="form-card">
              <div className="form-card-header">
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>upload_file</span>
                <span style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>Document Upload</span>
              </div>
              <div style={{ padding: "24px" }}>
                <label className="form-label flex items-center gap-1">Compliance Document <span style={{ color: "rgb(220, 38, 38)", marginLeft: "2px" }}>*</span> <InfoTooltip message="Max 10MB. PDF, JPG, PNG" /></label>
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "140px", borderRadius: "12px", cursor: "pointer", border: "2px dashed var(--border)", background: "var(--surface)", gap: "8px", transition: "0.15s", marginTop: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "rgb(148, 163, 184)" }}>cloud_upload</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "rgb(100, 116, 139)" }}>Click to Upload Document</span>
                  <span style={{ fontSize: "11px", color: "rgb(148, 163, 184)" }}>PDF / JPG / PNG — Max 10 MB</span>
                  <input id="compliance-file" accept=".pdf,.jpg,.jpeg,.png" type="file" style={{ display: "none" }} />
                </label>
              </div>
            </div>

            {/* Consent & Remarks */}
            <div className="form-card">
              <div className="form-card-header">
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>fact_check</span>
                <span style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>Consent & Remarks</span>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ padding: "16px 20px", borderRadius: "12px", marginBottom: "24px", border: "1.5px solid var(--border)", background: "var(--surface)", transition: "0.15s" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                    <input type="checkbox" {...register("consent_certified", { required: true })} style={{ accentColor: "var(--primary)", width: "18px", height: "18px", marginTop: "2px" }} />
                    <div>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>Compliance Certification <span style={{ color: "rgb(220, 38, 38)" }}>*</span></span>
                      <div style={{ fontSize: "13px", color: "rgb(100, 116, 139)", lineHeight: 1.6, marginTop: "4px" }}>
                        "I confirm that all submitted compliance information is accurate, valid, and up-to-date as per the applicable laws and regulations."
                      </div>
                    </div>
                  </label>
                </div>
                <label className="form-label">
                  Remarks / Notes 
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "rgb(148, 163, 184)", background: "rgb(241, 245, 249)", borderRadius: "4px", padding: "2px 6px", marginLeft: "6px", verticalAlign: "middle" }}>OPTIONAL</span>
                </label>
                <textarea {...register("remarks")} className="form-input" rows={4} placeholder="Any additional notes or context about this compliance record…" style={{ width: "100%", resize: "vertical" }}></textarea>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pb-8">
              <button type="button" onClick={() => navigate("/compliance")} className="btn btn-secondary order-2 sm:order-1 sm:mr-auto w-full sm:w-auto justify-center">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary order-1 sm:order-2 w-full sm:w-auto justify-center">
                <span className="material-symbols-outlined ms">add_circle</span>
                {isSubmitting ? "Saving..." : "Add Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

export default ComplianceCreatePage;
