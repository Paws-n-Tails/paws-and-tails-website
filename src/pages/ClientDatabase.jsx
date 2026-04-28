import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PawIcon, CalendarIcon, SunIcon, MoonIcon } from '../components/Icons';

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
const weightOptions = Array.from({ length: 50 }, (_, i) => i === 0 ? "1 lb" : `${i + 1} lbs`);
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
    case 'pending_rescheduled': return { label: 'Pending - Rescheduled', classes: 'bg-orange-400 text-white border-orange-500' };
    case 'scheduled': return { label: 'Scheduled', classes: 'bg-blue-400 text-white border-blue-500' };
    case 'approved': return { label: 'Approved', classes: 'bg-green-400 text-white border-green-500' };
    case 'client': return { label: 'Client', classes: 'bg-purple-500 text-white border-purple-600' };
    case 'declined': return { label: 'Declined', classes: 'bg-red-500 text-white border-red-600' };
    default: return { label: status || 'Unknown', classes: 'bg-gray-200 text-gray-700 border-gray-300' };
  }
};

export default function ClientDatabase({ leads, appointments, fetchDashboardData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Add New Client States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({});

  // Modal Edit States
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Booking States
  const [bookingType, setBookingType] = useState('day_care');
  const [dayCareStartDate, setDayCareStartDate] = useState(''); 
  const [dayCareEndDate, setDayCareEndDate] = useState('');     
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [isBooking, setIsBooking] = useState(false);

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

  // --- Add Client Handlers ---
  const openAddModal = () => {
    setAddForm({
      pet_name: '', owner_name: '', phone: '', email: '', breed: '', age: '', pet_weight: '', info: '', status: 'client'
    });
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
        owner_name: addForm.owner_name,
        email: addForm.email,
        phone: addForm.phone,
        pet_name: addForm.pet_name,
        breed: addForm.breed,
        age: addForm.age,
        pet_weight: addForm.pet_weight,
        info: addForm.info,
        status: addForm.status,
        pet_photo: finalPhotoUrl
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

  // --- Edit Client Handlers ---
  const openEditModal = (client) => {
    setEditingClient(client);
    setEditForm({ ...client, phone: formatPhoneNumber(client.phone) });
    setNewPhotoFile(null);
  };

  const closeEditModal = () => {
    setEditingClient(null);
    setEditForm({});
    setNewPhotoFile(null);
    setDayCareStartDate(''); setDayCareEndDate(''); setDropoffDate(''); setDropoffTime(''); setPickupDate(''); setPickupTime('');
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
          owner_name: editForm.owner_name,
          email: editForm.email,
          phone: editForm.phone,
          pet_name: editForm.pet_name,
          breed: editForm.breed,
          age: editForm.age,
          pet_weight: editForm.pet_weight,
          info: editForm.info,
          status: editForm.status,
          pet_photo: finalPhotoUrl
        }).eq('id', editingClient.id);

      if (updateError) throw updateError;
      await fetchDashboardData();
      closeEditModal();
    } catch (error) {
      alert(`Error saving profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Booking Handlers ---
  const handleAddBooking = async () => {
    setIsBooking(true);
    try {
      const payload = {
        lead_id: editingClient.id,
        service_type: bookingType,
      };

      if (bookingType === 'day_care') {
        if (!dayCareStartDate || !dayCareEndDate) throw new Error("Please select a 'From' and 'To' date for Day Care.");
        if (new Date(dayCareStartDate) > new Date(dayCareEndDate)) throw new Error("'To' date cannot be earlier than 'From' date.");
        
        payload.date_start = dayCareStartDate;
        payload.date_end = dayCareEndDate;
        payload.time_start = '';
        payload.time_end = '';
      } else {
        if (!dropoffDate || !dropoffTime || !pickupDate || !pickupTime) {
          throw new Error("Please fill out all drop-off and pick-up fields for Overnight.");
        }
        payload.date_start = dropoffDate;
        payload.time_start = dropoffTime;
        payload.date_end = pickupDate;
        payload.time_end = pickupTime;
      }

      const { error } = await supabase.from('appointments').insert([payload]);
      if (error) throw error;
      
      setDayCareStartDate(''); setDayCareEndDate(''); setDropoffDate(''); setDropoffTime(''); setPickupDate(''); setPickupTime('');
      await fetchDashboardData();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsBooking(false);
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
                  
                  {/* Header Row */}
                  <div className="flex justify-between items-end border-b-2 border-gray-200 pb-3">
                    <div className="flex-1 pr-4">
                      <label className="block text-xs font-bold text-[#d65a47] mb-1.5 uppercase tracking-wider">Pet's Name</label>
                      <input type="text" required placeholder="e.g. Buster" value={addForm.pet_name} onChange={(e) => setAddForm({...addForm, pet_name: e.target.value})} className="w-full px-2 py-1 focus:outline-none bg-transparent font-black text-4xl text-[#3a302a] font-serif border-b-2 border-transparent focus:border-[#104b57] transition-colors" />
                    </div>
                    <div className="pb-1 pl-2">
                      <select value={addForm.status} onChange={(e) => setAddForm({...addForm, status: e.target.value})}
                        className="font-black rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#104b57] border-2 shadow-sm text-sm cursor-pointer transition-colors bg-purple-50 border-purple-200 text-purple-700">
                        <option value="client">Client</option>
                        <option value="approved">Approved</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-56 aspect-[3/4] bg-[#fdf8f5] rounded-2xl flex items-center justify-center overflow-hidden border-4 border-[#ffd1bc] relative group flex-shrink-0 shadow-sm">
                      {newPhotoFile ? <img src={URL.createObjectURL(newPhotoFile)} alt="Preview" className="w-full h-full object-cover" /> : <PawIcon className="w-20 h-20 text-[#d65a47]/20" />}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
                        <label className="cursor-pointer bg-white text-[#104b57] px-4 py-2 rounded-xl font-black shadow-lg hover:bg-[#fdf8f5] transition-transform transform hover:scale-105 border-2 border-white w-full text-sm flex flex-col items-center gap-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          Upload Photo
                          <input type="file" accept="image/*" onChange={(e) => setNewPhotoFile(e.target.files[0])} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Breed</label>
                          <select required value={addForm.breed} onChange={(e) => setAddForm({...addForm, breed: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#d65a47] focus:outline-none bg-white font-medium text-gray-700 text-sm">
                            <option value="">Select breed...</option>
                            {allBreeds.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Age</label>
                          <select required value={addForm.age} onChange={(e) => setAddForm({...addForm, age: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#d65a47] focus:outline-none bg-white font-medium text-gray-700 text-sm">
                            <option value="">Select age...</option>
                            {ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Weight</label>
                          <select required value={addForm.pet_weight} onChange={(e) => setAddForm({...addForm, pet_weight: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#d65a47] focus:outline-none bg-white font-medium text-gray-700 text-sm">
                            <option value="">Select weight...</option>
                            {weightOptions.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Admin Notes / Care Info</label>
                        <textarea value={addForm.info} onChange={(e) => setAddForm({...addForm, info: e.target.value})} className="w-full h-full min-h-[5rem] border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#d65a47] focus:outline-none resize-none bg-gray-50 focus:bg-white transition-colors text-sm" placeholder="Add behavioral notes, feeding instructions, or allergies..." />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-200 border-dashed" />

                  <div className="bg-[#fdf8f5] p-6 rounded-2xl border border-[#ffd1bc]/50">
                    <h3 className="font-black text-sm text-[#d65a47] mb-4 uppercase tracking-widest">Human Contact Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Owner Name</label>
                        <input type="text" required value={addForm.owner_name} onChange={(e) => setAddForm({...addForm, owner_name: e.target.value})} className="w-full border-2 border-white rounded-lg px-3 py-2 focus:border-[#104b57] focus:outline-none bg-white font-bold text-gray-800 text-sm shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Phone</label>
                        <input type="tel" required placeholder="(555) 555-5555" value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: formatPhoneNumber(e.target.value)})} className="w-full border-2 border-white rounded-lg px-3 py-2 focus:border-[#104b57] focus:outline-none bg-white font-bold text-gray-800 text-sm shadow-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
                        <input type="email" required value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} className="w-full border-2 border-white rounded-lg px-3 py-2 focus:border-[#104b57] focus:outline-none bg-white font-medium text-gray-700 text-sm shadow-sm" />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="bg-white p-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 z-20 rounded-b-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <button type="button" onClick={closeAddModal} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm">Cancel</button>
                  <button type="submit" disabled={isSaving} className="bg-[#104b57] text-white px-8 py-2.5 rounded-xl font-black hover:bg-[#0c3942] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm">
                    {isSaving ? "Saving..." : "Create Client Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- PROFILE EDIT MODAL -------------------- */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-full overflow-hidden flex flex-col relative animate-[slideInRight_0.2s_ease-out]">
            
            <div className="bg-[#104b57] p-5 text-white flex justify-between items-center z-20 shadow-md">
              <h2 className="text-xl font-black font-serif flex items-center gap-3">
                <PawIcon className="w-5 h-5 text-[#ffd1bc]" /> Edit Profile
              </h2>
              <button onClick={closeEditModal} className="text-white/70 hover:text-white transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSaveProfile} className="flex flex-col">
                <div className="p-8 space-y-6">
                  
                  {/* Header Row */}
                  <div className="flex justify-between items-end border-b-2 border-gray-200 pb-3">
                    <div className="flex-1 pr-4">
                      <label className="block text-xs font-bold text-[#d65a47] mb-1.5 uppercase tracking-wider">Pet's Name</label>
                      <input type="text" required value={editForm.pet_name} onChange={(e) => setEditForm({...editForm, pet_name: e.target.value})} className="w-full px-2 py-1 focus:outline-none bg-transparent font-black text-4xl text-[#3a302a] font-serif border-b-2 border-transparent focus:border-[#104b57] transition-colors" />
                    </div>
                    <div className="pb-1 pl-2">
                      <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className={`font-black rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#104b57] border-2 shadow-sm text-sm cursor-pointer transition-colors ${
                          editForm.status === 'client' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                          editForm.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' :
                          editForm.status === 'scheduled' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          editForm.status === 'pending_rescheduled' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                          editForm.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                          editForm.status === 'declined' ? 'bg-red-50 border-red-200 text-red-700' :
                          'bg-gray-50 border-gray-200 text-gray-700'
                        }`}>
                        <option value="pending">Pending</option>
                        <option value="pending_rescheduled">Pending - Rescheduled</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="approved">Approved</option>
                        <option value="client">Client</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-56 aspect-[3/4] bg-[#fdf8f5] rounded-2xl flex items-center justify-center overflow-hidden border-4 border-[#ffd1bc] relative group flex-shrink-0 shadow-sm">
                      {newPhotoFile ? <img src={URL.createObjectURL(newPhotoFile)} alt="Preview" className="w-full h-full object-cover" /> : editForm.pet_photo && editForm.pet_photo.startsWith('http') ? <img src={editForm.pet_photo} alt={editForm.pet_name} className="w-full h-full object-cover" /> : <PawIcon className="w-20 h-20 text-[#d65a47]/20" />}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
                        <label className="cursor-pointer bg-white text-[#104b57] px-4 py-2 rounded-xl font-black shadow-lg hover:bg-[#fdf8f5] transition-transform transform hover:scale-105 border-2 border-white w-full text-sm flex flex-col items-center gap-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          Update Photo
                          <input type="file" accept="image/*" onChange={(e) => setNewPhotoFile(e.target.files[0])} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Breed</label>
                          <select required value={editForm.breed} onChange={(e) => setEditForm({...editForm, breed: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#d65a47] focus:outline-none bg-white font-medium text-gray-700 text-sm">
                            <option value="">Select breed...</option>
                            {allBreeds.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Age</label>
                          <select required value={editForm.age} onChange={(e) => setEditForm({...editForm, age: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#d65a47] focus:outline-none bg-white font-medium text-gray-700 text-sm">
                            <option value="">Select age...</option>
                            {ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Weight</label>
                          <select required value={editForm.pet_weight} onChange={(e) => setEditForm({...editForm, pet_weight: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#d65a47] focus:outline-none bg-white font-medium text-gray-700 text-sm">
                            <option value="">Select weight...</option>
                            {weightOptions.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Admin Notes / Care Info</label>
                        <textarea value={editForm.info || ''} onChange={(e) => setEditForm({...editForm, info: e.target.value})} className="w-full h-full min-h-[5rem] border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#d65a47] focus:outline-none resize-none bg-gray-50 focus:bg-white transition-colors text-sm" placeholder="Add behavioral notes, feeding instructions, or allergies..." />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-200 border-dashed" />

                  <div className="bg-[#fdf8f5] p-6 rounded-2xl border border-[#ffd1bc]/50">
                    <h3 className="font-black text-sm text-[#d65a47] mb-4 uppercase tracking-widest">Human Contact Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Owner Name</label>
                        <input type="text" required value={editForm.owner_name} onChange={(e) => setEditForm({...editForm, owner_name: e.target.value})} className="w-full border-2 border-white rounded-lg px-3 py-2 focus:border-[#104b57] focus:outline-none bg-white font-bold text-gray-800 text-sm shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Phone</label>
                        <input type="tel" required placeholder="(555) 555-5555" value={editForm.phone || ''} onChange={(e) => setEditForm({...editForm, phone: formatPhoneNumber(e.target.value)})} className="w-full border-2 border-white rounded-lg px-3 py-2 focus:border-[#104b57] focus:outline-none bg-white font-bold text-gray-800 text-sm shadow-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
                        <input type="email" required value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full border-2 border-white rounded-lg px-3 py-2 focus:border-[#104b57] focus:outline-none bg-white font-medium text-gray-700 text-sm shadow-sm" />
                      </div>
                    </div>
                  </div>

                  {/* MANAGING MULTIPLE BOOKINGS */}
                  {editForm.status === 'client' && (
                    <>
                      <hr className="border-gray-200 border-dashed" />
                      <div className="bg-[#104b57]/5 p-6 rounded-2xl border border-[#104b57]/20">
                        <h3 className="font-black text-sm text-[#104b57] mb-4 uppercase tracking-widest flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" /> Manage Bookings
                        </h3>
                        
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                          <div className="flex gap-2 mb-4">
                            <button type="button" onClick={() => setBookingType('day_care')} className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${bookingType === 'day_care' ? 'bg-[#d65a47] text-white border-[#d65a47]' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}>
                              <SunIcon className="w-4 h-4" /> Day Care
                            </button>
                            <button type="button" onClick={() => setBookingType('overnight')} className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${bookingType === 'overnight' ? 'bg-[#104b57] text-white border-[#104b57]' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}>
                              <MoonIcon className="w-4 h-4" /> Overnight
                            </button>
                          </div>

                          {bookingType === 'day_care' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">From Date</label>
                                <input type="date" value={dayCareStartDate} onChange={(e) => setDayCareStartDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d65a47]" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">To Date</label>
                                <input type="date" value={dayCareEndDate} onChange={(e) => setDayCareEndDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d65a47]" />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Drop-Off</label>
                                <div className="flex gap-2">
                                  <input type="date" value={dropoffDate} onChange={(e) => setDropoffDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#104b57]" />
                                  <select value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#104b57] bg-white">
                                    <option value="">Time...</option>
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Pick-Up</label>
                                <div className="flex gap-2">
                                  <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#104b57]" />
                                  <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#104b57] bg-white">
                                    <option value="">Time...</option>
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          <button type="button" onClick={handleAddBooking} disabled={isBooking} className={`w-full text-white font-black py-2.5 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-sm ${bookingType === 'day_care' ? 'bg-[#d65a47] hover:bg-[#c44a38]' : 'bg-[#104b57] hover:bg-[#0c3942]'}`}>
                             {isBooking ? "Adding..." : "+ Add to Calendar"}
                          </button>
                        </div>

                        {appointments.filter(a => a.lead_id === editingClient.id).length > 0 && (
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scheduled Stay History</label>
                            {appointments.filter(a => a.lead_id === editingClient.id).map(appt => (
                               <div key={appt.id} className="bg-white px-4 py-3 rounded-xl border border-gray-200 text-sm flex justify-between items-center shadow-sm">
                                 {appt.service_type === 'day_care' ? (
                                   <div className="flex items-center gap-2">
                                     <span className="bg-[#d65a47]/10 text-[#d65a47] p-1.5 rounded-lg"><SunIcon className="w-4 h-4" /></span>
                                     <div>
                                       <span className="font-bold text-gray-700">{new Date(appt.date_start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                       {appt.date_start !== appt.date_end && (
                                         <>
                                           <span className="text-gray-400 mx-1">→</span>
                                           <span className="font-bold text-gray-700">{new Date(appt.date_end + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                         </>
                                       )}
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-2">
                                      <span className="bg-[#104b57]/10 text-[#104b57] p-1.5 rounded-lg"><MoonIcon className="w-4 h-4" /></span>
                                      <div>
                                        <span className="font-bold text-[#104b57]">{new Date(appt.date_start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> 
                                        <span className="text-gray-400 mx-1">→</span> 
                                        <span className="font-bold text-[#104b57]">{new Date(appt.date_end + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
                                   </div>
                                 )}
                                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">Booked</div>
                               </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                </div>

                <div className="bg-white p-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 z-20 rounded-b-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <button type="button" onClick={closeEditModal} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm">Cancel</button>
                  <button type="submit" disabled={isSaving} className="bg-[#d65a47] text-white px-8 py-2.5 rounded-xl font-black hover:bg-[#c44a38] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm">
                    {isSaving ? "Saving..." : "Save Profile Edits"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* -------------------- MAIN PAGE RENDER -------------------- */}
      <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center z-10 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#3a302a] font-serif">Client Database</h1>
          <p className="text-sm text-gray-500 font-medium">Manage all your registered clients and pets.</p>
        </div>
        
        {/* NEW CLIENT BUTTON AND SEARCH BAR */}
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <input 
              type="text" 
              placeholder="Search clients or pets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#104b57] text-sm font-medium"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button 
            onClick={openAddModal} 
            className="bg-[#104b57] text-white px-5 py-2 rounded-xl text-sm font-black shadow-md hover:bg-[#0c3942] hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New Client
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 px-8 py-3 flex gap-2 overflow-x-auto z-10">
        {[
          { id: 'all', label: 'All Clients' },
          { id: 'pending', label: 'Pending' },
          { id: 'pending_rescheduled', label: 'Rescheduled' },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'approved', label: 'Approved' },
          { id: 'client', label: 'Active Clients' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-colors border ${
              statusFilter === tab.id 
                ? 'bg-[#104b57] text-white border-[#104b57]' 
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {sortedAndFilteredLeads.length === 0 ? (
             <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><PawIcon className="w-10 h-10 text-gray-300" /></div>
               <h3 className="text-xl font-bold text-gray-600">No clients found</h3>
               <p className="text-gray-400 mt-2">Try adjusting your search or filters.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
              {sortedAndFilteredLeads.map((client) => {
                const statusBadge = getStatusDisplay(client.status);
                return (
                  <div key={client.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col relative group">
                    <div className="absolute top-6 right-6 z-10"><span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${statusBadge.classes}`}>{statusBadge.label}</span></div>
                    <h3 className="text-3xl font-black text-[#3a302a] font-serif mb-5 pr-24 truncate">{client.pet_name}</h3>
                    <div className="flex gap-5 mb-6">
                      <div className="w-28 aspect-[3/4] rounded-2xl overflow-hidden bg-[#fdf8f5] flex-shrink-0 border-2 border-gray-100 flex items-center justify-center relative shadow-sm">
                        {client.pet_photo && client.pet_photo.startsWith('http') ? <img src={client.pet_photo} alt={client.pet_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <PawIcon className="w-10 h-10 text-[#d65a47]/20" />}
                      </div>
                      <div className="flex flex-col justify-center gap-3 overflow-hidden">
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Breed</p><p className="text-sm font-bold text-gray-700 truncate">{client.breed}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Age</p><p className="text-sm font-bold text-gray-700">{client.age}</p></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Weight</p><p className="text-sm font-black text-[#d65a47]">{client.pet_weight}</p></div>
                      </div>
                    </div>
                    <hr className="border-gray-100 mb-5" />
                    <div className="mb-6 flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Human Details</p>
                      <p className="font-black text-[#104b57] mb-1 truncate">{client.owner_name}</p>
                      <p className="text-sm text-gray-600 truncate mb-0.5">{client.email}</p>
                      <p className="text-sm font-medium text-gray-500">{client.phone}</p>
                    </div>
                    <button onClick={() => openEditModal(client)} className="w-full bg-[#104b57]/5 text-[#104b57] hover:bg-[#104b57] hover:text-white font-black py-3 rounded-xl transition-all shadow-sm border border-[#104b57]/10 hover:border-[#104b57] mt-auto opacity-0 group-hover:opacity-100 focus:opacity-100">Edit Profile</button>
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