import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Bus, 
  Users, 
  UserCheck, 
  // Star, 
  Maximize, 
  LayoutDashboard,
  Monitor,
  RotateCw,
  Gauge,
  Battery,
  Clock,
  User,
  Signal,
  AlertTriangle,
  MapPin
} from "lucide-react";
import { formatTime } from "../Utils/Toolkit";
import tenantApi from "../Services/ApiService";
import { useAuth } from "../Context/AuthContext";
import GoogleMapDisplay from "../Components/Map/GoogleMapDisplay";
import { useJsApiLoader } from "@react-google-maps/api";
import PageHeader from "../Components/UI/PageHeader";

/* ─── SVG Icons & Components (Inlined for simplicity) ────────────── */
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, delay = 0, onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    onClick={onClick}
    className="bg-white rounded-[14px] p-6 border border-[#e8edf5] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(124,58,237,0.08)] transition-all group cursor-pointer active:scale-95"
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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const [stats, setStats] = useState({
    vehicles: 0,
    employees: 0,
    drivers: 0,
    devices: 0
  });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>("Fetching location...");

  // Fetch real counts from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, vRes] = await Promise.all([
          tenantApi.get("/dashboard/stats"),
          tenantApi.get(`/vehicles/live/location/${tenantId}`)
        ]);

        if (vRes.data.success) {
          setVehicles(vRes.data.data || []);
        }

        if (statsRes.data.success) {
          const s = statsRes.data.data;
          setStats({
            vehicles: s.vehicleCount || 0,
            employees: s.employeeCount || 0,
            drivers: s.driverCount || 0,
            devices: s.deviceCount || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats, using mock data", err);
        // Fallback mock data for frontend-only development
        setStats({
          vehicles: 12,
          employees: 45,
          drivers: 8,
          devices: 42
        });
        setVehicles([
          { 
            vehicle_name: "Fleet Van 1",
            vehicle_number: "VAN-001", 
            battery: 92,
            gps: { lat: 12.9716, lng: 77.5946, speed: 45, timestamp: new Date().toISOString() }, 
            status: 'moving',
            beacons: [
              { id: "mock-d1", name: "Ramesh Kumar", type: "driver", lastSeen: new Date().toISOString() }
            ]
          },
          { 
            vehicle_name: "Fleet Van 2",
            vehicle_number: "VAN-002", 
            battery: 78,
            gps: { lat: 12.9816, lng: 77.6046, speed: 0, timestamp: new Date().toISOString() }, 
            status: 'idle',
            beacons: []
          }
        ] as any);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) fetchStats();
  }, [tenantId]);

  useEffect(() => {
    if (!selectedVehicleNumber || !vehicles.length) return;
    const selectedVehicle: any = vehicles.find((v: any) => v.vehicle_number === selectedVehicleNumber);
    if (!selectedVehicle || !selectedVehicle.gps) return;

    const fetchAddress = async () => {
      setAddress("Updating address...");
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setAddress("Location info unavailable");
        return;
      }
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${selectedVehicle.gps.lat},${selectedVehicle.gps.lng}&key=${apiKey}`
        );
        const data = await response.json();
        if (data.results && data.results[0]) {
          setAddress(data.results[0].formatted_address);
        } else {
          setAddress("Address not found");
        }
      } catch (error) {
        setAddress("Location info unavailable");
      }
    };

    fetchAddress();
  }, [selectedVehicleNumber, vehicles]);

  const handleVehicleSelect = (vehicle_number: string) => {
    setSelectedVehicleNumber((prevId) => (prevId === vehicle_number ? null : vehicle_number));
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-[var(--font-manrope)]">
      
      {/* ── Header ── */}
      <PageHeader
        title="Institute Dashboard"
        icon={<LayoutDashboard size={18} />}
        breadcrumb="Admin / Analytics / Dashboard"
      />

      <div className="px-4 lg:px-6 pb-8 space-y-8">
        {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard 
          title="Total Vehicles" 
          value={stats.vehicles} 
          icon={Bus} 
          colorClass="bg-blue-50 text-blue-600" 
          delay={0}
          onClick={() => navigate("/vehicles")}
        />
        <StatCard 
          title="Total Employees" 
          value={stats.employees} 
          icon={Users} 
          colorClass="bg-emerald-50 text-emerald-600" 
          delay={0.1}
          onClick={() => navigate("/staff")}
        />
        <StatCard 
          title="Total Drivers" 
          value={stats.drivers} 
          icon={UserCheck} 
          colorClass="bg-amber-50 text-amber-600" 
          delay={0.2}
          onClick={() => navigate("/drivers")}
        />
        <StatCard 
          title="Total Devices" 
          value={stats.devices} 
          icon={Monitor} 
          colorClass="bg-purple-50 text-purple-600" 
          delay={0.3}
          onClick={() => navigate("/devices")}
        />
      </div>

      {/* ── Map & Sidebar Section ── */}
      {(() => {
        const selectedVehicle: any = selectedVehicleNumber 
          ? vehicles.find((v: any) => v.vehicle_number === selectedVehicleNumber) 
          : null;
        const drivers = selectedVehicle?.beacons?.filter((b: any) => b.type.toLowerCase() === 'driver') || [];
        const passengers = selectedVehicle?.beacons?.filter((b: any) => b.type.toLowerCase() === 'traveller' || b.type.toLowerCase() === 'staff') || [];

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Map Container */}
            <div className={`bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] overflow-hidden relative min-h-[500px] h-[550px] transition-all duration-300 ${selectedVehicle ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              {loading ? (
                <div className="absolute inset-0 bg-slate-50 flex items-center justify-center flex-col gap-4">
                  <div className="p-4 bg-white rounded-full shadow-xl border border-slate-100 animate-bounce">
                    <Bus size={32} className="text-[#7c3aed]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-[900] text-[#1e293b] uppercase tracking-widest">Live Fleet Map</h3>
                    <p className="text-[10px] font-[800] text-[#94a3b8] uppercase mt-1">Connecting to tracking service...</p>
                  </div>
                </div>
              ) : apiKey && isLoaded ? (
                  <GoogleMapDisplay
                    vehicles={vehicles}
                    selectedVehicleNumber={selectedVehicleNumber}
                    onVehicleSelect={handleVehicleSelect}
                  />
              ) : (
                <div className="absolute inset-0 bg-[#fafcff] flex items-center justify-center flex-col gap-4 p-8">
                  <div className="w-16 h-16 bg-[#f1f5f9] rounded-2xl flex items-center justify-center border border-[#e2e8f0] shadow-sm">
                    <Bus size={28} className="text-[#64748b]" />
                  </div>
                  <div className="text-center max-w-sm">
                    <h3 className="text-[15px] font-[900] text-[#1e293b] uppercase tracking-wider mb-2">Live Fleet Tracking</h3>
                    <p className="text-[12px] font-[600] text-[#64748b] leading-relaxed">
                      Map visualization placeholder. The live fleet is tracking dynamically in sandbox mode.
                    </p>
                  </div>
                </div>
              )}

              {/* Floating Map Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button className="p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-[#64748b] hover:text-[#7c3aed] transition-all hover:scale-110 active:scale-95">
                  <Maximize size={18} />
                </button>
                <button className="p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-[#64748b] hover:text-[#7c3aed] transition-all hover:scale-110 active:scale-95">
                  <RotateCw size={18} />
                </button>
              </div>

              {/* Legend Overlay */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-xl z-10 hidden md:block">
                <p className="text-[10px] font-[900] text-[#1e293b] uppercase mb-3">Fleet Status</p>
                <div className="space-y-2">
                  {[
                    { label: 'Moving', color: 'bg-emerald-500' },
                    { label: 'Idle', color: 'bg-amber-500' },
                    { label: 'Offline', color: 'bg-slate-400' }
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                      <span className="text-[11px] font-[800] text-[#64748b]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Vehicle Detail Sidebar */}
            {selectedVehicle && (
              <div className="lg:col-span-1 bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] overflow-hidden flex flex-col h-[550px] transition-all duration-300">
                {/* Header */}
                <div className="bg-slate-50 p-5 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white border border-slate-200 rounded-full shadow-sm text-[#7c3aed]">
                                <Bus size={20} />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-[900] text-slate-800 uppercase leading-none">{selectedVehicle.vehicle_name}</h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-[11px] font-black text-slate-800">{selectedVehicle.vehicle_number || "-"}</span>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex gap-2">
                        <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-600 leading-relaxed font-[600]">
                            {address}
                        </p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">

                    {/* 1. Telemetry */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Live Telemetry</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Gauge size={14} className="text-blue-400" />
                                    <span className="text-[10px] font-black text-blue-800 uppercase">Speed</span>
                                </div>
                                <span className="text-xs font-extrabold text-blue-600">{selectedVehicle.gps?.speed || 0} <span className="text-[9px]">km/h</span></span>
                            </div>
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Battery size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-800 uppercase">Battery</span>
                                </div>
                                <span className="text-xs font-extrabold text-emerald-600">{selectedVehicle.battery || 85}%</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Driver */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2 tracking-wider">
                            <User size={12} /> Active Driver
                        </label>
                        {drivers.length > 0 ? (
                            <div className="space-y-2">
                                {drivers.map((d: any) => (
                                    <div key={d.id} className="flex items-center p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-500 font-black border border-slate-200 shadow-sm mr-2.5 text-xs">
                                            {d.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700 uppercase">{d.name}</p>
                                            <p className="text-[9px] text-slate-400 font-mono">ID: {d.id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-[11px] text-slate-450">
                                No driver detected
                            </div>
                        )}
                    </div>

                    {/* 3. Passengers Info */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-wider">
                                <Users size={12} /> Passengers
                            </label>
                            <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                Total: {passengers.length}
                            </span>
                        </div>

                        <div className="border border-slate-250 rounded-lg bg-white overflow-hidden">
                            {passengers.length > 0 ? (
                                <div className="divide-y divide-slate-100 max-h-[180px] overflow-y-auto custom-scrollbar">
                                    {passengers.map((pax: any) => (
                                        <div key={pax.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black border border-blue-100">
                                                    {pax.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-700 uppercase">{pax.name}</p>
                                                    <span className="text-[9px] text-slate-400 font-mono">ID: {pax.id}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-[8px] text-slate-400 flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded" title="Last Seen">
                                                    <Clock size={8} /> {formatTime(pax.lastSeen)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-xs text-slate-400 italic">
                                    No passengers detected
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                  <button 
                    onClick={() => navigate(`/vehicles/track/${selectedVehicle.vehicle_number}`)}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-indigo-750 active:scale-95 transition-all text-center"
                  >
                    Track Live
                  </button>
                  <button 
                    onClick={() => setSelectedVehicleNumber(null)}
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 active:scale-95 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      </div>
    </div>
  );
};

export default DashboardPage;
