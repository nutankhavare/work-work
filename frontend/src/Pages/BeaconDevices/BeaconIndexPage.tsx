import { useState, useCallback } from "react";
import PageHeader from "../../Components/UI/PageHeader";
import Table from "../../Components/UI/Table";
import SearchComponent from "../../Components/UI/SearchComponents";
import type { BeaconDevice } from "../../Types/Index";

// Dummy beacon devices data
const dummyBeacons: BeaconDevice[] = [
  {
    id: 1,
    sequnce_number: "BEA-001",
    serial_number: "SRL-BEA-10021",
    device_id: "BD-4F2A1C",
    manufacture_date: new Date("2023-06-15"),
    imei_number: "352099001761481",
    status: "active",
  },
  {
    id: 2,
    sequnce_number: "BEA-002",
    serial_number: "SRL-BEA-10022",
    device_id: "BD-7C3E9D",
    manufacture_date: new Date("2023-08-20"),
    imei_number: "352099001761482",
    status: "active",
  },
  {
    id: 3,
    sequnce_number: "BEA-003",
    serial_number: "SRL-BEA-10023",
    device_id: "BD-1A8B5F",
    manufacture_date: new Date("2023-11-05"),
    imei_number: "352099001761483",
    status: "inactive",
  },
  {
    id: 4,
    sequnce_number: "BEA-004",
    serial_number: "SRL-BEA-10024",
    device_id: "BD-9D6C2E",
    manufacture_date: new Date("2024-01-10"),
    imei_number: "352099001761484",
    status: "active",
  },
  {
    id: 5,
    sequnce_number: "BEA-005",
    serial_number: "SRL-BEA-10025",
    device_id: "BD-3B0F7A",
    manufacture_date: new Date("2024-03-22"),
    imei_number: "352099001761485",
    status: "inactive",
  },
  {
    id: 6,
    sequnce_number: "BEA-006",
    serial_number: "SRL-BEA-10026",
    device_id: "BD-5E4D8B",
    manufacture_date: new Date("2024-05-18"),
    imei_number: "352099001761486",
    status: "active",
  },
];

const columns = [
  {
    key: "sno",
    label: "SNo",
    render: (_: BeaconDevice, index: number) => index + 1,
  },
  { key: "sequnce_number", label: "Sequence No." },
  { key: "serial_number", label: "Serial Number" },
  { key: "device_id", label: "Device ID" },
  { key: "imei_number", label: "IMEI Number" },
  {
    key: "manufacture_date",
    label: "Manufacture Date",
    render: (item: BeaconDevice) =>
      new Date(item.manufacture_date).toLocaleDateString("en-IN"),
  },
  {
    key: "status",
    label: "Status",
    render: (item: BeaconDevice) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          item.status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-600"
        }`}
      >
        {item.status}
      </span>
    ),
  },
];

const BeaconIndexPage = () => {
  const [filteredBeacons, setFilteredBeacons] =
    useState<BeaconDevice[]>(dummyBeacons);

  const handleSearch = useCallback((query: string) => {
    if (!query) {
      setFilteredBeacons(dummyBeacons);
      return;
    }
    const q = query.toLowerCase();
    const filtered = dummyBeacons.filter(
      (beacon) =>
        beacon.device_id.toLowerCase().includes(q) ||
        beacon.imei_number.toLowerCase().includes(q) ||
        beacon.serial_number.toLowerCase().includes(q) ||
        beacon.sequnce_number.toLowerCase().includes(q) ||
        beacon.status.toLowerCase().includes(q)
    );
    setFilteredBeacons(filtered);
  }, []);

  return (
    <div className="px-4 bg-white min-h-screen">
      <PageHeader
        title="Beacon Devices"
        icon="bluetooth_searching"
        breadcrumb="Dashboard / Beacon Devices"
      />

      <div className="my-4">
        <SearchComponent
          onSearch={handleSearch}
          placeholder="Search by Device ID, IMEI, Serial No..."
        />
      </div>

      <Table<BeaconDevice>
        list={filteredBeacons}
        columns={columns}
        editUrl="/beacons/edit"
      />
    </div>
  );
};

export default BeaconIndexPage;
