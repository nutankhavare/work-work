import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Icons
import {
  Search,
  Eye,
  MapPin,
  Bus,
  Building,
  UserCircle,
  X,
  Armchair,
  CheckCircle,
  Clock,
  Slash
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

// Services & Utils
import tenantApi, { centralAsset } from "../../Services/ApiService";
import type { Booking } from "./Booking.types";
import { Loader } from "../../Components/UI/Loader";

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

const getStatusStyles = (status: string) => {
  const s = status?.toLowerCase();
  switch (s) {
    case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "active": return "bg-blue-50 text-blue-700 border-blue-200";
    case "completed": return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "cancelled": return "bg-rose-50 text-rose-700 border-rose-200";
    default: return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const BookingIndexPage = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [displayBookings, setDisplayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await tenantApi.get("/bookings", {
        params: { per_page: 100, status: statusFilter }
      });
      if (response.data.success) {
        const bookings = response.data.data.data || [];
        setAllBookings(bookings);
        setDisplayBookings(bookings);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  useEffect(() => {
    let result = allBookings;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((b) =>
        `${b.traveller_first_name} ${b.traveller_last_name}`.toLowerCase().includes(lowerQuery) ||
        (b.employee_id ?? "").toLowerCase().includes(lowerQuery) ||
        (b.pickup_location_name ?? "").toLowerCase().includes(lowerQuery) ||
        (b.assigned_vehicle ?? "").toLowerCase().includes(lowerQuery)
      );
    }
    setDisplayBookings(result);
    setCurrentPage(1);
  }, [searchQuery, allBookings]);

  const indexOfLastItem = currentPage * perPage;
  const indexOfFirstItem = indexOfLastItem - perPage;
  const currentItems = displayBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayBookings.length / perPage);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const renderAvatar = (row: Booking) => {
    const imgSrc = row.traveller_profile_photo
      ? `${centralAsset}${row.traveller_profile_photo}`
      : `https://ui-avatars.com/api/?name=${row.traveller_first_name}+${row.traveller_last_name}&background=random`;

    return (
      <img
        src={imgSrc}
        alt="Traveller"
        className="h-10 w-10 rounded-full object-cover border border-[#e2e8f0] shadow-sm"
        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${row.traveller_first_name}+${row.traveller_last_name}&background=random`; }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-[var(--font-manrope)]">
      <PageHeader 
        title="Booking Management" 
        icon={<Armchair size={18} />}
        breadcrumb="Admin / Fleet / Bookings"
      />

      <div className="px-6">
        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <StatCard title="Total Bookings" value={allBookings.length} icon={Armchair} colorClass="bg-blue-50 text-blue-600" />
            <StatCard title="Approved" value={allBookings.filter(b => b.status === 'Approved').length} icon={CheckCircle} colorClass="bg-emerald-50 text-emerald-600" />
            <StatCard title="Pending" value={allBookings.filter(b => b.status === 'Pending').length} icon={Clock} colorClass="bg-amber-50 text-amber-600" />
            <StatCard title="Cancelled" value={allBookings.filter(b => b.status === 'Cancelled').length} icon={Slash} colorClass="bg-rose-50 text-rose-600" />
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by traveller, location, vehicle..."
                  className="w-full pl-12 pr-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[500] placeholder:text-[#94a3b8] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[400px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
                >
                  <option value="">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                {(searchQuery || statusFilter) && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center justify-center gap-2 px-4 py-[13px] bg-red-50 text-red-600 rounded-[12px] text-[13px] font-[800] hover:bg-red-100 transition-all border border-red-100"
                  >
                    <X size={16} /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            {loading ? (
              <div className="py-24 flex justify-center"><Loader /></div>
            ) : displayBookings.length === 0 ? (
              <div className="py-24">
                <EmptyState
                  title="No Bookings Found"
                  description="Try adjusting your search or filters to find what you're looking for."
                  icon={<Armchair className="text-[#e2e8f0] mb-4" size={64} />}
                />
              </div>
            ) : (
              <>
                <TableContainer maxHeight="65vh">
                  <Table className="w-full min-w-[1000px]">
                    <Thead className="!bg-[#fafbff] border-b border-[#f1f5f9]">
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] pl-8">Traveller</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">Pickup Information</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">Assigned Vehicle</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Status</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center pr-8">Actions</Th>
                    </Thead>

                    <Tbody>
                      {currentItems.map((row) => (
                        <Tr key={row.id} className="hover:bg-[#fdfbff] transition-colors border-b border-[#f8fafc] last:border-0">
                          <Td className="py-5 pl-8">
                            <div className="flex items-center gap-4">
                              {renderAvatar(row)}
                              <div>
                                <p className="text-[13.5px] font-[900] text-[#1e293b] leading-tight mb-1">{row.traveller_first_name} {row.traveller_last_name}</p>
                                <div className="flex items-center gap-1.5 text-[10.5px] font-[800] text-[#64748b] uppercase tracking-wider">
                                  <UserCircle size={12} className="text-[#cbd5e1]" />
                                  {row.employee_id || "--"}
                                </div>
                              </div>
                            </div>
                          </Td>

                          <Td className="py-5">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-2 text-[13px] font-[800] text-[#475569]">
                                <MapPin size={14} className="text-rose-400" />
                                {row.pickup_location_name}
                              </span>
                              <span className="text-[11px] font-[700] text-slate-400 pl-5 uppercase tracking-tight">
                                {row.pickup_location_city}
                              </span>
                            </div>
                          </Td>

                          <Td className="py-5">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-[12px] font-[700] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 w-fit">
                                <Bus size={14} />
                                {row.assigned_vehicle || "Unassigned"}
                              </div>
                              {row.organisation_name && (
                                <div className="flex items-center gap-1.5 text-[10px] font-[800] text-slate-400 uppercase pl-1">
                                  <Building size={12} className="text-slate-300" />
                                  {row.organisation_name}
                                </div>
                              )}
                            </div>
                          </Td>

                          <Td className="py-5 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-[900] uppercase tracking-widest border shadow-xs ${getStatusStyles(row.status)}`}>
                              {row.status}
                            </span>
                          </Td>

                          <Td className="py-5 text-center pr-8">
                            <Link
                              to={`/bookings/show/${row.id}`}
                              className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] rounded-[10px] transition-all inline-flex"
                              title="View Details"
                            >
                              <Eye size={17} />
                            </Link>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>

                {totalPages > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={displayBookings.length}
                    onPageChange={setCurrentPage}
                    itemName="Bookings"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingIndexPage;