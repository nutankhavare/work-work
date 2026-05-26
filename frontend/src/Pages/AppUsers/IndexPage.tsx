import { Users, Search, UserPlus } from "lucide-react";
import PageHeader from "../../Components/UI/PageHeader";
import EmptyState from "../../Components/UI/EmptyState";
import { motion } from "framer-motion";

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

const AppUsersIndexPage = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-[var(--font-manrope)]">
      <PageHeader 
        title="App Users" 
        icon={<Users size={18} />}
        breadcrumb="Admin / Users / App Access"
      />

      <div className="px-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <StatCard title="Total App Users" value="0" icon={Users} colorClass="bg-blue-50 text-blue-600" />
            <StatCard title="Active Sessions" value="0" icon={UserPlus} colorClass="bg-emerald-50 text-emerald-600" />
            <StatCard title="New Registrations" value="0" icon={Search} colorClass="bg-amber-50 text-amber-600" subtext="Last 30 days" />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] overflow-hidden">
          <div className="p-6 border-b border-[#f1f5f9] bg-[#fafbff]/50">
             <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-[900] text-[#1e293b] uppercase tracking-wider">User Directory</h3>
                <div className="relative group w-64">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7c3aed]" />
                   <input 
                     type="text" 
                     placeholder="Search users..." 
                     className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-[600] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-[#7c3aed] transition-all"
                   />
                </div>
             </div>
          </div>

          <div className="py-24">
            <EmptyState
              title="No App Users Yet"
              description="App user data will be synchronized here once trainees start registering via the mobile application."
              icon={<Users className="text-[#e2e8f0] mb-4" size={64} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppUsersIndexPage;