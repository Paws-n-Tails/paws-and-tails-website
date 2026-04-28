import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarIcon, PawIcon, SunIcon, MoonIcon } from '../components/Icons';

const timeOptions = ["7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];

// Helper to convert "10:00 AM" strings into sortable numbers (minutes from midnight)
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
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); 
  const [selectedEvent, setSelectedEvent] = useState(null); 
  
  // View Modes
  const [viewMode, setViewMode] = useState('month'); 
  const [selectedDay, setSelectedDay] = useState(null); 

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

  // 2. Add dynamic appointments (Day Care vs Overnight)
  appointments.forEach(appt => {
    const client = leads.find(l => l.id === appt.lead_id) || {};
    
    if (appt.service_type === 'day_care') {
       const start = new Date(appt.date_start + 'T12:00:00');
       const end = new Date(appt.date_end + 'T12:00:00');
       let current = new Date(start);
       let dayCount = 0;
       
       while (current <= end) {
         const dateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
         masterAgenda.push({
           id: `dc_${appt.id}_${dayCount}`,
           type: 'Day Care',
           date: dateString,
           time: 'All Day',
           color: 'bg-orange-100 text-orange-800 border-orange-200',
           client: client,
           fullAppt: appt 
         });
         current.setDate(current.getDate() + 1);
         dayCount++;
       }
    } else {
       // A. Overnight Drop-Off
       masterAgenda.push({
         id: `do_${appt.id}`,
         type: 'Drop-Off',
         date: appt.date_start,
         time: appt.time_start,
         color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
         client: client,
         fullAppt: appt
       });

       // B. Overnight MIDDLE DAYS
       const start = new Date(appt.date_start + 'T12:00:00');
       const end = new Date(appt.date_end + 'T12:00:00');
       let current = new Date(start);
       current.setDate(current.getDate() + 1); 
       let nightCount = 0;
       
       while (current < end) { 
         const dateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
         masterAgenda.push({
           id: `on_${appt.id}_${nightCount}`,
           type: 'Over Night',
           date: dateString,
           time: 'All Day',
           color: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
           client: client,
           fullAppt: appt 
         });
         current.setDate(current.getDate() + 1);
         nightCount++;
       }

       // C. Overnight Pick-Up
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
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEditingAppt(false);
    
    if (event.type === 'M&G') {
      setEditApptForm({ start_date: event.fullAppt.start_date, start_time: event.fullAppt.start_time });
    } else {
      setEditApptForm({
        date_start: event.fullAppt.date_start,
        date_end: event.fullAppt.date_end,
        time_start: event.fullAppt.time_start || '',
        time_end: event.fullAppt.time_end || ''
      });
    }
  };

  const handleSaveAppointment = async () => {
    setIsSavingAppt(true);
    try {
      if (selectedEvent.type === 'M&G') {
        const { error } = await supabase.from('leads').update({
          meet_date: editApptForm.start_date,
          meet_time: editApptForm.start_time
        }).eq('id', selectedEvent.client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('appointments').update({
          date_start: editApptForm.date_start,
          date_end: editApptForm.date_end,
          time_start: editApptForm.time_start,
          time_end: editApptForm.time_end
        }).eq('id', selectedEvent.fullAppt.id);
        if (error) throw error;
      }
      
      await fetchDashboardData();
      setIsEditingAppt(false);
      setSelectedEvent(prev => ({
        ...prev,
        fullAppt: { ...prev.fullAppt, ...editApptForm }
      }));

    } catch (err) {
      alert("Failed to update appointment: " + err.message);
    } finally {
      setIsSavingAppt(false);
    }
  };

  const handleDayClick = (dateString) => {
    setSelectedDay(dateString);
    setViewMode('day');
  };

  // NEW: Day View Navigation Handlers
  const goToPrevDay = () => {
    if (!selectedDay) return;
    const date = new Date(selectedDay + 'T12:00:00');
    date.setDate(date.getDate() - 1);
    setSelectedDay(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  const goToNextDay = () => {
    if (!selectedDay) return;
    const date = new Date(selectedDay + 'T12:00:00');
    date.setDate(date.getDate() + 1);
    setSelectedDay(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  const getSortedDayEvents = (dateString) => {
    const events = eventsByDate[dateString] || [];
    return [...events].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  };

  const renderEventCard = (event) => (
    <div 
      key={event.id} 
      onClick={() => handleEventClick(event)}
      className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col relative cursor-pointer"
    >
      <div className="absolute top-4 left-4 z-10">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${event.color}`}>
          {event.type}
        </span>
      </div>
      
      {event.time !== 'All Day' && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-gray-200 bg-white text-gray-700">
            {event.time}
          </span>
        </div>
      )}

      <div className="h-40 w-full bg-[#fdf8f5] relative overflow-hidden flex-shrink-0 flex items-center justify-center">
        {event.client.pet_photo ? (
           <img src={event.client.pet_photo} alt={event.client.pet_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
           <PawIcon className="w-16 h-16 text-[#d65a47]/20" />
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col bg-white">
        <h3 className="text-2xl font-black text-[#3a302a] font-serif mb-1 truncate">{event.client.pet_name}</h3>
        <div className="text-xs font-bold text-gray-500 mb-4">
          {event.client.breed} • <span className="text-[#d65a47]">{event.client.pet_weight}</span>
        </div>

        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-auto flex flex-col">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Human</p>
          <p className="font-black text-[#104b57] truncate text-sm">{event.client.owner_name}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      
      {/* SIDE WINDOW DRAWER (Profile / Edit View) */}
      {selectedEvent && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedEvent(null)}></div>
          <div className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out] overflow-hidden border-l border-gray-200">
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-md transition-colors">
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
                <div className="absolute bottom-4 left-6">
                  <h2 className="text-4xl font-black text-white font-serif drop-shadow-md">{selectedEvent.client.pet_name}</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* APPOINTMENT CONTEXT BOX (EDITABLE) */}
                <div className="bg-[#fdf8f5] rounded-2xl p-5 border-2 border-[#ffd1bc]">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-[#d65a47] uppercase tracking-widest text-xs flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" /> Appointment Details
                    </h3>
                    {!isEditingAppt && (
                      <button onClick={() => setIsEditingAppt(true)} className="text-xs font-bold text-[#104b57] hover:underline bg-[#104b57]/10 px-3 py-1 rounded-full">
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {isEditingAppt ? (
                    <div className="flex flex-col gap-3 animate-[slideInRight_0.2s_ease-out]">
                      {selectedEvent.type === 'M&G' ? (
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</label>
                             <input type="date" value={editApptForm.start_date} onChange={e => setEditApptForm({...editApptForm, start_date: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                           </div>
                           <div>
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Time</label>
                             <select value={editApptForm.start_time} onChange={e => setEditApptForm({...editApptForm, start_time: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white">
                               {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                           </div>
                        </div>
                      ) : selectedEvent.fullAppt.service_type === 'day_care' ? (
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">From Date</label>
                             <input type="date" value={editApptForm.date_start} onChange={e => setEditApptForm({...editApptForm, date_start: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                           </div>
                           <div>
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">To Date</label>
                             <input type="date" value={editApptForm.date_end} onChange={e => setEditApptForm({...editApptForm, date_end: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-white p-2 rounded border shadow-sm">
                            <label className="text-[10px] font-bold text-[#104b57] uppercase tracking-wider mb-1 block">Drop-Off</label>
                            <div className="flex gap-2">
                              <input type="date" value={editApptForm.date_start} onChange={e => setEditApptForm({...editApptForm, date_start: e.target.value})} className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                              <select value={editApptForm.time_start} onChange={e => setEditApptForm({...editApptForm, time_start: e.target.value})} className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white">
                                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border shadow-sm">
                            <label className="text-[10px] font-bold text-[#d65a47] uppercase tracking-wider mb-1 block">Pick-Up</label>
                            <div className="flex gap-2">
                              <input type="date" value={editApptForm.date_end} onChange={e => setEditApptForm({...editApptForm, date_end: e.target.value})} className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                              <select value={editApptForm.time_end} onChange={e => setEditApptForm({...editApptForm, time_end: e.target.value})} className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white">
                                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setIsEditingAppt(false)} className="flex-1 bg-white border border-gray-300 text-gray-600 font-bold py-1.5 rounded shadow-sm text-sm">Cancel</button>
                        <button onClick={handleSaveAppointment} disabled={isSavingAppt} className="flex-1 bg-[#104b57] text-white font-bold py-1.5 rounded shadow-sm text-sm disabled:opacity-50">
                          {isSavingAppt ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedEvent.type === 'M&G' ? (
                        <div>
                          <p className="text-xl font-black text-[#3a302a]">Meet & Greet</p>
                          <p className="text-sm font-bold text-gray-600 mt-1">{formatFriendlyDate(selectedEvent.fullAppt.start_date)} at {selectedEvent.fullAppt.start_time}</p>
                        </div>
                      ) : selectedEvent.fullAppt.service_type === 'day_care' ? (
                        <div>
                          <p className="text-xl font-black text-[#3a302a]">Day Care</p>
                          <div className="text-sm font-bold text-gray-600 mt-1 flex flex-col gap-1">
                            <div>From: <span className="text-[#104b57]">{formatFriendlyDate(selectedEvent.fullAppt.date_start)}</span></div>
                            {selectedEvent.fullAppt.date_start !== selectedEvent.fullAppt.date_end && (
                              <div>To: <span className="text-[#104b57]">{formatFriendlyDate(selectedEvent.fullAppt.date_end)}</span></div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xl font-black text-[#3a302a]">Overnight Stay</p>
                          <div className="grid grid-cols-1 gap-3 mt-3">
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Drop-Off</p>
                              <p className="text-sm font-bold text-[#104b57]">{formatFriendlyDate(selectedEvent.fullAppt.date_start)}</p>
                              <p className="text-xs font-black text-[#3a302a]">{selectedEvent.fullAppt.time_start}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pick-Up</p>
                              <p className="text-sm font-bold text-[#d65a47]">{formatFriendlyDate(selectedEvent.fullAppt.date_end)}</p>
                              <p className="text-xs font-black text-[#3a302a]">{selectedEvent.fullAppt.time_end}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Pet Info */}
                <div>
                  <h3 className="font-black text-[#3a302a] text-lg mb-3 border-b-2 border-gray-100 pb-2 flex items-center gap-2">
                    <PawIcon className="w-5 h-5 text-[#d65a47]" /> Pet Info
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Breed</p><p className="font-bold text-gray-800 text-sm">{selectedEvent.client.breed}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Age</p><p className="font-bold text-gray-800 text-sm">{selectedEvent.client.age}</p></div>
                    <div className="col-span-2"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weight</p><p className="font-black text-[#d65a47] text-sm">{selectedEvent.client.pet_weight}</p></div>
                  </div>
                  {selectedEvent.client.info && (
                    <div className="mt-3 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                       <p className="text-[10px] font-bold text-yellow-800 uppercase tracking-widest mb-1">Admin Notes</p>
                       <p className="text-sm text-yellow-900 italic font-medium">"{selectedEvent.client.info}"</p>
                    </div>
                  )}
                </div>

                {/* Human Info */}
                <div>
                  <h3 className="font-black text-[#3a302a] text-lg mb-3 border-b-2 border-gray-100 pb-2">Human Contact</h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Owner</p><p className="font-black text-[#104b57]">{selectedEvent.client.owner_name}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p><p className="font-bold text-gray-700 text-sm">{selectedEvent.client.phone}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p><p className="font-medium text-gray-600 text-sm">{selectedEvent.client.email}</p></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

      {/* HEADER */}
      <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center z-10 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#3a302a] font-serif flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-[#104b57]" /> Master Calendar
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {viewMode === 'month' ? "Manage your facility's daily schedule." : "Detailed daily view."}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {viewMode === 'day' ? (
            <button onClick={() => setViewMode('month')} className="px-4 py-2 text-sm font-bold text-white bg-[#104b57] hover:bg-[#0c3942] rounded-xl transition-colors shadow-md flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back to Month View
            </button>
          ) : (
            <>
              <button onClick={goToToday} className="px-4 py-2 text-sm font-bold text-[#104b57] bg-[#104b57]/10 hover:bg-[#104b57]/20 rounded-xl transition-colors">
                Today
              </button>
              <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm p-1">
                <button onClick={prevMonth} className="p-2 text-gray-500 hover:text-[#104b57] hover:bg-gray-50 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <span className="w-40 text-center font-black text-[#3a302a] text-lg">
                  {monthNames[month]} {year}
                </span>
                <button onClick={nextMonth} className="p-2 text-gray-500 hover:text-[#104b57] hover:bg-gray-50 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6 flex flex-col">
        
        {/* DAY VIEW RENDERING */}
        {viewMode === 'day' && selectedDay && (() => {
          const dayEvents = getSortedDayEvents(selectedDay);
          const dayCareEvents = dayEvents.filter(e => e.type === 'Day Care');
          const overnightEvents = dayEvents.filter(e => ['Drop-Off', 'Over Night', 'Pick-Up'].includes(e.type));
          const mgEvents = dayEvents.filter(e => e.type === 'M&G');

          return (
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col animate-[slideInRight_0.2s_ease-out]">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 flex-1 overflow-y-auto">
                
                {/* UPDATED DAY VIEW HEADER WITH PREV/NEXT BUTTONS */}
                <div className="flex items-center justify-between mb-8 border-b-2 border-gray-100 pb-4">
                  <h2 className="text-3xl font-black text-[#3a302a] font-serif">
                    Agenda for {formatFriendlyDate(selectedDay)}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button onClick={goToPrevDay} className="p-2 text-gray-500 hover:text-[#104b57] hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm" title="Previous Day">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <button onClick={goToNextDay} className="p-2 text-gray-500 hover:text-[#104b57] hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm" title="Next Day">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>

                {dayEvents.length === 0 ? (
                   <div className="text-center py-20 text-gray-400 font-medium text-lg">
                     No appointments scheduled for this day.
                   </div>
                ) : (
                   <div className="space-y-12">
                     
                     {/* DAY CARE SECTION */}
                     {dayCareEvents.length > 0 && (
                       <section>
                         <h3 className="text-2xl font-black text-[#d65a47] font-serif mb-6 flex items-center gap-3">
                           <span className="bg-[#d65a47]/10 p-2 rounded-xl"><SunIcon className="w-6 h-6 text-[#d65a47]" /></span>
                           Day Care
                           <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full font-bold ml-2">{dayCareEvents.length}</span>
                         </h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {dayCareEvents.map(event => renderEventCard(event))}
                         </div>
                       </section>
                     )}

                     {/* OVER NIGHT SECTION */}
                     {overnightEvents.length > 0 && (
                       <section>
                         <h3 className="text-2xl font-black text-[#104b57] font-serif mb-6 flex items-center gap-3">
                           <span className="bg-[#104b57]/10 p-2 rounded-xl"><MoonIcon className="w-6 h-6 text-[#104b57]" /></span>
                           Over Night
                           <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full font-bold ml-2">{overnightEvents.length}</span>
                         </h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {overnightEvents.map(event => renderEventCard(event))}
                         </div>
                       </section>
                     )}

                     {/* MEET & GREET SECTION */}
                     {mgEvents.length > 0 && (
                       <section>
                         <h3 className="text-2xl font-black text-blue-600 font-serif mb-6 flex items-center gap-3">
                           <span className="bg-blue-100 p-2 rounded-xl"><PawIcon className="w-6 h-6 text-blue-600" /></span>
                           Meet & Greets
                           <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full font-bold ml-2">{mgEvents.length}</span>
                         </h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {mgEvents.map(event => renderEventCard(event))}
                         </div>
                       </section>
                     )}

                   </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* MONTH VIEW RENDERING */}
        {viewMode === 'month' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden animate-[slideInLeft_0.2s_ease-out]">
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
                {daysOfWeek.map(day => (
                  <div key={day} className="py-3 text-center text-xs font-black uppercase tracking-widest text-gray-500 border-r border-gray-100 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 flex-1 bg-gray-100 gap-[1px]">
                {blanks.map(blank => <div key={`blank-${blank}`} className="bg-gray-50 min-h-[120px]" />)}

                {days.map(day => {
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = eventsByDate[dateString] || [];
                  const isToday = dateString === todayString;

                  // Order: M&G -> Drop-Off -> Day Care -> Over Night -> Pick Up
                  dayEvents.sort((a, b) => {
                    const order = { 'M&G': 1, 'Drop-Off': 2, 'Day Care': 3, 'Over Night': 4, 'Pick-Up': 5 };
                    return (order[a.type] || 6) - (order[b.type] || 6);
                  });

                  return (
                    <div key={day} className={`bg-white min-h-[120px] p-2 flex flex-col transition-colors ${isToday ? 'bg-[#104b57]/5' : 'hover:bg-gray-50'}`}>
                      
                      <div className="flex justify-between items-start mb-2">
                        <button 
                          onClick={() => handleDayClick(dateString)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black transition-all transform hover:scale-110 hover:ring-2 hover:ring-[#d65a47]/50 ${isToday ? 'bg-[#104b57] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                          title="View Day Details"
                        >
                          {day}
                        </button>
                        
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold text-gray-400 mt-1">{dayEvents.length} events</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-32 hide-scrollbar">
                        {dayEvents.map(event => (
                          <div 
                            key={event.id} 
                            onClick={() => handleEventClick(event)} 
                            className={`cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all flex flex-col px-2 py-1.5 rounded-lg border text-xs shadow-sm ${event.color}`}
                          >
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-black uppercase tracking-wider text-[9px]">{event.type}</span>
                              {event.time !== 'All Day' && <span className="font-bold opacity-80">{event.time}</span>}
                            </div>
                            <div className="font-bold truncate" title={event.client.pet_name}>
                              {event.client.pet_name} <span className="font-medium opacity-80">({event.client.owner_name.split(' ')[0]})</span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  );
                })}

                {Array.from({ length: (7 - ((blanks.length + days.length) % 7)) % 7 }).map((_, i) => (
                   <div key={`end-blank-${i}`} className="bg-gray-50 min-h-[120px]" />
                ))}
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap justify-center gap-6">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-300"></span> Meet & Greet</div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300"></span> Drop-Off</div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><span className="w-3 h-3 rounded bg-orange-200 border border-orange-300"></span> Day Care</div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><span className="w-3 h-3 rounded bg-indigo-200 border border-indigo-300"></span> Over Night</div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><span className="w-3 h-3 rounded bg-rose-200 border border-rose-300"></span> Pick-Up</div>
            </div>
          </>
        )}
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}