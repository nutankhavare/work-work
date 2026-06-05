import { useState, useCallback } from "react";
import PageHeader from "../../Components/UI/PageHeader";
import Table from "../../Components/UI/Table";
import SearchComponent from "../../Components/UI/SearchComponents";
import type { GpsDevice } from "../../Types/Index";

// Dummy GPS devices data
const dummyGpsDevices: GpsDevice[] = [
  {
    id: 1,
    sequnce_number: "GPS-001",
    serial_number: "SRL-GPS-20031",
    device_id: "GD-2F5A3C",
    manufacture_date: new Date("2023-04-10"),
    imei_number: "860000001234561",
    status: "active",
  },
  {
    id: 2,
    sequnce_number: "GPS-002",
    serial_number: "SRL-GPS-20032",
    device_id: "GD-8B1E4D",
    manufacture_date: new Date("2023-07-25"),
    imei_number: "860000001234562",
    status: "active",
  },
  {
    id: 3,
    sequnce_number: "GPS-003",
    serial_number: "SRL-GPS-20033",
    device_id: "GD-4C9F6A",
    manufacture_date: new Date("2023-09-14"),
    imei_number: "860000001234563",
    status: "inactive",
  },
  {
    id: 4,
    sequnce_number: "GPS-004",
    serial_number: "SRL-GPS-20034",
    device_id: "GD-7D3B8E",
    manufacture_date: new Date("2024-02-08"),
    imei_number: "860000001234564",
    status: "active",
  },
  {
    id: 5,
    sequnce_number: "GPS-005",
    serial_number: "SRL-GPS-20035",
    device_id: "GD-1E7A2F",
    manufacture_date: new Date("2024-04-30"),
    imei_number: "860000001234565",
    status: "active",
  },
  {
    id: 6,
    sequnce_number: "GPS-006",
    serial_number: "SRL-GPS-20036",
    device_id: "GD-6F0C5B",
    manufacture_date: new Date("2024-06-12"),
    imei_number: "860000001234566",
    status: "inactive",
  },
];

const columns = [
  {
    key: "sno",
    label: "SNo",
    render: (_: GpsDevice, index: number) => index + 1,
  },
  { key: "sequnce_number", label: "Sequence No." },
  { key: "serial_number", label: "Serial Number" },
  { key: "device_id", label: "Device ID" },
  { key: "imei_number", label: "IMEI Number" },
  {
    key: "manufacture_date",
    label: "Manufacture Date",
    render: (item: GpsDevice) => new Date(item.manufacture_date).toLocaleDateString("en-IN"),
  },
  {
    key: "status",
    label: "Status",
    render: (item: GpsDevice) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          item.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}
      >
        {item.status}
      </span>
    ),
  },
];

const GpsIndexPage = () => {
  const [filteredGps, setFilteredGps] = useState<GpsDevice[]>(dummyGpsDevices);

  const handleSearch = useCallback((query: string) => {
    if (!query) {
      setFilteredGps(dummyGpsDevices);
      return;
    }
    const q = query.toLowerCase();
    const filtered = dummyGpsDevices.filter(
      (gps) =>
        gps.device_id.toLowerCase().includes(q) ||
        gps.imei_number.toLowerCase().includes(q) ||
        gps.serial_number.toLowerCase().includes(q) ||
        gps.sequnce_number.toLowerCase().includes(q) ||
        gps.status.toLowerCase().includes(q),
    );
    setFilteredGps(filtered);
  }, []);

  return (
    <div className="px-4 bg-white min-h-screen">
      <PageHeader title="GPS Devices" icon="gps_fixed" breadcrumb="Dashboard / GPS Devices" />

      <div className="my-4">
        <SearchComponent
          onSearch={handleSearch}
          placeholder="Search by Device ID, IMEI, Serial No..."
        />
      </div>

      <Table<GpsDevice> list={filteredGps} columns={columns} editUrl="/gps/edit" />
    </div>
  );
};

export default GpsIndexPage;
