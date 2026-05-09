import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PawIcon, UserIcon, CalendarIcon } from '../components/Icons';

import ClientDatabase from './ClientDatabase';
import CalendarView from './CalendarView';
import FinancialDashboard from './FinancialDashboard';

export default function Admin({ setIsAdminView, logoUrl }) {
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('meetAndGreets');

  // Reschedule Modal States
  const [availableWeekends, setAvailableWeekends] = useState([]);
  const [reschedulingLead, setReschedulingLead] = useState(null);
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Inner tab state for Meet & Greets
  const [meetAndGreetTab, setMeetAndGreetTab] = useState('pending');

  useEffect(() => {
    fetchDashboardData();

    // Generate upcoming weekends for the reschedule dropdown
    const weekends = [];
    let currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    for (let i = 1; i <= 30; i++) {
      let nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + i);
      if (nextDate.getDay() === 0 || nextDate.getDay() === 6) weekends.push(nextDate);
    }
    setAvailableWeekends(weekends);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      const { data: apptsData, error: apptsError } = await supabase
        .from('appointments')
        .select('*')
        .order('date_start', { ascending: true });
        
      if (apptsError) throw apptsError;
      setAppointments(apptsData || []);

    } catch (error) {
      console.error("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp);
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return `${Math.floor(mins/1440)}d ago`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No Date Selected';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAdminDecision = async (id, decision) => {
    let newStatus = decision; 
    if (decision === 'confirm') newStatus = 'scheduled';
    if (decision === 'decline') newStatus = 'declined';
    
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (updateError) throw updateError;
      fetchDashboardData();
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const openRescheduleModal = (lead) => {
    setReschedulingLead(lead);
    setSuggestedDate(lead.meet_date);
    setSuggestedTime(lead.meet_time);
  };

  const handleSendSuggestion = async (e) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: 'pending_rescheduled',
          meet_date: suggestedDate,
          meet_time: suggestedTime
        })
        .eq('id', reschedulingLead.id);
      
      if (updateError) throw updateError;

      await fetchDashboardData();
      setReschedulingLead(null);
    } catch (error) {
      alert("Failed to send suggestion.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-[#104b57] font-black text-2xl">Loading Admin Portal...</div>;
  }

  const pendingRequests = leads.filter(l => l.status === 'pending' || l.status === 'pending_rescheduled')
                               .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                               
  const scheduledRequests = leads.filter(l => l.status === 'scheduled')
                                 .sort((a, b) => new Date(a.meet_date) - new Date(b.meet_date));

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative">
      
      {/* RESCHEDULE MODAL */}
      {reschedulingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative animate-[slideInRight_0.2s_ease-out]">
            <div className="bg-orange-400 p-5 text-white flex justify-between items-center">
              <h2 className="text-xl font-black font-serif flex items-center gap-2">Suggest New Time</h2>
              <button onClick={() => setReschedulingLead(null)} className="text-white/70 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleSendSuggestion} className="p-6 flex flex-col gap-6">
              <div className="bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-200 text-sm font-medium">
                You are suggesting a new Meet &amp; Greet time for <strong>{reschedulingLead.owner_name}</strong> and their pet <strong>{reschedulingLead.pet_name}</strong>.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Suggested Date</label>
                  <select required value={suggestedDate} onChange={(e) => setSuggestedDate(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-orange-400 focus:outline-none bg-white font-bold text-gray-700 text-sm">
                    <option value="">Select date...</option>
                    {availableWeekends.map((date, idx) => (
                      <option key={idx} value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`}>
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Suggested Time</label>
                  <select required value={suggestedTime} onChange={(e) => setSuggestedTime(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-orange-400 focus:outline-none bg-white font-bold text-gray-700 text-sm">
                    <option value="">Select time...</option>
                    {["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setReschedulingLead(null)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={isSending} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-black hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm text-sm">
                  {isSending ? "Sending..." : "Send Suggestion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Sidebar */}
      <div className="w-64 bg-[#104b57] text-white flex flex-col shadow-2xl z-20 flex-shrink-0 h-screen">
        <div className="p-6 flex flex-col items-center border-b border-white/10">
          <div className="w-20 h-20 rounded-full border-2 border-[#ffd1bc] overflow-hidden bg-white mb-3">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover transform scale-[1.2]" />
          </div>
          <h2 className="font-black font-serif text-xl tracking-wider uppercase">Admin Portal</h2>
        </div>
        
        <nav className="py-6 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <button onClick={() => setActiveTab('meetAndGreets')} className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${activeTab === 'meetAndGreets' ? 'bg-white/10 text-[#ffd1bc] font-bold border-r-4 border-[#d65a47]' : 'text-white/70 hover:text-white hover:bg-white/5 font-medium'}`}>
                <PawIcon className="w-5 h-5" /> Meet &amp; Greets
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('clientDatabase')} className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${activeTab === 'clientDatabase' ? 'bg-white/10 text-[#ffd1bc] font-bold border-r-4 border-[#d65a47]' : 'text-white/70 hover:text-white hover:bg-white/5 font-medium'}`}>
                <UserIcon className="w-5 h-5" /> Client Database
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${activeTab === 'calendar' ? 'bg-white/10 text-[#ffd1bc] font-bold border-r-4 border-[#d65a47]' : 'text-white/70 hover:text-white hover:bg-white/5 font-medium'}`}>
                <CalendarIcon className="w-5 h-5" /> Calendar
              </button>
            </li>
          </ul>
        </nav>

        {/* SPACER pushes Financials to bottom */}
        <div className="flex-1"></div>
        
        <div className="border-t border-white/10">
            <button onClick={() => setActiveTab('financials')} className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${activeTab === 'financials' ? 'bg-white/10 text-[#ffd1bc] font-bold border-r-4 border-[#d65a47]' : 'text-white/70 hover:text-white hover:bg-white/5 font-medium'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Financials
            </button>
        </div>

        <div className="p-6 border-t border-white/10">
          <button onClick={() => setIsAdminView(false)} className="flex items-center gap-2 text-sm text-white/40 hover:text-[#d65a47] font-bold transition-colors w-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path></svg>
            Return to Website
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col h-screen">
        
        {activeTab === 'clientDatabase' && <ClientDatabase leads={leads} appointments={appointments} fetchDashboardData={fetchDashboardData} />}
        {activeTab === 'calendar' && <CalendarView leads={leads} appointments={appointments} fetchDashboardData={fetchDashboardData} />}
        {activeTab === 'financials' && <FinancialDashboard leads={leads} appointments={appointments} />}

        {activeTab === 'meetAndGreets' && (
          <div className="flex flex-col h-full">
            <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center z-10 flex-shrink-0">
              <div>
                <h1 className="text-2xl font-black text-[#3a302a] font-serif">Meet &amp; Greet Management</h1>
                <p className="text-sm text-gray-500 font-medium">Review applications and respond to clients.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={fetchDashboardData} className="text-[#104b57] hover:bg-gray-100 p-2 rounded-full transition-colors" title="Refresh Data">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border ${pendingRequests.length > 0 ? 'bg-[#fdf8f5] text-[#d65a47] border-[#ffd1bc]' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  <span className={`w-2 h-2 rounded-full bg-current ${pendingRequests.length > 0 ? 'animate-pulse' : ''}`}></span>
                  {pendingRequests.length} Needs Action
                </div>
              </div>
            </header>

            <div className="bg-white border-b border-gray-200 px-8 py-3 flex gap-2 z-10">
              <button
                onClick={() => setMeetAndGreetTab('pending')}
                className={`px-5 py-2 rounded-xl text-sm font-black tracking-wide transition-colors border ${
                  meetAndGreetTab === 'pending' 
                    ? 'bg-[#104b57] text-white border-[#104b57] shadow-md' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Pending Requests ({pendingRequests.length})
              </button>
              <button
                onClick={() => setMeetAndGreetTab('scheduled')}
                className={`px-5 py-2 rounded-xl text-sm font-black tracking-wide transition-colors border ${
                  meetAndGreetTab === 'scheduled' 
                    ? 'bg-[#104b57] text-white border-[#104b57] shadow-md' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Scheduled ({scheduledRequests.length})
              </button>
            </div>

            <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
              <div className="max-w-5xl mx-auto">
                
                {meetAndGreetTab === 'pending' && (
                  <div>
                    {pendingRequests.length === 0 ? (
                      <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-200 flex flex-col items-center justify-center mt-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <PawIcon className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-[#3a302a] font-serif mb-2">Your schedule is clear!</h3>
                        <p className="text-gray-400 font-medium">No pending meet and greet requests at the moment.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {pendingRequests.map(lead => (
                          <div key={lead.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-center md:items-stretch transition-all hover:shadow-md relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-yellow-400"></div>
                            
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-[#fdf8f5] flex-shrink-0 border-2 border-gray-100 flex items-center justify-center shadow-sm relative group">
                              {lead.pet_photo ? <img src={lead.pet_photo} alt={lead.pet_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <PawIcon className="w-10 h-10 text-[#d65a47]/20" />}
                            </div>

                            <div className="flex-1 flex flex-col justify-center w-full">
                              <div className="mb-3 text-center md:text-left">
                                <h3 className="text-2xl font-black text-[#3a302a] font-serif">{lead.pet_name}</h3>
                                <p className="text-sm font-bold text-gray-500">{lead.breed} • {lead.age} • <span className="text-[#d65a47]">{lead.pet_weight}</span></p>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-3">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex-1">
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Owner Contact</p>
                                   <p className="font-bold text-[#104b57] text-sm">{lead.owner_name}</p>
                                   <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-500 mt-0.5">
                                     <span>{lead.phone}</span>
                                     <span>{lead.email}</span>
                                   </div>
                                </div>
                              </div>

                              {lead.info && (
                                <div className="mt-3 text-xs text-gray-500 bg-[#fdf8f5] p-3 rounded-xl border border-[#ffd1bc]/50">
                                  <span className="font-bold text-[#d65a47] uppercase tracking-wider text-[10px] block mb-1">Application Notes:</span> 
                                  {lead.info}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-3 w-full md:w-56 flex-shrink-0 justify-center">
                               <div className="bg-[#e8f1f2] border border-[#104b57]/20 rounded-xl p-4 text-center relative">
                                 <div className="absolute top-2 right-2 text-[10px] font-bold text-gray-400">{formatTimeAgo(lead.created_at)}</div>
                                 <p className="text-[10px] font-black text-[#104b57] uppercase tracking-widest mb-1.5 mt-2">Requested Time</p>
                                 <div className="font-bold text-gray-800 flex items-center justify-center gap-1.5 text-sm">
                                   <CalendarIcon className="w-4 h-4 text-[#d65a47]" /> {formatDate(lead.meet_date)}
                                 </div>
                                 <div className="text-base font-black text-[#d65a47] mt-1">{lead.meet_time || 'No Time Set'}</div>
                               </div>
                               
                               <button onClick={() => handleAdminDecision(lead.id, 'confirm')} className="w-full bg-[#104b57] text-white py-2.5 rounded-xl font-black text-sm hover:bg-[#0c3942] transition-colors shadow-sm">
                                 Approve &amp; Schedule
                               </button>
                               <div className="flex gap-2">
                                 <button onClick={() => openRescheduleModal(lead)} className="flex-1 bg-white border-2 border-yellow-400 text-yellow-700 py-2.5 rounded-xl font-bold text-xs hover:bg-yellow-50 transition-colors">
                                   Suggest Date
                                 </button>
                                 <button onClick={() => handleAdminDecision(lead.id, 'decline')} className="flex-1 bg-white border-2 border-red-200 text-red-600 py-2.5 rounded-xl font-bold text-xs hover:bg-red-50 transition-colors">
                                   Decline
                                 </button>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {meetAndGreetTab === 'scheduled' && (
                  <div>
                    {scheduledRequests.length === 0 ? (
                      <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-200 flex flex-col items-center justify-center mt-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <CalendarIcon className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-[#3a302a] font-serif mb-2">No scheduled meetings</h3>
                        <p className="text-gray-400 font-medium">Approved requests will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {scheduledRequests.map(lead => (
                          <div key={lead.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-center md:items-stretch transition-all hover:shadow-md relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-400"></div>
                            
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-[#fdf8f5] flex-shrink-0 border-2 border-gray-100 flex items-center justify-center shadow-sm">
                              {lead.pet_photo ? <img src={lead.pet_photo} alt={lead.pet_name} className="w-full h-full object-cover" /> : <PawIcon className="w-10 h-10 text-[#d65a47]/20" />}
                            </div>

                            <div className="flex-1 flex flex-col justify-center w-full">
                              <div className="mb-3 text-center md:text-left">
                                <h3 className="text-2xl font-black text-[#3a302a] font-serif">{lead.pet_name}</h3>
                                <p className="text-sm font-bold text-gray-500">{lead.breed} • {lead.age} • <span className="text-[#d65a47]">{lead.pet_weight}</span></p>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-3">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex-1">
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Owner Contact</p>
                                   <p className="font-bold text-[#104b57] text-sm">{lead.owner_name}</p>
                                   <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-500 mt-0.5">
                                     <span>{lead.phone}</span>
                                     <span>{lead.email}</span>
                                   </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 w-full md:w-56 flex-shrink-0 justify-center">
                               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Scheduled For</p>
                                 <div className="font-bold text-gray-800 flex items-center justify-center gap-1.5 text-sm">
                                   <CalendarIcon className="w-4 h-4 text-blue-500" /> {formatDate(lead.meet_date)}
                                 </div>
                                 <div className="text-base font-black text-blue-600 mt-1">{lead.meet_time || 'TBD'}</div>
                               </div>
                               
                               <button onClick={() => handleAdminDecision(lead.id, 'client')} className="w-full bg-[#d65a47] text-white py-3 rounded-xl font-black text-sm hover:bg-[#c44a38] transition-colors shadow-sm disabled:opacity-50">
                                 Mark as Active Client
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}