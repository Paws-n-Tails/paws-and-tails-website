import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CameraIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>);
const XIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>);

export default function MediaGallery({ leads }) {
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  
  // Search & Tagging State
  const [searchPills, setSearchPills] = useState([]); // Multiple tags to filter by
  const [editTags, setEditTags] = useState([]); // Tags for the modal
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchMedia(); }, []);

  const fetchMedia = async () => {
    const { data } = await supabase.storage.from('media').list('', {
      limit: 500, sortBy: { column: 'created_at', order: 'desc' },
    });
    setMedia(data || []);
  };

  const getUrl = (name) => supabase.storage.from('media').getPublicUrl(name).data.publicUrl;

  const parseTags = (name) => {
    if (!name.includes('_TAG_')) return ['General'];
    return name.split('_TAG_')[1].split('_')[0].split('+').filter(Boolean);
  };

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      // Upload uses "General" or current search filters as default tags
      const tagString = searchPills.length > 0 ? searchPills.join('+') : 'General';
      
      for (const file of files) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${Date.now()}_TAG_${tagString}_${cleanName}`;
        await supabase.storage.from('media').upload(fileName, file);
      }
      await fetchMedia();
    } catch (error) { alert(error.message); } 
    finally { setUploading(false); }
  };

  const handleSaveChanges = async () => {
    if (!viewingItem || isSaving) return;
    setIsSaving(true);
    try {
      const oldName = viewingItem.name;
      const tagString = editTags.length > 0 ? editTags.join('+') : 'General';
      let timestamp = oldName.split('_TAG_')[0];
      let originalFile = oldName.split('_TAG_')[1]?.split('_').slice(1).join('_') || oldName;
      const newName = `${timestamp}_TAG_${tagString}_${originalFile}`;

      if (oldName === newName) { setViewingItem(null); setIsSaving(false); return; }

      await supabase.storage.from('media').copy(oldName, newName);
      await supabase.storage.from('media').remove([oldName]);

      setTimeout(async () => {
        await fetchMedia();
        setViewingItem(null);
        setIsSaving(false);
      }, 500);
    } catch (error) { alert(error.message); setIsSaving(false); }
  };

  // Filter logic: Item must contain ALL selected search pills
  const filteredMedia = media.filter(item => {
    if (searchPills.length === 0) return true;
    const itemTags = parseTags(item.name).map(t => t.toLowerCase());
    return searchPills.every(pill => itemTags.includes(pill.toLowerCase()));
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* --- REFINED HEADER --- */}
      <header className="bg-white border-b p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="flex flex-col w-full md:w-auto flex-1 max-w-2xl">
          <h1 className="text-2xl font-black text-[#104b57] font-serif italic mb-2">Dog Tag Vault</h1>
          
          {/* PILL SEARCH BAR */}
          <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-2xl border-2 border-transparent focus-within:border-[#104b57]/20 transition-all min-h-[50px] items-center">
            {searchPills.map(pill => (
              <span key={pill} className="bg-[#104b57] text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-sm">
                {pill} <button onClick={() => setSearchPills(searchPills.filter(p => p !== pill))}><XIcon className="w-3 h-3"/></button>
              </span>
            ))}
            <input 
              list="leads-list"
              placeholder={searchPills.length === 0 ? "Search for dogs..." : "Add dog to filter..."}
              className="bg-transparent text-sm outline-none flex-1 p-1 min-w-[150px]"
              onKeyUp={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                    setSearchPills([...new Set([...searchPills, e.target.value.trim()])]);
                    e.target.value = '';
                }
              }}
              onChange={(e) => {
                if (leads.some(l => l.pet_name === e.target.value)) {
                  setSearchPills([...new Set([...searchPills, e.target.value])]);
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>

        {/* CLEAN UPLOAD BUTTON */}
        <label className={`bg-[#d65a47] text-white px-10 py-4 rounded-2xl font-black text-sm cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap flex items-center gap-3 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <CameraIcon className="w-6 h-6" />
          {uploading ? "SAVING..." : "UPLOAD PHOTO"}
          <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </header>

      {/* --- GRID --- */}
      <main className="flex-1 overflow-y-auto p-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {filteredMedia.map((item) => (
            <div key={item.id} onClick={() => { setViewingItem(item); setEditTags(parseTags(item.name)); }} className="group relative aspect-square bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl cursor-pointer transition-all border-4 border-white">
              <img src={getUrl(item.name)} alt="Pet" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                {parseTags(item.name).map((tag, i) => (
                  <span key={i} className="bg-white/90 backdrop-blur-sm text-[9px] px-2 py-1 rounded-full font-black text-[#104b57] shadow-sm">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- MODAL (Same logic, better styling) --- */}
      {viewingItem && (
        <div className="fixed inset-0 z-[70] bg-[#104b57]/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] flex flex-col md:flex-row overflow-hidden h-[85vh] shadow-2xl">
            <div className="flex-1 bg-black flex items-center justify-center p-4 relative">
              <img src={getUrl(viewingItem.name)} className="max-w-full max-h-full object-contain" alt="Selected" />
              <button onClick={() => setViewingItem(null)} className="absolute top-8 left-8 p-4 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20 transition-all"><XIcon className="w-6 h-6"/></button>
            </div>
            <div className="w-full md:w-96 p-10 flex flex-col bg-white">
              <h2 className="text-3xl font-black text-[#3a302a] font-serif italic mb-10">Edit Tags</h2>
              <div className="flex-1 space-y-8 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {editTags.map(tag => (
                    <span key={tag} className="bg-[#fdf8f5] text-[#104b57] border-2 border-[#ffd1bc] px-4 py-2 rounded-full text-sm font-black flex items-center gap-3 shadow-sm">
                      {tag} <button onClick={() => setEditTags(editTags.filter(t => t !== tag))} className="text-[#d65a47]"><XIcon className="w-4 h-4"/></button>
                    </span>
                  ))}
                </div>
                <input 
                  list="leads-list"
                  placeholder="Add pet name..."
                  className="w-full p-5 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-[#ffd1bc] outline-none text-sm font-bold"
                  onKeyUp={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      setEditTags([...new Set([...editTags, e.target.value.trim()])]);
                      e.target.value = '';
                    }
                  }}
                  onChange={(e) => {
                    if (leads.some(l => l.pet_name === e.target.value)) {
                      setEditTags([...new Set([...editTags, e.target.value])]);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
              <div className="space-y-4 pt-8 mt-auto border-t">
                <button onClick={handleSaveChanges} disabled={isSaving} className={`w-full bg-[#104b57] text-white py-5 rounded-[2rem] font-black shadow-xl active:scale-95 ${isSaving ? 'opacity-50' : ''}`}>
                  {isSaving ? "SAVING..." : "SAVE CHANGES"}
                </button>
                <button onClick={async () => { if (window.confirm("Delete photo?")) { await supabase.storage.from('media').remove([viewingItem.name]); await fetchMedia(); setViewingItem(null); }}} className="w-full text-[#d65a47] font-black text-[10px] uppercase tracking-widest py-2 text-center">Delete Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <datalist id="leads-list">
        {leads.map(l => <option key={l.id} value={l.pet_name} />)}
      </datalist>
    </div>
  );
}