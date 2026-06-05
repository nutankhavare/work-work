import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Toggle } from "../../Components/UI/Toggle";
// import { useAuth } from "../../Context/AuthContext";
import tenantApi from "../../Services/ApiService";
import PageHeader from "../../Components/UI/PageHeader";

/* ── Container Animations ── */
const containerFade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const slideUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 22 },
  },
};

/* ── Reusable field components ── */
const ReadField = ({
  label,
  value,
  icon,
  wide,
}: {
  label: string;
  value: string;
  icon?: string;
  wide?: boolean;
}) => (
  <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase" as const,
        letterSpacing: "0.07em",
        color: "var(--muted)",
        marginBottom: 6,
      }}
    >
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
          {icon}
        </span>
      )}
      {label}
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          background: "#F1F5F9",
          color: "var(--muted)",
          borderRadius: 4,
          padding: "1px 5px",
          marginLeft: 2,
        }}
      >
        READ-ONLY
      </span>
    </label>
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 9,
        border: "1.5px solid var(--border)",
        background: "#F8FAFC",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: "42px"
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 15, color: "var(--muted)", flexShrink: 0 }}
      >
        lock
      </span>
      {value || "-"}
    </div>
  </div>
);

const EditField = ({
  label,
  value,
  onChange,
  icon,
  wide,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: string;
  wide?: boolean;
  type?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10,
          fontWeight: 800,
          textTransform: "uppercase" as const,
          letterSpacing: "0.07em",
          color: "var(--muted)",
          marginBottom: 6,
        }}
      >
        {icon && (
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            {icon}
          </span>
        )}
        {label}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 9,
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text)",
          border: `1.5px solid ${focused ? "var(--primary)" : "var(--border)"}`,
          background: "var(--surface)",
          outline: "none",
          boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
          transition: "all 0.2s",
        }}
      />
    </div>
  );
};

/* ── Section card header ── */
const CardHeader = ({
  icon,
  title,
  subtitle,
  dark,
}: {
  icon: string;
  title: string;
  subtitle: string;
  dark?: boolean;
}) => (
  <div
    style={{
      background: dark
        ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)"
        : "var(--surface)",
      borderBottom: "1px solid var(--border)",
      padding: "18px 22px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: dark ? "rgba(255,255,255,0.15)" : "var(--primary-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: dark ? "white" : "var(--primary)" }}
        >
          {icon}
        </span>
      </div>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 900,
            color: dark ? "white" : "var(--text)",
            letterSpacing: "-0.1px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: dark ? "rgba(255,255,255,0.65)" : "var(--muted)",
            marginTop: 1,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  </div>
);

