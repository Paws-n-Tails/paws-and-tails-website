import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Integrated Components
import ClientDatabase from './ClientDatabase';
import CalendarView from './CalendarView';
import FinancialDashboard from './FinancialDashboard';
import MediaGallery from './MediaGallery';

// Self-Contained Icons
const PawIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12,12.5c-1.38,0-2.5,1.12-2.5,2.5s1.12,2.5,2.5,2.5s2.5-1.12,2.5-2.5S13.38,12.5,12,12.5z M6,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S7.1,10,6,10z M18,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S19.1,10,18,10z M12,3c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,3,12,3z"/></svg>);
const UserIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>);
const CalendarIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>);
const CameraIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>);
const LogoutIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>);
const ChevronIcon = ({ className, isCollapsed }) => (
  <svg className={`${className} transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
);

export default function Admin({ setIsAdminView, logoUrl }) {
  // --- AUTH & UI STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // --- DATA STATE ---
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clientDatabase');
  const [meetAndGreetTab, setMeetAndGreetTab] = useState('pending');

  // --- RESCHEDULE STATE ---
  const [availableWeekends, setAvailableWeekends] = useState([]);
  const [reschedulingLead, setReschedulingLead] = useState(null);
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('admin_auth_persistent');
    if (isAuth === 'true') setIsAuthenticated(true);
    fetchDashboardData();

    // Weekend Generator
    const weekends = [];
    let current = new Date();
    current.setHours(0,0,0,0);
    for (let i = 1; i <= 30; i++) {
      let d = new Date(current);
      d.setDate(current.getDate() + i);
      if (d.getDay() === 0 || d.getDay() === 6) weekends.push(d);
    }
    setAvailableWeekends(weekends);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const securePassword = String(import.meta.env.VITE_ADMIN_PASSWORD || '5364').trim();
    if (String(passwordInput).trim() === securePassword) {
      setIsAuthenticated(true);
      setAuthError(false);
      localStorage.setItem('admin_auth_persistent', 'true');
    } else {
      setAuthError(true);
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of the Admin Portal?")) {
      setIsAuthenticated(false);
      localStorage.removeItem('admin_auth_persistent');
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: l } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      const { data: a } = await supabase.from('appointments').select('*').order('date_start', { ascending: true });
      setLeads(l || []);
      setAppointments(a || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No Date';

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#104b57] flex items-center justify-center p-6 font-sans">
        <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl border-8 border-[#0c3942]">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[#fdf8f5] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#ffd1bc] shadow-sm">
                <PawIcon className="w-10 h-10 text-[#d65a47]" />
            </div>
            <h1 className="text-3xl font-black text-[#3a302a] font-serif italic tracking-tight">Staff Entry</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Paws & Tails Resort</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} 
              className={`w-full p-6 bg-gray-50 rounded-3xl border-2 text-center text-2xl font-bold transition-all ${authError ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-[#ffd1bc]'}`} 
              placeholder="••••" autoFocus
            />
            <button type="submit" className="w-full bg-[#104b57] text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#0c3942] transition-all">Access Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`bg-[#104b57] text-white flex flex-col shadow-2xl z-20 h-screen transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-10 bg-[#d65a47] text-white rounded-full p-1 shadow-lg hover:scale-110 transition-all z-30">
          <ChevronIcon className="w-4 h-4" isCollapsed={isCollapsed} />
        </button>

        <div className="p-6 flex flex-col items-center border-b border-white/10 overflow-hidden whitespace-nowrap">
          <div className={`rounded-full border-2 border-[#ffd1bc] overflow-hidden bg-white transition-all duration-300 ${isCollapsed ? 'w-10 h-10 mb-0' : 'w-20 h-20 mb-3'}`}>
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover scale-125" />
          </div>
          {!isCollapsed && <h2 className="font-black font-serif text-xl tracking-wider uppercase">Admin Portal</h2>}
        </div>
        
        <nav className="py-6 flex-1 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-2">
            {[
              { id: 'clientDatabase', label: 'Client Database', icon: <UserIcon className="w-5 h-5"/> },
              { id: 'calendar', label: 'Facility Calendar', icon: <CalendarIcon className="w-5 h-5"/> },
              { id: 'meetAndGreets', label: 'Meet & Greets', icon: <PawIcon className="w-5 h-5"/> },
              { id: 'media', label: 'Media Gallery', icon: <CameraIcon className="w-5 h-5"/> }
            ].map(tab => (
              <li key={tab.id}>
                <button onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 px-6 py-4 transition-all relative ${activeTab === tab.id ? 'bg-white/10 text-[#ffd1bc]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                  <div className="shrink-0">{tab.icon}</div>
                  {!isCollapsed && <span className="font-bold text-sm tracking-wide">{tab.label}</span>}
                  {activeTab === tab.id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#d65a47]" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* BOTTOM SECTION */}
        <div className="mt-auto border-t border-white/10">
            <button onClick={() => setActiveTab('financials')} className={`w-full flex items-center gap-4 px-6 py-6 transition-all ${activeTab === 'financials' ? 'bg-white/10 text-[#ffd1bc]' : 'text-white/70 hover:text-white'}`}>
                <div className="shrink-0 font-bold text-lg">$</div>
                {!isCollapsed && <span className="font-bold text-sm tracking-wide">Financials</span>}
            </button>

            <div className="p-4 bg-black/10 space-y-1">
              <button onClick={() => setIsAdminView(false)} className="flex items-center gap-4 px-3 py-3 text-xs text-white/40 hover:text-white font-bold w-full transition-all group">
                <div className="shrink-0">
                   <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                </div>
                {!isCollapsed && <span className="whitespace-nowrap">Back to Website</span>}
              </button>
              <button onClick={handleLogout} className="flex items-center gap-4 px-3 py-3 text-xs text-[#d65a47] hover:text-red-400 font-black w-full transition-all group">
                <div className="shrink-0"><LogoutIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /></div>
                {!isCollapsed && <span className="uppercase tracking-widest">Logout Admin</span>}
              </button>
            </div>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50 text-[#104b57] font-black text-2xl animate-pulse italic">Syncing Vault...</div>
        ) : (
          <>
            {activeTab === 'clientDatabase' && <ClientDatabase leads={leads} appointments={appointments} fetchDashboardData={fetchDashboardData} />}
            {activeTab === 'calendar' && <CalendarView leads={leads} appointments={appointments} fetchDashboardData={fetchDashboardData} />}
            {activeTab === 'financials' && <FinancialDashboard leads={leads} appointments={appointments} />}
            {activeTab === 'media' && <MediaGallery leads={leads} />}
            {activeTab === 'meetAndGreets' && (
              <div className="flex flex-col h-full bg-gray-50">
                <header className="bg-white shadow-sm py-6 px-8 flex justify-between items-center">
                  <h1 className="text-2xl font-black text-[#3a302a] font-serif italic">Meet & Greet Requests</h1>
                  <button onClick={fetchDashboardData} className="text-[#104b57] hover:bg-gray-100 p-2 rounded-full transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
                </header>
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-5xl mx-auto space-y-6">
                    {leads.filter(l => l.status === 'pending').map(lead => (
                      <div key={lead.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 relative overflow-hidden transition-all hover:shadow-md">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-yellow-400"></div>
                        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border flex items-center justify-center">
                          {lead.pet_photo ? <img src={lead.pet_photo} alt="pet" className="w-full h-full object-cover" /> : <PawIcon className="w-12 h-12 text-[#d65a47]/20" />}
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 className="text-2xl font-black text-[#3a302a] font-serif">{lead.pet_name}</h3>
                          <p className="text-sm font-bold text-gray-500">{lead.breed} • {lead.owner_name}</p>
                          <div className="mt-3 flex gap-2"><span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold text-[#104b57]">{lead.phone}</span></div>
                        </div>
                        <div className="flex flex-col gap-3 justify-center text-center bg-[#e8f1f2] border border-[#104b57]/10 p-4 rounded-3xl min-w-[200px]">
                           <p className="text-[10px] font-black text-[#104b57] uppercase tracking-widest">Requested</p>
                           <p className="font-bold text-sm">{formatDate(lead.meet_date)}</p>
                           <p className="text-lg font-black text-[#d65a47]">{lead.meet_time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* RESCHEDULE MODAL */}
      {reschedulingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-[#3a302a] font-serif mb-6">Suggest Time</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleLogout(); }} className="space-y-4">
              <select value={suggestedDate} onChange={(e) => setSuggestedDate(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-[#ffd1bc]">
                {availableWeekends.map((d, i) => <option key={i} value={d.toISOString().split('T')[0]}>{d.toDateString()}</option>)}
              </select>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-[#104b57] text-white py-4 rounded-2xl font-black uppercase text-[10px]">Send</button>
                <button type="button" onClick={() => setReschedulingLead(null)} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}