import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Download, 
  Pencil,
  Trash2,
  Gavel,
  BookOpen,
  FileText
} from "lucide-react";
import PageHeader from "../../Components/UI/PageHeader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
import { Loader } from "../../Components/UI/Loader";
import ExportOverlay from "../../Components/UI/ExportOverlay";
import { Pagination } from "../../Components/Table/Pagination";
import { useConfirm } from "../../Context/ConfirmContext";
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "../../Components/Table/Table";
import EmptyState from "../../Components/UI/EmptyState";

/* ── STAT CARD COMPONENT ── */
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white rounded-[14px] p-6 border border-[#e8edf5] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(124,58,237,0.08)] transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-[12px] ${colorClass} transition-transform group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[11px] font-[800] text-[#94a3b8] uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-[900] text-[#1e293b]">{value}</h4>
          {subtext && <span className="text-[11px] font-[700] text-[#059669]">{subtext}</span>}
        </div>
      </div>
    </div>
  </motion.div>
);

const ComplianceIndexPage = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [individualExport, setIndividualExport] = useState<any | null>(null);

  const buildBulkPdf = useCallback((opts: any) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pw, 40, "F");
    if (opts.logo) { try { doc.addImage(opts.logo, "PNG", 14, 8, 24, 24); } catch (e) {} }
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text(opts.companyName || "Compliance Registry", opts.logo ? 42 : 14, 22);
    autoTable(doc, {
      startY: 45,
      head: [["ID", "Document Name", "Authority", "Category", "Status", "Recorded Date"]],
      body: records.map((r) => [
        `#${r.id}`, r.document_name, r.authority_name, r.category, r.status, new Date(r.date_recorded).toLocaleDateString()
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
    });
    return doc;
  }, [records]);

  const buildIndividualPdf = useCallback((r: any) => (opts: any) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pw, 45, "F");
    if (opts.logo) { try { doc.addImage(opts.logo, "PNG", 14, 10, 25, 25); } catch(e){} }
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text(opts.companyName || r.document_name, opts.logo ? 45 : 20, 22);
    return doc;
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tenantApi.get("/compliance", {
        params: {
          page: pagination.current_page,
          search: search,
          status: statusFilter === "All" ? undefined : statusFilter,
          category: categoryFilter || undefined
        }
      });
      setRecords(response.data.data.data || []);
      setPagination({
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
        total: response.data.data.total
      });
    } catch (err) {
      showAlert("Failed to load compliance records", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, search, statusFilter, categoryFilter, showAlert]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id: number) => {
    if (!(await confirm("Are you sure you want to delete this record?"))) return;
    try {
      await tenantApi.delete(`/compliance/${id}`);
      showAlert("Record deleted successfully", "success");
      fetchRecords();
    } catch (err) {
      showAlert("Failed to delete record", "error");
    }
  };

  const stats = [
    { label: "Total Records", value: pagination.total.toString(), icon: Gavel, colorClass: "bg-blue-50 text-blue-600" },
    { label: "Compliant", value: records.filter(r => r.status === "Compliant").length.toString(), icon: Gavel, colorClass: "bg-emerald-50 text-emerald-600" },
    { label: "Non-Compliant", value: records.filter(r => r.status === "Non-Compliant").length.toString(), icon: Gavel, colorClass: "bg-rose-50 text-rose-600" },
    { label: "Pending", value: records.filter(r => r.status === "Pending Review").length.toString(), icon: Gavel, colorClass: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-[var(--font-manrope)]">
      <PageHeader
        title="Compliance & Laws"
        icon={<Gavel size={18} />}
        breadcrumb="Admin / Compliance & Laws"
        buttonText="Add Record"
        buttonLink="/compliance/create"
      >
        <button className="flex items-center gap-2 px-5 py-[11px] bg-white text-[#475569] border border-[#e2e8f0] rounded-[12px] text-[12.5px] font-[800] shadow-sm hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all" onClick={() => setShowBulkExport(true)}>
          <Download size={16} /> Export PDF
        </button>
      </PageHeader>

      <div className="px-6">
        {/* Stat Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((s, idx) => (
            <StatCard key={idx} title={s.label} value={s.value} icon={s.icon} colorClass={s.colorClass} delay={idx * 0.05} />
          ))}
        </div>

        {/* Guidance Block */}
        <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
               <BookOpen size={20} />
             </div>
             <h3 className="text-[15px] font-[900] text-[#1e293b] uppercase tracking-wider">RTO Guidelines Framework</h3>
          </div>
          <p className="text-[13px] font-[600] text-slate-500 mb-6 leading-relaxed">Official government guidelines and legal compliance requirements for motor driving schools and educational transport services.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Licensing", text: "Schools must maintain valid registration renewed every 5 years.", color: "#7c3aed" },
              { title: "Instructors", text: "Min. 5 years experience with valid teaching certificates.", color: "#3b82f6" },
              { title: "Safety Systems", text: "Dual control systems mandatory for all training vehicles.", color: "#ef4444" },
              { title: "Signage", text: "Vehicles must display prominent 'L' signs at front and rear.", color: "#f59e0b" },
            ].map((b, i) => (
              <div key={i} className="p-5 rounded-[14px] bg-[#f8fafc] border-l-[4px]" style={{ borderLeftColor: b.color }}>
                <h4 className="text-[12px] font-[900] text-[#1e293b] uppercase mb-2">{b.title}</h4>
                <p className="text-[11px] font-[700] text-slate-500 leading-tight">{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] overflow-hidden">
          
          {/* Search & Filters */}
          <div className="p-6 border-b border-[#f1f5f9] bg-[#fafbff]/50">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#7c3aed] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, category or authority..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[500] placeholder:text-[#94a3b8] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[420px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
                >
                  <option value="">All Categories</option>
                  <option value="Operational">Operational</option>
                  <option value="Legal">Legal</option>
                  <option value="Tax">Tax</option>
                  <option value="Technical">Technical</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
                >
                  <option value="All">All Status</option>
                  <option value="Compliant">Compliant</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>
            </div>
          </div>

          <div className="relative">
            {loading ? (
              <div className="py-24 flex justify-center"><Loader /></div>
            ) : records.length === 0 ? (
              <div className="py-24">
                <EmptyState title="No Records Found" description="Try adjusting your filters to see more results." icon={<Gavel size={64} className="text-slate-200 mb-4" />} />
              </div>
            ) : (
              <>
                <TableContainer maxHeight="60vh">
                  <Table className="w-full">
                    <Thead className="!bg-[#fafbff] border-b border-[#f1f5f9]">
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] pl-8">ID / Document Name</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">Authority</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Category</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Status</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center pr-8">Actions</Th>
                    </Thead>
                    <Tbody>
                      {records.map((r, i) => (
                        <Tr key={i} className="hover:bg-[#fdfbff] transition-colors border-b border-[#f8fafc] last:border-0">
                          <Td className="py-5 pl-8">
                            <div className="flex items-center gap-4">
                               <div className="text-[11px] font-[900] text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-md border border-[#ddd6fe]">#{r.id}</div>
                               <span className="text-[13.5px] font-[900] text-[#1e293b]">{r.document_name}</span>
                            </div>
                          </Td>
                          <Td className="py-5 text-[13px] font-[700] text-[#475569]">{r.authority_name}</Td>
                          <Td className="py-5 text-center">
                             <span className="px-2.5 py-1 bg-[#f1f5f9] text-[#64748b] text-[10px] font-[900] rounded-[6px] uppercase tracking-wider">{r.category}</span>
                          </Td>
                          <Td className="py-5 text-center">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-[900] uppercase tracking-wider border shadow-xs ${
                              r.status === 'Compliant' ? 'bg-[#ecfdf5] text-[#059669] border-[#d1fae5]' : 
                              r.status === 'Pending Review' ? 'bg-[#fffbeb] text-[#d97706] border-[#fef3c7]' : 'bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]'
                            }`}>
                              {r.status}
                            </span>
                          </Td>
                          <Td className="py-5 text-center pr-8">
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => setIndividualExport(r)} className="p-2 text-[#64748b] hover:text-indigo-600 hover:bg-indigo-50 rounded-[8px] transition-all" title="Preview Report">
                                <FileText size={17} />
                              </button>
                              <button 
                                onClick={async () => { if(await confirm("Modify this compliance record?")) navigate(`/compliance/edit/${r.id}`); }}
                                className="p-2 text-[#64748b] hover:text-amber-600 hover:bg-amber-50 rounded-[8px] transition-all"
                                title="Edit"
                              >
                                <Pencil size={17} />
                              </button>
                              <button onClick={() => handleDelete(r.id)} className="p-2 text-[#64748b] hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-all" title="Delete">
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>

                {pagination.total > 0 && (
                  <Pagination
                    currentPage={pagination.current_page}
                    totalPages={pagination.last_page}
                    totalItems={pagination.total}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, current_page: page }))}
                    itemName="records"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBulkExport && (
          <ExportOverlay 
            onClose={() => setShowBulkExport(false)} 
            buildPdf={buildBulkPdf}
            title="Export Compliance Registry"
            defaultTitle="Institutional Compliance Report"
            defaultSubtitle={`Registry Audit · ${pagination.total} Documents`}
            fileName="compliance-report.pdf"
          />
        )}
        {individualExport && (
          <ExportOverlay 
            onClose={() => setIndividualExport(null)} 
            buildPdf={buildIndividualPdf(individualExport)}
            title={`Export Compliance Profile`}
            defaultTitle={individualExport.document_name}
            defaultSubtitle={`Reference: #${individualExport.id}`}
            fileName={`compliance-${individualExport.id}.pdf`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplianceIndexPage;
