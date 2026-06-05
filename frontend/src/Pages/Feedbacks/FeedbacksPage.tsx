import { MessageSquare } from "lucide-react";
import PageHeader from "../../Components/UI/PageHeader";

const FeedbacksPage = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-[var(--font-manrope)] animate-fade-in">
      <PageHeader 
        title="Feedbacks & Complaints" 
        icon={<MessageSquare size={18} />}
        breadcrumb="Admin / Support / Feedbacks"
      />
      <div className="px-6 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(30,41,59,0.03)] p-12 text-center max-w-[480px] w-full flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[#f5f3ff] rounded-2xl flex items-center justify-center text-[#7c3aed] mb-2 border border-[#eef2f6] shadow-sm">
            <MessageSquare size={28} />
          </div>
          <h2 className="text-xl font-[900] text-[#1e293b] uppercase tracking-tight">Under Development</h2>
          <p className="text-[13px] font-[600] text-[#64748b] leading-relaxed">
            This module is currently under development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbacksPage;
