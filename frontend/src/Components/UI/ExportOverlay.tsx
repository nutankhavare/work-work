import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import {
  X,
  Image as ImageIcon,
  Type,
  FileText,
  Download,
  Eye,
  Palette,
  FileBadge,
} from "lucide-react";
import { motion } from "framer-motion";

interface ExportOverlayProps {
  onClose: () => void;
  /**
   * Function that takes branding options and returns a jsPDF instance.
   */
  buildPdf: (opts: {
    logo?: string;
    companyName: string;
    subtitle: string;
    footerText: string;
  }) => jsPDF;
  title?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  fileName?: string;
}

const ExportOverlay: React.FC<ExportOverlayProps> = ({
  onClose,
  buildPdf,
  title = "Export Report",
  defaultTitle = "Institute Management Report",
  defaultSubtitle = "Confidential Report",
  fileName = "report.pdf",
}) => {
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [footerText, setFooterText] = useState("Confidential — For institutional use only");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setLogoName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setLogoData(e.target!.result as string);
    reader.readAsDataURL(file);
  };

  const generatePreview = () => {
    const doc = buildPdf({
      logo: logoData || undefined,
      companyName: reportTitle,
      subtitle,
      footerText,
    });
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
  };

  const handleDownload = () => {
    const doc = buildPdf({
      logo: logoData || undefined,
      companyName: reportTitle,
      subtitle,
      footerText,
    });
    doc.save(fileName);
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[24px] w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-[0_32px_80px_rgba(30,41,59,0.15)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
              <FileBadge size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">{title}</h2>
              <p className="text-white/70 text-sm font-semibold">
                Customize branding & preview before downloading
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column: Customization */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <Palette size={16} className="font-bold" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Branding Assets
                  </span>
                </div>

                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                  Company Logo (Optional)
                </label>
                <div
                  onClick={() => logoRef.current?.click()}
                  className="border-2 border-dashed border-indigo-100 rounded-2xl p-6 text-center cursor-pointer bg-white hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group"
                >
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
                  />
                  {logoData ? (
                    <div className="flex items-center gap-4 justify-center">
                      <img
                        src={logoData}
                        alt="logo"
                        className="w-12 h-12 object-contain rounded-xl border border-slate-200"
                      />
                      <div className="text-left">
                        <div className="text-sm font-bold text-emerald-600">✓ {logoName}</div>
                        <button
                          className="text-xs font-bold text-indigo-500 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogoData(null);
                            setLogoName(null);
                          }}
                        >
                          Remove Logo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon
                        size={32}
                        className="mx-auto mb-2 text-indigo-200 group-hover:text-indigo-400 transition-colors"
                      />
                      <div className="text-xs font-bold text-indigo-600">
                        Click to upload or drag & drop
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">
                        PNG, JPG, SVG — Max 2 MB
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                    <Type size={12} /> Report Main Title
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:outline-none font-bold text-[13px] transition-all"
                    placeholder="e.g. Acme Corp Fleet Summary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                    <FileText size={12} /> Subtitle / Scope
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:outline-none font-bold text-[13px] transition-all"
                    placeholder="e.g. Q1 2024 Audit Registry"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                    Disclaimers / Footer
                  </label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:outline-none font-bold text-[13px] transition-all"
                    placeholder="e.g. Property of Institution"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Preview */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Eye size={16} className="font-bold" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Document Preview
                </span>
              </div>

              <div className="bg-slate-200/50 rounded-2xl h-[400px] border border-slate-200 overflow-hidden flex items-center justify-center relative">
                {previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-none"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="text-center p-10">
                    <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                    <div className="text-sm font-bold text-slate-400">
                      Generate a preview to continue
                    </div>
                    <p className="text-[10px] uppercase font-black text-slate-300 mt-2 tracking-widest leading-relaxed">
                      Customize your branding
                      <br />
                      options on the left first
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col md:flex-row gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all order-2 md:order-1"
          >
            Cancel
          </button>

          <div className="flex-1 flex flex-col md:flex-row gap-3 justify-end order-1 md:order-2">
            <button
              onClick={generatePreview}
              className="px-6 py-3 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all shadow-sm"
            >
              <Eye size={18} />
              Generate Preview
            </button>
            <button
              onClick={handleDownload}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[0] transition-all shadow-indigo-200 shadow-md"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportOverlay;
