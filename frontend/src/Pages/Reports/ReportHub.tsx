import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Download,
  Users,
  Bus,
  Activity,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Battery,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import tenantApi from "../../Services/ApiService";
import PageHeader from "../../Components/UI/PageHeader";
import { Button } from "../../Components/UI";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ──────────────────────────────────────────────
   ANIMATION VARIANTS
   ─────────────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

/* ──────────────────────────────────────────────
   TIER DATA
   ─────────────────────────────────────────────── */
const tiers = [
  {
    id: "basic",
    route: "/reports/basic",
    label: "Basic Report",
    subtitle: "Staff & Fleet Demographics",
    Icon: BarChart2,
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    glowColor: "rgba(37, 99, 235, 0.15)",
    bgLight: "#EFF6FF",
    accentColor: "#2563EB",
    badgeText: "Staffing · Fleet Metrics",
    description:
      "A clean view of employee age demographics, department breakdowns, and fleet type distributions.",
    features: [
      "Employee Age Demographics",
      "Department Distribution",
      "Fleet Type & Fuel Profiles",
      "Export Excel Snapshot",
    ],
    pages: "Basic View",
  },
  {
    id: "advanced",
    route: "/reports/advanced",
    label: "Advanced Report",
    subtitle: "Hardware & Allocation Metrics",
    Icon: TrendingUp,
    gradient: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
    glowColor: "rgba(124, 58, 237, 0.15)",
    bgLight: "#F5F3FF",
    accentColor: "#7C3AED",
    badgeText: "Hardware · Drivers",
    description:
      "Driver assignments, active GPS devices utilization, and live fleet status tracking ratios.",
    features: [
      "Driver Assignment Details",
      "GPS Hardware Tracking Rate",
      "Device Allocation Summaries",
      "Export Device List",
    ],
    pages: "Advanced View",
    recommended: true,
  },
  {
    id: "compliance",
    route: "/reports/compliance",
    label: "Compliance Report",
    subtitle: "Regulatory Expiries & Audits",
    Icon: ShieldCheck,
    gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    glowColor: "rgba(5, 150, 105, 0.15)",
    bgLight: "#ECFDF5",
    accentColor: "#059669",
    badgeText: "Expiries · Compliance",
    description:
      "Full audit-ready sheet for vehicle insurance, fitness certificates, and RTO permits status.",
    features: [
      "Insurance Expiry Warnings",
      "Fitness Certificate Audit",
      "RTO Permits Summary",
      "Export PDF Compliance Doc",
    ],
    pages: "Compliance View",
  },
];

interface ReportHubProps {
  view?: "basic" | "advanced" | "compliance";
}

