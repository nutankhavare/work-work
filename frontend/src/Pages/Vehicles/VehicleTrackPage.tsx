// src/Pages/Vehicles/VehicleTrackPage.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import { useAuth } from "../../Context/AuthContext";
import tenantApi from "../../Services/ApiService";

// Components
import PageHeaderBack from "../../Components/UI/PageHeaderBack";
import GoogleMapDisplay from "../../Components/Map/GoogleMapDisplay";
import EmptyState from "../../Components/UI/EmptyState";
import { Loader } from "../../Components/UI/Loader";

// Icons
import {
  RefreshCw,
  Gauge,
  Battery,
  Clock,
  User,
  Users,
  Signal,
  AlertTriangle,
  MapPin,
  Bus,
} from "lucide-react";
import type { LiveVehicle } from "../../Types/Index";
import { formatTime } from "../../Utils/Toolkit";

const STORAGE_KEY = "vehicle_track_cooldown";
const COOLDOWN_DURATION = 60; // 1 Minute

const VehicleTrackPage = () => {
  const { vehicleNumber } = useParams<{ vehicleNumber: any }>();
  const { tenantId } = useAuth();

  // State
  const [vehicle, setVehicle] = useState<LiveVehicle | null>(null);
  const [address, setAddress] = useState<string>("Fetching location...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);

  // Timer State
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey,
  });

  // --- 1. Timer Logic ---
  const startTimerInterval = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          localStorage.removeItem(STORAGE_KEY);
          setIsButtonDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const initCooldown = () => {
    const endTime = Date.now() + COOLDOWN_DURATION * 1000;
    localStorage.setItem(STORAGE_KEY, endTime.toString());
    setCountdown(COOLDOWN_DURATION);
    setIsButtonDisabled(true);
    startTimerInterval();
  };

  // --- 2. Data Fetching ---
  const fetchAddress = async (lat: number, lng: number) => {
    if (!googleMapsApiKey) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`,
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

  const fetchVehicleTracking = useCallback(async () => {
    if (!tenantId || !vehicleNumber) return;

    setLoading(true);
    setError(null);
    setAddress("Updating address...");

    try {
      const response = await tenantApi.get(
        `/vehicles/track/${vehicleNumber}/live/location/${tenantId}`,
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setVehicle(data);
        if (data.gps) {
          fetchAddress(data.gps.lat, data.gps.lng);
        }
        initCooldown();
      } else {
        setError("Vehicle tracking data not available.");
      }
    } catch (err: any) {
      console.error("Failed to fetch vehicle tracking:", err);
      setError(err.response?.data?.message || "Connection failed. Please retry.");
      initCooldown();
    } finally {
      setLoading(false);
      setHasInitialFetch(true);
    }
  }, [tenantId, vehicleNumber, googleMapsApiKey]);

  // --- 3. Lifecycle ---
  useEffect(() => {
    if (!tenantId || !vehicleNumber) return;

    const initializePage = () => {
      const storedTimestamp = localStorage.getItem(STORAGE_KEY);

      if (storedTimestamp) {
        const endTime = parseInt(storedTimestamp, 10);
        const now = Date.now();
        const remainingSeconds = Math.ceil((endTime - now) / 1000);

        if (remainingSeconds > 0) {
          // Restore Timer
          setCountdown(remainingSeconds);
          setIsButtonDisabled(true);
          startTimerInterval();

          // Silent fetch if we restored timer but have no data
          if (!vehicle && !hasInitialFetch) {
            setLoading(true);
            tenantApi
              .get(`/vehicles/track/${vehicleNumber}/live/location/${tenantId}`)
              .then((res) => {
                if (res.data.success) {
                  setVehicle(res.data.data);
                  if (res.data.data.gps) fetchAddress(res.data.data.gps.lat, res.data.data.gps.lng);
                }
              })
              .catch(() => setError("Failed to restore data."))
              .finally(() => {
                setLoading(false);
                setHasInitialFetch(true);
              });
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          fetchVehicleTracking();
        }
      } else {
        fetchVehicleTracking();
      }
    };

    initializePage();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tenantId, vehicleNumber]);

  // Prevent Refresh Warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isButtonDisabled) {
        e.preventDefault();
        e.returnValue = "Please wait for timer.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isButtonDisabled]);

  // Helpers
  const drivers = vehicle?.beacons.filter((b) => b.type.toLowerCase() === "driver") || [];
  const passengers =
    vehicle?.beacons.filter(
      (b) => b.type.toLowerCase() === "traveller" || b.type.toLowerCase() === "staff",
    ) || [];

  const formatCountdownStr = (seconds: number) => `${seconds}s`;

  if (!googleMapsApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <EmptyState title="Config Error" description="Maps API Key missing." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-2">
      <div className="mx-4">
        <PageHeaderBack title={"Back"} buttonLink="/vehicles" />
      </div>

      <div className="px-4 mt-4 pb-10">
        <div className="space-y-4">
          {/* 1. Control Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <MapPin size={24} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase">Real-Time Monitoring</h2>
                <p className="text-xs text-slate-500">
                  {vehicle
                    ? `Data synced: ${formatTime(vehicle.gps.timestamp)}`
                    : "Waiting for connection..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {error && (
                <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                  <AlertTriangle size={14} /> {error}
                </span>
              )}

              <button
                onClick={fetchVehicleTracking}
                disabled={isButtonDisabled || loading}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase transition-all shadow-sm border
                                    ${
                                      isButtonDisabled || loading
                                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                        : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 active:scale-95"
                                    }`}
              >
                {loading ? (
                  <span className="animate-spin">
                    <RefreshCw size={14} />
                  </span>
                ) : (
                  <RefreshCw
                    size={14}
                    className={
                      isButtonDisabled ? "" : "group-hover:rotate-180 transition-transform"
                    }
                  />
                )}
                {loading
                  ? "Syncing..."
                  : isButtonDisabled
                    ? `Next Update in ${formatCountdownStr(countdown)}`
                    : "Update Location"}
              </button>
            </div>
          </div>

          {/* 2. Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[80vh]">
            {/* Map Area - ALWAYS RENDERED */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200  relative">
              {/* FIX: LoadScript is top-level within this div, so map loads instantly */}
              {isLoaded && (
                <GoogleMapDisplay
                  vehicles={vehicle ? [vehicle] : []}
                  selectedVehicleNumber={vehicle?.vehicle_number || null}
                  onVehicleSelect={() => {}}
                />
              )}

              {/* Overlay: Loading */}
              {loading && (
                <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2">
                    <Loader />
                    <span className="text-xs font-bold text-indigo-900 uppercase">
                      Updating Location...
                    </span>
                  </div>
                </div>
              )}

              {/* Overlay: Error */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30">
                  <EmptyState
                    title="Tracking Unavailable"
                    description={error}
                    icon={<AlertTriangle size={48} className="text-red-300 mb-4" />}
                  />
                </div>
              )}
            </div>

            {/* Sidebar Details Panel */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {vehicle ? (
                <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 ">
                  {/* Header */}
                  <div className="bg-slate-50 p-5 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border border-slate-200 rounded-full shadow-sm text-indigo-600">
                          <Bus size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-extrabold text-slate-800 uppercase leading-none">
                            {vehicle.vehicle_name}
                          </h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-slate-800">
                          {vehicle.vehicle_number || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex gap-2">
                      <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {address}
                      </p>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1  p-4 space-y-5 ">
                    {/* 1. Telemetry */}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                        Live Telemetry
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gauge size={16} className="text-blue-400" />
                            <span className="text-xs font-bold text-blue-800 uppercase">Speed</span>
                          </div>
                          <span className="text-sm font-extrabold text-blue-600">
                            {vehicle.gps.speed} <span className="text-[10px]">km/h</span>
                          </span>
                        </div>
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Battery size={16} className="text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-800 uppercase">
                              Battery
                            </span>
                          </div>
                          <span className="text-sm font-extrabold text-emerald-600">
                            {vehicle.battery}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Driver */}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                        <User size={14} /> Active Driver
                      </label>
                      {drivers.length > 0 ? (
                        <div className="space-y-2">
                          {drivers.map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded-lg"
                            >
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 font-bold border border-slate-200 shadow-sm mr-3">
                                {d.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-700 uppercase">
                                  {d.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">ID: {d.id}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-400">
                          No driver detected
                        </div>
                      )}
                    </div>

                    {/* 3. Passengers Info - SCROLLABLE */}
                    <div className="flex flex-col h-full min-h-0">
                      <div className="flex items-center justify-between mb-2 shrink-0">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                          <Users size={14} /> Passengers
                        </label>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Total: {passengers.length}
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-lg bg-white">
                        {passengers.length > 0 ? (
                          <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {passengers.map((pax) => (
                              <div
                                key={pax.id}
                                className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                                    {pax.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-700 uppercase">
                                      {pax.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded">
                                        ID: {pax.id}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span
                                    className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded"
                                    title="Last Seen"
                                  >
                                    <Clock size={8} /> {formatTime(pax.lastSeen)}
                                  </span>
                                  {pax.rssi && (
                                    <div
                                      className="flex items-center gap-1"
                                      title="Signal Strength"
                                    >
                                      <Signal
                                        size={10}
                                        className={
                                          pax.rssi > -60 ? "text-green-500" : "text-amber-500"
                                        }
                                      />
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {pax.rssi}dBm
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-400 italic">
                            No passengers detected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 text-center">
                  {loading ? (
                    <>
                      <Loader />
                      <p className="text-xs text-slate-500 mt-4 font-bold uppercase">
                        Connecting to Vehicle...
                      </p>
                    </>
                  ) : (
                    <>
                      <MapPin size={48} className="text-slate-200 mb-4" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase">Ready to Track</h3>
                      <p className="text-xs text-slate-500 mt-2">Waiting for connection...</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleTrackPage;
