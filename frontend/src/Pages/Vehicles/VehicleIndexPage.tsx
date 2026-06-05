// src/Pages/Vehicles/VehicleIndexPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Icons
import {
  Search,
  Truck,
  Zap,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Edit,
  Eye,
  Trash2,
  X,
  Plus,
  Bus,
  Car,
  Fuel,
  Download,
  FileText
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
import tenantApi from "../../Services/ApiService";
import type { Vehicle } from "./Vehicle.types";
import type { PaginatedResponse } from "../../Types/Index";
import { useAlert } from "../../Context/AlertContext";
import { useConfirm } from "../../Context/ConfirmContext";
import ExportOverlay from "../../Components/UI/ExportOverlay";
import { formatDateTime } from "../../Utils/Toolkit";

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

const VehicleIndexPage = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const confirm = useConfirm();

  // Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    inactive: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 15;

  const [showBulkExport, setShowBulkExport] = useState(false);
  const [individualExport, setIndividualExport] = useState<Vehicle | null>(null);

  // 1. Fetch Data
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        per_page: perPage,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      };

      const response = await tenantApi.get<PaginatedResponse<Vehicle>>(
        "/vehicles",
        { params }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data.data || [];
        setVehicles(data);
        setTotalPages(response.data.data.last_page);
        setTotalItems(response.data.data.total);

        // Stats Logic (Dynamic based on current response as simple summary)
        setStats({
          total: response.data.data.total,
          active: data.filter((v) => v.status?.toLowerCase() === "active").length,
          maintenance: data.filter((v) => v.status?.toLowerCase() === "maintenance").length,
          inactive: data.filter((v) => v.status?.toLowerCase() === "inactive").length,
        });
      }
    } catch (err) {
      console.error("Error fetching vehicles, using mock data", err);
      // showAlert("Failed to load vehicle data.", "error"); // Disable alert for mock mode
      const mockVehicles: Vehicle[] = [
        { id: 1, vehicle_name: "School Bus A", vehicle_number: "KA-01-MV-1234", make: "Tata", model: "Starbus", vehicle_type: "Bus", status: "Active", capacity: 40, fuel_type: "Diesel", gps_device_id: "GPS-101", battery: 85, speed: 0 } as any,
        { id: 2, vehicle_name: "Staff Van 1", vehicle_number: "KA-01-MV-5678", make: "Force", model: "Traveller", vehicle_type: "Van", status: "Active", capacity: 12, fuel_type: "Diesel", gps_device_id: "GPS-102", battery: 92, speed: 45 } as any,
        { id: 3, vehicle_name: "Principal's Car", vehicle_number: "KA-01-MV-9012", make: "Toyota", model: "Innova", vehicle_type: "Car", status: "Maintenance", capacity: 7, fuel_type: "Petrol", gps_device_id: "GPS-103", battery: 78, speed: 0 } as any,
      ];
      setVehicles(mockVehicles);
      setTotalPages(1);
      setTotalItems(3);
      setStats({
        total: 10,
        active: 7,
        maintenance: 2,
        inactive: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, typeFilter, showAlert]);

  useEffect(() => {
    const timer = setTimeout(fetchVehicles, 300);
    return () => clearTimeout(timer);
  }, [fetchVehicles]);

  // 2. Handlers
  // const handleClearFilters = () => {
  //   setSearchQuery("");
  //   setStatusFilter("");
  //   setTypeFilter("");
  //   setCurrentPage(1);
  // };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!(await confirm(`Are you sure you want to PERMANENTLY DECOMMISSION vehicle ${vehicle.vehicle_number}? All associated telemetry and permit history will be archived.`))) return;
    try {
      const response = await tenantApi.delete(`/vehicles/${vehicle.id}`);
      if (response.data.success) {
        setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
        showAlert("Vehicle decommissioned successfully.", "success");
      }
    } catch (err) {
      showAlert("Failed to delete vehicle.", "error");
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
    doc.text(opts.companyName || "Vehicle Fleet Registry", opts.logo ? 45 : 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 255);
    doc.text(opts.subtitle || `Asset Inventory Report · ${new Date().toLocaleDateString()}`, opts.logo ? 45 : 14, 26);

    autoTable(doc, {
      startY: 45,
      head: [["Name", "Number", "Make", "Model", "Type", "Status"]],
      body: vehicles.map(v => [
        v.vehicle_name || "",
        v.vehicle_number || "",
        v.make || "",
        v.model || "",
        v.vehicle_type || "",
        v.status || ""
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] }
    });

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Confidential Fleet Inventory Record", 14, ph - 10);
    return doc;
  }, [vehicles]);

  const buildIndividualPdf = useCallback((v: Vehicle) => (opts: any) => {
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
    doc.text(opts.companyName || `Asset: ${v.vehicle_number}`, x, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(220, 210, 255);
    doc.text(opts.subtitle || `${v.make} ${v.model} · ${v.vehicle_type}`, x, 32);

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

    field("Vehicle Name:", v.vehicle_name);
    field("Registration #:", v.vehicle_number);
    field("Make / Manufacturer:", v.make);
    field("Model Designation:", v.model);
    field("Asset Category:", v.vehicle_type);
    field("Seating Capacity:", v.seating_capacity);
    field("Current Condition:", (v.status || "").toUpperCase());

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(opts.footerText || "Fleet Management Technical Specification", 20, ph - 15);
    return doc;
  }, []);

  const getVehicleIcon = (type: string | null | undefined) => {
    const t = (type || "").toLowerCase();
    if (t.includes("bus")) return <Bus size={20} />;
    if (t.includes("van")) return <Truck size={20} />;
    return <Car size={20} />;
  };

  // const hasActiveFilters = searchQuery || statusFilter || typeFilter;

  return (
    <div className="min-h-screen font-[var(--font-manrope)]">
      {/* Header Section */}
      <div className="mb-2">
        <PageHeader
          title="Fleet Vehicles"
          icon={<Bus size={18} />}
          breadcrumb="Admin / Fleet Vehicles"
          buttonText="Add Vehicle"
          buttonLink="/vehicles/create"
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
          Export Fleet PDF
        </button>
        <Link to="/vehicles/create" className="btn btn-primary w-full justify-center">
          <Plus size={18} />
          Add New Vehicle
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          title="Total Fleet"
          value={stats.total}
          icon={Truck}
          colorClass="bg-[#ede9fe] text-[#7c3aed]"
          delay={0}
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={ShieldCheck}
          colorClass="bg-[#ecfdf5] text-[#059669]"
          delay={0.05}
        />
        <StatCard
          title="Maintenance"
          value={stats.maintenance}
          icon={AlertCircle}
          colorClass="bg-[#fffbeb] text-[#d97706]"
          delay={0.1}
        />
        <StatCard
          title="Out of Service"
          value={stats.inactive}
          icon={X}
          colorClass="bg-[#fef2f2] text-[#dc2626]"
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
                placeholder="Search by license plate, model, registration or VIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[500] placeholder:text-[#94a3b8] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[420px]">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
              >
                <option value="">All Types</option>
                <option value="Bus">Bus</option>
                <option value="Van">Van</option>
                <option value="Car">Car</option>
                <option value="Mini Bus">Mini Bus</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
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
                Fetching Fleet Records...
              </p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="py-24">
              <EmptyState
                title="No Vehicles Found"
                description="Your fleet registry is empty or no matches were found for your search."
              />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <TableContainer>
                <Table className="w-full min-w-[1000px]">
                  <Thead className="!bg-[#fafbff] border-b border-[#f1f5f9]">
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] pl-8">
                      Vehicle & Model
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">
                      Vehicle Number
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">
                      Capacity & Fuel
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">
                      GPS ID
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">
                      Telemetry
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">
                      Status
                    </Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center pr-8">
                      Actions
                    </Th>
                  </Thead>
                  <Tbody>
                    {vehicles.map((row) => (
                      <Tr
                        key={row.id}
                        className="hover:bg-[#fdfbff] transition-colors group relative border-b border-[#f8fafc] last:border-0"
                      >
                        <Td className="py-5 pl-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-[#7c3aed]">
                              {getVehicleIcon(row.vehicle_type)}
                            </div>
                            <div>
                              <p className="text-[13.5px] font-[900] text-[#1e293b] leading-tight mb-1">
                                {row.vehicle_name}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-[700] text-[#94a3b8] uppercase">
                                  {row.make} {row.model}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Td>

                        <Td className="py-5">
                          <div className="inline-flex items-center px-3 py-1 bg-[#f1f5f9] rounded-[8px] text-[12.5px] font-[900] text-[#1e293b] border border-[#e2e8f0] tracking-wider uppercase">
                            {row.vehicle_number}
                          </div>
                        </Td>

                        <Td className="py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[12px] font-[700] text-[#64748b]">
                              <Plus size={13} className="text-[#cbd5e1]" />
                              {row.capacity || row.seating_capacity || "—"} Seats
                            </div>
                            <div className="flex items-center gap-2 text-[12px] font-[700] text-[#64748b]">
                              <Fuel size={13} className="text-[#cbd5e1]" />
                              {row.fuel_type || "—"}
                            </div>
                          </div>
                        </Td>
                        <Td className="py-5 text-center">
                          {row.gps_device_id ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-[#fff1f2] text-[#e11d48] text-[11px] font-[800] rounded-md border border-[#fecdd3] uppercase">
                              {row.gps_device_id}
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] text-[12px]">None</span>
                          )}
                        </Td>
                        <Td className="py-5 text-center">
                          <div className="flex flex-col gap-1.5 items-center">
                            <div className="flex items-center gap-3">
                              {row.battery !== undefined && (
                                <div className="flex items-center gap-1 text-[11px] font-[800] text-[#64748b]">
                                  <Zap size={11} className="text-[#f59e0b]" />
                                  {row.battery}%
                                </div>
                              )}
                              {row.speed !== undefined && (
                                <div className="font-[900] text-[13px] text-[#1e293b]">
                                  {row.speed} <span className="text-[10px] font-[700] text-[#94a3b8]">km/h</span>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] font-[700] text-[#94a3b8] uppercase">
                              {formatDateTime(row.lastGpsUpdate || null)}
                            </span>
                          </div>
                        </Td>

                        <Td className="py-5 text-center">
                          <span
                            className={`px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider border shadow-xs ${
                              row.status?.toLowerCase() === "active"
                                ? "bg-[#ecfdf5] text-[#059669] border-[#d1fae5]"
                                : row.status?.toLowerCase() === "maintenance"
                                ? "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]"
                                : "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]"
                            }`}
                          >
                            {row.status || "active"}
                          </span>
                        </Td>

                        <Td className="py-5 text-center pr-8">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              to={`/vehicles/track/${row.vehicle_number}`}
                              className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] rounded-[8px] transition-all"
                              title="Track Live"
                            >
                              <MapPin size={17} />
                            </Link>
                            <Link
                              to={`/vehicles/show/${row.id}`}
                              className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] rounded-[8px] transition-all"
                              title="View Specs"
                            >
                              <Eye size={17} />
                            </Link>
                            <button
                              onClick={async () => {
                                if(await confirm("Modify this vehicle record?")) {
                                  navigate(`/vehicles/edit/${row.id}`);
                                }
                              }}
                              className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#f5f3ff] rounded-[8px] transition-all"
                              title="Edit Details"
                            >
                              <Edit size={16} />
                            </button>
                            <button onClick={() => setIndividualExport(row)} className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] rounded-[8px] transition-all" title="Preview Report">
                               <FileText size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="p-2 text-[#64748b] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-[8px] transition-all"
                              title="Delete Vehicle"
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
                itemName="vehicles"
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
            title="Export Vehicle Fleet Registry"
            defaultTitle="Fleet Inventory Summary"
            defaultSubtitle={`Asset Log · ${totalItems} Registered Vehicles`}
            fileName="fleet-report.pdf"
          />
        )}
        {individualExport && (
          <ExportOverlay 
            onClose={() => setIndividualExport(null)} 
            buildPdf={buildIndividualPdf(individualExport)}
            title={`Export Asset Specification Report`}
            defaultTitle={`Vehicle: ${individualExport.vehicle_number}`}
            defaultSubtitle={`Technical Profile · ${individualExport.vehicle_name}`}
            fileName={`vehicle-${individualExport.vehicle_number}.pdf`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VehicleIndexPage;
