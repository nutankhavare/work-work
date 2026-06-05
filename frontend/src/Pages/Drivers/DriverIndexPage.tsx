// src/Pages/Drivers/DriverIndexPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Icons
import {
  Search,
  Users,
  UserCheck,
  UserMinus,
  Truck,
  Edit,
  Eye,
  Phone,
  Mail,
  MapPin,
  // X,
  Trash2,
  Download,
  // FileSpreadsheet,
  FileText,
  Plus,
  IdCard
} from "lucide-react";

// Components
import PageHeader from "../../Components/UI/PageHeader";
import EmptyState from "../../Components/UI/EmptyState";
import { Pagination } from "../../Components/Table/Pagination";
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "../../Components/Table/Table";
import { Loader } from "../../Components/UI/Loader";
import tenantApi, { tenantAsset } from "../../Services/ApiService";
import { DUMMY_USER_IMAGE } from "../../Utils/Toolkit";
import type { Driver } from "./Driver.types";
import type { PaginatedResponse } from "../../Types/Index";
import { useAlert } from "../../Context/AlertContext";
import { useConfirm } from "../../Context/ConfirmContext";
import ExportOverlay from "../../Components/UI/ExportOverlay";

/* ── STAT CARD COMPONENT ── */
const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  delay = 0,
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white rounded-[14px] p-6 border border-[#e8edf5] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(124,58,237,0.08)] transition-all group"
  >
    <div className="flex items-center gap-4">
      <div
        className={`p-4 rounded-[12px] ${colorClass} transition-transform group-hover:scale-110`}
      >
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[11px] font-[800] text-[#94a3b8] uppercase tracking-wider mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-[900] text-[#1e293b]">{value}</h4>
          {subtext && (
            <span className="text-[11px] font-[700] text-[#059669]">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

const DriverIndexPage = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const confirm = useConfirm();

  // Data State
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [displayDrivers, setDisplayDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    experienced: 0,
  });

  // Filter Options
  const [cities, setCities] = useState<string[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);

  // Filter Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedEmployment, setSelectedEmployment] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(15);

  const [showBulkExport, setShowBulkExport] = useState(false);
  const [individualExport, setIndividualExport] = useState<Driver | null>(null);

  // 1. Fetch Data
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tenantApi.get<PaginatedResponse<Driver>>(
        "/drivers",
        { params: { page: currentPage, per_page: perPage } }
      );

      if (response.data.success && response.data.data) {
        const drivers = response.data.data.data || [];
        setAllDrivers(drivers);
        setDisplayDrivers(drivers);

        // Extract unique filter options
        setCities(
          Array.from(
            new Set(drivers.map((d) => d.city).filter(Boolean))
          ) as string[]
        );
        setEmploymentTypes(
          Array.from(
            new Set(drivers.map((d) => d.employment_type).filter(Boolean))
          ) as string[]
        );

        // Stats
        setStats({
          total: response.data.data.total || drivers.length,
          active: drivers.filter(
            (d) => d.status?.toLowerCase() === "active"
          ).length,
          inactive: drivers.filter(
            (d) => d.status?.toLowerCase() === "inactive"
          ).length,
          experienced: drivers.filter(
            (d) => (d.driving_experience || 0) >= 3
          ).length,
        });

        setTotalPages(response.data.data.last_page);
        setTotalItems(response.data.data.total);
      }
    } catch (err) {
      console.error("Error fetching drivers, using mock data", err);
      // showAlert("Failed to load driver data.", "error"); // Disable alert for mock mode
      const mockDrivers: Driver[] = [
        { id: 1, first_name: "Rahul", last_name: "Sharma", employee_id: "DRV001", mobile_number: "+91 9876543210", email: "rahul@example.com", city: "Mumbai", status: "Active", driving_experience: 5, employment_type: "Full-time" } as any,
        { id: 2, first_name: "Amit", last_name: "Patel", employee_id: "DRV002", mobile_number: "+91 8765432109", email: "amit@example.com", city: "Ahmedabad", status: "Active", driving_experience: 3, employment_type: "Contract" } as any,
        { id: 3, first_name: "Suresh", last_name: "Kumar", employee_id: "DRV003", mobile_number: "+91 7654321098", email: "suresh@example.com", city: "Delhi", status: "Inactive", driving_experience: 8, employment_type: "Full-time" } as any,
      ];
      setAllDrivers(mockDrivers);
      setDisplayDrivers(mockDrivers);
      setStats({
        total: 15,
        active: 12,
        inactive: 3,
        experienced: 8,
      });
      setTotalPages(1);
      setTotalItems(15);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, showAlert]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // 2. Filter Logic (client-side)
  useEffect(() => {
    let result = allDrivers;
    if (selectedCity) result = result.filter((d) => d.city === selectedCity);
    if (selectedStatus)
      result = result.filter((d) => d.status === selectedStatus);
    if (selectedEmployment)
      result = result.filter((d) => d.employment_type === selectedEmployment);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
          (d.email ?? "").toLowerCase().includes(q) ||
          (d.mobile_number ?? "").includes(q) ||
          (d.employee_id ?? "").toLowerCase().includes(q)
      );
    }
    setDisplayDrivers(result);
  }, [searchQuery, selectedCity, selectedStatus, selectedEmployment, allDrivers]);

  // 3. Handlers
  // const handleClearFilters = () => {
  //   setSearchQuery("");
  //   setSelectedCity("");
  //   setSelectedStatus("");
  //   setSelectedEmployment("");
  // };

  const handleDelete = async (driver: Driver) => {
    if (!(await confirm(`Are you sure you want to PERMANENTLY DELETE driver ${driver.first_name} ${driver.last_name}? This action cannot be undone.`)))
      return;
    try {
      const response = await tenantApi.delete(`/drivers/${driver.id}`);
      if (response.data.success) {
        setAllDrivers((prev) => prev.filter((d) => d.id !== driver.id));
        setDisplayDrivers((prev) => prev.filter((d) => d.id !== driver.id));
        showAlert("Driver record purged successfully.", "success");
      }
    } catch (err) {
      console.error("Delete failed", err);
      showAlert("Failed to delete driver.", "error");
    }
  };

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
    doc.text(opts.companyName || "Driver Fleet Report", opts.logo ? 45 : 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 255);
    doc.text(opts.subtitle || `Fleet Personnel Intelligence · ${new Date().toLocaleDateString()}`, opts.logo ? 45 : 14, 26);

    autoTable(doc, {
      startY: 45,
      head: [["ID", "Name", "Email", "Phone", "City", "Status"]],
      body: displayDrivers.map(d => [
        d.employee_id || "",
        `${d.first_name} ${d.last_name}`,
        d.email || "",
        d.mobile_number || "",
        d.city || "",
        d.status || ""
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] }
    });

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Sensitive Fleet Data — Institutional Use Only", 14, ph - 10);
    return doc;
  }, [displayDrivers]);

  const buildIndividualPdf = useCallback((d: Driver) => (opts: any) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pw, 45, "F");

    if (opts.logo) {
      try { doc.addImage(opts.logo, "PNG", 14, 10, 25, 25); } catch(e){}
    }
    
    const x = opts.logo ? 45 : 20;
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.text(opts.companyName || `${d.first_name} ${d.last_name}`, x, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(220, 210, 255);
    doc.text(opts.subtitle || `Driving Professional · ID: ${d.employee_id}`, x, 32);

    let y = 60;
    const field = (label: string, value: any) => {
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(label, 20, y);
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(String(value || "—"), 75, y);
      y += 10;
    };

    field("Full Name:", `${d.first_name} ${d.last_name}`);
    field("Professional ID:", d.employee_id);
    field("Primary Contact:", d.mobile_number);
    field("Email Identity:", d.email);
    field("Locality:", d.city);
    field("Employment Type:", d.employment_type);
    field("Current Status:", (d.status || "").toUpperCase());

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Professional Credential Record", 20, ph - 15);
    return doc;
  }, []);

  const renderAvatar = (driver: Driver) => {
    const imgSrc = driver.profile_photo
      ? `${tenantAsset}${driver.profile_photo}`
      : DUMMY_USER_IMAGE;
    return (
      <img
        src={imgSrc}
        alt={driver.first_name}
        className="h-10 w-10 rounded-full object-cover border border-[#f1f5f9] shadow-sm bg-[#ede9fe]"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=ede9fe&color=7c3aed&bold=true&font-size=0.45`;
        }}
      />
    );
  };

  // const hasActiveFilters =
  //   searchQuery || selectedCity || selectedStatus || selectedEmployment;

  return (
    <div className="min-h-screen font-[var(--font-manrope)]">
      {/* Header Section */}
      <div className="mb-2">
        <PageHeader 
          title="Fleet Drivers" 
          icon={<IdCard size={18} />}
          breadcrumb="Admin / Fleet Drivers"
          buttonText="Add Driver" 
          buttonLink="/drivers/create" 
        >
             <button onClick={() => setShowBulkExport(true)} className="w-full md:w-auto flex justify-center items-center gap-2 px-5 py-[11px] bg-white text-[#475569] border border-[#e2e8f0] rounded-[10px] text-[12.5px] font-[800] shadow-sm hover:bg-[#f8fafc] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all duration-200">
                <Download size={16} />
                Export PDF
             </button>
        </PageHeader>
      </div>

      {/* Mobile Actions Stack */}
      <div className="lg:hidden flex flex-col gap-3 mb-6 px-4">
        <button onClick={() => setShowBulkExport(true)} className="btn btn-secondary w-full justify-center">
          <Download size={18} />
          Export Drivers PDF
        </button>
        <Link to="/drivers/create" className="btn btn-primary w-full justify-center">
          <Plus size={18} />
          Add New Driver
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          title="Total Drivers"
          value={stats.total}
          icon={Users}
          colorClass="bg-[#ede9fe] text-[#7c3aed]"
          subtext={`${stats.active} Active`}
          delay={0}
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={UserCheck}
          colorClass="bg-[#ecfdf5] text-[#059669]"
          delay={0.05}
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={UserMinus}
          colorClass="bg-[#fef2f2] text-[#dc2626]"
          delay={0.1}
        />
        <StatCard
          title="Experienced (3yr+)"
          value={stats.experienced}
          icon={Truck}
          colorClass="bg-[#fffbeb] text-[#d97706]"
          delay={0.15}
        />
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
                placeholder="Search by name, phone, email or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[500] placeholder:text-[#94a3b8] transition-all"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-[560px]">
              {/* City */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Employment */}
              <select
                value={selectedEmployment}
                onChange={(e) => setSelectedEmployment(e.target.value)}
                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
              >
                <option value="">Employment Type</option>
                {employmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            </div>
          </div>

        {/* Table Content */}
        <div className="relative">
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <Loader />
              <p className="text-[14px] font-[700] text-[#94a3b8]">
                Loading Driver Records...
              </p>
            </div>
          ) : displayDrivers.length === 0 ? (
            <div className="py-24">
              <EmptyState
                title="No Drivers Found"
                description="Try adjusting your search or filters to find what you're looking for."
                icon={<Truck className="text-[#e2e8f0] mb-4" size={64} />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <TableContainer>
                <Table className="w-full min-w-[900px]">
                  <Thead className="!bg-[#fafbff] border-b border-[#f1f5f9]">
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] pl-8">
                      Driver Profile
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">
                      Contact Details
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">
                      Location
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">
                      Experience
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">
                      Beacon
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">
                      Status
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center pr-8">
                      Actions
                    </Th>
                  </Thead>
                  <Tbody>
                    {displayDrivers.map((row) => (
                      <Tr
                        key={row.id}
                        className="hover:bg-[#fdfbff] transition-colors border-b border-[#f8fafc] last:border-0"
                      >
                        {/* Driver Profile */}
                        <Td className="py-5 pl-8">
                          <div className="flex items-center gap-4">
                            {renderAvatar(row)}
                            <div>
                              <p className="text-[13.5px] font-[900] text-[#1e293b] leading-tight mb-1">
                                {row.first_name} {row.last_name}
                              </p>
                              <div className="flex items-center gap-2">
                                {row.employee_id && (
                                  <div className="inline-flex items-center px-2 py-0.5 bg-[#f1f5f9] rounded-[6px] text-[10px] font-[800] text-[#64748b]">
                                    ID: {row.employee_id}
                                  </div>
                                )}
                                {row.employment_type && (
                                  <div className="inline-flex items-center px-2 py-0.5 bg-[#eff6ff] rounded-[6px] text-[10px] font-[800] text-[#3b82f6]">
                                    {row.employment_type}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Td>

                        {/* Contact */}
                        <Td className="py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[12px] font-[700] text-[#64748b]">
                              <Phone size={13} className="text-[#cbd5e1]" />
                              {row.mobile_number}
                            </div>
                            {row.email && (
                              <div className="flex items-center gap-2 text-[12px] font-[700] text-[#64748b]">
                                <Mail size={13} className="text-[#cbd5e1]" />
                                {row.email}
                              </div>
                            )}
                          </div>
                        </Td>

                        {/* Location */}
                        <Td className="py-5">
                          <div className="flex items-start gap-1.5">
                            <MapPin
                              size={13}
                              className="text-[#cbd5e1] mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-[13px] font-[800] text-[#475569] uppercase">
                                {row.city || "—"}
                              </p>
                              {row.state && (
                                <p className="text-[11px] font-[600] text-[#94a3b8]">
                                  {row.state}
                                </p>
                              )}
                            </div>
                          </div>
                        </Td>

                        {/* Experience */}
                        <Td className="py-5 text-center">
                          {row.driving_experience ? (
                            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px]">
                              <span className="text-[13px] font-[900] text-[#475569]">
                                {row.driving_experience}
                              </span>
                              <span className="text-[10px] font-[700] text-[#94a3b8]">
                                yrs
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#cbd5e1] font-[700]">—</span>
                          )}
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

                        {/* Status */}
                        <Td className="py-5 text-center">
                          <span
                            className={`px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider border ${
                              row.status?.toLowerCase() === "active"
                                ? "bg-[#ecfdf5] text-[#059669] border-[#d1fae5]"
                                : "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]"
                            }`}
                          >
                            {row.status || "Active"}
                          </span>
                        </Td>

                        {/* Actions */}
                        <Td className="py-5 text-center pr-8">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              to={`/drivers/show/${row.id}`}
                              className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#f5f3ff] rounded-[8px] transition-all"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={async () => {
                                if(await confirm("Modify this driver record?")) {
                                  navigate(`/drivers/edit/${row.id}`);
                                }
                              }}
                              className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#f5f3ff] rounded-[8px] transition-all"
                              title="Edit Driver"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setIndividualExport(row)}
                              className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#f5f3ff] rounded-[8px] transition-all"
                              title="Preview Report"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="p-2 text-[#64748b] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-[8px] transition-all"
                              title="Delete Driver"
                            >
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
                  itemName="Drivers"
                  perPage={perPage}
                />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showBulkExport && (
          <ExportOverlay 
            onClose={() => setShowBulkExport(false)} 
            buildPdf={buildBulkPdf}
            title="Export Driver Fleet Registry"
            defaultTitle="Driver Operations Summary"
            defaultSubtitle={`Institutional Fleet Log · ${totalItems} Active Drivers`}
            fileName="driver-report.pdf"
          />
        )}
        {individualExport && (
          <ExportOverlay 
            onClose={() => setIndividualExport(null)} 
            buildPdf={buildIndividualPdf(individualExport)}
            title={`Export Driver Personnel Profile`}
            defaultTitle={`${individualExport.first_name} ${individualExport.last_name}`}
            defaultSubtitle={`Personnel Identity · ID: ${individualExport.employee_id}`}
            fileName={`driver-${individualExport.employee_id}.pdf`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverIndexPage;