import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Self-contained Icons to prevent export errors
const CameraIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>);
const XIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>);
const ClockIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);
const CalendarIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>);
const PawIcon = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12,12.5c-1.38,0-2.5,1.12-2.5,2.5s1.12,2.5,2.5,2.5s2.5-1.12,2.5-2.5S13.38,12.5,12,12.5z M6,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S7.1,10,6,10z M18,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S19.1,10,18,10z M12,3c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,3,12,3z"/></svg>);

export default function CalendarView({ leads, appointments }) {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [viewMode, setViewMode] = useState('month'); 
  const [searchPills, setSearchPills] = useState([]);

  const masterAgenda = [];

  // 1. Process Meet & Greets
  leads?.filter(l => l.status === 'scheduled').forEach(lead => {
    masterAgenda.push({
      id: `mg_${lead.id}`,
      type: 'M&G',
      date: lead.meet_date,
      time: lead.meet_time,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      client: lead,
      currentDay: 1,
      totalDays: 1,
      fullAppt: { 
        service_type: 'Meet & Greet', 
        date_start: lead.meet_date, 
        time_start: lead.meet_time,
        date_end: lead.meet_date,
        time_end: lead.meet_time
      }
    });
  });

  // 2. Process Appointments with Day Counting
  appointments?.forEach(appt => {
    const client = leads.find(l => l.id === appt.lead_id) || {};
    const startD = new Date(appt.date_start + 'T12:00:00');
    const endD = new Date(appt.date_end + 'T12:00:00');
    const totalDays = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1;

    if (appt.service_type === 'day_care') {
       let current = new Date(startD);
       let dayCounter = 1;
       while (current <= endD) {
         const dateString = current.toISOString().split('T')[0];
         masterAgenda.push({
           id: `dc_${appt.id}_${current.getTime()}`,
           type: 'Day Care',
           date: dateString,
           currentDay: dayCounter,
           totalDays: totalDays,
           time: (appt.time_start && appt.time_end) ? `${appt.time_start} - ${appt.time_end}` : 'All Day',
           color: 'bg-orange-100 text-orange-800 border-orange-200',
           client: client,
           fullAppt: appt 
         });
         current.setDate(current.getDate() + 1);
         dayCounter++;
       }
    } else {
       let current = new Date(startD);
       let dayCounter = 1;
       while (current <= endD) {
         const dateString = current.toISOString().split('T')[0];
         let label = 'Over Night';
         if (dayCounter === 1) label = 'Drop-Off';
         if (current.getTime() === endD.getTime()) label = 'Pick-Up';

         masterAgenda.push({
           id: `on_${appt.id}_${current.getTime()}`,
           type: label,
           date: dateString,
           currentDay: dayCounter,
           totalDays: totalDays,
           time: label === 'Drop-Off' ? appt.time_start : label === 'Pick-Up' ? appt.time_end : 'All Day',
           color: label === 'Drop-Off' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                  label === 'Pick-Up' ? 'bg-rose-100 text-rose-800 border-rose-200' : 
                  'bg-indigo-100 text-indigo-800 border-indigo-200',
           client: client,
           fullAppt: appt 
         });
         current.setDate(current.getDate() + 1);
         dayCounter++;
       }
    }
  });

  const eventsByDate = masterAgenda.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const filteredEventsByDate = Object.keys(eventsByDate).reduce((acc, date) => {
    const filtered = eventsByDate[date].filter(event => {
      if (searchPills.length === 0) return true;
      return searchPills.every(pill => 
        event.client.pet_name?.toLowerCase().includes(pill.toLowerCase())
      );
    });
    if (filtered.length > 0) acc[date] = filtered;
    return acc;
  }, {});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayString = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {selectedEvent && (
        <>
          <div className="fixed inset-0 z-40 bg-[#104b57]/20 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}></div>
          <div className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-gray-200 animate-[slideInRight_0.3s_ease-out]">
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all">
              <XIcon className="w-5 h-5" />
            </button>
            <div className="overflow-y-auto flex-1">
              <div className="h-64 bg-[#104b57] relative w-full overflow-hidden">
                {selectedEvent.client.pet_photo ? (
                   <img src={selectedEvent.client.pet_photo} alt={selectedEvent.client.pet_name} className="w-full h-full object-cover opacity-90" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-[#fdf8f5]"><PawIcon className="w-16 h-16 text-[#d65a47]/10" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#104b57] via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-8">
                  <h2 className="text-5xl font-black text-white font-serif">{selectedEvent.client.pet_name}</h2>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ClockIcon className="w-4 h-4 text-[#d65a47]" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arrival & Departure</span>
                    </div>
                    <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 relative">
                        <div className="absolute left-11 top-16 bottom-16 w-0.5 bg-gray-200 border-dashed border-l-2 border-gray-300" />
                        <div className="space-y-12 relative">
                            <div className="flex items-start gap-6">
                                <div className="w-7 h-7 rounded-full bg-[#104b57] flex items-center justify-center shrink-0 z-10 shadow-lg border-4 border-white">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Check-In Arrival</p>
                                    <p className="text-4xl font-serif italic text-gray-800 mt-1">{selectedEvent.fullAppt.time_start || "7:00 AM"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-6">
                                <div className="w-7 h-7 rounded-full bg-[#d65a47] flex items-center justify-center shrink-0 z-10 shadow-lg border-4 border-white">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Check-Out Pick-Up</p>
                                    <p className="text-4xl font-serif italic text-gray-800 mt-1">{selectedEvent.fullAppt.time_end || "7:00 PM"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#fdf8f5] rounded-[2rem] p-8 border border-[#ffd1bc] flex justify-between items-center shadow-sm">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-[#d65a47] font-serif">
                        {selectedEvent.currentDay}{[undefined, 'st', 'nd', 'rd'][selectedEvent.currentDay] || 'th'} Day
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">( Out of {selectedEvent.totalDays} Days )</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#104b57] font-serif">${Number(selectedEvent.fullAppt.price || 0).toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{selectedEvent.type} Est. Revenue</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </>
      )}

      <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center z-10 flex-shrink-0">
        <div className="flex items-center gap-8 flex-1 max-w-2xl">
          <h1 className="text-2xl font-black text-[#3a302a] font-serif">Facility Calendar</h1>
          <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-2xl flex-1 items-center border-2 border-transparent focus-within:border-[#104b57]/20 min-h-[50px]">
            {searchPills.map(pill => (
              <span key={pill} className="bg-[#104b57] text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-sm">
                {pill} <button onClick={() => setSearchPills(searchPills.filter(p => p !== pill))}><XIcon className="w-3 h-3"/></button>
              </span>
            ))}
            <input 
              placeholder="Search guest name..."
              className="bg-transparent text-sm outline-none flex-1 p-1"
              onKeyUp={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                    setSearchPills([...new Set([...searchPills, e.target.value.trim()])]);
                    e.target.value = '';
                }
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-black uppercase bg-[#104b57]/10 text-[#104b57] rounded-xl hover:bg-[#104b57]/20">Today</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-full min-h-[750px]">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50 font-black text-[11px] text-gray-400 uppercase py-4 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 flex-1 gap-px bg-gray-200">
            {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => <div key={i} className="bg-gray-50/50" />)}
            {Array.from({ length: new Date(year, month + 1, 0).getDate() }).map((_, i) => {
              const day = i + 1;
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = (filteredEventsByDate[dStr] || []).slice(0, 4);
              return (
                <div key={day} className="bg-white p-3 min-h-[120px] flex flex-col group relative">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black mb-2 ${dStr === todayString ? 'bg-[#104b57] text-white shadow-lg' : 'text-gray-400 group-hover:bg-gray-50 transition-colors'}`}>{day}</div>
                  <div className="space-y-1.5">
                    {dayEvents.map(e => (
                      <div key={e.id} onClick={() => setSelectedEvent(e)} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black truncate cursor-pointer ${e.color} border shadow-sm transition-transform hover:scale-[1.03]`}>
                        {e.client.pet_name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}