export const ReportHub = ({ view }: ReportHubProps) => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [gpsDevices, setGpsDevices] = useState<any[]>([]);
  const [, setBeacons] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [complianceLogs, setComplianceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Basic View Search/Filters
  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [empPage, setEmpPage] = useState(1);

  // Advanced View Search/Filters
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("all");

  // Compliance View State
  const [complianceTab, setComplianceTab] = useState<"docs" | "audits">("docs");
  const [modalOpen, setModalOpen] = useState(false);

  // Compliance Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Safety Audit");
  const [formRegNum, setFormRegNum] = useState("");
  const [formSubLaw, setFormSubLaw] = useState("");
  const [formAuthority, setFormAuthority] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formStatus, setFormStatus] = useState("Compliant");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [empRes, vehRes, drvRes, devRes, compRes] = await Promise.all([
        tenantApi.get("/employees", { params: { per_page: 1000 } }),
        tenantApi.get("/vehicles", { params: { per_page: 1000 } }),
        tenantApi.get("/drivers", { params: { per_page: 1000 } }),
        tenantApi.get("/devices"),
        tenantApi.get("/compliance", { params: { per_page: 100 } }),
      ]);

      setEmployees(empRes.data?.data?.data || []);
      setVehicles(vehRes.data?.data?.data || []);
      setDrivers(drvRes.data?.data?.data || []);

      const gps = devRes.data?.data?.gpsDevices || [];
      const bcs = devRes.data?.data?.beacons || [];
      setGpsDevices(gps);
      setBeacons(bcs);
      setDevices([...gps, ...bcs]);

      setComplianceLogs(compRes.data?.data?.data || compRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  useEffect(() => {
    setEmpPage(1);
  }, [empSearch, deptFilter]);

  // Helper: Calculate age from date_of_birth
  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Group employee ages
  const getAgeDemographics = () => {
    const buckets = { under25: 0, range25_35: 0, range36_45: 0, range46_55: 0, over55: 0 };
    employees.forEach((emp) => {
      const age = calculateAge(emp.date_of_birth);
      if (age === null) return;
      if (age < 25) buckets.under25++;
      else if (age <= 35) buckets.range25_35++;
      else if (age <= 45) buckets.range36_45++;
      else if (age <= 55) buckets.range46_55++;
      else buckets.over55++;
    });
    return buckets;
  };

  const getDepartmentStats = () => {
    const stats: Record<string, number> = {};
    employees.forEach((emp) => {
      const dept = emp.department || "General";
      stats[dept] = (stats[dept] || 0) + 1;
    });
    return stats;
  };

  const getFuelTypeStats = () => {
    const stats: Record<string, number> = {};
    vehicles.forEach((veh) => {
      const fuel = veh.fuel_type || "Diesel";
      stats[fuel] = (stats[fuel] || 0) + 1;
    });
    return stats;
  };

  // EXCEL EXPORTS
  const exportBasicToExcel = () => {
    const data = employees.map((emp) => {
      const age = calculateAge(emp.date_of_birth);
      return {
        "Employee ID": emp.employee_id || emp.id,
        "First Name": emp.first_name,
        "Last Name": emp.last_name,
        Email: emp.email || "—",
        Mobile: emp.mobile_number || "—",
        Age: age || "—",
        Gender: emp.gender || "—",
        Department: emp.department || "—",
        Designation: emp.designation || "—",
        Status: emp.status || "—",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "Staff_Directory_Report.xlsx");
  };

  const exportAdvancedToExcel = () => {
    const data = devices.map((d) => ({
      "Device ID": d.device_id,
      "Device Type": d.device_type || (d.sim_number ? "GPS" : "Beacon"),
      "Sequence/Sim ID": d.sequence_id || d.sim_number || "—",
      "Assigned Target": d.assigned_to_name || d.assigned_to || "Unassigned",
      "Assignment Type": d.assigned_type || "—",
      "Battery Level": d.battery_level !== undefined ? `${d.battery_level}%` : "—",
      "Device Health": d.device_health || "—",
      "Connection Status": d.status || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Devices Audit");
    XLSX.writeFile(workbook, "Hardware_Allocation_Report.xlsx");
  };

  // PDF COMPLIANCE EXPORTS
  const exportComplianceToPdf = () => {
    const doc = new jsPDF();
    doc.text("Compliance & Document Expiry Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const columns = [
      "Vehicle Number",
      "Insurance Expiry",
      "Fitness Expiry",
      "Pollution Expiry",
      "Permit Expiry",
      "Status",
    ];
    const rows = vehicles.map((veh) => {
      const formatDate = (dateStr: string) =>
        dateStr ? new Date(dateStr).toLocaleDateString() : "—";
      return [
        veh.vehicle_number,
        formatDate(veh.insurance_expiry_date),
        formatDate(veh.fitness_expiry_date),
        formatDate(veh.pollution_expiry_date),
        formatDate(veh.permit_expiry_date),
        veh.status || "active",
      ];
    });

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 28,
    });

    doc.save("Fleet_Compliance_Expiry_Report.pdf");
  };

  const exportComplianceLogsToPdf = () => {
    const doc = new jsPDF();
    doc.text("Recorded Compliance Audits & Logs", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const columns = [
      "Document Name",
      "Category",
      "Reg Number",
      "Authority",
      "Date Recorded",
      "Status",
    ];
    const rows = complianceLogs.map((log) => {
      const formatDate = (dateStr: string) =>
        dateStr ? new Date(dateStr).toLocaleDateString() : "—";
      return [
        log.document_name,
        log.category,
        log.registration_number,
        log.authority_name,
        formatDate(log.date_recorded),
        log.status,
      ];
    });

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 28,
    });

    doc.save("Compliance_Audits_Logs.pdf");
  };

  const handleAddCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formRegNum || !formAuthority || !formDate) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        document_name: formName,
        category: formCategory,
        registration_number: formRegNum,
        sub_law_reference: formSubLaw,
        authority_name: formAuthority,
        authority_contact: formContact,
        date_recorded: formDate,
        status: formStatus,
        remarks: formRemarks,
      };

      await tenantApi.post("/compliance", payload);

      // Reset form
      setFormName("");
      setFormCategory("Safety Audit");
      setFormRegNum("");
      setFormSubLaw("");
      setFormAuthority("");
      setFormContact("");
      setFormRemarks("");
      setFormStatus("Compliant");
      setFormDate(new Date().toISOString().split("T")[0]);

      setModalOpen(false);
      await fetchReportData();
    } catch (err) {
      console.error("Failed to save compliance log:", err);
      alert("Failed to submit compliance record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Custom fuel donut chart SVG builder
  const renderDonutChart = (fuelStats: Record<string, number>) => {
    const total = Object.values(fuelStats).reduce((a, b) => a + b, 0);
    if (total === 0)
      return (
        <div className="text-slate-400 text-xs font-semibold py-6">No vehicle data available</div>
      );

    const colors = {
      Diesel: "#3B82F6",
      CNG: "#10B981",
      Petrol: "#F59E0B",
      Electric: "#8B5CF6",
      Other: "#64748B",
    };

    let accumulatedPercentage = 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="14"
            />
            {Object.entries(fuelStats).map(([fuel, val]) => {
              const percentage = val / total;
              const strokeLength = percentage * circumference;
              const strokeOffset = circumference - accumulatedPercentage * circumference;
              accumulatedPercentage += percentage;
              const strokeColor = (colors as any)[fuel] || colors.Other;

              return (
                <circle
                  key={fuel}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={strokeColor}
                  strokeWidth="14"
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-800">{total}</span>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
              Vehicles
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(fuelStats).map(([fuel, val]) => {
            const percent = Math.round((val / total) * 100);
            const strokeColor = (colors as any)[fuel] || colors.Other;
            return (
              <div key={fuel} className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: strokeColor }}
                />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-black text-slate-700">{fuel}</span>
                  <span className="text-[11px] font-bold text-slate-400">
                    ({val} · {percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Compiling database analytics...</p>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────
     BASIC REPORT RENDER
     ─────────────────────────────────────────────── */
  if (view === "basic") {
    const ageDemographics = getAgeDemographics();
    const depts = getDepartmentStats();
    const fuels = getFuelTypeStats();
    const totalCapacity = vehicles.reduce((acc, curr) => acc + (curr.seating_capacity || 0), 0);
    const avgCapacity = vehicles.length ? Math.round(totalCapacity / vehicles.length) : 0;

    const filteredEmployees = employees.filter((emp) => {
      const matchesSearch =
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(empSearch.toLowerCase()) ||
        (emp.employee_id && emp.employee_id.toLowerCase().includes(empSearch.toLowerCase()));
      const matchesDept = deptFilter === "all" || (emp.department || "General") === deptFilter;
      return matchesSearch && matchesDept;
    });

    const empPageSize = 5;
    const totalEmpPages = Math.ceil(filteredEmployees.length / empPageSize) || 1;
    const paginatedEmployees = filteredEmployees.slice(
      (empPage - 1) * empPageSize,
      empPage * empPageSize,
    );

    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-12 font-[var(--font-manrope)]">
        <PageHeader
          title="Basic Report"
          icon={<BarChart2 size={18} />}
          breadcrumb="Admin / Reports / Basic"
        />

        <div className="max-w-[1100px] mx-auto px-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate("/reports")}
              className="btn btn-secondary flex items-center gap-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Hub
            </button>
            <Button
              className="flex items-center gap-2 shadow-sm"
              variant="default"
              onClick={exportBasicToExcel}
            >
              <Download size={16} /> Export Staff Excel
            </Button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Total Employees",
                value: employees.length,
                bg: "bg-blue-50 text-blue-600 border-blue-100",
                icon: Users,
              },
              {
                label: "Departments",
                value: Object.keys(depts).length,
                bg: "bg-purple-50 text-purple-600 border-purple-100",
                icon: Activity,
              },
              {
                label: "Active Fleet",
                value: vehicles.length,
                bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
                icon: Bus,
              },
              {
                label: "Avg Seating Capacity",
                value: avgCapacity,
                bg: "bg-amber-50 text-amber-600 border-amber-100",
                icon: Sparkles,
              },
            ].map((metric, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.bg} border`}
                >
                  <metric.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {metric.label}
                  </p>
                  <p className="text-xl font-black text-slate-800">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Age Demographics Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Users size={15} className="text-blue-500" /> Employee Age Demographics
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Under 25 years", val: ageDemographics.under25, color: "bg-cyan-500" },
                  { label: "25 - 35 years", val: ageDemographics.range25_35, color: "bg-blue-600" },
                  {
                    label: "36 - 45 years",
                    val: ageDemographics.range36_45,
                    color: "bg-indigo-600",
                  },
                  {
                    label: "46 - 55 years",
                    val: ageDemographics.range46_55,
                    color: "bg-violet-600",
                  },
                  { label: "Over 55 years", val: ageDemographics.over55, color: "bg-slate-500" },
                ].map((item) => {
                  const percent =
                    employees.length > 0 ? Math.round((item.val / employees.length) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>{item.label}</span>
                        <span>
                          {item.val} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fleet Fuel Profiles */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Bus size={15} className="text-emerald-500" /> Fleet Fuel Profiles & Donut
                </h3>
                {renderDonutChart(fuels)}
              </div>
            </div>
          </div>

          {/* Interactive Staff List Table */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Activity size={15} className="text-purple-500" /> Active Employee Directory
              </h3>
              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name or ID..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="w-full sm:w-48 pl-9 pr-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white"
                  />
                </div>
                <div className="relative flex-grow sm:flex-grow-0">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Filter size={14} />
                  </span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full sm:w-36 pl-9 pr-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white appearance-none"
                  >
                    <option value="all">All Depts</option>
                    {Object.keys(depts).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Age</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.length ? (
                    paginatedEmployees.map((emp) => {
                      const age = calculateAge(emp.date_of_birth);
                      return (
                        <tr
                          key={emp.id}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {emp.employee_id || `EMP-${emp.id}`}
                          </td>
                          <td className="py-3 px-4 text-slate-800">
                            {emp.first_name} {emp.last_name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {emp.department || "General"}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{emp.designation || "Staff"}</td>
                          <td className="py-3 px-4">{age || "—"}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-emerald-50 text-emerald-600 border border-emerald-200">
                              {emp.status || "active"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No employees match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalEmpPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-slate-500">
                <span>
                  Showing {paginatedEmployees.length} of {filteredEmployees.length} employees
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEmpPage((p) => Math.max(p - 1, 1))}
                    disabled={empPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-slate-800">
                    {empPage} of {totalEmpPages}
                  </span>
                  <button
                    onClick={() => setEmpPage((p) => Math.min(p + 1, totalEmpPages))}
                    disabled={empPage === totalEmpPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────
     ADVANCED REPORT RENDER
     ─────────────────────────────────────────────── */
  if (view === "advanced") {
    // Math indicators
    const vehiclesWithGps = vehicles.filter((v) => v.gps_device_id).length;
    const gpsRate = vehicles.length ? Math.round((vehiclesWithGps / vehicles.length) * 100) : 0;

    const driversWithBeacon = drivers.filter((d) => d.beacon_id).length;
    const staffWithBeacon = employees.filter((e) => e.beacon_id).length;
    const beaconRate =
      drivers.length + employees.length
        ? Math.round(
            ((driversWithBeacon + staffWithBeacon) / (drivers.length + employees.length)) * 100,
          )
        : 0;

    const isHealthy = (h: string) =>
      !h ||
      h.toLowerCase() === "good" ||
      h.toLowerCase() === "healthy" ||
      h.toLowerCase() === "active";
    const totalHealthy = devices.filter((d) => isHealthy(d.device_health)).length;
    const healthRate = devices.length ? Math.round((totalHealthy / devices.length) * 100) : 100;

    // Allocation Anomalies
    const anomalies: string[] = [];
    vehicles.forEach((v) => {
      if (!v.gps_device_id) {
        anomalies.push(`Vehicle ${v.vehicle_number} does not have a GPS device assigned.`);
      }
    });
    drivers.forEach((d) => {
      if (!d.beacon_id) {
        anomalies.push(
          `Driver ${d.first_name} ${d.last_name} does not have an active Beacon assigned.`,
        );
      }
    });

    const filteredDevices = devices.filter((d) => {
      const matchesSearch =
        d.device_id.toLowerCase().includes(deviceSearch.toLowerCase()) ||
        (d.assigned_to_name &&
          d.assigned_to_name.toLowerCase().includes(deviceSearch.toLowerCase()));

      const type = d.device_type || (d.sim_number ? "GPS" : "Beacon");
      const matchesType =
        deviceTypeFilter === "all" || type.toLowerCase() === deviceTypeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });

    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-12 font-[var(--font-manrope)]">
        <PageHeader
          title="Advanced Report"
          icon={<TrendingUp size={18} />}
          breadcrumb="Admin / Reports / Advanced"
        />

        <div className="max-w-[1100px] mx-auto px-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate("/reports")}
              className="btn btn-secondary flex items-center gap-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Hub
            </button>
            <Button
              className="flex items-center gap-2 shadow-sm"
              variant="default"
              onClick={exportAdvancedToExcel}
            >
              <Download size={16} /> Export Device Audit
            </Button>
          </div>

          {/* Device allocation cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[
              {
                label: "GPS Allocation Rate",
                value: `${gpsRate}%`,
                detail: `${vehiclesWithGps} of ${vehicles.length} vehicles assigned`,
                bg: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
              },
              {
                label: "Beacon Allocation Rate",
                value: `${beaconRate}%`,
                detail: `${driversWithBeacon + staffWithBeacon} total beacons assigned`,
                bg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
              },
              {
                label: "Device Integrity Score",
                value: `${healthRate}%`,
                detail: `${totalHealthy} of ${devices.length} devices reporting healthy`,
                bg: "linear-gradient(135deg, #10B981 0%, #047857 100%)",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border text-white shadow-sm flex flex-col justify-between"
                style={{ background: card.bg }}
              >
                <div>
                  <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                    {card.label}
                  </p>
                  <p className="text-3xl font-black mt-2">{card.value}</p>
                </div>
                <p className="text-xs text-white/80 font-bold mt-4 border-t border-white/20 pt-2">
                  {card.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Allocation Anomalies Alerts */}
          {anomalies.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
              <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                <AlertTriangle size={15} /> Allocation Anomalies & Missing Hardware (
                {anomalies.length})
              </h3>
              <div className="space-y-1.5">
                {anomalies.map((item, index) => (
                  <p
                    key={index}
                    className="text-xs font-bold text-amber-700 flex items-start gap-2"
                  >
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Full Device Audit Table */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Activity size={15} className="text-indigo-500" /> Complete Device Registry &
                Connectivity Audit
              </h3>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search ID or assignee..."
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    className="w-full sm:w-48 pl-9 pr-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white"
                  />
                </div>
                <div className="relative flex-grow sm:flex-grow-0">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Filter size={14} />
                  </span>
                  <select
                    value={deviceTypeFilter}
                    onChange={(e) => setDeviceTypeFilter(e.target.value)}
                    className="w-full sm:w-36 pl-9 pr-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white appearance-none"
                  >
                    <option value="all">All Types</option>
                    <option value="gps">GPS Only</option>
                    <option value="beacon">Beacon Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Device ID</th>
                    <th className="py-3 px-4">Device Type</th>
                    <th className="py-3 px-4">Sim / Seq Number</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Battery</th>
                    <th className="py-3 px-4">Integrity Health</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.length ? (
                    filteredDevices.map((d) => {
                      const type = d.device_type || (d.sim_number ? "GPS" : "Beacon");
                      const battery = d.battery_level;
                      const batteryClass =
                        battery === undefined
                          ? "text-slate-400"
                          : battery <= 20
                            ? "text-red-500 font-extrabold animate-pulse"
                            : battery <= 50
                              ? "text-amber-500"
                              : "text-emerald-500";

                      return (
                        <tr
                          key={d.device_id}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-slate-800">{d.device_id}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${type === "GPS" ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-blue-50 text-blue-600 border border-blue-200"}`}
                            >
                              {type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {d.sim_number || d.sequence_id || "—"}
                          </td>
                          <td className="py-3 px-4">
                            {d.assigned_to_name ? (
                              <span className="text-slate-800">{d.assigned_to_name}</span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {battery !== undefined ? (
                              <span className={`flex items-center gap-1 ${batteryClass}`}>
                                <Battery size={14} /> {battery}%
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${d.device_health === "healthy" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                            >
                              {d.device_health || "healthy"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-black ${d.status === "active" || d.is_active ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-100"}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${d.status === "active" || d.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                              />
                              {d.status || (d.is_active ? "active" : "inactive")}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No devices match filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────
     COMPLIANCE REPORT RENDER
     ─────────────────────────────────────────────── */
  if (view === "compliance") {
    // Expiries check
    const getTodayMidnight = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    };

    const isExpired = (d: string) => {
      if (!d) return false;
      const expiry = new Date(d);
      expiry.setHours(0, 0, 0, 0);
      return expiry < getTodayMidnight();
    };

    const isExpiringSoon = (d: string) => {
      if (!d) return false;
      const expiry = new Date(d);
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - getTodayMidnight().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    };

    let compliantCount = 0;
    let criticalCount = 0;
    let warningCount = 0;

    vehicles.forEach((v) => {
      const dates = [
        v.insurance_expiry_date,
        v.fitness_expiry_date,
        v.pollution_expiry_date,
        v.permit_expiry_date,
      ];
      const expired = dates.some(isExpired);
      const soon = dates.some(isExpiringSoon);

      if (expired) criticalCount++;
      else if (soon) warningCount++;
      else compliantCount++;
    });

    const totalVehicles = vehicles.length || 1;
    const auditScore = Math.round((compliantCount / totalVehicles) * 100);

    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-12 font-[var(--font-manrope)] relative">
        <PageHeader
          title="Compliance & Audit Report"
          icon={<ShieldCheck size={18} />}
          breadcrumb="Admin / Reports / Compliance"
        />

        <div className="max-w-[1100px] mx-auto px-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate("/reports")}
              className="btn btn-secondary flex items-center gap-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Hub
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:bg-slate-50"
                onClick={() => setModalOpen(true)}
              >
                <Plus size={16} /> Log Compliance Audit
              </Button>
              <Button
                className="flex items-center gap-2 shadow-sm"
                variant="default"
                onClick={
                  complianceTab === "docs" ? exportComplianceToPdf : exportComplianceLogsToPdf
                }
              >
                <Download size={16} /> Download{" "}
                {complianceTab === "docs" ? "Expiries PDF" : "Audits PDF"}
              </Button>
            </div>
          </div>

          {/* Compliance Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Compliant Fleet",
                value: compliantCount,
                bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
                icon: CheckCircle2,
              },
              {
                label: "Critical Expiries",
                value: criticalCount,
                bg: "bg-red-50 text-red-600 border-red-100",
                icon: ShieldAlert,
              },
              {
                label: "Expiring Soon (30d)",
                value: warningCount,
                bg: "bg-amber-50 text-amber-600 border-amber-100",
                icon: AlertTriangle,
              },
              {
                label: "Compliance Score",
                value: `${auditScore}%`,
                bg: "bg-blue-50 text-blue-600 border-blue-100",
                icon: ShieldCheck,
              },
            ].map((metric, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.bg} border`}
                >
                  <metric.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {metric.label}
                  </p>
                  <p className="text-xl font-black text-slate-800">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs header */}
          <div className="flex border-b border-slate-200 mb-6 gap-6">
            <button
              onClick={() => setComplianceTab("docs")}
              className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${complianceTab === "docs" ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              Vehicle Document Expiries
              {complianceTab === "docs" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setComplianceTab("audits")}
              className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${complianceTab === "audits" ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              Recorded Compliance Audits & Logs
              {complianceTab === "audits" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          </div>

          {/* TAB 1: VEHICLE DOCUMENT LOGS */}
          {complianceTab === "docs" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" /> Vehicle Document Expiry Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-bold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Vehicle Number</th>
                      <th className="py-3 px-4">Insurance Expiry</th>
                      <th className="py-3 px-4">Fitness Expiry</th>
                      <th className="py-3 px-4">Pollution Expiry</th>
                      <th className="py-3 px-4">Permit Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => {
                      const formatDate = (dateStr: string) => {
                        if (!dateStr) return <span className="text-slate-400">—</span>;
                        const date = new Date(dateStr);
                        if (isExpired(dateStr)) {
                          return (
                            <span className="text-red-500 font-black flex items-center gap-1">
                              ⚠ {date.toLocaleDateString()} (Expired)
                            </span>
                          );
                        }
                        if (isExpiringSoon(dateStr)) {
                          return (
                            <span className="text-amber-500 font-extrabold">
                              {date.toLocaleDateString()} (Due Soon)
                            </span>
                          );
                        }
                        return <span className="text-slate-700">{date.toLocaleDateString()}</span>;
                      };
                      return (
                        <tr
                          key={v.id}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-800">{v.vehicle_number}</td>
                          <td className="py-3 px-4">{formatDate(v.insurance_expiry_date)}</td>
                          <td className="py-3 px-4">{formatDate(v.fitness_expiry_date)}</td>
                          <td className="py-3 px-4">{formatDate(v.pollution_expiry_date)}</td>
                          <td className="py-3 px-4">{formatDate(v.permit_expiry_date)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: RECORDED COMPLIANCE AUDITS */}
          {complianceTab === "audits" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" /> Active RTO & Safety
                Compliance Audits
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-bold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Document / Audit Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Reg Number</th>
                      <th className="py-3 px-4">Authority</th>
                      <th className="py-3 px-4">Date Logged</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceLogs.length ? (
                      complianceLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-800">{log.document_name}</td>
                          <td className="py-3 px-4">{log.category}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {log.registration_number}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{log.authority_name}</td>
                          <td className="py-3 px-4">
                            {log.date_recorded
                              ? new Date(log.date_recorded).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${log.status === "Compliant" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-normal italic max-w-[200px] truncate">
                            {log.remarks || "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No safety or transport compliance audits logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FORM FOR LOGGING NEW COMPLIANCE INCIDENT */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" /> Log Regulatory Compliance
                  Audit
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCompliance} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Document Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g., School Bus Permit Check"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white"
                    >
                      <option value="Safety Audit">Safety Audit</option>
                      <option value="Speed Governor">Speed Governor</option>
                      <option value="Pollution Certificate">Pollution Certificate</option>
                      <option value="RTO Permit">RTO Permit</option>
                      <option value="Health & Safety">Health & Safety</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Registration / Ref Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formRegNum}
                      onChange={(e) => setFormRegNum(e.target.value)}
                      placeholder="e.g., REG-998123"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Sub-law Reference
                    </label>
                    <input
                      type="text"
                      value={formSubLaw}
                      onChange={(e) => setFormSubLaw(e.target.value)}
                      placeholder="e.g., Section 135 MV Act"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Authority Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formAuthority}
                      onChange={(e) => setFormAuthority(e.target.value)}
                      placeholder="e.g., Karnataka Transport Dept"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Authority Contact
                    </label>
                    <input
                      type="text"
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      placeholder="e.g., 080-2224433"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Date Recorded *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white"
                    >
                      <option value="Compliant">Compliant</option>
                      <option value="Pending Renewal">Pending Renewal</option>
                      <option value="Non-Compliant">Non-Compliant</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Remarks / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    placeholder="Provide additional details or inspection outcomes..."
                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    {submitting ? (
                      "Saving..."
                    ) : (
                      <>
                        <Check size={14} /> Save Record
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ──────────────────────────────────────────────
     DEFAULT REPORT HUB VIEW (CARDS & METRICS)
     ─────────────────────────────────────────────── */
  return (
    <>
      <PageHeader
        title="AI Analytics & Reports"
        icon={<BarChart2 size={20} />}
        breadcrumb="Admin / Intelligence & Reports"
      />

      <div className="page-body" style={{ background: "#F8FAFC" }}>
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background:
              "linear-gradient(135deg, #6458dfff 0%, hsla(242, 44%, 66%, 1.00) 50%, #a384d3ff 100%)",
            borderRadius: 20,
            padding: "36px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative blobs */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(167,139,250,0.12)",
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: "30%",
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(96,165,250,0.1)",
              filter: "blur(30px)",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Sparkles size={13} color="#fbbf24" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fbbf24",
                    letterSpacing: "0.06em",
                  }}
                >
                  AI-POWERED
                </span>
              </div>
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "white",
                margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              Fleet Intelligence Hub
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                margin: "0 0 20px",
                maxWidth: 520,
              }}
            >
              Select a report tier below to view live auto-generated analytics, age demographics,
              expiries, and fleet KPIs compiled directly from your system.
            </p>
            {/* Quick stats row */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { label: "Total Fleet", val: vehicles.length },
                { label: "Active Drivers", val: drivers.length },
                { label: "Total Staff", val: employees.length },
                { label: "GPS Allocated", val: gpsDevices.length },
              ].map((s) => (
                <div key={s.label} style={{ minWidth: 90, textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: "white",
                      lineHeight: 1,
                    }}
                  >
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.5)",
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Section label */}
        <div style={{ marginTop: 24 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Choose Report Tier
          </p>
        </div>

        {/* TIER CARDS */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          style={{ marginTop: 12 }}
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.id}
              variants={cardVariants}
              whileHover={{ y: -6, boxShadow: `0 20px 48px ${tier.glowColor}` }}
              style={{
                background: "white",
                borderRadius: 20,
                border: `1.5px solid ${tier.bgLight}`,
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                transition: "box-shadow 0.25s",
              }}
              onClick={() => navigate(tier.route)}
            >
              {/* Card Header */}
              <div
                style={{
                  background: tier.gradient,
                  padding: "28px 24px 22px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                  }}
                />
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <tier.Icon size={26} color="white" strokeWidth={2} />
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.6)",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  {tier.pages}
                </div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "white",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {tier.label}
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.75)",
                    margin: "4px 0 0",
                  }}
                >
                  {tier.subtitle}
                </p>
              </div>

              {/* Card Body */}
              <div style={{ padding: "20px 24px 24px" }}>
                {/* Audience badge */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: tier.bgLight,
                    color: tier.accentColor,
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: 20,
                    marginBottom: 14,
                    letterSpacing: "0.04em",
                  }}
                >
                  {tier.badgeText}
                </div>

                <p
                  style={{
                    fontSize: 12.5,
                    color: "#64748B",
                    lineHeight: 1.65,
                    marginBottom: 16,
                  }}
                >
                  {tier.description}
                </p>

                {/* Feature list */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 22,
                  }}
                >
                  {tier.features.map((f) => (
                    <div
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <CheckCircle2
                        size={14}
                        color={tier.accentColor}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#475569",
                        }}
                      >
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    borderRadius: 12,
                    background: tier.gradient,
                    color: "white",
                    fontWeight: 800,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: `0 6px 18px ${tier.glowColor}`,
                    transition: "opacity 0.15s",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(tier.route);
                  }}
                >
                  Open {tier.label}
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
};

export default ReportHub;
