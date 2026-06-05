import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
    Search,
    Shield,
    ShieldCheck,
    // AlertCircle,
    // UserCog,
    Eye,
    Edit,
    Trash2,
    // Plus,
    Users,
    Activity,
    Lock,
    Settings,
} from "lucide-react";

// Components
import PageHeader from "../../Components/UI/PageHeader";
import {
    TableContainer,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
} from "../../Components/Table/Table";
import { Pagination } from "../../Components/Table/Pagination";
import { Loader } from "../../Components/UI/Loader";

import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
import {
    type Role,
    getAvatarColor,
} from "../../data/rolesData";

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

/* ── VIEW DETAIL OVERLAY ── */
const ViewOverlay = ({
    role,
    index,
    onClose,
}: {
    role: Role;
    index: number;
    onClose: () => void;
}) => {
    const av = getAvatarColor(index);
    const init = role.roleName.slice(0, 2);

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
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] p-8 flex items-center gap-6 rounded-t-2xl">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-[900] border-[3px] border-white/30 shrink-0"
                        style={{ background: av.bg, color: av.cl }}
                    >
                        {init}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-[900] text-white mb-1 uppercase tracking-tight">
                            {role.roleName}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-[12px] text-white/75 font-[600]">
                                ID: #{role.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-[800] uppercase tracking-wider border shadow-xs ${
                                role.status === "Active" 
                                    ? "bg-[#ecfdf5] text-[#059669] border-[#d1fae5]" 
                                    : "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]"
                            }`}>
                                {role.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <p className="text-[10px] font-[800] text-[#94a3b8] uppercase tracking-wider mb-1">Department</p>
                            <p className="text-[14px] font-[700] text-[#1e293b]">{role.department}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-[800] text-[#94a3b8] uppercase tracking-wider mb-1">Access Level</p>
                            <p className="text-[14px] font-[700] text-[#1e293b]">{role.accessLevel}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-[800] text-[#94a3b8] uppercase tracking-wider mb-1">Assigned Users</p>
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-[#7c3aed]" />
                                <span className="text-[14px] font-[700] text-[#1e293b]">{role.assignedUsers} Users</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-[800] text-[#94a3b8] uppercase tracking-wider mb-1">Last Modified</p>
                            <p className="text-[14px] font-[700] text-[#1e293b]">{role.lastModified}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <p className="text-[10px] font-[800] text-[#94a3b8] uppercase tracking-wider mb-2">Role Description</p>
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-[13px] text-[#475569] leading-relaxed">
                            {role.description || "No description provided for this role."}
                        </div>
                    </div>

                    {/* Permissions */}
                    <div>
                        <p className="text-[10px] font-[800] text-[#94a3b8] uppercase tracking-wider mb-3">Permissions ({role.permissions.length})</p>
                        <div className="flex flex-wrap gap-2">
                            {role.permissions.map((p) => (
                                <span
                                    key={p}
                                    className="px-3 py-1 bg-[#ede9fe] text-[#7c3aed] text-[11px] font-[800] rounded-full uppercase tracking-tight"
                                >
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export const IndexPage = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    /* ── Data State ── */
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        admin: 0,
        custom: 0,
    });

    /* ── Filters ── */
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    /* ── Overlays ── */
    const [viewRole, setViewRole] = useState<{ r: Role; idx: number } | null>(null);
    const [deleteRole, setDeleteRole] = useState<Role | null>(null);

    /* ── Fetch Data ── */
    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await tenantApi.get("/roles");
            const responseData = response.data.data;
            const data = Array.isArray(responseData) ? responseData : (responseData?.data || []);
            
            const mappedRoles = data.map((r: any) => ({
                id: r.id,
                roleName: r.name,
                department: r.department || "Unassigned",
                accessLevel: r.access_level || "Read Only",
                description: r.description || "",
                permissions: r.permissions?.map((p: any) => p.name) || [],
                assignedUsers: parseInt(r.assigned_users) || 0,
                lastModified: new Date(r.updated_at || r.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                status: r.status || "Active",
                createdBy: r.created_by || "Admin User"
            }));
            
            setRoles(mappedRoles);
            
            // Stats
            setStats({
                total: mappedRoles.length,
                active: mappedRoles.filter((r: any) => r.status === "Active").length,
                admin: mappedRoles.filter((r: any) => r.accessLevel === "Root Access" || r.accessLevel === "Full Access").length,
                custom: mappedRoles.filter((r: any) => r.accessLevel === "Partial Access" || r.accessLevel === "Read Only").length,
            });
        } catch (error) {
            showAlert("Failed to fetch roles.", "error");
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    /* ── Filtering ── */
    const filtered = roles.filter((r) => {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
            !q ||
            r.roleName.toLowerCase().includes(q) ||
            r.department.toLowerCase().includes(q) ||
            String(r.id).includes(q) ||
            r.accessLevel.toLowerCase().includes(q);
        const matchStatus = statusFilter === "All" || r.status === statusFilter;
        return matchSearch && matchStatus;
    });

    /* ── Handlers ── */
    const handleDelete = async () => {
        if (!deleteRole) return;
        try {
            await tenantApi.delete(`/roles/${deleteRole.id}`);
            setRoles((prev) => prev.filter((r) => r.id !== deleteRole.id));
            showAlert("Role deleted successfully", "success");
            setDeleteRole(null);
        } catch (error) {
            showAlert("Failed to delete role", "error");
        }
    };

    return (
        <div className="min-h-screen font-[var(--font-manrope)]">
            {/* Header Section */}
            <div className="mb-2">
                <PageHeader
                    title="Roles & Permissions"
                    icon={<ShieldCheck size={18} />}
                    breadcrumb="Admin / Roles & Permissions"
                    buttonText="Add New Role"
                    buttonLink="/roles/create"
                />
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatCard
                    title="Total Roles"
                    value={stats.total}
                    icon={Shield}
                    colorClass="bg-[#ede9fe] text-[#7c3aed]"
                    delay={0}
                />
                <StatCard
                    title="Active Roles"
                    value={stats.active}
                    icon={Activity}
                    colorClass="bg-[#ecfdf5] text-[#059669]"
                    delay={0.05}
                />
                <StatCard
                    title="Admin Access"
                    value={stats.admin}
                    icon={Lock}
                    colorClass="bg-[#fffbeb] text-[#d97706]"
                    delay={0.1}
                />
                <StatCard
                    title="Custom Access"
                    value={stats.custom}
                    icon={Settings}
                    colorClass="bg-[#ebf5ff] text-[#2563eb]"
                    delay={0.15}
                />
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] overflow-hidden">
                
                {/* Search & Filters */}
                <div className="p-6 border-b border-[#f1f5f9] bg-[#fafbff]/50">
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
                        <div className="flex-1 relative group">
                            <Search
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#7c3aed] transition-colors"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search by role name, department or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[500] placeholder:text-[#94a3b8] transition-all"
                            />
                        </div>

                        <div className="lg:w-[200px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-[13px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[12px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[700] text-[#475569] appearance-none cursor-pointer hover:border-[#cbd5e1] transition-colors"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="relative">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center gap-4">
                            <Loader />
                            <p className="text-[14px] font-[700] text-[#94a3b8]">Fetching Role Definitions...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-[16px] font-[800] text-[#1e293b] mb-1">No Roles Found</h3>
                            <p className="text-[13px] text-[#94a3b8]">Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <TableContainer maxHeight="65vh">
                                <Table className="w-full min-w-[1000px]">
                                    <Thead className="!bg-[#fafbff] border-b border-[#f1f5f9]">
                                        <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] pl-8">Role Identity</Th>
                                        <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px]">Permissions Summary</Th>
                                        <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Assigned Users</Th>
                                        <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Last Modified</Th>
                                        <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center">Status</Th>
                                        <Th className="text-[11px] font-[900] uppercase tracking-[0.08em] !text-[#64748b] py-[18px] text-center pr-8">Actions</Th>
                                    </Thead>
                                    <Tbody>
                                        {filtered.map((r, fi) => {
                                            const av = getAvatarColor(fi);
                                            const init = r.roleName.slice(0, 2);
                                            return (
                                                <Tr key={r.id} className="hover:bg-[#fdfbff] transition-colors group relative border-b border-[#f8fafc] last:border-0">
                                                    <Td className="py-5 pl-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center font-[900] text-[14px]" style={{ background: av.bg, color: av.cl }}>
                                                                {init}
                                                            </div>
                                                            <div>
                                                                <p className="text-[13.5px] font-[900] text-[#1e293b] leading-tight mb-1 uppercase">{r.roleName}</p>
                                                                <p className="text-[11px] font-[700] text-[#94a3b8] uppercase tracking-wide">{r.department} • {r.accessLevel}</p>
                                                            </div>
                                                        </div>
                                                    </Td>
                                                    <Td className="py-5">
                                                        <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                                                            {r.permissions.slice(0, 2).map(p => (
                                                                <span key={p} className="px-2 py-0.5 bg-[#f1f5f9] text-[#64748b] text-[10px] font-[800] rounded-md border border-[#e2e8f0] uppercase">
                                                                    {p}
                                                                </span>
                                                            ))}
                                                            {r.permissions.length > 2 && (
                                                                <span className="px-2 py-0.5 bg-[#ede9fe] text-[#7c3aed] text-[10px] font-[800] rounded-md border border-[#ddd6fe] uppercase">
                                                                    +{r.permissions.length - 2} MORE
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Td>
                                                    <Td className="py-5 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Users size={14} className="text-[#94a3b8]" />
                                                            <span className="text-[13px] font-[900] text-[#1e293b]">+{r.assignedUsers}</span>
                                                        </div>
                                                    </Td>
                                                    <Td className="py-5 text-center text-[12px] font-[700] text-[#64748b]">
                                                        {r.lastModified}
                                                    </Td>
                                                    <Td className="py-5 text-center">
                                                        <span className={`px-3 py-1.5 rounded-full text-[10.5px] font-[900] uppercase tracking-wider border shadow-xs ${
                                                            r.status === "Active" 
                                                                ? "bg-[#ecfdf5] text-[#059669] border-[#d1fae5]" 
                                                                : "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]"
                                                        }`}>
                                                            {r.status}
                                                        </span>
                                                    </Td>
                                                    <Td className="py-5 text-center pr-8">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button 
                                                                onClick={() => setViewRole({ r, idx: fi })}
                                                                className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] rounded-[8px] transition-all"
                                                                title="View Details"
                                                            >
                                                                <Eye size={17} />
                                                            </button>
                                                            <button 
                                                                onClick={() => navigate(`/roles/edit/${r.id}`)}
                                                                className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] rounded-[8px] transition-all"
                                                                title="Edit Role"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => setDeleteRole(r)}
                                                                className="p-2 text-[#64748b] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-[8px] transition-all"
                                                                title="Delete Role"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </Td>
                                                </Tr>
                                            );
                                        })}
                                    </Tbody>
                                </Table>
                            </TableContainer>

                            <Pagination
                                currentPage={1}
                                totalPages={1}
                                totalItems={roles.length}
                                onPageChange={() => {}}
                                itemName="roles"
                                perPage={roles.length}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {viewRole && (
                    <ViewOverlay
                        role={viewRole.r}
                        index={viewRole.idx}
                        onClose={() => setViewRole(null)}
                    />
                )}
                {deleteRole && (
                    <div className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-6" onClick={() => setDeleteRole(null)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-2xl p-8 max-w-[420px] w-full text-center shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-5">
                                <Trash2 size={32} className="text-[#dc2626]" />
                            </div>
                            <h3 className="text-[18px] font-[900] text-[#dc2626] mb-2">Delete Role?</h3>
                            <p className="text-[13px] text-[#64748b] mb-6 leading-relaxed">
                                You are about to permanently delete <span className="font-[800] text-[#1e293b]">{deleteRole.roleName}</span>. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteRole(null)} className="flex-1 px-5 py-3 bg-[#f1f5f9] text-[#64748b] rounded-xl font-[800] text-[13px] hover:bg-[#e2e8f0] transition-all uppercase">Cancel</button>
                                <button onClick={handleDelete} className="flex-1 px-5 py-3 bg-[#dc2626] text-white rounded-xl font-[800] text-[13px] hover:bg-[#b91c1c] transition-all shadow-lg shadow-red-100 uppercase">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default IndexPage;