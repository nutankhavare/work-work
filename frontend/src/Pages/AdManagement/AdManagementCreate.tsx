import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, Card } from "../../Components/UI";
import tenantApi from "../../Services/ApiService";
import { Megaphone, Cloud, CheckCircle, Info, ToggleLeft, ArrowLeft, UploadCloud } from "lucide-react";
import PageHeader from "../../Components/UI/PageHeader";

interface Form {
  title: string;
  status: string;
  image: string;
}

type Errs = Partial<Record<keyof Form, string>>;

const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 20px",
      borderBottom: "1.5px solid var(--border)",
      background: "var(--surface)",
    }}
  >
    <span
      className="material-symbols-outlined"
      style={{ fontSize: 18, color: "var(--primary)" }}
    >
      {icon}
    </span>
    <span
      style={{
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: ".07em",
        textTransform: "uppercase",
      }}
    >
      {title}
    </span>
  </div>
);

const Body = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: "20px 22px" }}>{children}</div>
);

const Label = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label
    style={{
      display: "block",
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: ".06em",
      color: "#64748B",
      marginBottom: 5,
    }}
  >
    {children}
    {required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
  </label>
);

const Err = ({ msg }: { msg?: string }) =>
  msg ? (
    <div
      style={{ fontSize: 10, color: "#DC2626", fontWeight: 700, marginTop: 3 }}
    >
      ⚠ {msg}
    </div>
  ) : null;

export const AdManagementCreate = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Form>({
    title: "",
    status: "Active",
    image: "",
  });
  const [errs, setErrs] = useState<Errs>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveError, setSaveError] = useState("");

  const f =
    (key: keyof Form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((v) => ({ ...v, [key]: e.target.value }));
      setErrs((v) => ({ ...v, [key]: undefined }));
    };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrs((v) => ({ ...v, image: "Only image files are allowed." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrs((v) => ({ ...v, image: "File size exceeds 5MB limit." }));
      return;
    }

    setUploadingImage(true);
    setErrs((v) => ({ ...v, image: undefined }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await tenantApi.post<{ success: boolean; url: string }>("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success && response.data.url) {
        setForm((v) => ({ ...v, image: response.data.url }));
      } else {
        setErrs((v) => ({ ...v, image: "Failed to upload image." }));
      }
    } catch (err) {
      console.error(err);
      setErrs((v) => ({ ...v, image: "Error uploading image to server." }));
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = (): boolean => {
    const e: Errs = {};
    if (!form.title.trim()) {
      e.title = "Ad title is required";
    }
    if (!form.image.trim()) {
      e.image = "Image is required";
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      const first = document.querySelector('[data-err="1"]');
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    try {
      await tenantApi.post("/ads", {
        title: form.title,
        image: form.image,
        status: form.status,
      });
      setSaved(true);
      setSaveError("");
    } catch (err) {
      console.error(err);
      setSaveError(
        "Failed to save ad. Please check your connection and try again.",
      );
      setTimeout(() => setSaveError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-12 font-[var(--font-manrope)]">
        <PageHeader 
          title="Ad Management" 
          icon={<Megaphone size={18} />} 
          breadcrumb="Admin / Ad Management / New Ad" 
        />
        <motion.div
          className="page-body flex items-center justify-center pt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1.5px solid var(--border)",
              padding: "52px 60px",
              textAlign: "center",
              maxWidth: 500,
              width: "100%",
              boxShadow: "0 8px 40px rgba(124,58,237,.08)",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <CheckCircle size={44} className="text-[#7C3AED]" />
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#4C1D95",
                marginBottom: 8,
              }}
            >
              Ad Uploaded Successfully
            </div>
            <div style={{ fontSize: 13, color: "#7C3AED", marginBottom: 6 }}>
              <b>{form.title}</b> has been saved and is now {form.status.toLowerCase()}.
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-6">
              <Button
                className="w-full sm:w-auto"
                variant="secondary"
                onClick={() => {
                  setForm({
                    title: "",
                    status: "Active",
                    image: "",
                  });
                  setSaved(false);
                }}
              >
                Upload Another
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="default"
                onClick={() => navigate("/ads")}
              >
                <ArrowLeft size={16} /> Back to Ads
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-[var(--font-manrope)]">
      <PageHeader 
        title="New Ad Upload" 
        icon={<Megaphone size={18} />} 
        breadcrumb="Admin / Ad Management / New Ad" 
      />

      <div className="px-6">
        <div className="flex justify-end mt-4 mb-4">
          <Button
            className="flex items-center gap-2"
            variant="secondary"
            onClick={() => navigate("/ads")}
          >
            <ArrowLeft size={16} /> Back to Ads
          </Button>
        </div>

        <div style={{ maxWidth: 900, width: "100%", margin: "0 auto" }}>
          <AnimatePresence>
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  background: "#FEE2E2",
                  border: "1px solid #FECACA",
                  borderRadius: 12,
                  padding: "12px 20px",
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>
                  ⚠ {saveError}
                </span>
                <button
                  onClick={() => setSaveError("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#DC2626",
                    fontWeight: 800,
                  }}
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <Card>
            <SectionHeader icon="info" title="Ad Details" />
            <Body>
              <div className="mb-6" data-err={errs.title ? "1" : undefined}>
                <Label required>Ad Title</Label>
                <Input
                  placeholder="e.g. Summer Discount Promo"
                  value={form.title}
                  onChange={f("title")}
                  style={{
                    borderColor: errs.title ? "#DC2626" : undefined,
                  }}
                />
                <Err msg={errs.title} />
              </div>

              <div className="mb-4" data-err={errs.image ? "1" : undefined}>
                <Label required>Ad Banner Image</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                
                {form.image ? (
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white flex flex-col items-center gap-4">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="max-h-[220px] rounded-lg object-contain border border-slate-100"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Image
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setForm((v) => ({ ...v, image: "" }))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-[#7C3AED]/50 transition-all duration-200 cursor-pointer text-center ${
                      errs.image ? "border-red-500 bg-red-50" : "border-slate-200"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  >
                    <UploadCloud size={36} className="text-slate-400 mb-2" />
                    <span className="text-[12px] font-bold text-slate-600">
                      {uploadingImage ? "Uploading Image..." : "Click or drag image to upload"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      Supports JPG, PNG, WEBP — Max 5MB
                    </span>
                  </div>
                )}
                <Err msg={errs.image} />
              </div>
            </Body>
          </Card>

          <Card>
            <SectionHeader icon="toggle_on" title="Ad Status" />
            <Body>
              <div>
                <Label required>Status</Label>
                <div className="flex gap-3 mt-2">
                  {["Active", "Inactive"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((v) => ({ ...v, status: s }))}
                      style={{
                        padding: "8px 24px",
                        borderRadius: 8,
                        border: `1.5px solid ${form.status === s ? (s === "Active" ? "#059669" : "#D97706") : "var(--border)"}`,
                        background:
                          form.status === s
                            ? s === "Active"
                              ? "#DCFCE7"
                              : "#FEF3C7"
                            : "var(--surface)",
                        color:
                          form.status === s
                            ? s === "Active"
                              ? "#059669"
                              : "#D97706"
                            : "#64748B",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all .15s",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </Body>
          </Card>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              variant="secondary"
              onClick={() => navigate("/ads")}
              disabled={loading}
            >
              CANCEL
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={loading || uploadingImage}
            >
              {loading ? "SAVING..." : "UPLOAD AD"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

  export default AdManagementCreate;
  
