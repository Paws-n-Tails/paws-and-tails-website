import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PawIcon, CalendarIcon, SunIcon, MoonIcon } from '../components/Icons';

// --- INLINE ICONS ---
const PencilIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>);
const TrashIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>);

const allBreeds = [
  "Affenpinscher", "Afghan Hound", "Airedale Terrier", "Akita", "Alaskan Malamute", "American Bulldog", 
  "American Staffordshire Terrier", "Australian Cattle Dog", "Australian Shepherd", "Basset Hound", "Beagle", 
  "Belgian Malinois", "Bernese Mountain Dog", "Bichon Frise", "Bloodhound", "Border Collie", "Border Terrier", 
  "Boston Terrier", "Boxer", "Boykin Spaniel", "Brittany", "Brussels Griffon", "Bull Terrier", "Bulldog", 
  "Bullmastiff", "Cairn Terrier", "Cane Corso", "Cavalier King Charles Spaniel", "Chihuahua", "Chinese Crested", 
  "Chow Chow", "Cocker Spaniel", "Collie", "Corgi (Cardigan Welsh)", "Corgi (Pembroke Welsh)", "Dachshund", 
  "Dalmatian", "Doberman Pinscher", "Dogo Argentino", "English Mastiff", "English Springer Spaniel", "French Bulldog", 
  "German Shepherd", "German Shorthaired Pointer", "Giant Schnauzer", "Golden Retriever", "Goldendoodle", "Great Dane", 
  "Great Pyrenees", "Greyhound", "Havanese", "Irish Setter", "Italian Greyhound", "Jack Russell Terrier", "Japanese Chin", 
  "Keeshond", "Labradoodle", "Labrador Retriever", "Lhasa Apso", "Maltipoo", "Maltese", "Mastiff", "Miniature Pinscher", 
  "Miniature Schnauzer", "Newfoundland", "Papillon", "Pekingese", "Pit Bull", "Pointer", "Pomeranian", "Poodle (Miniature)", 
  "Poodle (Standard)", "Poodle (Toy)", "Pug", "Puggle", "Rhodesian Ridgeback", "Rottweiler", "Saint Bernard", "Samoyed", 
  "Scottish Terrier", "Shar-Pei", "Shetland Sheepdog", "Shiba Inu", "Shih Tzu", "Siberian Husky", "Staffordshire Bull Terrier", 
  "Vizsla", "Weimaraner", "West Highland White Terrier", "Whippet", "Yorkshire Terrier", "Mixed Breed", "Other"
];

const ageOptions = ["Under 1 year", ...Array.from({ length: 20 }, (_, i) => i === 0 ? "1 year" : `${i + 1} years`)];
const weightOptions = Array.from({ length: 150 }, (_, i) => i === 0 ? "1 lb" : `${i + 1} lbs`);
const timeOptions = ["7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];

const formatPhoneNumber = (value) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '').slice(0, 10);
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

const getStatusDisplay = (status) => {
  switch(status) {
    case 'pending': return { label: 'Pending', classes: 'bg-yellow-400 text-yellow-900 border-yellow-500' };
    case 'pending_rescheduled': return { label: 'Rescheduled', classes: 'bg-orange-400 text-white border-orange-500' };
    case 'scheduled': return { label: 'Scheduled', classes: 'bg-blue-400 text-white border-blue-500' };
    case 'approved': return { label: 'Approved', classes: 'bg-green-400 text-white border-green-500' };
    case 'client': return { label: 'Client', classes: 'bg-purple-500 text-white border-purple-600' };
    case 'declined': return { label: 'Declined', classes: 'bg-red-500 text-white border-red-600' };
    default: return { label: status || 'Unknown', classes: 'bg-gray-200 text-gray-700 border-gray-300' };
  }
};

const daysOfWeek = [{label: 'Su', val: 0}, {label: 'M', val: 1}, {label: 'T', val: 2}, {label: 'W', val: 3}, {label: 'Th', val: 4}, {label: 'F', val: 5}, {label: 'Sa', val: 6}];

