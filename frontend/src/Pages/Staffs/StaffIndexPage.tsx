// src/components/staff/StaffIndexPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Icons
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Edit,
  Eye,
  Phone,
  Mail,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Plus,
  CloudUpload,
  Trash2
} from "lucide-react";

// Components
import PageHeader from "../../Components/UI/PageHeader";
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "../../Components/Table/Table";

// Services & Utils
import tenantApi, { tenantAsset } from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
import { Loader } from "../../Components/UI/Loader";
import EmptyState from "../../Components/UI/EmptyState";
import { Pagination } from "../../Components/Table/Pagination";
import type { Employee, Role } from "./Staff.types";
import { DUMMY_USER_IMAGE } from "../../Utils/Toolkit";
import ExportOverlay from "../../Components/UI/ExportOverlay";
import { useConfirm } from "../../Context/ConfirmContext";

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

/* ── IMPORT MODAL COMPONENT ── */
const ImportModal = ({ isOpen, onClose, onImport }: { isOpen: boolean; onClose: () => void; onImport: (rows: any[]) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setPreview(json);
      setIsParsing(false);
    };
    reader.readAsBinaryString(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f1028]/50 backdrop-blur-[4px]">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[20px] w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#fafbff]">
          <h3 className="text-[15px] font-[900] text-[#1e293b] uppercase">Import Employees</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#f1f5f9] rounded-full transition-colors"><X size={20} className="text-[#94a3b8]" /></button>
        </div>
        <div className="p-8">
          {!file ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#e2e8f0] bg-[#fafbff] py-12 px-6 rounded-[16px] cursor-pointer hover:border-[#7c3aed] transition-colors group">
              <CloudUpload size={48} className="text-[#cbd5e1] group-hover:text-[#7c3aed] mb-4 transition-colors" />
              <p className="text-[14px] font-[800] text-[#1e293b] mb-1">Click to upload Excel</p>
              <p className="text-[12px] font-[600] text-[#94a3b8]">Support for .xlsx, .xls, .csv</p>
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px]">
                <FileSpreadsheet className="text-[#059669]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-[800] text-[#1e293b] truncate uppercase">{file.name}</p>
                  <p className="text-[11px] font-[600] text-[#94a3b8]">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button onClick={() => setFile(null)} className="text-[#dc2626] text-xs font-bold hover:underline">Change</button>
              </div>
              {isParsing ? <Loader /> : (
                <div className="bg-[#ecfdf5] border border-[#d1fae5] p-4 rounded-[12px]">
                   <p className="text-[13px] font-[800] text-[#065f46]">Successfully parsed {preview.length} employees</p>
                   <p className="text-[11px] font-[600] text-[#059669]">Ready to import into database</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#f1f5f9] flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 text-[12.5px] font-[800] text-[#475569] hover:bg-[#e2e8f0] rounded-[10px] transition-colors">Cancel</button>
          <button disabled={!file || isParsing} onClick={() => onImport(preview)} className="px-6 py-2.5 bg-[#7c3aed] text-white text-[12.5px] font-[800] rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(124,58,237,0.25)]">Import Data</button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── MAIN COMPONENT ── */
const StaffIndexPage = () => {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Data State
  const [staffList, setStaffList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0, inactive: 0 });

  // UI State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [allRoles, setAllRoles] = useState<Role[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [perPage] = useState(10);

  const [showBulkExport, setShowBulkExport] = useState(false);
  const [individualExport, setIndividualExport] = useState<Employee | null>(null);

  // 1. Fetch data from backend
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tenantApi.get("/employees", {
        params: {
          page: currentPage,
          limit: perPage,
          search: searchQuery,
          status: statusFilter,
          role: roleFilter,
        },
      });

      const resData = response.data?.data;
      const employees = resData?.data || [];
      
      setStaffList(employees);
      setTotalItems(resData?.total || 0);
      setTotalPages(resData?.last_page || 1);
      
      setStats({
        total: resData?.total || 0,
        active: employees.filter((s: any) => s.status?.toLowerCase() === "active").length || 0,
        onLeave: employees.filter((s: any) => ["leave", "on leave", "onleave"].includes(s.status?.toLowerCase() || "")).length || 0,
        inactive: employees.filter((s: any) => s.status?.toLowerCase() === "inactive").length || 0,
      });
    } catch (error) {
      showAlert("Failed to fetch staff list", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchQuery, statusFilter, roleFilter]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await tenantApi.get("/roles");
      setAllRoles(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    const timer = setTimeout(fetchStaff, 300);
    return () => clearTimeout(timer);
  }, [fetchStaff]);

  // 2. Handlers
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setRoleFilter("");
    setCurrentPage(1);
  };

  const handleDelete = async (emp: Employee) => {
    if (!(await confirm(`Delete ${emp.first_name} ${emp.last_name}? This cannot be undone.`))) return;
    try {
      await tenantApi.delete(`/employees/${emp.id}`);
      setStaffList((prev) => prev.filter((s) => s.id !== emp.id));
      showAlert(`${emp.first_name} deleted successfully.`, "success");
      fetchStaff();
    } catch (error) {
      showAlert("Failed to delete employee", "error");
    }
  };

  /* ── PDF BUILDER (ALL) ── */
  const buildBulkPdf = useCallback((opts: any) => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pw = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pw, 35, "F");

    if (opts.logo) {
      try { doc.addImage(opts.logo, "PNG", 14, 5, 25, 25); } catch(e){}
    }

    doc.setFontSize(20);
    doc.setTextColor(255);
    doc.text(opts.companyName || "Employee Registry", opts.logo ? 45 : 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 255);
    doc.text(opts.subtitle || `Generated for ${new Date().toLocaleDateString()}`, opts.logo ? 45 : 14, 26);

    autoTable(doc, {
      startY: 45,
      head: [["ID", "Name", "Designation", "Email", "Phone", "Status", "Join Date"]],
      body: staffList.map((s) => [
        s.employee_id,
        `${s.first_name} ${s.last_name}`,
        s.designation || "-",
        s.email,
        s.phone,
        (s.status || "Active").toUpperCase(),
        s.joining_date ? new Date(s.joining_date).toLocaleDateString() : "-"
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
    });

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Confidential Employee Data", 14, ph - 10);
    return doc;
  }, [staffList]);

  /* ── PDF BUILDER (INDIVIDUAL) ── */
  const buildIndividualPdf = useCallback((emp: Employee) => (opts: any) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pw, 45, "F");

    if (opts.logo) {
      try { doc.addImage(opts.logo, "PNG", 14, 10, 25, 25); } catch(e){}
    }
    
    const startX = opts.logo ? 45 : 20;
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text(opts.companyName || `${emp.first_name} ${emp.last_name}`, startX, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(220, 210, 255);
    doc.text(opts.subtitle || `Employee ID: ${emp.employee_id || 'N/A'}  |  ${emp.designation || 'Staff Member'}`, startX, 32);

    let y = 60;
    const field = (label: string, value: string) => {
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(label, 20, y);
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(value || "—", 70, y);
      y += 10;
    };

    field("Full Name:", `${emp.first_name} ${emp.last_name}`);
    field("Employee ID:", emp.employee_id || "-");
    field("Email Address:", emp.email);
    field("Department:", emp.department || "-");
    field("Designation:", emp.designation || "-");
    field("Phone Number:", emp.phone || "-");
    field("Status:", (emp.status || "-").toUpperCase());

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Personnel Record", 20, ph - 15);

    return doc;
  }, []);

  /* ── BULK IMPORT HANDLER ── */
  const handleBulkImport = async (rows: any[]) => {
    setIsImportModalOpen(false);
    try {
      await tenantApi.post("/employees/import", { employees: rows });
      showAlert(`Successfully imported ${rows.length} records.`, "success");
      fetchStaff();
    } catch (error) {
      showAlert("Failed to import employees", "error");
    }
  };

  /* ── UTILS ── */
  const renderAvatar = (employee: Employee) => {
    const imgSrc = employee.photo ? `${tenantAsset}${employee.photo}` : `${DUMMY_USER_IMAGE}`;
    return (
      <img
        src={imgSrc}
        alt={`${employee.first_name}`}
        className="h-10 w-10 rounded-full object-cover border border-[#f1f5f9] shadow-sm bg-[#ede9fe]"
        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=ede9fe&color=7c3aed&bold=true&font-size=0.45`; }}
      />
    );
  };

  return (
    <div className="min-h-screen font-[var(--font-manrope)]">
      {/* Header Section */}
      <div className="mb-2">
        <PageHeader
          title="Staff Management"
          icon={<Users size={18} />}
          breadcrumb="Admin / Staff Management"
          buttonText="Add Employee"
          buttonLink="/staff/create"
        >
            <button 
              onClick={() => setIsImportModalOpen(true)} 
              className="w-full md:w-auto flex justify-center items-center gap-2 px-5 py-[11px] bg-white text-[#475569] border border-[#e2e8f0] rounded-[12px] text-[12.5px] font-[800] shadow-sm hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
            >
              <FileSpreadsheet size={16} />
              Import Excel
            </button>
            <button 
              onClick={() => setShowBulkExport(true)}
              className="w-full md:w-auto flex justify-center items-center gap-2 px-5 py-[11px] bg-white text-[#475569] border border-[#e2e8f0] rounded-[12px] text-[12.5px] font-[800] shadow-sm hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
            >
              <Download size={16} />
              Export PDF
            </button>
        </PageHeader>
      </div>

      {/* Mobile Actions Stack */}
      <div className="lg:hidden flex flex-col gap-3 mb-6 px-4">
        <button 
          onClick={() => setIsImportModalOpen(true)} 
          className="btn btn-secondary w-full justify-center"
        >
          <FileSpreadsheet size={18} />
          Import Excel
        </button>
        <button onClick={() => setShowBulkExport(true)} className="btn btn-secondary w-full justify-center">
          <Download size={18} />
          Export Staff Report
        </button>
        <Link to="/staff/create" className="btn btn-primary w-full justify-center">
          <Plus size={18} />
          Add Employee
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard title="Total Staff" value={stats.total} icon={Users} colorClass="bg-[#ede9fe] text-[#7c3aed]" subtext={`${stats.active} Active`} />
        <StatCard title="Active" value={stats.active} icon={UserCheck} colorClass="bg-[#ecfdf5] text-[#059669]" />
        <StatCard title="On Leave" value={stats.onLeave} icon={UserPlus} colorClass="bg-[#fffbeb] text-[#d97706]" />
        <StatCard title="Inactive" value={stats.inactive} icon={UserMinus} colorClass="bg-[#fef2f2] text-[#dc2626]" />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] overflow-hidden">
        
        {/* Search & Filters */}
        <div className="p-6 border-b border-[#f1f5f9] bg-[#fafbff]/50">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#7c3aed] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name, email, role or ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[500] placeholder:text-[#94a3b8] transition-all"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[420px]">
              {/* Role */}
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
              >
                <option value="">All Roles</option>
                {allRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            </div>
          </div>

        <div className="relative">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
               <Loader size={40} />
             </div>
          ) : staffList.length === 0 ? (
            <div className="py-24">
               <EmptyState
                title="No Records Found"
                description="Try adjusting your search or filters to find what you're looking for."
                icon={<Users className="text-[#e2e8f0] mb-4" size={64} />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <TableContainer>
                <Table className="w-full min-w-[1000px]">
                  <Thead className="!bg-[#fafbff] border-b border-[#f1f5f9]">
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] pl-8">Employee</Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">Role</Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">Contact Details</Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Join Date</Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Beacon</Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Status</Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center pr-8">Actions</Th>
                  </Thead>
                  <Tbody>
                    {staffList.map((row) => (
                      <Tr key={row.id} className="hover:bg-[#fdfbff] transition-colors group relative border-b border-[#f8fafc] last:border-0">
                        <Td className="py-5 pl-8">
                          <div className="flex items-center gap-4">
                            {renderAvatar(row)}
                            <div>
                              <p className="text-[13.5px] font-[900] text-[#1e293b] leading-tight mb-1">{row.first_name} {row.last_name}</p>
                              <div className="inline-flex items-center px-2 py-0.5 bg-[#f1f5f9] rounded-[6px] text-[10px] font-[800] text-[#64748b]">
                                ID: {row.employee_id}
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td className="py-5">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-[800] text-[#475569]">{row.designation || 'Staff'}</span>
                          </div>
                        </Td>
                        <Td className="py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[12px] font-[700] text-[#64748b]">
                              <Mail size={13} className="text-[#cbd5e1]" />
                              {row.email}
                            </div>
                            <div className="flex items-center gap-2 text-[12px] font-[700] text-[#64748b]">
                              <Phone size={13} className="text-[#cbd5e1]" />
                              {row.phone}
                            </div>
                          </div>
                        </Td>
                        <Td className="py-5 text-center font-[700] text-[#475569] text-[12.5px]">
                          {row.joining_date ? new Date(row.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </Td>
                        <Td className="py-5 text-center">
                          {row.beacon_id ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-[#f5f3ff] text-[#7c3aed] text-[11px] font-[800] rounded-md border border-[#ddd6fe] uppercase">
                              {row.beacon_id}
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] text-[12px]">None</span>
                          )}
                        </Td>
                        <Td className="py-5 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider border shadow-xs ${
                            row.status?.toLowerCase() === 'active' ? 'bg-[#ecfdf5] text-[#059669] border-[#d1fae5]' :
                            ['leave', 'on leave', 'onleave'].includes(row.status?.toLowerCase() || "") ? 'bg-[#fffbeb] text-[#d97706] border-[#fef3c7]' :
                            'bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]'
                          }`}>
                            {row.status || 'Active'}
                          </span>
                        </Td>
                        <Td className="py-5 text-center pr-8">
                          <div className="flex items-center justify-center gap-1.5">
                             <Link to={`/staff/show/${row.id}`} className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] rounded-[8px] transition-all" title="View Profile">
                               <Eye size={17} />
                             </Link>
                             <button
                               onClick={async () => {
                                 if(await confirm("Modify this employee record?")) {
                                   navigate(`/staff/edit/${row.id}`);
                                 }
                               }}
                               className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#f5f3ff] rounded-[8px] transition-all"
                               title="Edit Record"
                             >
                               <Edit size={16} />
                             </button>
                             <button onClick={() => setIndividualExport(row)} className="p-2 text-[#64748b] hover:text-[#059669] hover:bg-[#ebfef5] rounded-[8px] transition-all" title="Preview Report">
                               <FileText size={16} />
                             </button>
                             <button onClick={() => handleDelete(row)} className="p-2 text-[#64748b] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-[8px] transition-all" title="Delete">
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
              <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  itemName="employees"
                  perPage={perPage}
                />
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleBulkImport} />

      <AnimatePresence>
        {showBulkExport && (
          <ExportOverlay 
            onClose={() => setShowBulkExport(false)} 
            buildPdf={buildBulkPdf}
            title="Export Employees Registry"
            defaultTitle="Staff Management Audit"
            defaultSubtitle={`Full Directory · ${totalItems} Personnel`}
            fileName="employee-registry.pdf"
          />
        )}
        {individualExport && (
          <ExportOverlay 
            onClose={() => setIndividualExport(null)} 
            buildPdf={buildIndividualPdf(individualExport)}
            title={`Export Employee Profile`}
            defaultTitle={`${individualExport.first_name} ${individualExport.last_name}`}
            defaultSubtitle={`Staff Registry · ID: ${individualExport.employee_id}`}
            fileName={`employee-${individualExport.employee_id}.pdf`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffIndexPage;