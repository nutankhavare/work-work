import { useState, useEffect, useCallback } from "react";
import { Radio, Bluetooth, Search, Monitor, Link2, Link2Off, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../../Components/UI/PageHeader";
import { Loader } from "../../Components/UI/Loader";
import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
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

interface Device {
  id: string;
  device_id: string;
  assigned_to: string | null;
  assigned_type: "staff" | "driver" | "vehicle" | null;
  assigned_to_name: string | null;
  status: string;
  device_health?: string;
  battery_level?: number;
  sim_number?: string;
  network_provider?: string;
}

interface DevicesData {
  beacons: Device[];
  gpsDevices: Device[];
}

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

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status?.toLowerCase() === "active";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-[900] uppercase tracking-wider border ${
      isActive
        ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs"
        : "bg-slate-50 text-slate-500 border-slate-200 shadow-xs"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
      {status}
    </span>
  );
};

const BatteryBadge = ({ level }: { level: number }) => {
  const color = level > 60 ? "#10b981" : level > 25 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${level}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-[900] text-slate-600 tracking-tighter">{level}%</span>
    </div>
  );
};

const DeviceManagementIndexPage = () => {
  const { showAlert } = useAlert();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<"gps" | "beacon">("gps");
  const [devicesData, setDevicesData] = useState<DevicesData>({ beacons: [], gpsDevices: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    device: Device | null;
    type: "beacon" | "gps";
  }>({ open: false, device: null, type: "beacon" });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tenantApi.get("/devices");
      if (response.data.success && response.data.data) {
        setDevicesData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load devices", err);
      showAlert("Failed to load device data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleUnassign = async (type: "beacon" | "gps", deviceId: string) => {
    if (!(await confirm(`Are you sure you want to unassign device ${deviceId}?`))) return;
    try {
      await tenantApi.post("/devices/unassign", { deviceType: type, deviceId });
      showAlert("Device unassigned successfully.", "success");
      fetchDevices();
    } catch (err) {
      console.error(err);
      showAlert("Failed to unassign device.", "error");
    }
  };

  const currentDevices = activeTab === "gps" ? devicesData.gpsDevices : devicesData.beacons;

  const filteredDevices = currentDevices.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      d.device_id.toLowerCase().includes(q) ||
      (d.sim_number && d.sim_number.toLowerCase().includes(q)) ||
      (d.assigned_to_name && d.assigned_to_name.toLowerCase().includes(q))
    );
  });

  const gpsTotal = devicesData.gpsDevices.length;
  const gpsAssigned = devicesData.gpsDevices.filter((d) => d.assigned_to).length;
  const beaconTotal = devicesData.beacons.length;
  const beaconAssigned = devicesData.beacons.filter((d) => d.assigned_to).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-[var(--font-manrope)]">
      <PageHeader
        title="Device Management"
        icon={<Monitor size={18} />}
        breadcrumb="Admin / IoT Management / Devices"
      />

      <div className="px-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="GPS Total"
            value={gpsTotal}
            icon={Radio}
            colorClass="bg-blue-50 text-blue-600"
            subtext={`${gpsAssigned} Assigned`}
          />
          <StatCard
            title="GPS Assigned"
            value={gpsAssigned}
            icon={Radio}
            colorClass="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Beacons Total"
            value={beaconTotal}
            icon={Bluetooth}
            colorClass="bg-violet-50 text-violet-600"
            subtext={`${beaconAssigned} Assigned`}
          />
          <StatCard
            title="Beacons Assigned"
            value={beaconAssigned}
            icon={Bluetooth}
            colorClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] overflow-hidden">
          
          {/* Tabs + Search */}
          <div className="p-6 border-b border-[#f1f5f9] bg-[#fafbff]/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex bg-[#f1f5f9] rounded-[14px] p-1.5 gap-1.5 w-fit">
                <button
                  onClick={() => setActiveTab("gps")}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-[10px] text-[12px] font-[800] uppercase tracking-wider transition-all duration-200 ${
                    activeTab === "gps"
                      ? "bg-white text-[#7c3aed] shadow-md shadow-indigo-100"
                      : "text-[#64748b] hover:text-[#475569] hover:bg-white/50"
                  }`}
                >
                  <Radio size={16} />
                  GPS
                  <span className={`ml-1.5 px-2 py-0.5 rounded-[6px] text-[10px] font-[900] ${
                    activeTab === "gps" ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-500"
                  }`}>{gpsTotal}</span>
                </button>
                <button
                  onClick={() => setActiveTab("beacon")}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-[10px] text-[12px] font-[800] uppercase tracking-wider transition-all duration-200 ${
                    activeTab === "beacon"
                      ? "bg-white text-[#7c3aed] shadow-md shadow-indigo-100"
                      : "text-[#64748b] hover:text-[#475569] hover:bg-white/50"
                  }`}
                >
                  <Bluetooth size={16} />
                  Beacons
                  <span className={`ml-1.5 px-2 py-0.5 rounded-[6px] text-[10px] font-[900] ${
                    activeTab === "beacon" ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-500"
                  }`}>{beaconTotal}</span>
                </button>
              </div>

              <div className="relative group lg:w-[320px]">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#7c3aed] transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, SIM or Assignment..."
                  className="w-full pl-12 pr-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[500] placeholder:text-[#94a3b8] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="relative">
            {loading ? (
              <div className="py-24 flex flex-col items-center gap-4">
                <Loader />
                <p className="text-[14px] font-[700] text-[#94a3b8]">Synchronizing Hardware Inventory...</p>
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="py-24">
                <EmptyState
                  title={activeTab === "gps" ? "No GPS Trackers Found" : "No Bluetooth Beacons Found"}
                  description="Adjust your filters or add hardware from the central registry."
                  icon={activeTab === "gps" ? <Radio size={64} className="text-slate-200 mb-4" /> : <Bluetooth size={64} className="text-slate-200 mb-4" />}
                />
              </div>
            ) : (
              <TableContainer maxHeight="65vh">
                <Table className="w-full">
                  <Thead className="!bg-[#fafbff] border-b border-[#f1f5f9]">
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] pl-8">Device Info</Th>
                    {activeTab === "gps" ? (
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">SIM Configuration</Th>
                    ) : (
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">Battery Health</Th>
                    )}
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Diagnostics</Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Status</Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Assignment</Th>
                    <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center pr-8">Actions</Th>
                  </Thead>
                  <Tbody>
                    {filteredDevices.map((device) => (
                      <Tr key={device.id} className="hover:bg-[#fdfbff] transition-colors border-b border-[#f8fafc] last:border-0">
                        <Td className="py-5 pl-8">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                              activeTab === "gps" ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-violet-50 border-violet-100 text-violet-600"
                            }`}>
                              {activeTab === "gps" ? <Radio size={18} /> : <Bluetooth size={18} />}
                            </div>
                            <div>
                              <p className="text-[13.5px] font-[900] text-[#1e293b] leading-tight mb-1">{device.device_id}</p>
                              <span className="text-[10px] font-[800] text-slate-400 uppercase tracking-widest">
                                {activeTab === "gps" ? "GPS TRACKER" : "BLUETOOTH TAG"}
                              </span>
                            </div>
                          </div>
                        </Td>
                        <Td className="py-5">
                          {activeTab === "gps" ? (
                            <div className="flex flex-col gap-1">
                              <p className="text-[13px] font-[800] text-[#475569]">{device.sim_number || "—"}</p>
                              <p className="text-[10px] font-[700] text-slate-400 uppercase tracking-tight">{device.network_provider || "No Provider"}</p>
                            </div>
                          ) : (
                            <BatteryBadge level={device.battery_level || 0} />
                          )}
                        </Td>
                        <Td className="py-5 text-center">
                          <span className={`text-[12.5px] font-[700] px-3 py-1 rounded-lg border uppercase tracking-tighter ${
                            (device.device_health || "Healthy").toLowerCase() === "healthy"
                              ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                              : "text-amber-600 bg-amber-50 border-amber-100"
                          }`}>{device.device_health || "Healthy"}</span>
                        </Td>
                        <Td className="py-5 text-center"><StatusBadge status={device.status} /></Td>
                        <Td className="py-5 text-center">
                          {device.assigned_to ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <span className="material-symbols-outlined text-[13px]">{
                                device.assigned_type === "vehicle" ? "directions_bus" : "person"
                              }</span>
                              {device.assigned_to_name || `ID: ${device.assigned_to}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-200">
                              Unassigned
                            </span>
                          )}
                        </Td>
                        <Td className="py-5 text-center pr-8">
                          {device.assigned_to ? (
                            <button
                              onClick={() => handleUnassign(activeTab, device.device_id)}
                              className="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 text-[11px] font-[800] rounded-xl uppercase tracking-wider transition-all inline-flex items-center gap-2"
                            >
                              <Link2Off size={13} />
                              Unassign
                            </button>
                          ) : (
                            <button
                              onClick={() => setAssignModal({ open: true, device, type: activeTab })}
                              className="px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 text-[11px] font-[800] rounded-xl uppercase tracking-wider transition-all inline-flex items-center gap-2"
                            >
                              <Link2 size={13} />
                              Assign
                            </button>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal.open && assignModal.device && (
          <AssignModal
            device={assignModal.device}
            type={assignModal.type}
            onClose={() => setAssignModal({ open: false, device: null, type: "beacon" })}
            onSuccess={() => {
              setAssignModal({ open: false, device: null, type: "beacon" });
              fetchDevices();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── ASSIGN MODAL ── */
const AssignModal = ({
  device,
  type,
  onClose,
  onSuccess,
}: {
  device: Device;
  type: "beacon" | "gps";
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { showAlert } = useAlert();
  const [entities, setEntities] = useState<any[]>([]);
  const [entityType, setEntityType] = useState<"staff" | "driver" | "vehicle">(
    type === "beacon" ? "staff" : "vehicle"
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const fetchEntities = async () => {
      setLoading(true);
      try {
        let res;
        if (entityType === "staff") {
          res = await tenantApi.get("/employees", { params: { page: 1, limit: 100 } });
          setEntities(res.data?.data?.data || []);
        } else if (entityType === "driver") {
          res = await tenantApi.get("/drivers", { params: { page: 1, limit: 100 } });
          setEntities(res.data?.data?.data || []);
        } else if (entityType === "vehicle") {
          res = await tenantApi.get("/vehicles", { params: { page: 1, limit: 100 } });
          setEntities(res.data?.data?.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEntities();
  }, [entityType]);

  const handleSave = async () => {
    if (!selectedId) {
      showAlert("Please select an entity to assign.", "error");
      return;
    }
    setSaving(true);
    try {
      await tenantApi.post("/devices/assign", {
        deviceType: type,
        deviceId: device.device_id,
        entityType,
        entityId: selectedId,
      });
      showAlert(`Device ${device.device_id} assigned successfully!`, "success");
      onSuccess();
    } catch (e: any) {
      console.error(e);
      showAlert(e.response?.data?.message || "Failed to assign device.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white rounded-2xl w-full max-w-[420px] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
            type === "beacon" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
          }`}>
            <Cpu size={28} />
          </div>
          <h3 className="text-[17px] font-[900] text-[#1e293b] uppercase tracking-tight">Assign Hardware</h3>
          <p className="text-[12px] font-[700] text-slate-400 mt-1 uppercase tracking-widest">
            {type.toUpperCase()}: {device.device_id}
          </p>
        </div>

        {/* Entity Type Selection */}
        <div className="mb-4">
          <label className="block text-[11px] font-[800] text-slate-400 uppercase tracking-wider mb-2">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value as any);
              setSelectedId("");
            }}
            className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] cursor-pointer"
          >
            {type === "beacon" && <option value="staff">Staff Member</option>}
            {type === "beacon" && <option value="driver">Fleet Driver</option>}
            <option value="vehicle">Fleet Vehicle</option>
          </select>
        </div>

        {/* Entity Selector */}
        <div className="mb-8">
          <label className="block text-[11px] font-[800] text-slate-400 uppercase tracking-wider mb-2">Select {entityType}</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] cursor-pointer disabled:opacity-50"
          >
            <option value="">-- Choose {entityType} --</option>
            {!loading &&
              entities.map((ent) => {
                const isAssigned =
                  (entityType === "staff" && ent.beacon_id) ||
                  (entityType === "driver" && ent.beacon_id) ||
                  (entityType === "vehicle" && (type === "gps" ? ent.gps_device_id : ent.beacon_count > 0));

                const label =
                  entityType === "vehicle"
                    ? `${ent.vehicle_number} (${ent.vehicle_name || 'Unnamed'})`
                    : `${ent.first_name} ${ent.last_name} (${ent.employee_id || 'ID N/A'})`;

                return (
                  <option key={ent.id} value={ent.id} disabled={!!isAssigned}>
                    {label} {isAssigned ? "— (Assigned)" : ""}
                  </option>
                );
              })}
          </select>
          {loading && (
            <p className="text-[11px] font-[700] text-[#7c3aed] mt-2 animate-pulse">Syncing catalog options...</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-5 py-3.5 bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] rounded-xl font-[800] text-[12px] uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedId}
            className="flex-1 px-5 py-3.5 bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 rounded-xl font-[800] text-[12px] uppercase tracking-wider transition-all shadow-lg shadow-indigo-100"
          >
            {saving ? "Linking..." : "Confirm"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeviceManagementIndexPage;