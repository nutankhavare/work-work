import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

// Icons
import {
  Search,
  Eye,
  Users,
  IdCard,
  Bluetooth,
  UserRound,
  FileEdit,
  X
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
import type { Traveller } from "./Traveler.types";
import type { PaginatedResponse } from "../../Types/Index";
import { Loader } from "../../Components/UI/Loader";
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

const TravellerIndexPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  // Data State
  const [allTravelers, setAllTravelers] = useState<Traveller[]>([]);
  const [displayTravelers, setDisplayTravelers] = useState<Traveller[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(15);

  // 1. Fetch Data
  const fetchTravelers = async () => {
    try {
      setLoading(true);

      const response = await tenantApi.get<PaginatedResponse<Traveller>>(
        "/travellers",
        {
          params: {
            page: currentPage,
            per_page: perPage,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const travellers = response.data.data.data || [];
        setAllTravelers(travellers);
        setDisplayTravelers(travellers);

        setTotalPages(response.data.data.last_page);
        setTotalItems(response.data.data.total);
      }
    } catch (err) {
      console.error("Error fetching travellers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravelers();
  }, [currentPage, perPage]);

  // 2. Filter Logic
  useEffect(() => {
    let result = allTravelers;

    if (genderFilter) {
      result = result.filter(t => t.gender?.toLowerCase() === genderFilter.toLowerCase());
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((t) =>
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(lowerQuery) ||
        (t.beacon_id ?? "").toLowerCase().includes(lowerQuery) ||
        (t.traveller_uid ?? "").toLowerCase().includes(lowerQuery)
      );
    }

    setDisplayTravelers(result);
  }, [searchQuery, genderFilter, allTravelers]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setGenderFilter("");
  };

  const renderAvatar = (row: Traveller) => {
    const imgSrc = row.profile_photo
      ? `${centralAsset}${row.profile_photo}`
      : `https://ui-avatars.com/api/?name=${row.first_name}+${row.last_name}&background=random`;

    return (
      <img
        src={imgSrc}
        alt={`${row.first_name}`}
        className="h-10 w-10 rounded-full object-cover border border-[#e2e8f0] shadow-sm"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${row.first_name}+${row.last_name}&background=random`;
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-[var(--font-manrope)]">
      <PageHeader 
        title="Traveller Management" 
        icon={<Users size={18} />}
        breadcrumb="Admin / Users / Travellers"
      />

      <div className="px-6">
        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <StatCard title="Total Travellers" value={totalItems} icon={Users} colorClass="bg-blue-50 text-blue-600" />
            <StatCard title="Male" value={allTravelers.filter(t => t.gender?.toLowerCase() === 'male').length} icon={UserRound} colorClass="bg-amber-50 text-amber-600" />
            <StatCard title="Female" value={allTravelers.filter(t => t.gender?.toLowerCase() === 'female').length} icon={UserRound} colorClass="bg-pink-50 text-pink-600" />
            <StatCard title="Tagged" value={allTravelers.filter(t => t.beacon_id).length} icon={Bluetooth} colorClass="bg-violet-50 text-violet-600" />
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
                  placeholder="Search by name, UID or Beacon ID..."
                  className="w-full pl-12 pr-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[500] placeholder:text-[#94a3b8] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[400px]">
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>

                {(searchQuery || genderFilter) && (
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

          {/* Table Section */}
          <div className="relative">
            {loading ? (
              <div className="py-24 flex justify-center"><Loader /></div>
            ) : displayTravelers.length === 0 ? (
              <div className="py-24">
                <EmptyState
                  title="No Travellers Found"
                  description="Try adjusting your search or filters to find what you're looking for."
                  icon={<Users className="text-[#e2e8f0] mb-4" size={64} />}
                />
              </div>
            ) : (
              <>
                <TableContainer maxHeight="65vh">
                  <Table className="w-full min-w-[1000px]">
                    <Thead className="!bg-[#fafbff] border-b border-[#f1f5f9]">
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] pl-8">Traveller</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">UID Details</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Beacon Tag</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Gender</Th>
                      <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center pr-8">Actions</Th>
                    </Thead>

                    <Tbody>
                      {displayTravelers.map((row) => (
                        <Tr key={row.id} className="hover:bg-[#fdfbff] transition-colors border-b border-[#f8fafc] last:border-0">
                          <Td className="py-5 pl-8">
                            <div className="flex items-center gap-4">
                              {renderAvatar(row)}
                              <div>
                                <p className="text-[13.5px] font-[900] text-[#1e293b] leading-tight mb-1">{row.first_name} {row.last_name}</p>
                                {row.relationship && (
                                  <span className="inline-flex items-center px-2 py-0.5 bg-[#f1f5f9] rounded-[6px] text-[10px] font-[800] text-[#64748b] uppercase tracking-wider">
                                    {row.relationship}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Td>

                          <Td className="py-5">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <IdCard size={14} className="text-[#94a3b8]" />
                              </div>
                              <span className="text-[13px] font-[700] text-[#475569] font-mono tracking-tight">
                                {row.traveller_uid || "—"}
                              </span>
                            </div>
                          </Td>

                          <Td className="py-5 text-center">
                            {row.beacon_id ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f3ff] text-[#7c3aed] text-[11px] font-[800] rounded-lg border border-[#ddd6fe] uppercase tracking-widest">
                                <Bluetooth size={12} />
                                {row.beacon_id}
                              </span>
                            ) : (
                              <span className="text-[#94a3b8] text-[12px] italic">Not Assigned</span>
                            )}
                          </Td>

                          <Td className="py-5 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-[900] uppercase tracking-widest border shadow-xs ${
                              row.gender?.toLowerCase() === 'male' 
                                ? 'bg-[#fff7ed] text-[#9a3412] border-[#ffedd5]' 
                                : row.gender?.toLowerCase() === 'female'
                                ? 'bg-[#fdf2f8] text-[#9d174d] border-[#fce7f3]'
                                : 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0]'
                            }`}>
                              {row.gender || "N/A"}
                            </span>
                          </Td>

                          <Td className="py-5 text-center pr-8">
                            <div className="flex items-center justify-center gap-1.5">
                              <Link
                                to={`/travellers/show/${row.id}`}
                                className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] rounded-[10px] transition-all"
                                title="View Details"
                              >
                                <Eye size={17} />
                              </Link>

                              <button
                                onClick={async () => {
                                  if(await confirm("Modify this traveller record?")) {
                                    navigate(`/travellers/edit/${row.id}`);
                                  }
                                }}
                                className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#f5f3ff] rounded-[10px] transition-all"
                                title="Edit"
                              >
                                <FileEdit size={16} />
                              </button>
                            </div>
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
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    itemName="Travellers"
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

export default TravellerIndexPage;