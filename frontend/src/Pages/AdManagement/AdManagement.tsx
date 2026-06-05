import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../Components/UI";
import tenantApi from "../../Services/ApiService";
import { Megaphone, Plus, Trash2, Eye, X } from "lucide-react";
import PageHeader from "../../Components/UI/PageHeader";

export interface AdItem {
  id: string;
  title: string;
  status: string;
  image: string;
  created_at: string;
}

export function AdManagement() {
  const navigate = useNavigate();
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteAd, setDeleteAd] = useState<AdItem | null>(null);
  const [viewAd, setViewAd] = useState<AdItem | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAds = async () => {
    try {
      const res = await tenantApi.get<{ success: boolean; data: AdItem[] }>("/ads");
      if (res.data?.success) {
        setAds(res.data.data);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to load advertisements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleDelete = async () => {
    if (!deleteAd) return;
    try {
      await tenantApi.delete(`/ads/${deleteAd.id}`);
      setAds((prev) => prev.filter((a) => a.id !== deleteAd.id));
      setDeleteAd(null);
      setErrorMsg("");
    } catch (e) {
      console.error(e);
      setDeleteAd(null);
      setErrorMsg("Failed to delete ad. Please try again.");
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-[var(--font-manrope)]">
      <PageHeader
        title="Ad Management"
        icon={<Megaphone size={18} />}
        breadcrumb="Admin / Ad Management"
      />

      <div className="px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6 mb-6">
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--text)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
            }}
          >
            Active Ad Banners
          </div>
          <Button
            className="flex items-center gap-2"
            variant="default"
            onClick={() => navigate("/ads/create")}
          >
            <Plus size={16} />
            Upload New Ad
          </Button>
        </div>

        <AnimatePresence>
          {errorMsg && (
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
              <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>⚠ {errorMsg}</span>
              <button
                onClick={() => setErrorMsg("")}
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

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Loading ads...
          </div>
        ) : ads.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              background: "white",
              borderRadius: 16,
              border: "1px solid var(--border)",
            }}
          >
            <Megaphone size={48} className="text-slate-300 mx-auto mb-4" />
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              No Ads Uploaded
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              Upload your first advertisement image to display it across the network.
            </div>
            <Button variant="default" onClick={() => navigate("/ads/create")}>
              Upload Ad
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => {
              return (
                <div
                  key={ad.id}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                    transition: "all 0.3s ease",
                  }}
                  className="hover:shadow-lg hover:-translate-y-1"
                >
                  <div
                    style={{
                      position: "relative",
                      height: 200,
                      background: "#F1F5F9",
                    }}
                  >
                    {ad.image ? (
                      <img
                        src={ad.image}
                        alt={ad.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--muted)",
                        }}
                      >
                        <Megaphone size={40} />
                      </div>
                    )}
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                      <span
                        style={{
                          background: ad.status === "Active" ? "#DCFCE7" : "#F1F5F9",
                          color: ad.status === "Active" ? "#059669" : "#64748B",
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                          backdropFilter: "blur(4px)",
                          border: `1px solid ${ad.status === "Active" ? "#05966933" : "#64748B33"}`,
                        }}
                      >
                        {ad.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "20px 24px" }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "var(--text)",
                        marginBottom: 6,
                      }}
                    >
                      {ad.title}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        fontWeight: 600,
                      }}
                    >
                      Uploaded: {new Date(ad.created_at).toLocaleDateString()}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid var(--border)",
                        paddingTop: 12,
                        marginTop: 16,
                      }}
                    >
                      <div className="flex gap-2 w-full justify-end">
                        <button
                          className="p-2 bg-[#F1F5F9] text-[#64748B] hover:text-[#7C3AED] hover:bg-[#EDE9FE] rounded-lg transition-all"
                          title="View Full Ad"
                          onClick={() => setViewAd(ad)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="p-2 bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FCA5A5] rounded-lg transition-all"
                          title="Delete Ad"
                          onClick={() => setDeleteAd(ad)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewAd && <ViewOverlay ad={viewAd} onClose={() => setViewAd(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {deleteAd && (
          <DeleteOverlay
            ad={deleteAd}
            onConfirm={handleDelete}
            onCancel={() => setDeleteAd(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const ViewOverlay = ({ ad, onClose }: { ad: AdItem; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        style={{
          background: "transparent",
          width: "100%",
          maxWidth: 800,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              backdropFilter: "blur(4px)",
            }}
          >
            <X size={20} />
          </button>
        </div>
        <img
          src={ad.image}
          alt={ad.title}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0,0,0,.3)",
          }}
        />
      </motion.div>
    </motion.div>
  );
};

const DeleteOverlay = ({
  ad,
  onConfirm,
  onCancel,
}: {
  ad: AdItem;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(0,0,0,.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 10 }}
      transition={{ type: "spring", duration: 0.3 }}
      style={{
        background: "white",
        borderRadius: 16,
        width: "100%",
        maxWidth: 420,
        padding: "36px 32px 28px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,.15)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#FEE2E2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#DC2626" }}>
          delete_forever
        </span>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: "#DC2626",
          marginBottom: 8,
        }}
      >
        Delete Ad?
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#64748B",
          marginBottom: 6,
          lineHeight: 1.6,
        }}
      >
        You are about to permanently delete the ad:
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "var(--text)",
          marginBottom: 24,
        }}
      >
        {ad.title}
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Button variant="secondary" onClick={onCancel} className="flex-1 justify-center">
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          className="flex-1 justify-center !bg-red-600 hover:!bg-red-700"
        >
          Delete
        </Button>
      </div>
    </motion.div>
  </motion.div>
);

export default AdManagement;
