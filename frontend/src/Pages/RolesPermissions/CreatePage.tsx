import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

// Icons
import {
  Shield,
  Activity,
  // Users,
  Settings,
  Lock,
  Key,
  Info,
  CheckCircle,
  UserCog,
  Save,
  // ChevronLeft,
  // AlertCircle,
  // BadgeCheck,
  Plus,
} from "lucide-react";

// Components
import PageHeader from "../../Components/UI/PageHeader";
import LoadingSpinner from "../../Components/UI/LoadingSpinner";
import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";

/* ── FormSection Component ── */
const FormSection = ({ title, icon: Icon, children, color = "var(--primary)" }: any) => (
  <div className="form-card overflow-hidden mb-6">
    <div className="form-card-header flex items-center gap-2">
      {Icon && <Icon size={18} style={{ color }} strokeWidth={2.5} />}
      <span className="text-[11px] font-[900] tracking-[0.07em] uppercase text-[#1e293b]">
        {title}
      </span>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ── Types ── */
interface FormInputs {
  roleName: string;
  department: string;
  accessLevel: string;
  description: string;
  permissions: number[];
  status: string;
  consent: boolean;
}

const DEPARTMENTS = [
  "Fleet Operations",
  "Reception & Support",
  "Core Administration",
  "Finance & Billing",
  "Training & Instructors",
  "IT & Systems",
  "Compliance & Legal",
  "Other",
];

const ACCESS_LEVELS = [
  { val: "Full Access", color: "#7C3AED", bg: "#EDE9FE", icon: Lock },
  { val: "Partial Access", color: "#2563EB", bg: "#DBEAFE", icon: Lock },
  { val: "Read Only", color: "#D97706", bg: "#FEF3C7", icon: Activity },
  { val: "Root Access", color: "#DC2626", bg: "#FEE2E2", icon: Key },
];

const CreatePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(isEdit);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [form, setForm] = useState<FormInputs>({
    roleName: "",
    department: "",
    accessLevel: "",
    description: "",
    permissions: [],
    status: "Active",
    consent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const permsRes = await tenantApi.get("/permissions");
        const permsRaw = permsRes.data.data;
        setAllPermissions(Array.isArray(permsRaw) ? permsRaw : permsRaw?.data || []);

        if (isEdit && id) {
          const roleRes = await tenantApi.get(`/roles/${id}`);
          const r = roleRes.data.data;
          setForm({
            roleName: r.name,
            department: r.department || "",
            accessLevel: r.access_level || "",
            description: r.description || "",
            permissions: r.permissions?.map((p: any) => p.id) || [],
            status: r.status || "Active",
            consent: false,
          });
        }
      } catch (error) {
        showAlert("Failed to load data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit, showAlert]);

  const handlePermissionToggle = (permId: number) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.roleName.trim()) return showAlert("Role name is required", "error");
    if (!form.department) return showAlert("Department is required", "error");
    if (!form.accessLevel) return showAlert("Access level is required", "error");
    if (form.permissions.length === 0) return showAlert("Assign at least one permission", "error");
    if (!form.consent) return showAlert("Please confirm the role settings", "error");

    try {
      setIsSubmitting(true);
      const payload = {
        name: form.roleName.trim(),
        department: form.department,
        access_level: form.accessLevel,
        description: form.description,
        permissions: form.permissions,
        status: form.status,
      };

      if (isEdit && id) {
        await tenantApi.put(`/roles/${id}`, payload);
        showAlert("Role updated successfully!", "success");
      } else {
        await tenantApi.post("/roles", payload);
        showAlert("Role created successfully!", "success");
      }
      setSaved(true);
    } catch (error: any) {
      showAlert(error.response?.data?.message || "Failed to save role.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (saved) {
    return (
      <div className="page-body flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-10 max-w-[500px] w-full text-center border border-[#eef2f6] shadow-xl"
        >
          <div className="w-20 h-20 bg-[#ecfdf5] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={44} className="text-[#059669]" />
          </div>
          <h2 className="text-2xl font-[900] text-[#1e293b] mb-2 uppercase tracking-tight">
            Role {isEdit ? "Updated" : "Created"}!
          </h2>
          <p className="text-[#64748b] mb-8 font-[600]">
            The role <span className="text-[#7c3aed] font-[800]">{form.roleName}</span> has been
            successfully {isEdit ? "updated" : "added to the system"}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setSaved(false);
                setForm({ ...form, roleName: "", permissions: [], consent: false });
                if (isEdit) navigate("/roles/create");
              }}
              className="flex-1 btn btn-secondary justify-center"
            >
              Add Another
            </button>
            <button
              onClick={() => navigate("/roles")}
              className="flex-1 btn btn-primary justify-center"
            >
              Back to List
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-body pb-20">
      <PageHeader
        title={isEdit ? "Edit Role Configuration" : "Create New Role"}
        icon={isEdit ? <UserCog size={20} /> : <Plus size={20} />}
        breadcrumb={`Admin / Roles & Permissions / ${isEdit ? "Edit" : "Create"}`}
        showBackButton={true}
        backButtonLink="/roles"
      />

      <div className="max-w-[860px] mx-auto px-4 sm:px-0">
        <form onSubmit={handleSave}>
          <FormSection title="Role Identity" icon={Shield}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Info size={14} className="text-slate-400" />
                  Role Name
                </label>
                <input
                  className="form-input uppercase"
                  placeholder="e.g. SYSTEM-ADMIN"
                  value={form.roleName}
                  onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Activity size={14} className="text-slate-400" />
                  Department
                </label>
                <select
                  className="form-select"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Role Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Define the primary responsibilities and scope of this role..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Access Level" icon={Lock} color="#f59e0b">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {ACCESS_LEVELS.map((a) => (
                <button
                  key={a.val}
                  type="button"
                  onClick={() => setForm({ ...form, accessLevel: a.val })}
                  className={`p-4 rounded-xl border-[1.5px] transition-all text-left flex flex-col gap-2 ${
                    form.accessLevel === a.val
                      ? "border-[#7c3aed] bg-[#f5f3ff] shadow-sm"
                      : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                  }`}
                >
                  <a.icon
                    size={18}
                    style={{ color: form.accessLevel === a.val ? "#7c3aed" : "#94a3b8" }}
                  />
                  <span
                    className={`text-[12px] font-[800] uppercase tracking-tight ${
                      form.accessLevel === a.val ? "text-[#7c3aed]" : "text-[#475569]"
                    }`}
                  >
                    {a.val}
                  </span>
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection title="Permissions Assignment" icon={Key} color="#7c3aed">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-[12px] text-[#64748b] font-[600]">
                Select functional permissions for this role
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, permissions: allPermissions.map((p) => p.id) })}
                  className="text-[11px] font-[800] text-[#7c3aed] uppercase hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, permissions: [] })}
                  className="text-[11px] font-[800] text-[#94a3b8] uppercase hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allPermissions.map((perm) => {
                const isChecked = form.permissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-[1.5px] cursor-pointer transition-all ${
                      isChecked
                        ? "bg-[#f0f9ff] border-[#0ea5e9]"
                        : "bg-[#fafafa] border-[#f1f5f9] hover:border-[#e2e8f0]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handlePermissionToggle(perm.id)}
                      className="w-4 h-4 rounded accent-[#0ea5e9]"
                    />
                    <span
                      className={`text-[12px] font-[700] uppercase tracking-tight ${
                        isChecked ? "text-[#0369a1]" : "text-[#64748b]"
                      }`}
                    >
                      {perm.name.replace(/-/g, " ")}
                    </span>
                  </label>
                );
              })}
            </div>
            {form.permissions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
                <span className="text-[11px] font-[800] bg-[#ede9fe] text-[#7c3aed] px-3 py-1 rounded-full uppercase tracking-wider">
                  {form.permissions.length} Permissions Selected
                </span>
              </div>
            )}
          </FormSection>

          <FormSection title="Status & Finalization" icon={Settings}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="form-label">Role Status</label>
                <select
                  className="form-select uppercase"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-start gap-3 p-4 rounded-xl border-[1.5px] border-[#e2e8f0] bg-[#fafbff] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-[#7c3aed]"
                  />
                  <div>
                    <p className="text-[12.5px] font-[800] text-[#1e293b] mb-1 group-hover:text-[#7c3aed] transition-colors">
                      Confirm Configuration
                    </p>
                    <p className="text-[11.5px] text-[#64748b] leading-relaxed font-[600]">
                      I confirm that these permissions are necessary for this role and adhere to the
                      principle of least privilege.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </FormSection>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-10">
            <button
              type="button"
              onClick={() => navigate("/roles")}
              className="btn btn-secondary min-w-[120px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary min-w-[220px] justify-center"
            >
              <Save size={18} />
              {isSubmitting ? "Saving Configuration..." : isEdit ? "Update Role" : "Register Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePage;
