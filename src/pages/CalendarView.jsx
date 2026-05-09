import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarIcon, PawIcon, SunIcon, MoonIcon } from '../components/Icons';

const timeOptions = ["7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === 'All Day') return -1; 
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (hours === 12 && modifier === 'AM') hours = 0;
  if (modifier === 'PM' && hours < 12) hours += 12;
  return hours * 60 + parseInt(minutes, 10);
};

export default function CalendarView({ leads, appointments, fetchDashboardData }) {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [viewMode, setViewMode] = useState('month'); 
  const [showLegend, setShowLegend] = useState(true); // <-- NEW STATE

  const [isEditingAppt, setIsEditingAppt] = useState(false);
  const [editApptForm, setEditApptForm] = useState({});
  const [isSavingAppt, setIsSavingAppt] = useState(false);

  const masterAgenda = [];

  // 1. Add "Scheduled" Meet & Greets
  leads.filter(l => l.status === 'scheduled').forEach(lead => {
    masterAgenda.push({
      id: `mg_${lead.id}`,
      type: 'M&G',
      date: lead.meet_date,
      time: lead.meet_time,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      client: lead,
      fullAppt: { type: 'Meet & Greet', start_date: lead.meet_date, start_time: lead.meet_time }
    });
  });

  // 2. Add dynamic appointments
  appointments.forEach(appt => {
    const client = leads.find(l => l.id === appt.lead_id) || {};
    if (appt.service_type === 'day_care') {
       const start = new Date(appt.date_start + 'T12:00:00');
       const end = new Date(appt.date_end + 'T12:00:00');
       let current = new Date(start);
       while (current <= end) {
         const dateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
         const timeDisplay = (appt.time_start && appt.time_end) ? `${appt.time_start} - ${appt.time_end}` : 'All Day';
         masterAgenda.push({
           id: `dc_${appt.id}_${current.getTime()}`,
           type: 'Day Care',
           date: dateString,
           time: timeDisplay,
           color: 'bg-orange-100 text-orange-800 border-orange-200',
           client: client,
           fullAppt: appt 
         });
         current.setDate(current.getDate() + 1);
       }
    } else {
       masterAgenda.push({
         id: `do_${appt.id}`,
         type: 'Drop-Off',
         date: appt.date_start,
         time: appt.time_start,
         color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
         client: client,
         fullAppt: appt
       });
       const start = new Date(appt.date_start + 'T12:00:00');
       const end = new Date(appt.date_end + 'T12:00:00');
       let current = new Date(start);
       current.setDate(current.getDate() + 1); 
       while (current < end) { 
         const dateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
         masterAgenda.push({
           id: `on_${appt.id}_${current.getTime()}`,
           type: 'Over Night',
           date: dateString,
           time: 'All Day',
           color: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
           client: client,
           fullAppt: appt 
         });
         current.setDate(current.getDate() + 1);
       }
       masterAgenda.push({
         id: `pu_${appt.id}`,
         type: 'Pick-Up',
         date: appt.date_end,
         time: appt.time_end,
         color: 'bg-rose-100 text-rose-800 border-rose-200',
         client: client,
         fullAppt: appt
       });
    }
  });

  const eventsByDate = masterAgenda.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayString = new Date().toISOString().split('T')[0];

  const handleDateJump = (day) => {
    const newDate = new Date(year, month, day);
    setCurrentDate(newDate);
    setViewMode('today');
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEditingAppt(false);
  };

  const getWeekDates = () => {
    const dates = [];
    let temp = new Date(currentDate);
    temp.setDate(temp.getDate() - temp.getDay()); 
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }
    return dates;
  };

  const sortedMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      
      {/* SIDE DRAWER */}
      {selectedEvent && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}></div>
          <div className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-gray-200 animate-[slideInRight_0.3s_ease-out]">
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="overflow-y-auto flex-1 pb-10">
              <div className="h-56 bg-gray-100 relative w-full border-b-4 border-[#ffd1bc]">
                {selectedEvent.client.pet_photo ? (
                   <img src={selectedEvent.client.pet_photo} alt={selectedEvent.client.pet_name} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-[#fdf8f5]"><PawIcon className="w-16 h-16 text-[#d65a47]/20" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-6"><h2 className="text-4xl font-black text-white font-serif drop-shadow-md">{selectedEvent.client.pet_name}</h2></div>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-[#fdf8f5] rounded-2xl p-5 border-2 border-[#ffd1bc]">
                  <h3 className="font-black text-[#d65a47] uppercase tracking-widest text-xs flex items-center gap-2 mb-3"><CalendarIcon className="w-4 h-4" /> Appointment Details</h3>
                  <p className="text-xl font-black text-[#3a302a]">{selectedEvent.type}</p>
                  <p className="text-sm font-bold text-gray-600 mt-1">{new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} {selectedEvent.time !== 'All Day' && `at ${selectedEvent.time}`}</p>
                  {selectedEvent.fullAppt.price && (
                    <div className="mt-4 pt-4 border-t border-[#ffd1bc]/50 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Total Revenue</span>
                      <span className="text-lg font-black text-green-600">${Number(selectedEvent.fullAppt.price).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Human Contact</p>
                   <p className="font-black text-[#104b57]">{selectedEvent.client.owner_name}</p>
                   <p className="text-sm text-gray-600">{selectedEvent.client.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* HEADER WITH VIEW TABS */}
      <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center z-10 flex-shrink-0">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-2xl font-black text-[#3a302a] font-serif">Facility Calendar</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
               {viewMode === 'month' ? `${sortedMonthNames[month]} ${year}` : viewMode === 'week' ? 'Weekly Flow' : 'Daily Dashboard'}
            </p>
          </div>

          <div className="bg-gray-100 p-1 rounded-xl flex shadow-inner">
            {['today', 'week', 'month'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === mode ? 'bg-white text-[#104b57] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* LEGEND TOGGLE BUTTON */}
          <button 
            onClick={() => setShowLegend(!showLegend)} 
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${showLegend ? 'bg-[#ffd1bc] border-[#d65a47] text-[#d65a47]' : 'bg-white border-gray-200 text-gray-400'}`}
          >
            {showLegend ? "Hide Legend" : "Show Legend"}
          </button>

          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-black uppercase bg-[#104b57]/10 text-[#104b57] rounded-xl hover:bg-[#104b57]/20 transition-colors">Today</button>
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => {
              const d = new Date(currentDate);
              if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
              else if (viewMode === 'week') d.setDate(d.getDate() - 7);
              else d.setDate(d.getDate() - 1);
              setCurrentDate(d);
            }} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
            <button onClick={() => {
              const d = new Date(currentDate);
              if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
              else if (viewMode === 'week') d.setDate(d.getDate() + 7);
              else d.setDate(d.getDate() + 1);
              setCurrentDate(d);
            }} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
        {/* TODAY VIEW */}
        {viewMode === 'today' && (() => {
          const dateStr = currentDate.toISOString().split('T')[0];
          const todayEvents = (eventsByDate[dateStr] || []).sort((a,b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
          return (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-3xl font-black text-[#3a302a] font-serif mb-8 border-b-2 border-gray-200 pb-4">Schedule for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
              {todayEvents.length === 0 ? (
                <div className="bg-white rounded-3xl p-24 text-center border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase tracking-widest">No activities today</div>
              ) : (
                <div className="grid gap-4 pb-12">
                  {todayEvents.map(event => (
                    <div key={event.id} onClick={() => handleEventClick(event)} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 flex items-center gap-6 hover:shadow-xl transition-all cursor-pointer group shadow-sm">
                      <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-gray-50 flex-shrink-0 border-4 border-white shadow-md">
                        {event.client.pet_photo ? <img src={event.client.pet_photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="pet"/> : <div className="w-full h-full flex items-center justify-center bg-[#fdf8f5]"><PawIcon className="w-10 h-10 text-gray-200"/></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${event.color}`}>{event.type}</span>
                          {event.time !== 'All Day' && <span className="text-sm font-black text-[#104b57] bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{event.time}</span>}
                        </div>
                        <h3 className="text-3xl font-black text-[#3a302a] font-serif">{event.client.pet_name}</h3>
                        <p className="text-sm font-bold text-gray-400 tracking-wide">{event.client.breed} <span className="mx-2 text-gray-200">|</span> Owner: {event.client.owner_name}</p>
                      </div>
                      <div className="pr-6 text-gray-300 group-hover:text-[#104b57] transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* WEEK VIEW */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-4 h-full min-h-[600px]">
            {getWeekDates().map(date => {
              const dStr = date.toISOString().split('T')[0];
              const dayEvents = (eventsByDate[dStr] || []).sort((a,b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
              const isToday = dStr === todayString;
              return (
                <div key={dStr} className={`flex flex-col bg-white rounded-3xl border transition-all ${isToday ? 'border-[#d65a47] ring-4 ring-[#d65a47]/10 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                  <button onClick={() => { setCurrentDate(date); setViewMode('today'); }} className={`p-4 text-center border-b transition-colors hover:bg-gray-100 ${isToday ? 'bg-[#d65a47] text-white rounded-t-2xl' : 'bg-gray-50/50 text-gray-500'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className="text-2xl font-black">{date.getDate()}</p>
                  </button>
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {dayEvents.map(event => (
                      <div key={event.id} onClick={() => handleEventClick(event)} className={`p-3 rounded-2xl border text-[10px] font-bold cursor-pointer hover:scale-105 transition-all shadow-sm ${event.color}`}>
                        <p className="font-black text-sm truncate">{event.client.pet_name}</p>
                        {event.time !== 'All Day' && <p className="opacity-80 mt-1 font-black">{event.time}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MONTH VIEW */}
        {viewMode === 'month' && (() => {
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const blanks = Array.from({ length: firstDay }, (_, i) => i);
          const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
          return (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-full min-h-[750px]">
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50 font-black text-[11px] text-gray-400 uppercase tracking-[0.25em] py-4 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 flex-1 gap-px bg-gray-200">
                {blanks.map(b => <div key={`b-${b}`} className="bg-gray-50/50" />)}
                {days.map(day => {
                  const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = (eventsByDate[dStr] || []).slice(0, 4);
                  return (
                    <div key={day} className="bg-white p-3 min-h-[120px] flex flex-col group relative">
                      <div className="flex justify-between items-center mb-2">
                        <button onClick={() => handleDateJump(day)} className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black transition-all ${dStr === todayString ? 'bg-[#104b57] text-white shadow-lg scale-110' : 'text-gray-400 group-hover:bg-gray-50'}`}>{day}</button>
                        {eventsByDate[dStr]?.length > 4 && <span className="text-[9px] font-black text-[#d65a47] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">+{eventsByDate[dStr].length - 4}</span>}
                      </div>
                      <div className="space-y-1.5">
                        {dayEvents.map(e => (
                          <div key={e.id} onClick={(ev) => { ev.stopPropagation(); handleEventClick(e); }} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black truncate cursor-pointer ${e.color} border shadow-sm transition-transform hover:scale-[1.03]`}>
                            {e.client.pet_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </main>

      {/* LEGEND SECTION WITH SHOW/HIDE LOGIC */}
      {showLegend && (
        <div className="bg-white border-t border-gray-100 p-4 flex flex-wrap justify-center gap-8 shadow-sm animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-blue-400 shadow-sm"></span> Meet & Greet</div>
            <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm"></span> Drop-Off</div>
            <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-orange-400 shadow-sm"></span> Day Care</div>
            <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-indigo-400 shadow-sm"></span> Over Night</div>
            <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-rose-400 shadow-sm"></span> Pick-Up</div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}