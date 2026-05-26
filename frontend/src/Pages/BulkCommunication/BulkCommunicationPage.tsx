import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, 
  Mail, 
  MessageSquare, 
  BellRing, 
  Send, 
  Paperclip, 
  CalendarClock, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Trash2, 
  Edit,
  Search,
  ChevronRight,
  X
} from "lucide-react";

// Components
import PageHeader from "../../Components/UI/PageHeader";
import { Loader } from "../../Components/UI/Loader";
import tenantApi from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";

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

const BulkCommunicationPage = () => {
  const { showAlert } = useAlert();
  
  // Form State
  const [targetAudience, setTargetAudience] = useState("everyone");
  const [deliveryChannel, setDeliveryChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<{id: number, type: 'staff' | 'drivers', name: string}[]>([]);

  // Individual Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [allRecipients, setAllRecipients] = useState<{id: number, type: 'staff' | 'drivers', name: string, email: string}[]>([]);
  const [isFetchingRecipients, setIsFetchingRecipients] = useState(false);

  // Data State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSent: 0 });
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState<any[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        tenantApi.get("/broadcasts/stats"),
        tenantApi.get("/broadcasts")
      ]);
      
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      
      if (logsRes.data.success) {
        setDispatchLogs(logsRes.data.data.data || []);
        setScheduledBroadcasts((logsRes.data.data.data || []).filter((l: any) => l.status === 'scheduled'));
      }

    } catch (err) {
      console.error("Error fetching broadcasts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllRecipients = useCallback(async () => {
    try {
      setIsFetchingRecipients(true);
      const [staffRes, driversRes] = await Promise.all([
        tenantApi.get("/employees", { params: { per_page: 1000 } }),
        tenantApi.get("/drivers", { params: { per_page: 1000 } })
      ]);

      const staff = (staffRes.data.data?.data || []).map((s: any) => ({
        id: s.id,
        type: 'staff' as const,
        name: `${s.first_name} ${s.last_name}`,
        email: s.email
      }));

      const drivers = (driversRes.data.data?.data || []).map((d: any) => ({
        id: d.id,
        type: 'drivers' as const,
        name: `${d.first_name} ${d.last_name}`,
        email: d.email
      }));

      setAllRecipients([...staff, ...drivers]);
    } catch (err) {
      console.error("Error fetching recipients:", err);
    } finally {
      setIsFetchingRecipients(false);
    }
  }, []);

  useEffect(() => {
    if (targetAudience === "individual" && allRecipients.length === 0) {
      fetchAllRecipients();
    }
  }, [targetAudience, allRecipients.length, fetchAllRecipients]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendBroadcast = async () => {
    if (!subject || !messageBody) {
      showAlert("Please fill in both subject and message body", "warning");
      return;
    }

    try {
      setIsSending(true);
      const payload = {
        target_audience: targetAudience,
        channel: deliveryChannel,
        subject,
        body: messageBody,
        recipient_ids: targetAudience === "individual" ? selectedRecipients.map(r => ({ id: r.id, type: r.type === 'drivers' ? 'drivers' : 'staff' })) : undefined
      };

      const response = await tenantApi.post("/broadcasts", payload);
      
      if (response.data.success) {
        showAlert("Broadcast sent successfully!", "success");
        setSubject("");
        setMessageBody("");
        setSelectedRecipients([]);
        fetchData(); // Refresh logs
      }
    } catch (err) {
      console.error("Error sending broadcast:", err);
      showAlert("Failed to send broadcast", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-[var(--font-manrope)]">
      <PageHeader 
        title="Bulk Communication" 
        icon={<Megaphone size={18} />} 
        breadcrumb="Admin / Automated Messaging" 
      />

      <div className="px-6">
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[24px] border border-[#eef2f6] shadow-[0_4px_24px_rgba(30,41,59,0.04)] overflow-hidden"
            >
              <div className="px-8 py-5 border-b border-[#f1f5f9] bg-[#fafbff]/50 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#ede9fe] text-[#7c3aed]">
                  <Megaphone size={18} />
                </div>
                <span className="text-[12px] font-[900] uppercase tracking-wider text-[#1e293b]">Create Broadcast</span>
              </div>

              <div className="p-8 space-y-8">
                {/* Audience & Channel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-[800] text-[#64748b] uppercase tracking-widest mb-2 ml-1">
                      Target Audience <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] rounded-[14px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[13px] font-[600] text-[#1e293b] transition-all"
                    >
                      <option value="everyone">Everyone (Staff & Drivers)</option>
                      <option value="staff">All Staff</option>
                      <option value="drivers">All Drivers</option>
                      <option value="individual">Individual Selection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-[800] text-[#64748b] uppercase tracking-widest mb-2 ml-1">
                      Delivery Channel <span className="text-red-500">*</span>
                    </label>
                    <div className="flex p-1 bg-[#f1f5f9] rounded-2xl border border-[#e2e8f0]">
                      <button 
                        onClick={() => setDeliveryChannel("email")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-[900] uppercase tracking-wider transition-all ${
                          deliveryChannel === "email" 
                          ? "bg-white text-[#7c3aed] shadow-sm ring-1 ring-[#e2e8f0]" 
                          : "text-[#64748b] hover:text-[#1e293b]"
                        }`}
                      >
                        <Mail size={14} /> Email
                      </button>
                      <button 
                        onClick={() => setDeliveryChannel("sms")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-[900] uppercase tracking-wider transition-all ${
                          deliveryChannel === "sms" 
                          ? "bg-white text-[#7c3aed] shadow-sm ring-1 ring-[#e2e8f0]" 
                          : "text-[#64748b] hover:text-[#1e293b]"
                        }`}
                      >
                        <MessageSquare size={14} /> SMS
                      </button>
                      <button 
                        onClick={() => setDeliveryChannel("push")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-[900] uppercase tracking-wider transition-all ${
                          deliveryChannel === "push" 
                          ? "bg-white text-[#7c3aed] shadow-sm ring-1 ring-[#e2e8f0]" 
                          : "text-[#64748b] hover:text-[#1e293b]"
                        }`}
                      >
                        <BellRing size={14} /> Push
                      </button>
                    </div>
                  </div>
                </div>

                {/* Individual Selection UI */}
                <AnimatePresence>
                  {targetAudience === "individual" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div>
                        <label className="block text-[10px] font-[800] text-[#64748b] uppercase tracking-widest mb-2 ml-1">
                          Select Recipients <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#7c3aed]" size={16} />
                          <input 
                            type="text"
                            placeholder="Search staff or drivers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] rounded-[14px] focus:outline-none focus:border-[#7c3aed] text-[13px] font-[600]"
                          />
                        </div>
                      </div>

                      <div className="max-h-[200px] overflow-y-auto border border-[#e2e8f0] rounded-2xl bg-white p-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2">
                        {isFetchingRecipients ? <div className="col-span-full py-8 text-center"><Loader /></div> : 
                         allRecipients.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map(rec => {
                          const isSelected = selectedRecipients.some(s => s.id === rec.id && s.type === rec.type);
                          return (
                            <button
                              key={`${rec.type}-${rec.id}`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedRecipients(prev => prev.filter(s => !(s.id === rec.id && s.type === rec.type)));
                                } else {
                                  setSelectedRecipients(prev => [...prev, rec]);
                                }
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                isSelected ? 'bg-[#f5f3ff] border-[#7c3aed]' : 'bg-white border-[#f1f5f9] hover:bg-[#fafbff]'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                isSelected ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-[#cbd5e1]'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-[800] text-[#1e293b] truncate">{rec.name}</p>
                                <p className="text-[10px] font-[700] text-[#94a3b8] uppercase">{rec.type}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {selectedRecipients.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {selectedRecipients.map(s => (
                            <span key={`tag-${s.type}-${s.id}`} className="inline-flex items-center gap-2 px-3 py-1 bg-[#ede9fe] text-[#7c3aed] text-[10px] font-[900] rounded-lg">
                              {s.name}
                              <X size={12} className="cursor-pointer" onClick={() => setSelectedRecipients(prev => prev.filter(p => !(p.id === s.id && p.type === s.type)))} />
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Subject */}
                <div>
                  <label className="block text-[10px] font-[800] text-[#64748b] uppercase tracking-widest mb-2 ml-1">
                    Subject Line <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter a compelling subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-5 py-4 bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] rounded-[16px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[14px] font-[600] text-[#1e293b] transition-all placeholder:text-[#94a3b8]"
                  />
                </div>

                {/* Body */}
                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="text-[10px] font-[800] text-[#64748b] uppercase tracking-widest">
                      Message Body <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-[900] text-[#94a3b8] tracking-widest bg-[#f1f5f9] px-2 py-1 rounded-md">
                      {messageBody.length} / 5000
                    </span>
                  </div>
                  <textarea 
                    rows={8}
                    placeholder="Type your message here..."
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="w-full px-5 py-5 bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] rounded-[20px] focus:outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.08)] text-[14px] font-[500] text-[#1e293b] leading-relaxed transition-all placeholder:text-[#94a3b8] resize-none"
                  />
                </div>

                {/* Footer Actions */}
                <div className="pt-6 border-t border-[#f1f5f9] flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[12px] font-[800] hover:bg-[#f8fafc] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all">
                      <Paperclip size={16} /> Attach
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[12px] font-[800] hover:bg-[#f8fafc] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all">
                      <CalendarClock size={16} /> Schedule
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleSendBroadcast}
                    disabled={isSending || !subject || !messageBody}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-3.5 rounded-2xl text-[13px] font-[900] shadow-lg transition-all ${
                      isSending || !subject || !messageBody
                      ? "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed shadow-none"
                      : "bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-[0_8px_20px_rgba(124,58,237,0.25)] hover:-translate-y-0.5 active:translate-y-0"
                    }`}
                  >
                    {isSending ? <Loader /> : <Send size={18} />}
                    <span>{isSending ? "Dispatching..." : "Send Broadcast"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Stats & Logs */}
          <div className="lg:col-span-4 space-y-8">
            
            <StatCard 
              title="Total Sent" 
              value={stats.totalSent.toLocaleString()} 
              icon={Send} 
              colorClass="bg-blue-50 text-blue-600"
            />

            {/* Scheduled Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-[24px] border border-[#eef2f6] shadow-sm p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 text-[11px] font-[900] text-[#94a3b8] uppercase tracking-widest">
                  <Clock size={16} className="text-[#f59e0b]" /> Scheduled
                </h3>
                <span className="bg-[#fffbeb] text-[#d97706] text-[10px] font-[900] px-2.5 py-1 rounded-lg border border-[#fef3c7]">
                  {scheduledBroadcasts.length} PENDING
                </span>
              </div>

              <div className="space-y-4">
                {scheduledBroadcasts.length === 0 ? (
                  <div className="text-center py-8 px-4 border-2 border-dashed border-[#f1f5f9] rounded-2xl">
                    <p className="text-[11px] font-[700] text-[#94a3b8]">No broadcasts scheduled</p>
                  </div>
                ) : (
                  scheduledBroadcasts.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-[#fafbff] border border-[#f1f5f9] group">
                      <h4 className="text-[13px] font-[900] text-[#1e293b] mb-2">{item.title}</h4>
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-[700] text-[#64748b]">To: <span className="text-[#1e293b]">{item.audience}</span></span>
                        <span className="flex items-center gap-1.5 font-[900] text-[#f59e0b]">
                          <CalendarClock size={12} /> {item.time}
                        </span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#f1f5f9] flex justify-end gap-2">
                        <button className="p-1.5 rounded-lg text-[#64748b] hover:text-[#7c3aed] hover:bg-[#ede9fe] transition-all">
                          <Edit size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg text-[#64748b] hover:text-red-500 hover:bg-red-50" title="Cancel Schedule">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Dispatch Logs */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-[24px] border border-[#eef2f6] shadow-sm p-6"
            >
              <h3 className="flex items-center gap-2 text-[11px] font-[900] text-[#94a3b8] uppercase tracking-widest mb-6">
                <CheckCircle2 size={16} className="text-[#059669]" /> Dispatch Logs
              </h3>

              <div className="space-y-6">
                {dispatchLogs.length === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-[#f1f5f9] rounded-2xl">
                    <p className="text-[11px] font-[700] text-[#94a3b8]">No dispatch history yet</p>
                  </div>
                ) : (
                  dispatchLogs.map((log, index) => (
                  <div key={log.id} className="relative pl-4 group">
                    <div className="flex gap-4">
                      <div className={`mt-1 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
                        log.type === 'email' ? 'bg-[#ede9fe] text-[#7c3aed]' : 
                        log.type === 'sms' ? 'bg-[#fffbeb] text-[#f59e0b]' : 'bg-[#ecfdf5] text-[#059669]'
                      }`}>
                        {log.type === 'email' ? <Mail size={16} /> : 
                         log.type === 'sms' ? <MessageSquare size={16} /> : <BellRing size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-[900] text-[#1e293b] leading-tight truncate">{log.title}</h4>
                        <p className="text-[10px] font-[600] text-[#94a3b8] mt-1">{log.audience} • {log.time}</p>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <span className="flex items-center gap-1.5 text-[9px] font-[900] text-[#059669] px-2 py-1 bg-[#ecfdf5] rounded-md border border-[#d1fae5]">
                            <CheckCircle2 size={10} /> DELIVERED
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-[900] text-[#059669]">
                            <Eye size={12} /> {log.engagement}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-1.5 text-[#94a3b8] hover:text-[#7c3aed] transition-colors">
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {index !== dispatchLogs.length - 1 && (
                      <div className="absolute left-[34px] top-10 bottom-[-24px] w-[1px] bg-[#f1f5f9]"></div>
                    )}
                  </div>
                  ))
                )}
              </div>

              <button className="w-full mt-8 py-3 rounded-xl border border-[#f1f5f9] text-[11px] font-[800] text-[#64748b] hover:bg-[#fafbff] hover:text-[#7c3aed] transition-all uppercase tracking-widest">
                View All Logs
              </button>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCommunicationPage;
