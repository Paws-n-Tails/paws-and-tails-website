import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PawIcon } from '../components/Icons';

// --- ICONS ---
const CameraIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>);
const ShareIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>);
const TrashIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>);

export default function MediaGallery({ leads }) {
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [filterPet, setFilterPet] = useState('all');

  useEffect(() => { fetchMedia(); }, []);

  const fetchMedia = async () => {
    const { data, error } = await supabase.storage.from('media').list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) console.error(error);
    else setMedia(data || []);
  };

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        // Naming convention: timestamp_PetName.ext
        const fileName = `${Date.now()}_${filterPet === 'all' ? 'General' : filterPet}.${fileExt}`;
        const { error } = await supabase.storage.from('media').upload(fileName, file);
        if (error) throw error;
      }
      await fetchMedia();
    } catch (error) { alert(error.message); } 
    finally { setUploading(false); }
  };

  const deleteMedia = async (name) => {
    if (!window.confirm("Delete this photo/video?")) return;
    const { error } = await supabase.storage.from('media').remove([name]);
    if (error) alert(error.message);
    else fetchMedia();
  };

  const getUrl = (name) => supabase.storage.from('media').getPublicUrl(name).data.publicUrl;

  const copyToClipboard = (name) => {
    const url = getUrl(name);
    navigator.clipboard.writeText(url);
    alert("Link copied! Paste this into a text or email to the owner.");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center z-10 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#3a302a] font-serif">Pet Media Gallery</h1>
          <p className="text-sm text-gray-500 font-medium">Snap moments and share them with owners.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
             <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Tag a Pet First</label>
             <select 
                value={filterPet} 
                onChange={(e) => setFilterPet(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-[#104b57] focus:border-[#d65a47] outline-none bg-white"
              >
                <option value="all">General / No Tag</option>
                {leads.map(l => <option key={l.id} value={l.pet_name}>{l.pet_name}</option>)}
              </select>
          </div>

          <label className={`bg-[#d65a47] text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg hover:bg-[#c44a38] transition-all cursor-pointer flex items-center gap-2 mt-4 ${uploading ? 'opacity-50 animate-pulse' : ''}`}>
            <CameraIcon className="w-6 h-6" />
            {uploading ? "Uploading..." : "Snap / Upload"}
            <input type="file" multiple accept="image/*,video/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {media.map((item) => {
            const isVideo = item.name.match(/\.(mp4|mov|webm)$/i);
            const petTag = item.name.includes('_') ? item.name.split('_')[1].split('.')[0] : null;
            
            return (
              <div key={item.id} className="group relative bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-200 aspect-square transition-all hover:shadow-xl">
                {isVideo ? (
                  <video src={getUrl(item.name)} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={getUrl(item.name)} alt="Moment" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                )}
                
                {/* Pet Tag Badge */}
                {petTag && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase text-[#d65a47] shadow-sm z-10 border border-orange-100">
                    {petTag}
                  </div>
                )}

                {/* Desktop/Tablet Hover Controls */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={() => copyToClipboard(item.name)} className="bg-white p-3 rounded-full text-[#104b57] hover:scale-125 transition-transform shadow-xl"><ShareIcon className="w-6 h-6" /></button>
                  <button onClick={() => deleteMedia(item.name)} className="bg-white p-3 rounded-full text-red-500 hover:scale-125 transition-transform shadow-xl"><TrashIcon className="w-6 h-6" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}