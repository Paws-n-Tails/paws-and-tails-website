'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HeartIcon, PawIcon, SunIcon, MoonIcon, CloudIcon, StarIcon, CheckCircleIcon } from '../components/Icons';

// --- SVGs for Google Reviews ---
const GoogleStarIcon = () => (
  <svg className="w-5 h-5 text-[#fbbc04] fill-current" viewBox="0 0 24 24">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const GoogleG = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Comprehensive list of dog breeds
const allBreeds = [
  "Affenpinscher", "Australian Cattle Dog", "Basset Hound", "Beagle", "Bichon Frise", "Border Collie", 
  "Border Terrier", "Boston Terrier", "Boykin Spaniel", "Brittany", "Brussels Griffon", "Bull Terrier", 
  "Bulldog", "Cairn Terrier", "Cavalier King Charles Spaniel", "Chihuahua", "Chinese Crested", "Cocker Spaniel", 
  "Corgi (Cardigan Welsh)", "Corgi (Pembroke Welsh)", "Dachshund", "French Bulldog", "Havanese", 
  "Italian Greyhound", "Jack Russell Terrier", "Japanese Chin", "Lhasa Apso", "Maltese", "Maltipoo", 
  "Miniature Pinscher", "Miniature Schnauzer", "Papillon", "Pekingese", "Pomeranian", "Poodle (Miniature)", 
  "Poodle (Toy)", "Pug", "Puggle", "Scottish Terrier", "Shetland Sheepdog", "Shiba Inu", "Staffordshire Bull Terrier", "West Highland White Terrier", "Whippet", "Yorkshire Terrier", 
  "Mixed Breed (Under 50lbs)", "Other (Under 50lbs)"
];

const ageOptions = ["Under 1 year", ...Array.from({ length: 20 }, (_, i) => i === 0 ? "1 year" : `${i + 1} years`)];
const weightOptions = Array.from({ length: 50 }, (_, i) => i === 0 ? "1 lb" : `${i + 1} lbs`);
const timeOptions = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

export default function Home({ setIsAdminView, logoUrl }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ sender: 'ai', text: 'Woof! How can I help you today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [formData, setFormData] = useState({ ownerName: '', email: '', phone: '', petName: '', breed: '', age: '', petWeight: '', petPhoto: null, info: ''});
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [availableWeekends, setAvailableWeekends] = useState([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15 });
    
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    const weekends = [];
    let currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    for (let i = 1; i <= 30; i++) {
      let nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + i);
      if (nextDate.getDay() === 0 || nextDate.getDay() === 6) weekends.push(nextDate);
    }
    setAvailableWeekends(weekends);
    
    return () => elements.forEach(el => observer.unobserve(el));
  }, []);

  const galleryImages = [
    "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777337510645.jpg",
    "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777337560083.jpg",
    "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777337641448.jpg",
    "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777337710272.jpg",
    "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777337817287.jpg",
    "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777337867641.jpg",
    "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777337914741.jpg",
    "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777337959664.jpg",
    "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777344607263.jpg"
  ];

  const reviews = [
    { name: "Amanda Torres", text: "Paws & Tails is amazing! My Goldendoodle Bailey loves it here. It is so hard to find a truly cage-free environment, and I have total peace of mind knowing she is sleeping on a real bed and not locked up.", rating: 5, initial: "A", color: "bg-purple-500", time: "2 weeks ago" },
    { name: "Parwin Abassi", text: "Brownie is a timid Maltipoo, but he comes home so happy and exhausted. The fact that they cap the weight limit at 50 lbs makes me feel so much better leaving him. Highly recommend!", rating: 5, initial: "P", color: "bg-blue-500", time: "1 month ago" },
    { name: "Michael Rossi", text: "Best day care in Ridgefield Park hands down. The facility is spotless, the scheduling is super easy, and Charlie literally pulls me to the front door when we drop him off. 5 stars.", rating: 5, initial: "M", color: "bg-green-500", time: "2 months ago" },
    { name: "Allison M", text: "Mac loves going to Paws & Tails! He's always so excited when we pull up, and he comes back wonderfully exhausted from running around all day.", rating: 5, initial: "A", color: "bg-[#104b57]", time: "3 months ago" },
    { name: "Lauren C", text: "Paws & Tails is amazing and I am so thankful I found someone I trust completely with my pup. 10/10 highly recommend to anyone in NJ looking for cage-free boarding.", rating: 5, initial: "L", color: "bg-[#d65a47]", time: "4 months ago" },
    { name: "Joseph T", text: "I'm one of the neighbors and every time my family and I go on vacation they are the ones we trust. Fantastic environment and the updates we get are great.", rating: 5, initial: "J", color: "bg-[#3a302a]", time: "5 months ago" }
  ];

  const faqs = [
    { q: "Are dogs placed in kennels or cages?", a: "Absolutely not! Our philosophy is 'cage-free comfort.' All dogs have free roam of our secure indoor play areas and outdoor yards. At night, they sleep in cozy, home-like suites—never a cage." },
    { q: "Do you accept large breeds?", a: "For the safety and comfort of our pack, we specialize in small to medium-sized breeds and currently only accept dogs weighing up to 50 lbs." },
    { q: "What should I pack for an overnight stay?", a: "Please bring their regular food, any medications, and a favorite toy or blanket to help them feel at home." },
    { q: "How do I schedule a meet & greet?", a: "Simply fill out our onboarding form by clicking the 'Schedule Meet & Greet' button above, or use our virtual receptionist!" }
  ];

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { sender: 'user', text: chatInput }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Bark! Thanks for reaching out. A human will get back to you shortly to finalize the details!' }]);
    }, 1000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalPhotoUrl = null;

      if (formData.petPhoto) {
        const file = formData.petPhoto;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pet_photos')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('pet_photos')
          .getPublicUrl(fileName);

        finalPhotoUrl = publicUrlData.publicUrl;
      }

      const newLeadData = {
        owner_name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        pet_name: formData.petName,
        breed: formData.breed,
        age: formData.age,
        pet_weight: formData.petWeight,
        pet_photo: finalPhotoUrl, 
        info: formData.info,
        meet_date: meetDate,
        meet_time: meetTime,
        status: 'pending'
      };

      const { error: leadError } = await supabase.from('leads').insert([newLeadData]);
      if (leadError) throw leadError;

      await supabase.from('system_logs').insert([{ 
        text: `New Request from ${formData.ownerName}: SMS & Email dispatched to Admin. AI Call countdown started (60m).`, 
        active: true 
      }]);

      setSubmitSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error.message);
      alert(`Uh oh! There was an error submitting your request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextFormStep = () => setFormStep(prev => Math.min(prev + 1, 3));
  const prevFormStep = () => setFormStep(prev => Math.max(prev - 1, 1));
  const openForm = () => {
    setSubmitSuccess(false);
    setShowForm(true);
    setFormStep(1);
    setTimeout(() => document.getElementById('main-form-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="min-h-screen bg-[#fdf8f5] font-sans text-gray-800 flex flex-col overflow-x-hidden relative">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(5deg); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
        @keyframes heartbeat { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.15); } 30% { transform: scale(1); } 45% { transform: scale(1.15); } 60% { transform: scale(1); } }
        .animate-heartbeat { animation: heartbeat 2s ease-in-out infinite; }
        @keyframes slideInLeft { 0% { opacity: 0; transform: translateX(-60px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { 0% { opacity: 0; transform: translateX(60px); } 100% { opacity: 1; transform: translateX(0); } }
        .animate-on-scroll { opacity: 0; transition: opacity 0.4s ease-out; }
        .slide-left.visible { animation: slideInLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .slide-right.visible { animation: slideInRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />

      {/* Top Bar */}
      <div className="bg-[#3a302a] text-[#ffd1bc] py-2 px-4 flex justify-center items-center z-50 relative shadow-md">
        <div className="flex items-center gap-3 text-sm font-bold">
          <HeartIcon className="text-[#d65a47] animate-heartbeat w-4 h-4" />
          <span>Call Us! (201) 822-5535</span>
          <HeartIcon className="text-[#d65a47] animate-heartbeat w-4 h-4" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center pt-12 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
            <source src="https://assets.mixkit.co/videos/preview/mixkit-small-dog-playing-with-a-toy-in-the-grass-1563-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/20 to-[#fdf8f5]"></div>
          <div className="absolute inset-0 bg-[#ffd1bc]/10 mix-blend-multiply"></div>
        </div>

        <div className="absolute top-20 left-10 text-[#ffd1bc] opacity-80 animate-float" style={{ animationDelay: '0s' }}><HeartIcon className="w-12 h-12" /></div>
        <div className="absolute top-32 right-32 text-[#d65a47] opacity-40 animate-float" style={{ animationDelay: '0.5s' }}><PawIcon className="w-14 h-14" /></div>
        <div className="absolute top-52 right-10 text-[#ffd1bc] opacity-70 animate-float" style={{ animationDelay: '1s' }}><HeartIcon className="w-16 h-16" /></div>
        <div className="absolute top-10 left-1/3 text-[#d65a47] opacity-20 animate-float" style={{ animationDelay: '0.8s' }}><PawIcon className="w-8 h-8 transform -rotate-12" /></div>
        <div className="absolute bottom-30 left-10 text-[#d65a47] opacity-15 animate-float" style={{ animationDelay: '1.5s' }}><PawIcon className="w-10 h-10 transform rotate-45" /></div>
        <div className="absolute bottom-20 right-30 text-[#ffd1bc] opacity-40 animate-float" style={{ animationDelay: '2s' }}><HeartIcon className="w-18 h-18" /></div>
        <div className="absolute top-70 left-1/4 text-[#d65a47] opacity-25 animate-float" style={{ animationDelay: '2.5s' }}><PawIcon className="w-9 h-9" /></div>
        <div className="absolute top-60 left-1/2 text-[#ffd1bc] opacity-35 animate-float" style={{ animationDelay: '3s' }}><HeartIcon className="w-14 h-14" /></div>
        <div className="absolute top-15 right-1/4 text-[#d65a47] opacity-10 animate-float" style={{ animationDelay: '3.5s' }}><PawIcon className="w-7 h-7 transform rotate-30" /></div>
        <div className="absolute bottom-10 right-1/2 text-[#ffd1bc] opacity-30 animate-float" style={{ animationDelay: '4s' }}><HeartIcon className="w-15 h-15" /></div>
        <div className="absolute top-5 right-10 text-[#d65a47] opacity-15 animate-float" style={{ animationDelay: '0.2s' }}><PawIcon className="w-11 h-11 transform rotate-12" /></div>
        <div className="absolute bottom-40 left-1/5 text-[#ffd1bc] opacity-20 animate-float" style={{ animationDelay: '1s' }}><HeartIcon className="w-13 h-13" /></div>
        <div className="absolute top-40 right-5 text-[#d65a47] opacity-10 animate-float" style={{ animationDelay: '2s' }}><PawIcon className="w-9 h-9" /></div>
        <div className="absolute bottom-5 left-1/2 text-[#ffd1bc] opacity-15 animate-float" style={{ animationDelay: '3.2s' }}><HeartIcon className="w-10 h-10" /></div>
        <div className="absolute top-30 left-1/6 text-[#d65a47] opacity-10 animate-float" style={{ animationDelay: '1.5s' }}><PawIcon className="w-7 h-7" /></div>
        
        <div className="relative z-10 flex flex-col items-center w-full max-w-3xl text-center mt-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white shadow-2xl mb-4 overflow-hidden bg-[#3a302a] flex items-center justify-center">
              <img src={logoUrl} alt="Paws and Tails" className="w-full h-full object-cover object-center transform scale-[1.2]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#3a302a] tracking-tight drop-shadow-sm font-serif">
              PAWS <span className="text-[#d65a47]">{'&'}</span> TAILS
            </h1>
            <span className="bg-[#3a302a] text-[#ffd1bc] font-bold px-6 py-2 rounded-full mt-3 shadow-md uppercase tracking-wider text-sm border border-[#2d1b13]">
              Your Pet{"'"}s Home Away From Home
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 mt-6 shadow-xl border-2 border-white max-w-2xl transform hover:scale-105 transition-transform duration-300">
            <p className="text-[#3a302a] text-lg md:text-xl leading-relaxed font-medium">
              We <span className="font-bold text-[#d65a47]">love</span> providing the very best dog sitting service! We welcome and encourage all new clients to schedule a meet and greet interview at our place in Ridgefield Park, New Jersey.
            </p>
          </div>

          <button onClick={openForm} className="mt-10 bg-[#104b57] hover:bg-[#0c3942] text-white px-10 py-4 rounded-full font-black text-xl transition-all flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 w-full max-w-sm animate-bounce" style={{ animationDuration: '2.5s' }}>
            Schedule Meet {'&'} Greet!
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
        </div>
      </section>

      {/* Love Statement Section */}
      <section className="bg-[#3a302a] py-24 px-4 relative z-20 overflow-hidden shadow-2xl border-y-8 border-[#ffd1bc]">
        <div className="max-w-4xl mx-auto text-center relative z-10 animate-on-scroll slide-right">
          
          <div className="flex justify-center items-center gap-4 mb-8">
            <HeartIcon className="w-12 h-12 text-[#ffd1bc] animate-heartbeat drop-shadow-md" style={{ animationDelay: '0s' }} />
            <HeartIcon className="w-16 h-16 text-[#d65a47] animate-heartbeat drop-shadow-md" style={{ animationDelay: '0.2s' }} />
            <HeartIcon className="w-12 h-12 text-[#ffd1bc] animate-heartbeat drop-shadow-md" style={{ animationDelay: '0.4s' }} />
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white font-serif leading-tight mb-8">
            At Paws {'&'} Tails, we don{"'"}t feel the need to charge a premium for something we absolutely <span className="text-[#d65a47]">love</span> doing.
          </h2>
          
          <p className="text-2xl md:text-4xl text-[#ffd1bc] font-black font-serif italic">
            We do it more out of love than anything else!
          </p>
          
          <div className="absolute top-10 left-10 text-[#ffd1bc] opacity-20 animate-float" style={{ animationDelay: '0.2s' }}><HeartIcon className="w-8 h-8" /></div>
          <div className="absolute bottom-10 right-20 text-[#d65a47] opacity-30 animate-float" style={{ animationDelay: '0.7s' }}><PawIcon className="w-10 h-10 transform rotate-12" /></div>
          <div className="absolute top-1/2 left-1/4 text-[#ffd1bc] opacity-15 animate-float" style={{ animationDelay: '1.2s' }}><HeartIcon className="w-6 h-6" /></div>
          <div className="absolute top-1/3 right-10 text-[#d65a47] opacity-20 animate-float" style={{ animationDelay: '1.7s' }}><PawIcon className="w-5 h-5 transform -rotate-15" /></div>
          <div className="absolute bottom-20 left-1/2 text-[#ffd1bc] opacity-15 animate-float" style={{ animationDelay: '2.2s' }}><HeartIcon className="w-7 h-7" /></div>
          <div className="absolute bottom-5 left-5 text-[#ffd1bc] opacity-10 animate-float" style={{ animationDelay: '0.1s' }}><HeartIcon className="w-9 h-9 transform -rotate-12" /></div>
          <div className="absolute top-20 right-1/4 text-[#d65a47] opacity-20 animate-float" style={{ animationDelay: '0.9s' }}><PawIcon className="w-8 h-8 transform rotate-30" /></div>
          <div className="absolute top-1/2 right-1/3 text-[#ffd1bc] opacity-15 animate-float" style={{ animationDelay: '1.4s' }}><HeartIcon className="w-6 h-6" /></div>
          <div className="absolute bottom-15 right-10 text-[#ffd1bc] opacity-10 animate-float" style={{ animationDelay: '0.5s' }}><HeartIcon className="w-9 h-9" /></div>
          <div className="absolute top-5 left-1/3 text-[#d65a47] opacity-20 animate-float" style={{ animationDelay: '2.1s' }}><PawIcon className="w-7 h-7 transform rotate-45" /></div>
          
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gradient-to-b md:bg-gradient-to-r from-[#ffd1bc] via-[#a3b1c6] to-[#104b57] py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none -mt-1 flex text-white z-20">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 fill-current">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
            </svg>
        </div>
        <div className="absolute top-10 left-10 text-white/50 animate-float z-10 hidden md:block"><SunIcon className="w-32 h-32 text-white/40" /></div>
        <div className="absolute top-40 left-1/4 text-white/60 animate-float delay-1000 z-10 hidden md:block"><CloudIcon className="w-20 h-20" /></div>
        <div className="absolute bottom-20 right-10 md:top-20 md:right-20 text-white/30 animate-pulse z-10"><MoonIcon className="w-24 h-24 text-white/50" /></div>
        <div className="absolute bottom-40 right-1/4 text-white/60 animate-float delay-500 z-10"><StarIcon className="w-10 h-10" /></div>

        <div className="max-w-4xl mx-auto text-center relative z-20 pt-6 pb-12 animate-on-scroll slide-left">
          <div className="inline-block bg-white/40 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/50 shadow-lg mx-4">
            <p className="text-xl md:text-2xl text-[#3a302a] leading-relaxed font-medium">
              We make each pet feel uniquely comfortable and loved. Check out our transparent pricing below!
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 text-center relative z-20">
          <div className="bg-white/95 backdrop-blur-sm rounded-[3rem] p-10 shadow-xl border-4 border-white transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center">
            <div className="p-4 bg-[#d65a47]/10 rounded-full mb-6"><SunIcon className="w-12 h-12 text-[#d65a47]" /></div>
            <h3 className="text-3xl font-black text-[#3a302a] mb-3 font-serif">Day Care</h3>
            <span className="bg-[#d65a47]/10 text-[#d65a47] font-bold px-4 py-1.5 rounded-full text-sm mb-6 inline-block">7am to 7pm</span>
            <p className="text-gray-600 leading-relaxed mb-8 font-medium">Your pup{"'"}s home away from home! We offer our fun and playful pet day care service from 7am to 7pm.</p>
            <div className="text-4xl font-black text-[#d65a47] mt-auto drop-shadow-sm">$50<span className="text-xl text-gray-400">/day</span></div>
          </div>

          <div className="bg-[#0b2931]/95 backdrop-blur-sm rounded-[3rem] p-10 shadow-xl border-4 border-[#104b57] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center">
            <div className="p-4 bg-[#104b57] rounded-full mb-6"><MoonIcon className="w-12 h-12 text-[#ffd1bc]" /></div>
            <h3 className="text-3xl font-black text-white mb-3 font-serif">Over Night</h3>
            <span className="bg-[#104b57] text-[#ffd1bc] font-bold px-4 py-1.5 rounded-full text-sm mb-6 inline-block shadow-inner">Full Day {'&'} Night</span>
            <p className="text-gray-300 leading-relaxed mb-8 font-medium">Your pet{"'"}s cozy overnight retreat! They can choose between their bed or ours, ensuring a restful night{"'"}s sleep.</p>
            <div className="text-4xl font-black text-[#ffd1bc] mt-auto drop-shadow-sm">$80<span className="text-xl text-[#608d96] font-medium ml-1">/night</span></div>
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      {showForm && (
        <section className="bg-[#fdf8f5] py-16 px-4 relative shadow-inner border-b-8 border-[#ffd1bc]" id="main-form-section">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row bg-white rounded-[3rem] shadow-2xl border-4 border-[#ffd1bc] overflow-hidden transform transition-all duration-500">
            
            <div className="lg:w-2/5 h-72 lg:h-auto relative overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80" 
                alt="Happy Dog" 
                className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#104b57] via-[#104b57]/40 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white z-10">
                <h3 className="text-3xl lg:text-4xl font-black font-serif mb-2 leading-tight">We can{"'"}t wait to meet your best friend!</h3>
                <p className="text-[#ffd1bc] font-bold text-lg">Schedule a quick 15-minute intro at our home.</p>
              </div>
            </div>

            <div className="lg:w-3/5 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white relative">
              <PawIcon className="absolute top-10 right-10 w-32 h-32 text-gray-50 opacity-50 transform rotate-12 z-0" />

              {submitSuccess ? (
                <div className="text-center relative z-10">
                  <div className="w-24 h-24 bg-[#104b57]/10 text-[#104b57] rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircleIcon className="w-12 h-12" />
                  </div>
                  <h2 className="text-4xl font-black text-[#3a302a] font-serif mb-4">Request Sent!</h2>
                  <div className="bg-[#ffd1bc] text-[#3a302a] inline-block px-6 py-2 rounded-full font-bold text-sm mb-6">Pending Approval</div>
                  <p className="text-gray-600 text-lg font-medium leading-relaxed mb-8">
                    We have received your request. All appointments must be manually approved by our team before being confirmed. We will contact you shortly to finalize!
                  </p>
                  <button onClick={() => setShowForm(false)} className="bg-[#104b57] text-white font-black px-10 py-4 rounded-xl hover:bg-[#0c3942] transition-colors shadow-lg">Close {'&'} Return</button>
                </div>
              ) : (
                <div className="relative z-10">
                  <div className="mb-10">
                    <h2 className="text-3xl md:text-4xl font-black text-[#3a302a] font-serif mb-3 flex items-center gap-3">Let{"'"}s Get Started! <PawIcon className="w-8 h-8 text-[#d65a47]" /></h2>
                    <p className="text-gray-500 font-medium text-lg">Just three quick steps to schedule your meet {'&'} greet.</p>
                  </div>
                  
                  <form onSubmit={handleFormSubmit}>
                    <div className="flex justify-start mb-10 gap-2 md:gap-4">
                      <div className={`h-2.5 w-16 md:w-24 rounded-full transition-colors duration-500 ${formStep >= 1 ? 'bg-[#d65a47]' : 'bg-gray-200'}`}></div>
                      <div className={`h-2.5 w-16 md:w-24 rounded-full transition-colors duration-500 ${formStep >= 2 ? 'bg-[#d65a47]' : 'bg-gray-200'}`}></div>
                      <div className={`h-2.5 w-16 md:w-24 rounded-full transition-colors duration-500 ${formStep >= 3 ? 'bg-[#104b57]' : 'bg-gray-200'}`}></div>
                    </div>

                    {formStep === 1 && (
                      <div className="space-y-5 p-2">
                        <h3 className="font-black text-2xl text-[#104b57] mb-6 border-b-2 border-[#104b57]/10 pb-4">1. Human Details</h3>
                        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Owner{"'"}s Name</label><input type="text" required value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} className="w-full border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d65a47] focus:bg-white transition-colors" /></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d65a47] focus:bg-white transition-colors" /></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Phone</label><input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d65a47] focus:bg-white transition-colors" /></div>
                      </div>
                    )}

                    {formStep === 2 && (
                      <div className="space-y-5 p-2">
                        <h3 className="font-black text-2xl text-[#d65a47] mb-6 border-b-2 border-[#d65a47]/10 pb-4">2. Pet Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Pet{"'"}s Name</label>
                            <input type="text" required value={formData.petName} onChange={(e) => setFormData({...formData, petName: e.target.value})} className="w-full border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] focus:bg-white transition-colors" />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Breed</label>
                            <select required value={formData.breed} onChange={(e) => setFormData({...formData, breed: e.target.value})} className="w-full border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] focus:bg-white transition-colors">
                              <option value="">Select a breed...</option>
                              {allBreeds.map((b, idx) => <option key={`breed-${idx}`} value={b}>{b}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                            <select required value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] focus:bg-white transition-colors">
                              <option value="">Select age...</option>
                              {ageOptions.map((a, idx) => <option key={`age-${idx}`} value={a}>{a}</option>)}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Weight (Max 50 lbs)</label>
                            <select required value={formData.petWeight} onChange={(e) => setFormData({...formData, petWeight: e.target.value})} className="w-full border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] focus:bg-white transition-colors">
                              <option value="">Select weight...</option>
                              {weightOptions.map((w, idx) => <option key={`weight-${idx}`} value={w}>{w}</option>)}
                            </select>
                          </div>

                          <div className="md:col-span-2 mt-2">
                            <label className="block text-sm font-bold text-[#104b57] mb-2">Upload a Photo of Your Dog! 📸</label>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => setFormData({...formData, petPhoto: e.target.files[0]})} 
                              className="w-full border-2 border-dashed border-[#104b57]/30 rounded-xl px-4 py-8 text-center text-gray-500 focus:outline-none focus:border-[#104b57] cursor-pointer file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#ffd1bc] file:text-[#3a302a] hover:file:bg-[#d65a47] hover:file:text-white transition-all bg-[#104b57]/5" 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formStep === 3 && (
                      <div className="space-y-5 p-2">
                        <h3 className="font-bold text-2xl text-[#104b57] mb-6 border-b-2 border-[#104b57]/10 pb-4">3. Meet {'&'} Greet</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                            <select required value={meetDate} onChange={(e) => setMeetDate(e.target.value)} className="w-full border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d65a47] focus:bg-white transition-colors">
                              <option value="">Select a weekend...</option>
                              {availableWeekends.map((date, idx) => (
                                <option key={`date-${idx}`} value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`}>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                            <select required value={meetTime} onChange={(e) => setMeetTime(e.target.value)} className="w-full border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d65a47] focus:bg-white transition-colors">
                              <option value="">Select a time...</option>
                              {timeOptions.map((t, idx) => <option key={`time-${idx}`} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-8 mt-6 flex justify-between items-center border-t-2 border-gray-100">
                      {formStep > 1 ? <button type="button" onClick={prevFormStep} className="bg-gray-100 text-gray-600 font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">Back</button> : <div></div>}
                      {formStep < 3 ? <button type="button" onClick={nextFormStep} className="bg-[#104b57] text-white font-black px-8 py-3 rounded-xl hover:bg-[#0c3942] transition-colors shadow-md">Next Step</button> : 
                        <button type="submit" disabled={isSubmitting} className="bg-[#d65a47] hover:bg-[#c44a38] text-white font-black px-10 py-3 rounded-xl shadow-lg transform transition-all hover:-translate-y-1">{isSubmitting ? "Sending..." : "Request Interview"}</button>
                      }
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Promo VIP Pass */}
      <section className="flex flex-col md:flex-row min-h-[300px] bg-white m-4 md:m-10 rounded-[3rem] overflow-hidden shadow-xl border-4 border-[#ffd1bc]">
        <div className="md:w-1/2 w-full h-80 md:h-auto overflow-hidden relative group">
           <img src="https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777345551064.jpg" alt="Paws and Tails VIP" className="w-full h-full object-cover transform scale-125 group-hover:scale-[1.35] transition-transform duration-700 object-center" />
           <div className="absolute inset-0 bg-[#104b57]/10 group-hover:bg-transparent transition-colors duration-500"></div>
           <div className="absolute top-8 left-8 bg-[#d65a47] text-white font-black text-sm md:text-base uppercase tracking-widest py-2 px-6 rounded-full shadow-xl transform -rotate-6 border-2 border-white animate-float">
             ★ Best Value ★
           </div>
        </div>
        <div className="md:w-1/2 w-full bg-white flex flex-col justify-center items-start text-left p-8 md:p-12 relative z-10">
          <h3 className="text-3xl md:text-5xl font-black font-serif text-[#3a302a] mb-2">Monthly VIP Pass</h3>
          <p className="text-gray-500 font-medium mb-6 text-sm md:text-base">Our most popular plan for regular working parents.</p>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl md:text-7xl font-black text-[#d65a47] font-serif">$800</span>
            <span className="text-gray-400 font-medium text-xl md:text-2xl">/ month</span>
          </div>
          <p className="text-[#104b57] font-bold mb-8 text-lg">Saves $200 vs 20 Daily Passes!</p>

          <ul className="space-y-5 mb-8 w-full">
            {[
              "Weekday Day Care (7am - 7pm)",
              "Valid all month (Monday - Friday)",
              "Valid for the full month (up to 30 days)",
              "Priority booking guarantee"
            ].map((item, i) => (
              <li key={`benefit-${i}`} className="flex items-center gap-4">
                <CheckCircleIcon className="w-7 h-7 text-[#d65a47] flex-shrink-0" />
                <span className="text-[#3a302a] font-bold text-base md:text-lg">{item}</span>
              </li>
            ))}
          </ul>

          <button onClick={openForm} className="bg-[#104b57] text-white hover:bg-[#0c3942] font-black text-lg px-10 py-4 rounded-full shadow-lg transition-all transform hover:-translate-y-1 w-full mt-auto">
            Schedule Interview to Unlock
          </button>
        </div>
      </section>

      {/* Instagram Gallery Section */}
      <section className="bg-[#ffd1bc] py-20 px-4 relative border-y-8 border-white shadow-sm z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-[#3a302a] font-serif mb-2 drop-shadow-sm">Follow Our Adventures</h2>
            <a href="https://www.instagram.com/pawsandtails_nj/" target="_blank" rel="noopener noreferrer" className="text-[#104b57] font-black text-xl hover:underline mb-2">@pawsandtails_nj</a>
          </div>
          <div className="grid grid-cols-3 gap-1 md:gap-3">
            {galleryImages.map((imgUrl, idx) => (
              <a key={`insta-${idx}`} href="https://www.instagram.com/pawsandtails_nj/" target="_blank" rel="noopener noreferrer" className="aspect-square bg-gray-100 overflow-hidden group">
                <img src={imgUrl} alt="Instagram Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- NEW GOOGLE REVIEWS SECTION ---------------- */}
      <section id="reviews" className="w-full bg-white border-y-8 border-[#ffd1bc] py-24 px-4 shadow-inner relative z-20 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-10 animate-on-scroll slide-left">
            <h2 className="text-4xl md:text-5xl font-black text-[#3a302a] font-serif mb-4">
              See what our pet parents are saying!
            </h2>
          </div>

          {/* Centered Google Header */}
          <div className="flex flex-col items-center justify-center mb-16 animate-on-scroll slide-right">
            <span className="text-6xl md:text-7xl font-black text-gray-800 tracking-tighter mb-2">
              5.0
            </span>
            <div className="flex gap-1.5 mb-4">
              {[...Array(5)].map((_, i) => <GoogleStarIcon key={`star-top-${i}`} />)}
            </div>
            <GoogleG />
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <div key={`review-${i}`} className={`animate-on-scroll ${i % 2 === 0 ? 'slide-left' : 'slide-right'} bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${review.color}`}>{review.initial}</div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{review.name}</h4>
                    <p className="text-gray-400 text-xs">{review.time}</p>
                  </div>
                  {/* Full color Google Logo */}
                  <div className="ml-auto">
                    <GoogleG />
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <GoogleStarIcon key={`star-${i}-${j}`} />)}
                </div>
                <p className="text-gray-600 text-sm font-medium leading-relaxed">{'"'}{review.text}{'"'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#ffd1bc] py-20 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={`faq-${index}`} className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden animate-on-scroll slide-left" style={{ animationDelay: `${index * 0.1}s` }}>
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full px-6 py-5 text-left font-bold text-[#3a302a] flex justify-between items-center">
                  {faq.q}
                  <svg className={`w-5 h-5 transform transition-transform ${openFaq === index ? 'rotate-180 text-[#d65a47]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}><p className="text-gray-600 font-medium">{faq.a}</p></div>
              </div>
            ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3a302a] py-12 flex flex-col items-center text-center px-4 relative border-t border-white/10">
         <div className="w-20 h-20 rounded-full border-2 border-white shadow-md mb-6 overflow-hidden bg-[#3a302a] flex items-center justify-center">
           <img src={logoUrl} alt="Paws & Tails" className="w-full h-full object-cover transform scale-[1.2]" />
         </div>
         <div className="font-black text-2xl text-[#ffd1bc] mb-2">(201) 822-5535</div>
         <div className="mt-8 pt-6 border-t border-white/10 w-full max-w-md flex justify-center">
           <button onClick={() => setIsAdminView(true)} className="text-sm font-bold text-[#ffd1bc] hover:text-white flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
             Staff Login
           </button>
         </div>
      </footer>
      
      {/* AI Chatbot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white w-80 rounded-[2rem] shadow-2xl mb-4 overflow-hidden flex flex-col h-[400px] animate-[slideInRight_0.2s_ease-out]">
            <div className="bg-[#3a302a] p-4 flex justify-between items-center text-[#ffd1bc]">
              <span className="font-bold text-sm">Virtual Paw-ssistant</span>
              <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-[#fdf8f5] flex flex-col gap-3">
              {chatMessages.map((msg, i) => (
                <div key={`msg-${i}`} className={`p-3 rounded-2xl text-sm font-medium ${msg.sender === 'ai' ? 'bg-white text-gray-700 shadow-sm border border-gray-100' : 'bg-[#d65a47] text-white self-end shadow-sm'}`}>{msg.text}</div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#104b57]" />
              <button type="submit" className="bg-[#104b57] text-white p-2 rounded-full hover:bg-[#0c3942] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="bg-[#104b57] text-white p-4 rounded-full shadow-2xl hover:bg-[#0c3942] hover:scale-105 transition-all flex items-center justify-center">
          {isChatOpen ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>}
        </button>
      </div>

    </div>
  );
}