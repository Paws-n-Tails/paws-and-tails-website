import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PawIcon, UserIcon, CalendarIcon } from '../components/Icons';

import ClientDatabase from './ClientDatabase';
import CalendarView from './CalendarView';

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
      // 1. Fetch Clients/Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      // 2. Fetch Appointments (ordered by the date_start column)
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

  const handleAdminDecision = async (id, decision) => {
    let newStatus = decision === 'confirm' ? 'scheduled' : 'declined';
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

  const pendingRequests = leads.filter(l => l.status === 'pending');

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
                You are suggesting a new Meet & Greet time for <strong>{reschedulingLead.owner_name}</strong> and their pet <strong>{reschedulingLead.pet_name}</strong>.
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
      <div className="w-64 bg-[#104b57] text-white flex flex-col shadow-2xl z-20 flex-shrink-0">
        <div className="p-6 flex flex-col items-center border-b border-white/10">
          <div className="w-20 h-20 rounded-full border-2 border-[#ffd1bc] overflow-hidden bg-white mb-3">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover transform scale-[1.2]" />
          </div>
          <h2 className="font-black font-serif text-xl tracking-wider">ADMIN PORTAL</h2>
        </div>
        
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <button onClick={() => setActiveTab('meetAndGreets')} className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${activeTab === 'meetAndGreets' ? 'bg-white/10 text-[#ffd1bc] font-bold border-r-4 border-[#d65a47]' : 'text-white/70 hover:text-white hover:bg-white/5 font-medium'}`}>
                <PawIcon className="w-5 h-5" /> Meet & Greets
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
        
        <div className="p-6 border-t border-white/10">
          <button onClick={() => setIsAdminView(false)} className="flex items-center gap-2 text-sm text-white/70 hover:text-[#d65a47] font-bold transition-colors w-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path></svg>
            Return to Website
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col h-screen">
        
        {/* Pass leads, appointments, AND fetchDashboardData to both components */}
        {activeTab === 'clientDatabase' && <ClientDatabase leads={leads} appointments={appointments} fetchDashboardData={fetchDashboardData} />}
        {activeTab === 'calendar' && <CalendarView leads={leads} appointments={appointments} fetchDashboardData={fetchDashboardData} />}

        {activeTab === 'meetAndGreets' && (
          <>
            <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center z-10 flex-shrink-0">
              <div>
                <h1 className="text-2xl font-black text-[#3a302a] font-serif">Meet & Greet Management</h1>
                <p className="text-sm text-gray-500 font-medium">Review applications and respond to clients.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={fetchDashboardData} className="text-[#104b57] hover:bg-gray-100 p-2 rounded-full transition-colors" title="Refresh Data">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
                <div className="bg-[#fdf8f5] px-4 py-2 rounded-full text-sm font-bold text-[#d65a47] flex items-center gap-2 border border-[#ffd1bc]">
                  <span className="w-2 h-2 rounded-full bg-[#d65a47] animate-pulse"></span>
                  {pendingRequests.length} Needs Action
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-[#104b57]">Pending Requests</h3>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><PawIcon className="w-10 h-10 text-gray-300" /></div>
                    <h3 className="text-xl font-bold text-gray-600">Your schedule is clear!</h3>
                    <p className="text-gray-400 mt-2">No pending meet and greet requests at the moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pendingRequests.map((lead) => {
                      const meetDateObj = new Date(lead.meet_date + 'T12:00:00');
                      return (
                        <div key={lead.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group relative">
                          <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                            {formatTimeAgo(lead.created_at)}
                          </div>
                          <div className="h-48 w-full bg-gray-100 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {lead.pet_photo && lead.pet_photo.startsWith('http') ? (
                               <img src={lead.pet_photo} alt={lead.pet_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                               <PawIcon className="w-16 h-16 text-gray-300" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4">
                              <h2 className="text-3xl font-black text-white font-serif drop-shadow-md">{lead.pet_name}</h2>
                              <p className="text-[#ffd1bc] font-medium text-sm flex items-center gap-1 drop-shadow-md">
                                {lead.breed} • {lead.age}
                              </p>
                            </div>
                          </div>
                          <div className="p-5 flex-1 flex flex-col gap-4">
                            <div className="bg-[#fdf8f5] rounded-xl p-3 border border-[#ffd1bc]/50 flex items-center gap-3">
                              <div className="bg-[#d65a47] text-white p-2 rounded-lg flex flex-col items-center justify-center min-w-[3rem] shadow-sm">
                                <span className="text-[10px] uppercase font-bold leading-none mb-1">{meetDateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span className="text-lg font-black leading-none">{meetDateObj.getDate()}</span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Requested Slot</p>
                                <p className="text-sm font-black text-[#104b57]">{meetDateObj.toLocaleDateString('en-US', { weekday: 'short' })} at {lead.meet_time}</p>
                              </div>
                            </div>
                            <div>
                               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Human Details</p>
                               <div className="flex items-center justify-between mb-1">
                                 <span className="font-bold text-[#3a302a]">{lead.owner_name}</span>
                                 <span className="text-xs font-bold text-[#d65a47] bg-[#d65a47]/10 px-2 py-0.5 rounded-full">{lead.pet_weight}</span>
                               </div>
                               <p className="text-sm text-gray-600 truncate">{lead.email}</p>
                               <p className="text-sm text-gray-600">{lead.phone}</p>
                            </div>
                            {lead.info && (
                              <div className="mt-2">
                                 <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Notes</p>
                                 <p className="text-sm text-gray-500 italic line-clamp-3 bg-gray-50 p-3 rounded-xl border border-gray-100">"{lead.info}"</p>
                              </div>
                            )}
                          </div>
                          <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-2 mt-auto">
                            <button onClick={() => handleAdminDecision(lead.id, 'confirm')} className="w-full bg-[#104b57] hover:bg-[#0c3942] text-white font-black py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              Confirm Request
                            </button>
                            <div className="flex gap-2">
                              <button onClick={() => openRescheduleModal(lead)} className="flex-1 bg-white border-2 border-yellow-400 text-yellow-700 font-bold text-xs py-2 rounded-xl hover:bg-yellow-50 transition-colors">
                                Suggest Date
                              </button>
                              <button onClick={() => handleAdminDecision(lead.id, 'decline')} className="flex-1 bg-white border-2 border-red-200 text-red-600 font-bold text-xs py-2 rounded-xl hover:bg-red-50 transition-colors">
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}