export default function ClientDatabase({ leads, appointments, fetchDashboardData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({});

  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [bookingType, setBookingType] = useState('day_care');
  const [dayCareStartDate, setDayCareStartDate] = useState(''); 
  const [dayCareEndDate, setDayCareEndDate] = useState('');     
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [bookingPrice, setBookingPrice] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); 
  const [recurringWeeks, setRecurringWeeks] = useState(4); 

  const [editingApptId, setEditingApptId] = useState(null);
  const [apptEditForm, setApptEditForm] = useState({});

  const sortedAndFilteredLeads = leads
    .filter(lead => {
      const matchesSearch = 
        lead.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.pet_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => a.pet_name.localeCompare(b.pet_name));

  useEffect(() => {
    if (bookingType === 'day_care') {
      if (isRecurring && dayCareStartDate) {
        const start = new Date(dayCareStartDate + 'T12:00:00');
        let daysCount = 0;
        const end = new Date(start);
        end.setDate(end.getDate() + (recurringWeeks * 7) - 1);
        let current = new Date(start);
        while(current <= end) {
           if (selectedDays.includes(current.getDay())) {
              daysCount++;
           }
           current.setDate(current.getDate() + 1);
        }
        setBookingPrice((daysCount * 50).toFixed(2));
      } else if (!isRecurring && dayCareStartDate && dayCareEndDate) {
        const start = new Date(dayCareStartDate + 'T12:00:00');
        const end = new Date(dayCareEndDate + 'T12:00:00');
        if (end >= start) {
          const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
          setBookingPrice((days * 50).toFixed(2));
        }
      }
    } else if (bookingType === 'overnight' && dropoffDate && pickupDate) {
      const start = new Date(dropoffDate + 'T12:00:00');
      const end = new Date(pickupDate + 'T12:00:00');
      if (end > start) {
        const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
        setBookingPrice((nights * 80).toFixed(2));
      }
    }
  }, [bookingType, dayCareStartDate, dayCareEndDate, dropoffDate, pickupDate, isRecurring, selectedDays, recurringWeeks]);

  const toggleDay = (dayVal) => {
    if (selectedDays.includes(dayVal)) {
      setSelectedDays(selectedDays.filter(d => d !== dayVal));
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  const openAddModal = () => {
    setAddForm({ pet_name: '', owner_name: '', phone: '', email: '', breed: '', age: '', pet_weight: '', info: '', status: 'client' });
    setNewPhotoFile(null);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddForm({});
    setNewPhotoFile(null);
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalPhotoUrl = null;
      if (newPhotoFile) {
        const fileExt = newPhotoFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('pet_photos').upload(fileName, newPhotoFile);
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage.from('pet_photos').getPublicUrl(fileName);
        finalPhotoUrl = publicUrlData.publicUrl;
      }
      const { error: insertError } = await supabase.from('leads').insert([{
        owner_name: addForm.owner_name, email: addForm.email, phone: addForm.phone, pet_name: addForm.pet_name, breed: addForm.breed, age: addForm.age, pet_weight: addForm.pet_weight, info: addForm.info, status: addForm.status, pet_photo: finalPhotoUrl
      }]);
      if (insertError) throw insertError;
      await fetchDashboardData();
      closeAddModal();
    } catch (error) {
      alert(`Error creating profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setEditForm({ ...client, phone: formatPhoneNumber(client.phone) });
    setNewPhotoFile(null);
    setEditingApptId(null); 
  };

  const closeEditModal = () => {
    setEditingClient(null);
    setEditForm({});
    setNewPhotoFile(null);
    setDayCareStartDate(''); setDayCareEndDate(''); setDropoffDate(''); setDropoffTime(''); setPickupDate(''); setPickupTime(''); setBookingPrice('');
    setIsRecurring(false); setEditingApptId(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalPhotoUrl = editForm.pet_photo;
      if (newPhotoFile) {
        const fileExt = newPhotoFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('pet_photos').upload(fileName, newPhotoFile);
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage.from('pet_photos').getPublicUrl(fileName);
        finalPhotoUrl = publicUrlData.publicUrl;
      }
      const { error: updateError } = await supabase.from('leads').update({
          owner_name: editForm.owner_name, email: editForm.email, phone: editForm.phone, pet_name: editForm.pet_name, breed: editForm.breed, age: editForm.age, pet_weight: editForm.pet_weight, info: editForm.info, status: editForm.status, pet_photo: finalPhotoUrl
        }).eq('id', editingClient.id);

      if (updateError) throw updateError;
      await fetchDashboardData();
      setEditForm(prev => ({...prev, pet_photo: finalPhotoUrl}));
      setNewPhotoFile(null);
      alert("Profile Saved Successfully!");
    } catch (error) {
      alert(`Error saving profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBooking = async () => {
    setIsBooking(true);
    try {
      if (bookingType === 'day_care' && isRecurring) {
        if (!dayCareStartDate) throw new Error("Please select a Start Date.");
        if (!dropoffTime || !pickupTime) throw new Error("Please select arrival and departure times.");
        if (selectedDays.length === 0) throw new Error("Please select at least one day of the week.");
        const start = new Date(dayCareStartDate + 'T12:00:00');
        const end = new Date(start);
        end.setDate(end.getDate() + (recurringWeeks * 7) - 1);
        const payloads = [];
        let totalDays = 0;
        let tempCurrent = new Date(start);
        while(tempCurrent <= end) {
           if (selectedDays.includes(tempCurrent.getDay())) totalDays++;
           tempCurrent.setDate(tempCurrent.getDate() + 1);
        }
        const pricePerDay = bookingPrice ? (parseFloat(bookingPrice) / totalDays).toFixed(2) : 50;
        let current = new Date(start);
        while(current <= end) {
          if (selectedDays.includes(current.getDay())) {
             const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
             payloads.push({
               lead_id: editingClient.id,
               service_type: 'day_care',
               date_start: dateStr,
               date_end: dateStr,
               time_start: dropoffTime,
               time_end: pickupTime,
               price: pricePerDay
             });
          }
          current.setDate(current.getDate() + 1);
        }
        const { error } = await supabase.from('appointments').insert(payloads);
        if (error) throw error;
      } else {
        const payload = { lead_id: editingClient.id, service_type: bookingType, price: bookingPrice ? parseFloat(bookingPrice) : null };
        if (bookingType === 'day_care') {
          if (!dayCareStartDate || !dayCareEndDate || !dropoffTime || !pickupTime) throw new Error("Please fill out all dates and times.");
          payload.date_start = dayCareStartDate; 
          payload.date_end = dayCareEndDate;
          payload.time_start = dropoffTime;
          payload.time_end = pickupTime;
        } else {
          if (!dropoffDate || !dropoffTime || !pickupDate || !pickupTime) throw new Error("Please fill out overnight fields.");
          payload.date_start = dropoffDate; payload.time_start = dropoffTime; payload.date_end = pickupDate; payload.time_end = pickupTime;
        }
        const { error } = await supabase.from('appointments').insert([payload]);
        if (error) throw error;
      }
      setDayCareStartDate(''); setDayCareEndDate(''); setDropoffDate(''); setDropoffTime(''); setPickupDate(''); setPickupTime(''); setBookingPrice(''); setIsRecurring(false);
      await fetchDashboardData(); 
    } catch (error) {
      alert(error.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleEditApptStart = (appt) => {
    setEditingApptId(appt.id);
    setApptEditForm({
      date_start: appt.date_start,
      date_end: appt.date_end,
      time_start: appt.time_start || '',
      time_end: appt.time_end || '',
      price: appt.price || ''
    });
  };

  const handleUpdateAppt = async () => {
    try {
      const { error } = await supabase.from('appointments').update({
        date_start: apptEditForm.date_start,
        date_end: apptEditForm.date_end,
        time_start: apptEditForm.time_start,
        time_end: apptEditForm.time_end,
        price: apptEditForm.price ? parseFloat(apptEditForm.price) : null
      }).eq('id', editingApptId);
      if (error) throw error;
      await fetchDashboardData();
      setEditingApptId(null);
    } catch (error) {
      alert("Error updating appointment: " + error.message);
    }
  };

  const handleDeleteAppt = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      await fetchDashboardData();
    } catch (error) {
      alert("Error deleting appointment: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* -------------------- ADD NEW CLIENT MODAL -------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-full overflow-hidden flex flex-col relative animate-[slideInRight_0.2s_ease-out]">
            <div className="bg-[#104b57] p-5 text-white flex justify-between items-center z-20 shadow-md">
              <h2 className="text-xl font-black font-serif flex items-center gap-3">
                <PawIcon className="w-5 h-5 text-[#ffd1bc]" /> Create New Profile
              </h2>
              <button onClick={closeAddModal} className="text-white/70 hover:text-white transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleCreateProfile} className="flex flex-col">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-end border-b-2 border-gray-200 pb-3">
                    <div className="flex-1 pr-4">
                      <label className="block text-xs font-bold text-[#d65a47] mb-1.5 uppercase tracking-wider">Pet's Name</label>
                      <input type="text" required placeholder="Buster" value={addForm.pet_name} onChange={(e) => setAddForm({...addForm, pet_name: e.target.value})} className="w-full px-2 py-1 focus:outline-none bg-transparent font-black text-4xl text-[#3a302a] font-serif border-b-2 border-transparent focus:border-[#104b57] transition-colors" />
                    </div>
                    <div className="pb-1 pl-2">
                      <select value={addForm.status} onChange={(e) => setAddForm({...addForm, status: e.target.value})}
                        className="font-black rounded-xl px-4 py-2 focus:outline-none border-2 shadow-sm text-sm bg-purple-50 border-purple-200 text-purple-700">
                        <option value="client">Client</option><option value="approved">Approved</option><option value="scheduled">Scheduled</option><option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-56 aspect-[3/4] bg-[#fdf8f5] rounded-2xl flex items-center justify-center overflow-hidden border-4 border-[#ffd1bc] relative group flex-shrink-0 shadow-sm">
                      {newPhotoFile ? <img src={URL.createObjectURL(newPhotoFile)} alt="Preview" className="w-full h-full object-cover" /> : <PawIcon className="w-20 h-20 text-[#d65a47]/20" />}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                        <label className="cursor-pointer bg-white text-[#104b57] px-4 py-2 rounded-xl font-black text-sm flex flex-col items-center gap-1">
                          Upload Photo<input type="file" accept="image/*" onChange={(e) => setNewPhotoFile(e.target.files[0])} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Breed</label>
                          <select required value={addForm.breed} onChange={(e) => setAddForm({...addForm, breed: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm">
                            <option value="">Select breed...</option>{allBreeds.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Age</label>
                          <select required value={addForm.age} onChange={(e) => setAddForm({...addForm, age: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm">
                            <option value="">Select age...</option>{ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Weight</label>
                          <select required value={addForm.pet_weight} onChange={(e) => setAddForm({...addForm, pet_weight: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm">
                            <option value="">Select weight...</option>{weightOptions.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </div>
                      </div>
                      <textarea value={addForm.info} onChange={(e) => setAddForm({...addForm, info: e.target.value})} className="w-full flex-1 min-h-[5rem] border-2 border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Add notes..." />
                    </div>
                  </div>
                  <div className="bg-[#fdf8f5] p-6 rounded-2xl border border-[#ffd1bc]/50">
                    <h3 className="font-black text-sm text-[#d65a47] mb-4 uppercase tracking-widest">Human Contact Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Owner Name</label><input type="text" required value={addForm.owner_name} onChange={(e) => setAddForm({...addForm, owner_name: e.target.value})} className="w-full border-2 border-white rounded-lg px-3 py-2 bg-white font-bold text-sm shadow-sm" /></div>
                      <div><label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Phone</label><input type="tel" required value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: formatPhoneNumber(e.target.value)})} className="w-full border-2 border-white rounded-lg px-3 py-2 bg-white font-bold text-sm shadow-sm" /></div>
                      <div className="md:col-span-2"><label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label><input type="email" required value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} className="w-full border-2 border-white rounded-lg px-3 py-2 bg-white text-sm shadow-sm" /></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-5 border-t flex justify-end gap-3 rounded-b-3xl">
                  <button type="button" onClick={closeAddModal} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 text-sm">Cancel</button>
                  <button type="submit" disabled={isSaving} className="bg-[#104b57] text-white px-8 py-2.5 rounded-xl font-black shadow-md text-sm">{isSaving ? "Saving..." : "Create Profile"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* -------------------- FULL-SCREEN EDIT & BOOKING DASHBOARD -------------------- */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 md:p-6 lg:p-8">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full h-full max-w-[1600px] overflow-hidden flex flex-col relative animate-[slideInRight_0.2s_ease-out]">
            <div className="bg-[#104b57] p-5 md:px-8 text-white flex justify-between items-center z-20 flex-shrink-0">
              <h2 className="text-xl md:text-2xl font-black font-serif flex items-center gap-3"><PawIcon className="w-6 h-6 text-[#ffd1bc]" /> Client Dashboard: {editingClient.pet_name}</h2>
              <button onClick={closeEditModal} className="p-2 bg-black/10 rounded-full hover:bg-black/20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50">
              <div className="w-full lg:w-[55%] flex flex-col bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto relative h-full">
                <form onSubmit={handleSaveProfile} className="flex flex-col flex-1">
                  <div className="p-6 md:p-8 space-y-8">
                    <div className="flex justify-between items-end border-b-2 border-gray-100 pb-4">
                      <div className="flex-1 pr-4">
                        <label className="block text-xs font-bold text-[#d65a47] mb-1.5 uppercase tracking-wider">Pet's Name</label>
                        <input type="text" required value={editForm.pet_name} onChange={(e) => setEditForm({...editForm, pet_name: e.target.value})} className="w-full px-2 py-1 focus:outline-none bg-transparent font-black text-4xl lg:text-5xl text-[#3a302a] font-serif border-b-2 border-transparent focus:border-[#104b57] transition-colors" />
                      </div>
                      <div className="pb-1 pl-2">
                        <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className={`font-black rounded-xl px-4 py-2 focus:outline-none border-2 shadow-sm text-sm cursor-pointer transition-colors ${editForm.status === 'client' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                          <option value="pending">Pending</option><option value="scheduled">Scheduled</option><option value="approved">Approved</option><option value="client">Client</option><option value="declined">Declined</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-48 lg:w-56 aspect-[3/4] bg-[#fdf8f5] rounded-2xl flex items-center justify-center overflow-hidden border-4 border-[#ffd1bc] relative group flex-shrink-0">
                        {newPhotoFile ? <img src={URL.createObjectURL(newPhotoFile)} alt="Preview" className="w-full h-full object-cover" /> : editForm.pet_photo && editForm.pet_photo.startsWith('http') ? <img src={editForm.pet_photo} alt={editForm.pet_name} className="w-full h-full object-cover" /> : <PawIcon className="w-20 h-20 text-[#d65a47]/20" />}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4">
                          <label className="cursor-pointer bg-white text-[#104b57] px-4 py-2 rounded-xl font-black text-sm">Update Photo<input type="file" accept="image/*" onChange={(e) => setNewPhotoFile(e.target.files[0])} className="hidden" /></label>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Breed</label>
                            <select required value={editForm.breed} onChange={(e) => setEditForm({...editForm, breed: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm">{allBreeds.map(b => <option key={b} value={b}>{b}</option>)}</select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Age</label>
                            <select required value={editForm.age} onChange={(e) => setEditForm({...editForm, age: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm">{ageOptions.map(a => <option key={a} value={a}>{a}</option>)}</select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Weight</label>
                            <select required value={editForm.pet_weight} onChange={(e) => setEditForm({...editForm, pet_weight: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm">{weightOptions.map(w => <option key={w} value={w}>{w}</option>)}</select>
                          </div>
                        </div>
                        <textarea value={editForm.info || ''} onChange={(e) => setEditForm({...editForm, info: e.target.value})} className="w-full h-full min-h-[6rem] border-2 border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Care Info..." />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                      <h3 className="font-black text-sm text-[#104b57] mb-4 uppercase tracking-widest">Human Contact Info</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Owner Name</label><input type="text" required value={editForm.owner_name} onChange={(e) => setEditForm({...editForm, owner_name: e.target.value})} className="w-full border-2 border-white rounded-lg px-3 py-2 bg-white font-bold text-sm shadow-sm" /></div>
                        <div><label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Phone</label><input type="tel" required value={editForm.phone || ''} onChange={(e) => setEditForm({...editForm, phone: formatPhoneNumber(e.target.value)})} className="w-full border-2 border-white rounded-lg px-3 py-2 bg-white font-bold text-sm shadow-sm" /></div>
                        <div className="md:col-span-2"><label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label><input type="email" required value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full border-2 border-white rounded-lg px-3 py-2 bg-white text-sm shadow-sm" /></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-5 border-t flex justify-end gap-3 mt-auto sticky bottom-0 z-20">
                    <button type="submit" disabled={isSaving} className="bg-white border-2 border-[#104b57] text-[#104b57] px-8 py-3 rounded-xl font-black hover:bg-[#104b57] hover:text-white transition-all text-sm w-full md:w-auto shadow-sm">{isSaving ? "Saving..." : "Save Profile Edits"}</button>
                  </div>
                </form>
              </div>

              <div className="w-full lg:w-[45%] flex flex-col bg-[#fdf8f5] overflow-y-auto h-full">
                <div className="p-6 md:p-8 space-y-8">
                  {editForm.status !== 'client' ? (
                     <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                       <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                       <h3 className="text-lg font-black text-gray-500 mb-1">Not an Active Client</h3>
                       <p className="text-sm text-gray-400">Mark as "Client" to unlock bookings.</p>
                     </div>
                  ) : (
                    <>
                      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-[#ffd1bc]/50 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#d65a47] to-[#104b57]"></div>
                        <h3 className="font-black text-xl text-[#3a302a] mb-6 flex items-center gap-2 font-serif"><CalendarIcon className="w-6 h-6 text-[#d65a47]" /> Create New Booking</h3>
                        <div className="flex gap-2 mb-6 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                          <button type="button" onClick={() => setBookingType('day_care')} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${bookingType === 'day_care' ? 'bg-white text-[#d65a47] shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}><SunIcon className="w-4 h-4" /> Day Care</button>
                          <button type="button" onClick={() => setBookingType('overnight')} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${bookingType === 'overnight' ? 'bg-white text-[#104b57] shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}><MoonIcon className="w-4 h-4" /> Overnight</button>
                        </div>

                        {bookingType === 'day_care' ? (
                          <>
                            <div className="flex items-center justify-end mb-4 pr-1">
                              <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                  <input type="checkbox" className="sr-only" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} />
                                  <div className={`block w-10 h-6 rounded-full transition-colors ${isRecurring ? 'bg-[#d65a47]' : 'bg-gray-300'}`}></div>
                                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isRecurring ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className="ml-3 text-xs font-bold text-gray-600 uppercase tracking-widest">Repeat Weekly</span>
                              </label>
                            </div>

                            {isRecurring ? (
                              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                                <div className="flex flex-col gap-4 mb-4">
                                  <div className="w-full">
                                    <label className="block text-[10px] font-bold text-[#d65a47] mb-1.5 uppercase tracking-wider">Start Date</label>
                                    <input type="date" value={dayCareStartDate} onChange={(e) => setDayCareStartDate(e.target.value)} className="w-full border border-orange-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d65a47] font-bold text-orange-900 bg-white" />
                                  </div>
                                  <div className="w-full">
                                    <label className="block text-[10px] font-bold text-[#d65a47] mb-1.5 uppercase tracking-wider">Duration</label>
                                    <select value={recurringWeeks} onChange={(e) => setRecurringWeeks(Number(e.target.value))} className="w-full border border-orange-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d65a47] font-bold text-orange-900 bg-white cursor-pointer">
                                      <option value={1}>1 Week</option><option value={2}>2 Weeks</option><option value={4}>4 Weeks</option><option value={8}>8 Weeks</option><option value={12}>12 Weeks</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 mb-4">
                                   <div className="flex gap-2">
                                     <div className="flex-1">
                                        <label className="block text-[9px] font-bold text-[#d65a47] uppercase mb-1">Arrival Time</label>
                                        <select value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} className="w-full border border-orange-200 rounded-lg px-2 py-2 text-xs bg-white">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                     </div>
                                     <div className="flex-1">
                                        <label className="block text-[9px] font-bold text-[#d65a47] uppercase mb-1">Departure Time</label>
                                        <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full border border-orange-200 rounded-lg px-2 py-2 text-xs bg-white">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                     </div>
                                   </div>
                                </div>

                                <div className="pt-2 border-t border-orange-200/50">
                                  <label className="block text-[10px] font-bold text-[#d65a47] mb-3 uppercase tracking-wider text-center">Repeat On Days</label>
                                  <div className="flex justify-center gap-1.5 sm:gap-2">
                                    {daysOfWeek.map(day => (
                                      <button key={day.val} type="button" onClick={() => toggleDay(day.val)} className={`w-9 h-9 rounded-full text-xs font-black transition-all ${selectedDays.includes(day.val) ? 'bg-[#d65a47] text-white shadow-md scale-110' : 'bg-white text-gray-400 border border-gray-300 hover:bg-orange-100'}`}>{day.label}</button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">From Date</label><input type="date" value={dayCareStartDate} onChange={(e) => setDayCareStartDate(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm" /></div>
                                  <div><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">To Date</label><input type="date" value={dayCareEndDate} onChange={(e) => setDayCareEndDate(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                                  <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Arrival Time</label><select value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-white">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                  <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Departure Time</label><select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-white">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200"><label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Drop-Off</label>
                              <div className="flex gap-2"><input type="date" value={dropoffDate} onChange={(e) => setDropoffDate(e.target.value)} className="w-full border-2 border-white shadow-sm rounded-lg px-3 py-2 text-sm" />
                                <select value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} className="w-full border-2 border-white shadow-sm rounded-lg px-3 py-2 bg-white text-sm">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200"><label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Pick-Up</label>
                              <div className="flex gap-2"><input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full border-2 border-white shadow-sm rounded-lg px-3 py-2 text-sm" />
                                <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full border-2 border-white shadow-sm rounded-lg px-3 py-2 bg-white text-sm">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="mb-6"><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Total Price ($)</label>
                          <div className="relative"><span className="absolute left-4 top-2.5 text-gray-400 font-bold">$</span><input type="number" value={bookingPrice} onChange={(e) => setBookingPrice(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm" placeholder="0.00" /></div>
                        </div>
                        <button type="button" onClick={handleAddBooking} disabled={isBooking} className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-sm ${bookingType === 'day_care' ? 'bg-[#d65a47] hover:bg-[#c44a38]' : 'bg-[#104b57] hover:bg-[#0c3942]'}`}>{isBooking ? "Saving..." : "+ Save Booking to Calendar"}</button>
                      </div>
                      <div>
                        <h3 className="font-black text-xs text-gray-400 mb-4 uppercase tracking-widest">Scheduled Stay History</h3>
                        <div className="space-y-3">
                            {appointments.filter(a => a.lead_id === editingClient.id).sort((a,b) => new Date(b.date_start) - new Date(a.date_start)).map(appt => {
                               if (editingApptId === appt.id) {
                                 return (
                                   <div key={appt.id} className={`p-4 rounded-2xl border shadow-sm animate-[slideInRight_0.2s_ease-out] ${appt.service_type === 'day_care' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                                     <div className="flex justify-between items-center mb-3"><span className={`text-[10px] font-black uppercase tracking-widest ${appt.service_type === 'day_care' ? 'text-[#d65a47]' : 'text-[#104b57]'}`}>Edit Booking</span><button onClick={() => setEditingApptId(null)} className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>
                                     <div className="space-y-2 mb-3">
                                        <div className="flex gap-2">
                                          <div className="flex-1"><label className="text-[9px] font-bold uppercase block mb-1">Start Date</label><input type="date" value={apptEditForm.date_start} onChange={(e) => setApptEditForm({...apptEditForm, date_start: e.target.value})} className="w-full text-xs p-1.5 border rounded" /></div>
                                          <div className="flex-1"><label className="text-[9px] font-bold uppercase block mb-1">End Date</label><input type="date" value={apptEditForm.date_end} onChange={(e) => setApptEditForm({...apptEditForm, date_end: e.target.value})} className="w-full text-xs p-1.5 border rounded" /></div>
                                        </div>
                                        <div className="flex gap-2">
                                           <div className="flex-1"><label className="text-[9px] font-bold uppercase block mb-1">Time In</label><select value={apptEditForm.time_start} onChange={(e) => setApptEditForm({...apptEditForm, time_start: e.target.value})} className="w-full text-xs p-1 border bg-white">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                           <div className="flex-1"><label className="text-[9px] font-bold uppercase block mb-1">Time Out</label><select value={apptEditForm.time_end} onChange={(e) => setApptEditForm({...apptEditForm, time_end: e.target.value})} className="w-full text-xs p-1 border bg-white">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                        </div>
                                     </div>
                                     <div className="flex gap-2">
                                        <button onClick={() => handleDeleteAppt(appt.id)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded"><TrashIcon className="w-4 h-4" /></button>
                                        <button onClick={handleUpdateAppt} className="flex-1 py-1.5 bg-[#104b57] text-white font-bold text-xs rounded">Save Changes</button>
                                     </div>
                                   </div>
                                 )
                               }
                               return (
                                 <div key={appt.id} className="bg-white p-4 rounded-2xl border border-gray-200 text-sm flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group relative pr-12">
                                   <button onClick={() => handleEditApptStart(appt)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-100 text-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"><PencilIcon className="w-4 h-4" /></button>
                                   <div className="flex items-center gap-4">
                                       <div className={`p-2.5 rounded-xl ${appt.service_type === 'day_care' ? 'bg-[#d65a47]/10 text-[#d65a47]' : 'bg-[#104b57]/10 text-[#104b57]'}`}>{appt.service_type === 'day_care' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}</div>
                                       <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{appt.service_type === 'day_care' ? 'Day Care' : 'Overnight'}</p>
                                         <div className="font-bold text-gray-800">{new Date(appt.date_start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<span className="text-gray-300 mx-2">→</span>{new Date(appt.date_end + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                         <div className="text-[9px] font-black text-gray-400">{appt.time_start} - {appt.time_end}</div>
                                       </div>
                                   </div>
                                   <div className="text-sm font-black text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">${Number(appt.price || 0).toFixed(2)}</div>
                                 </div>
                               )
                            })}
                          </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center z-10 flex-shrink-0">
        <div><h1 className="text-2xl font-black text-[#3a302a] font-serif">Client Database</h1><p className="text-sm text-gray-500 font-medium">Manage all your registered clients and pets.</p></div>
        <div className="flex items-center gap-4">
          <div className="relative w-72"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#104b57] text-sm font-medium" /><svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
          <button onClick={openAddModal} className="bg-[#104b57] text-white px-5 py-2 rounded-xl text-sm font-black shadow-md hover:bg-[#0c3942] transition-all transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap">New Client</button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 px-8 py-3 flex gap-2 overflow-x-auto z-10">
        {['all', 'pending', 'scheduled', 'approved', 'client'].map((tab) => (
          <button key={tab} onClick={() => setStatusFilter(tab)} className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors border ${statusFilter === tab ? 'bg-[#104b57] text-white border-[#104b57]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>{tab === 'all' ? 'All Clients' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {sortedAndFilteredLeads.length === 0 ? (
             <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200"><h3 className="text-xl font-bold text-gray-600">No clients found</h3></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedAndFilteredLeads.map((client) => {
                const statusBadge = getStatusDisplay(client.status);
                return (
                  <div key={client.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col relative group cursor-pointer overflow-hidden h-[380px]" onClick={() => openEditModal(client)}>
                    <div className="h-[55%] w-full relative bg-[#fdf8f5]">
                      {client.pet_photo && client.pet_photo.startsWith('http') ? <img src={client.pet_photo} alt={client.pet_name} className="w-full h-full object-cover group-hover:scale-105 transition-all" /> : <div className="w-full h-full flex items-center justify-center"><PawIcon className="w-16 h-16 text-[#d65a47]/20" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute top-4 right-4 z-10"><span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${statusBadge.classes}`}>{statusBadge.label}</span></div>
                      <h3 className="absolute bottom-3 left-4 right-4 text-3xl font-black text-white font-serif truncate drop-shadow-md">{client.pet_name}</h3>
                    </div>
                    <div className="flex-1 p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center px-1">
                        <div className="text-center w-1/3"><p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Breed</p><p className="text-xs font-bold text-gray-700 truncate">{client.breed}</p></div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <div className="text-center w-1/3"><p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Age</p><p className="text-xs font-bold text-gray-700 truncate">{client.age}</p></div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <div className="text-center w-1/3"><p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Weight</p><p className="text-xs font-black text-[#d65a47] truncate">{client.pet_weight}</p></div>
                      </div>
                      <div className="mt-auto bg-gray-50 p-3 rounded-xl border border-gray-100 group-hover:bg-[#104b57]/5 transition-colors">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Human Details</p>
                        <div className="flex justify-between items-center"><p className="font-black text-[#104b57] text-sm truncate">{client.owner_name}</p><p className="text-xs font-medium text-gray-500">{client.phone}</p></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}