export const SettingsPage = () => {
  // const { user } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState([true, false, true, false, true]);

  const tog = (i: number) =>
    setToggles((t) => t.map((v, idx) => (idx === i ? !v : v)));

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await tenantApi.get("/organization/me");
        if (res.data.success) {
          const data = res.data.data;
          setOrg({
            ...data,
            address: data.address || {},
            contact: data.contact || {},
            institute: data.institute || {},
            documents: data.documents || {}
          });
        }
      } catch (err) {
        console.error("Failed to fetch organization settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Add top level fields
      formData.append("name", org.name || "");
      formData.append("website", org.website || "");
      formData.append("phone", org.phone || "");
      formData.append("email", org.email || "");
      formData.append("gst_number", org.gst_number || "");
      formData.append("pan_number", org.pan_number || "");
      
      // Add nested objects as JSON strings (backend will parse them)
      formData.append("address", JSON.stringify(org.address));
      formData.append("contact", JSON.stringify(org.contact));
      formData.append("institute", JSON.stringify(org.institute));
      formData.append("documents", JSON.stringify(org.documents));

      // Handle any files selected in the UI
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => {
        if (input.files?.[0]) {
          // Use the 'name' attribute we added to the input (pan_card, etc.)
          formData.append(input.name, input.files[0]);
        }
      });

      const res = await tenantApi.put("/organization/me", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        alert("Settings updated successfully!");
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const card: React.CSSProperties = {
    background: "white",
    borderRadius: 14,
    border: "1px solid var(--border)",
    overflow: "hidden",
  };
  const body: React.CSSProperties = { padding: "22px" };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-[var(--font-manrope)]">
      {/* ── Page Header ── */}
      <PageHeader
        title="General Settings"
        icon="settings"
        breadcrumb="Admin / Account Settings"
      >
        <button
          className="btn btn-primary !py-2.5"
          onClick={handleSave}
          disabled={saving}
          style={{ opacity: saving ? 0.75 : 1 }}
        >
          <span className="material-symbols-outlined ms" style={{ fontSize: 16 }}>save</span>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </PageHeader>

      <div className="px-4 lg:px-6 pb-10 space-y-8">
        <motion.div
          variants={containerFade}
          initial="hidden"
          animate="show"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 980,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {/* ════ 1. LEGAL IDENTITY ════ */}
          <motion.div variants={slideUp} style={card}>
            <CardHeader
              dark
              icon="school"
              title="Institution Legal Identity"
              subtitle="Registered details and official identification."
            />
            <div style={body}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                <EditField
                  label="Legal Name"
                  value={org?.name || ""}
                  onChange={(v) => setOrg({...org, name: v})}
                  icon="business"
                  wide
                />
                <ReadField
                  label="Category"
                  value={org?.type}
                  icon="category"
                />
                <ReadField
                  label="Registration No."
                  value={org?.registration_no}
                  icon="badge"
                />
                <EditField
                  label="GST Number"
                  value={org?.gst_number || ""}
                  onChange={(v) => setOrg({...org, gst_number: v})}
                  icon="payments"
                />
                <EditField
                  label="PAN Number"
                  value={org?.pan_number || ""}
                  onChange={(v) => setOrg({...org, pan_number: v})}
                  icon="credit_card"
                />
              </div>

              {/* Status Section */}
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <div className="flex-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                    <div className="text-sm font-bold text-slate-700">{org?.status || 'Active'}</div>
                 </div>
                 <div className="flex-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan</div>
                    <div className="text-sm font-bold text-slate-700">{org?.subscription_plan || 'Professional'}</div>
                 </div>
                 <div className="flex-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Org ID</div>
                    <div className="text-sm font-bold text-slate-700">{org?.org_id}</div>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* ════ 2. CONTACT DETAILS ════ */}
          <motion.div variants={slideUp} style={card}>
            <CardHeader
              icon="contacts"
              title="Contact Information"
              subtitle="How your institution can be reached by the system and trainees."
            />
            <div style={body}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <EditField
                  label="Primary Contact Name"
                  value={org?.contact?.primary_name || ""}
                  onChange={(v) => setOrg({...org, contact: {...org.contact, primary_name: v}})}
                  icon="person"
                  wide
                />
                <EditField
                  label="Primary Phone"
                  value={org?.contact?.primary_phone || ""}
                  onChange={(v) => setOrg({...org, contact: {...org.contact, primary_phone: v}})}
                  icon="call"
                />
                <EditField
                  label="Primary Email"
                  value={org?.contact?.primary_email || ""}
                  onChange={(v) => setOrg({...org, contact: {...org.contact, primary_email: v}})}
                  icon="mail"
                />
                <EditField
                  label="Official Website"
                  value={org?.website || ""}
                  onChange={(v) => setOrg({...org, website: v})}
                  icon="language"
                  wide
                />
              </div>
            </div>
          </motion.div>

          {/* ════ 3. INSTITUTIONAL PROFILE ════ */}
          <motion.div variants={slideUp} style={card}>
            <CardHeader
              icon="account_balance"
              title="Institutional Profile"
              subtitle="Specific details for educational institutions."
            />
            <div style={body}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <EditField
                  label="Affiliation Board"
                  value={org?.institute?.affiliation_board || ""}
                  onChange={(v) => setOrg({...org, institute: {...org.institute, affiliation_board: v}})}
                  icon="workspace_premium"
                />
                <EditField
                  label="UDISE Code"
                  value={org?.institute?.udise_code || ""}
                  onChange={(v) => setOrg({...org, institute: {...org.institute, udise_code: v}})}
                  icon="pin"
                />
                <EditField
                  label="Institution Type"
                  value={org?.institute?.institution_type || ""}
                  onChange={(v) => setOrg({...org, institute: {...org.institute, institution_type: v}})}
                  icon="category"
                />
                <EditField
                  label="Safety Officer"
                  value={org?.institute?.safety_officer_name || ""}
                  onChange={(v) => setOrg({...org, institute: {...org.institute, safety_officer_name: v}})}
                  icon="admin_panel_settings"
                />
                <EditField
                  label="Officer Contact"
                  value={org?.institute?.safety_officer_contact || ""}
                  onChange={(v) => setOrg({...org, institute: {...org.institute, safety_officer_contact: v}})}
                  icon="phone_in_talk"
                />
              </div>
            </div>
          </motion.div>

          {/* ════ 4. PHYSICAL ADDRESS ════ */}
          <motion.div variants={slideUp} style={card}>
            <CardHeader
              icon="location_on"
              title="Physical Address"
              subtitle="Your registered office location."
            />
            <div style={body}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditField
                  label="Street Address / Line 1"
                  value={org?.address?.address1 || ""}
                  onChange={(v) => setOrg({...org, address: {...org.address, address1: v}})}
                  icon="home"
                  wide
                />
                <EditField
                  label="Area / Locality / Line 2"
                  value={org?.address?.address2 || ""}
                  onChange={(v) => setOrg({...org, address: {...org.address, address2: v}})}
                  icon="signpost"
                  wide
                />
                <EditField
                  label="City / Town"
                  value={org?.address?.city || ""}
                  onChange={(v) => setOrg({...org, address: {...org.address, city: v}})}
                  icon="location_city"
                />
                <EditField
                  label="District"
                  value={org?.address?.district || ""}
                  onChange={(v) => setOrg({...org, address: {...org.address, district: v}})}
                  icon="map"
                />
                <EditField
                  label="State"
                  value={org?.address?.state || ""}
                  onChange={(v) => setOrg({...org, address: {...org.address, state: v}})}
                  icon="flag"
                />
                <EditField
                  label="PIN Code"
                  value={org?.address?.pincode || ""}
                  onChange={(v) => setOrg({...org, address: {...org.address, pincode: v}})}
                  icon="pin"
                />
              </div>
            </div>
          </motion.div>

          {/* ════ 5. LEGAL DOCUMENTS ════ */}
          <motion.div variants={slideUp} style={card}>
            <CardHeader
              icon="description"
              title="Official Documents"
              subtitle="Manage your institution's registration and tax certificates."
            />
            <div style={body}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: "PAN Card", key: "pan_card" },
                  { label: "GST Certificate", key: "gst_cert" },
                  { label: "Registration Cert", key: "registration_cert" },
                ].map((doc) => (
                  <div key={doc.key} className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.label}</label>
                    <div className="relative group">
                      {org?.documents?.[doc.key] ? (
                        <div className="flex flex-col gap-2">
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <span className="material-symbols-outlined text-primary text-sm">file_present</span>
                                <span className="text-xs font-bold text-slate-600 truncate">{org.documents[doc.key].split('/').pop()}</span>
                             </div>
                             <a 
                               href={org.documents[doc.key]} 
                               target="_blank" 
                               rel="noreferrer"
                               className="text-[10px] font-bold text-primary hover:underline"
                             >
                               VIEW
                             </a>
                          </div>
                          <button 
                            className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                            onClick={() => setOrg({...org, documents: {...org.documents, [doc.key]: ""}})}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span> REMOVE
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer bg-slate-50/50">
                          <span className="material-symbols-outlined text-slate-300 text-3xl">upload_file</span>
                          <span className="text-[10px] font-bold text-slate-400">UPLOAD {doc.label}</span>
                          <input 
                            type="file" 
                            name={doc.key}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // For now we just alert, real upload happens on Save Changes
                                alert("File selected. Click 'Save Changes' to upload.");
                                // We simulate the local value for now (the real upload logic is in the backend PUT)
                                // But since the backend handles multipart, we should ideally handle it via FormData
                                // For this specific UI, we'll just track that a file was picked if we had a dedicated state
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ════ 6. OPERATIONAL SETTINGS ════ */}
          <motion.div
            variants={slideUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start"
          >
            <div style={card}>
              <CardHeader
                icon="tune"
                title="System Notifications"
                subtitle="Control automated communication."
              />
              <div style={{ padding: "0 22px" }}>
                {[
                  { label: "SMS Alerts", sub: "Session reminders", i: 0 },
                  { label: "Auto Invoicing", sub: "Generate PDFs", i: 1 },
                  { label: "Compliance", sub: "SLA monitoring", i: 2 },
                  { label: "Feedback", sub: "Auto-forms", i: 3 },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "15px 0",
                      borderBottom: item.i < 3 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{item.sub}</div>
                    </div>
                    <Toggle checked={toggles[item.i]} onChange={() => tog(item.i)} />
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
                <CardHeader
                  icon="info"
                  title="App Metadata"
                  subtitle="System build information."
                />
                <div style={{ padding: "16px 22px" }}>
                  {[
                    { k: "App Version", v: "v2.4.1" },
                    { k: "Last Sync", v: new Date().toLocaleDateString() },
                    { k: "API Status", v: "Connected" },
                  ].map((r, i, arr) => (
                    <div
                      key={r.k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{r.k}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
