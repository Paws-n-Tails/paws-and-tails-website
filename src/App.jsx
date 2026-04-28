import React, { useState, useEffect } from 'react';

export default function App() {
  const [isHovered, setIsHovered] = useState(null);
  
  // UI States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ sender: 'ai', text: 'Woof! How can I help you today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  
  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validation States for Interview
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [availableWeekends, setAvailableWeekends] = useState([]);
  
  const logoUrl = "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777350618285.jpg";

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

    // Automatically generate the next 30 days of weekends for the dropdown
    const weekends = [];
    let currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    for (let i = 1; i <= 30; i++) {
      let nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + i);
      if (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
        weekends.push(nextDate);
      }
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
    { name: "Allison M", text: "Mac loves going to Paws & Tails Dog Sitting!", rating: 5, initial: "A", color: "bg-[#104b57]" },
    { name: "Mel E", text: "Paws & Tails took great care of our five dogs in our house. She even picked up our mails.", rating: 5, initial: "M", color: "bg-[#d65a47]" },
    { name: "Cassandra C", text: "My fur babies love her. Reliable, kind, and easy scheduling with her. Thanks Paws & Tails!", rating: 5, initial: "C", color: "bg-[#3a302a]" },
    { name: "Lauren C", text: "Paws & Tails is amazing and I am so thankful I found someone I trust completely with my pup. 10/10", rating: 5, initial: "L", color: "bg-[#104b57]" },
    { name: "Dogs Of Tampa", text: "There is no one I trust more when I visit New Jersey to take care of my dogs!", rating: 5, initial: "D", color: "bg-[#d65a47]" },
    { name: "Joseph T", text: "I'm one of Paws & Tails' neighbors and every time my family and I go on vacation she is the one we trust...", rating: 5, initial: "J", color: "bg-[#3a302a]" }
  ];

  const faqs = [
    { q: "What vaccinations are required?", a: "We require up-to-date Rabies, DHPP, and Bordetella vaccines for all our furry guests." },
    { q: "Do you accept large breeds?", a: "Currently, we specialize in small breeds to ensure a safe and comfortable environment for our little guests!" },
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

  const handleLogin = (e) => {
    e.preventDefault();
    // In a real app, this would authenticate with Supabase Auth
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowForm(false);
  };

  const submitLeadToSupabase = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    /* =========================================
      SUPABASE INTEGRATION READY
      =========================================
      Replace the setTimeout below with your Supabase insert code:
      
      const { data, error } = await supabase
        .from('leads')
        .insert([
          { 
            owner_name: formData.name, 
            email: formData.email, 
            phone: formData.phone,
            pet_name: formData.petName,
            status: 'pending_interview',
            interview_date: meetDate,
            interview_time: meetTime
          }
        ]);
        
      if (!error) {
         setIsSubmitting(false);
         setSubmitSuccess(true);
      }
      =========================================
    */

    // Simulating database network request for demo
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 1500);
  };

  const submitBookingToSupabase = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Supabase insert for 'appointments' table goes here
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 1500);
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
      {/* Custom Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.15); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
          60% { transform: scale(1); }
        }
        .animate-heartbeat { animation: heartbeat 2s ease-in-out infinite; }

        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-60px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(60px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-on-scroll { opacity: 0; }
        .slide-left.visible { animation: slideInLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .slide-right.visible { animation: slideInRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fillStarAnim {
          0% { color: #d1d5db; transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { color: #d65a47; transform: scale(1); }
        }
        .visible .star-animate { animation: fillStarAnim 0.5s ease-out forwards; }
      `}} />

      {/* Top Bar with Client Login */}
      <div className="bg-[#3a302a] text-[#ffd1bc] py-2 px-4 flex justify-between items-center z-50 relative shadow-md">
        <div className="w-24"></div> {/* Spacer */}
        <div className="flex items-center gap-3 text-sm font-bold">
          <HeartIcon className="text-[#d65a47] animate-heartbeat w-4 h-4" />
          <span>Call Us! (201) 822-5535</span>
          <HeartIcon className="text-[#d65a47] animate-heartbeat w-4 h-4" />
        </div>
        <div className="w-24 flex justify-end">
          {isLoggedIn ? (
            <button onClick={handleLogout} className="text-xs font-bold text-white hover:text-[#d65a47] transition-colors flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">
              Logout
            </button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="text-xs font-bold text-[#3a302a] bg-[#ffd1bc] hover:bg-white transition-colors px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
              <UserIcon className="w-3 h-3" /> Client Login
            </button>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-[slideInRight_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-black text-[#3a302a] font-serif">Welcome Back! <PawIcon className="w-6 h-6 text-[#d65a47] inline-block -mt-2" /></h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full bg-[#104b57] text-white font-black py-4 rounded-xl mt-4 hover:bg-[#0c3942] transition-colors shadow-md">
                Login to Portal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center pt-12 pb-20 px-4 overflow-hidden">
        {/* HTML5 Background Video */}
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
            <source src="https://assets.mixkit.co/videos/preview/mixkit-small-dog-playing-with-a-toy-in-the-grass-1563-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/20 to-[#fdf8f5]"></div>
          <div className="absolute inset-0 bg-[#ffd1bc]/10 mix-blend-multiply"></div>
        </div>

        {/* Floating Background Elements */}
        <div className="absolute top-20 left-10 text-[#ffd1bc] opacity-80 animate-float" style={{ animationDelay: '0s' }}><HeartIcon className="w-12 h-12" /></div>
        <div className="absolute top-32 right-32 text-[#d65a47] opacity-40 animate-float" style={{ animationDelay: '0.5s' }}><PawIcon className="w-14 h-14" /></div>
        <div className="absolute top-52 right-10 text-[#ffd1bc] opacity-70 animate-float" style={{ animationDelay: '1s' }}><HeartIcon className="w-16 h-16" /></div>
        <div className="absolute top-10 left-1/3 text-[#d65a47] opacity-20 animate-float" style={{ animationDelay: '0.8s' }}><PawIcon className="w-8 h-8 transform -rotate-12" /></div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-3xl text-center mt-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white shadow-2xl mb-4 overflow-hidden bg-[#3a302a] flex items-center justify-center">
              <img src={logoUrl} alt="Paws & Tails" className="w-full h-full object-cover object-center transform scale-[1.2]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#3a302a] tracking-tight drop-shadow-sm font-serif">
              PAWS <span className="text-[#d65a47]">&</span> TAILS
            </h1>
            <span className="bg-[#3a302a] text-[#ffd1bc] font-bold px-6 py-2 rounded-full mt-3 shadow-md uppercase tracking-wider text-sm border border-[#2d1b13]">
              Your Pet's Home Away From Home
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 mt-6 shadow-xl border-2 border-white max-w-2xl transform hover:scale-105 transition-transform duration-300">
            {isLoggedIn ? (
              <p className="text-[#104b57] text-xl md:text-2xl leading-relaxed font-black font-serif">
                Welcome back to the portal! Ready to book your next stay?
              </p>
            ) : (
              <p className="text-[#3a302a] text-lg md:text-xl leading-relaxed font-medium">
                We <span className="font-bold text-[#d65a47]">love</span> providing the very best dog sitting service! We welcome and encourage all new clients to schedule a meet and greet interview at our place in Ridgefield Park, New Jersey.
              </p>
            )}
          </div>

          <button onClick={openForm} className="mt-10 bg-[#104b57] hover:bg-[#0c3942] text-white px-10 py-4 rounded-full font-black text-xl transition-all flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 w-full max-w-sm animate-bounce" style={{ animationDuration: '2.5s' }}>
            {isLoggedIn ? "Book a Stay Online" : "Schedule Meet & Greet!"}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
        </div>
      </section>

      {/* Services Section - Day to Night Morph */}
      <section className="bg-gradient-to-b md:bg-gradient-to-r from-[#ffd1bc] via-[#a3b1c6] to-[#104b57] py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none -mt-1 flex text-white z-20">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 fill-current">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
            </svg>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 text-center relative z-20 pt-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-[3rem] p-10 shadow-xl border-4 border-white transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center">
            <div className="p-4 bg-[#d65a47]/10 rounded-full mb-6"><SunIcon className="w-12 h-12 text-[#d65a47]" /></div>
            <h3 className="text-3xl font-black text-[#3a302a] mb-3 font-serif">Day Care</h3>
            <span className="bg-[#d65a47]/10 text-[#d65a47] font-bold px-4 py-1.5 rounded-full text-sm mb-6 inline-block">7am to 7pm</span>
            <p className="text-gray-600 leading-relaxed mb-8 font-medium">Your pup's home away from home! We offer our fun and playful pet day care service from 7am to 7pm.</p>
            <div className="text-4xl font-black text-[#d65a47] mt-auto drop-shadow-sm">$50<span className="text-xl text-gray-400">/day</span></div>
          </div>

          <div className="bg-[#0b2931]/95 backdrop-blur-sm rounded-[3rem] p-10 shadow-xl border-4 border-[#104b57] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center">
            <div className="p-4 bg-[#104b57] rounded-full mb-6"><MoonIcon className="w-12 h-12 text-[#ffd1bc]" /></div>
            <h3 className="text-3xl font-black text-white mb-3 font-serif">Over Night</h3>
            <span className="bg-[#104b57] text-[#ffd1bc] font-bold px-4 py-1.5 rounded-full text-sm mb-6 inline-block shadow-inner">Full Day & Night</span>
            <p className="text-gray-300 leading-relaxed mb-8 font-medium">Your pet's cozy overnight retreat! They can choose between their bed or ours, ensuring a restful night's sleep.</p>
            <div className="text-4xl font-black text-[#ffd1bc] mt-auto drop-shadow-sm">$80<span className="text-xl text-[#608d96] font-medium ml-1">/night</span></div>
          </div>
        </div>
      </section>

      {/* Main Dynamic Form Section */}
      {showForm && (
        <section className="bg-[#fdf8f5] py-16 px-4 relative shadow-inner border-b-8 border-[#ffd1bc]" id="main-form-section">
          <div className="max-w-3xl mx-auto">
            
            {submitSuccess ? (
              <div className="bg-white p-12 rounded-[3rem] shadow-xl border-4 border-[#104b57] text-center animate-[slideInRight_0.4s_ease-out]">
                <div className="w-24 h-24 bg-[#104b57]/10 text-[#104b57] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-4xl font-black text-[#3a302a] font-serif mb-4">Request Sent!</h2>
                <div className="bg-[#ffd1bc] text-[#3a302a] inline-block px-6 py-2 rounded-full font-bold text-sm mb-6">Pending Approval</div>
                <p className="text-gray-600 text-lg font-medium leading-relaxed mb-8">
                  We have received your request. All appointments must be manually approved by our team before being confirmed. We will contact you shortly to finalize!
                </p>
                <button onClick={() => setShowForm(false)} className="bg-[#104b57] text-white font-black px-10 py-4 rounded-xl hover:bg-[#0c3942] transition-colors">
                  Close & Return
                </button>
              </div>
            ) : isLoggedIn ? (
              // ==========================================
              // LOGGED IN VIEW: DIRECT BOOKING FORM
              // ==========================================
              <>
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black text-[#104b57] font-serif mb-4 flex items-center justify-center gap-3">
                    Book a Stay <SunIcon className="w-9 h-9 text-[#d65a47]" />
                  </h2>
                  <p className="text-gray-600 font-medium text-lg">Welcome back! Schedule your approved pup's next visit.</p>
                </div>
                <form className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border-4 border-[#104b57]" onSubmit={submitBookingToSupabase}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Select Service</label>
                      <select required className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50 font-medium text-gray-700">
                        <option value="">Choose a service...</option>
                        <option value="daycare">Day Care ($50/day)</option>
                        <option value="overnight">Over Night ($80/night)</option>
                        <option value="vip">Use VIP Monthly Pass</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Drop-off Date</label>
                        <input type="date" required className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50 text-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pick-up Date</label>
                        <input type="date" required className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50 text-gray-700" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Special Instructions for this stay?</label>
                      <textarea rows="3" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50 text-gray-700 resize-none" placeholder="Feeding times, medications, etc..."></textarea>
                    </div>
                    
                    <div className="bg-[#ffd1bc]/30 p-4 rounded-xl border border-[#ffd1bc] flex items-start gap-3 mt-6">
                      <svg className="w-6 h-6 text-[#d65a47] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <p className="text-sm text-[#3a302a] font-medium">Appointments requested through the portal require manual approval before confirmation.</p>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-[#104b57] hover:bg-[#0c3942] text-white font-black text-lg px-8 py-4 rounded-xl shadow-lg transform transition-all hover:-translate-y-1 mt-4 disabled:opacity-50 flex justify-center items-center">
                      {isSubmitting ? "Sending Request..." : "Request Booking"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // ==========================================
              // LOGGED OUT VIEW: ONBOARDING INTERVIEW FORM
              // ==========================================
              <>
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black text-[#3a302a] font-serif mb-4 flex items-center justify-center gap-3">
                    Let's Get Started! <PawIcon className="w-9 h-9 text-[#d65a47]" />
                  </h2>
                  <p className="text-gray-600 font-medium text-lg">Tell us about you and your furry friend to schedule your meet & greet.</p>
                </div>
                
                <form className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border-4 border-[#ffd1bc]" onSubmit={submitLeadToSupabase}>
                  <div className="flex justify-center mb-10 gap-2 md:gap-4">
                    <div className={`h-3 w-16 md:w-24 rounded-full transition-colors duration-500 ${formStep >= 1 ? 'bg-[#d65a47]' : 'bg-gray-200'}`}></div>
                    <div className={`h-3 w-16 md:w-24 rounded-full transition-colors duration-500 ${formStep >= 2 ? 'bg-[#d65a47]' : 'bg-gray-200'}`}></div>
                    <div className={`h-3 w-16 md:w-24 rounded-full transition-colors duration-500 ${formStep >= 3 ? 'bg-[#104b57]' : 'bg-gray-200'}`}></div>
                  </div>

                  {formStep === 1 && (
                    <div className="relative space-y-5 bg-[#fff3ec] p-6 md:p-10 rounded-3xl text-[#3a302a] border-4 border-[#ffd1bc] animate-[slideInRight_0.4s_ease-out_forwards]">
                      <div className="relative z-10 border-b-2 border-[#ffd1bc] pb-6 mb-8 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="bg-white p-3 rounded-full shadow-sm inline-flex transform rotate-12">
                           <HeartIcon className="w-8 h-8 text-[#d65a47]" />
                        </div>
                        <div>
                          <h3 className="font-black text-3xl text-[#3a302a] font-serif tracking-wide">1. Human Details</h3>
                          <p className="text-gray-600 font-bold text-sm mt-1">Let's get to know you first! How can we reach you?</p>
                        </div>
                      </div>
                      
                      <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Owner's Name</label><input type="text" required className="w-full border-2 border-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#d65a47] bg-white text-gray-800 shadow-sm" /></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label><input type="email" required className="w-full border-2 border-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#d65a47] bg-white text-gray-800 shadow-sm" /></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label><input type="tel" required className="w-full border-2 border-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#d65a47] bg-white text-gray-800 shadow-sm" /></div>
                    </div>
                  )}

                  {formStep === 2 && (
                    <div className="space-y-5 p-2 animate-[slideInRight_0.4s_ease-out_forwards]">
                      <h3 className="font-black text-2xl text-[#d65a47] mb-6 border-b-2 border-[#d65a47]/20 pb-4 flex items-center gap-2">
                        <PawIcon className="w-6 h-6 text-[#d65a47]" /> 2. Pet Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">Pet's Name</label><input type="text" required className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50" /></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Breed</label><input type="text" required className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50" /></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Age</label><input type="text" required className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50" /></div>
                      </div>
                    </div>
                  )}

                  {formStep === 3 && (
                    <div className="space-y-5 p-2 animate-[slideInRight_0.4s_ease-out_forwards]">
                      <h3 className="font-bold text-2xl text-[#104b57] mb-6 border-b-2 border-[#104b57]/20 pb-4">3. Meet & Greet Details</h3>
                      
                      <div className="bg-[#104b57]/5 border border-[#104b57]/20 p-4 rounded-xl mb-6 flex gap-3">
                        <svg className="w-6 h-6 text-[#104b57] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-sm font-medium text-gray-700">Interviews are exclusively held on <strong>Saturdays and Sundays</strong> between <strong>10:00 AM and 5:00 PM</strong>.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                          <select required value={meetDate} onChange={(e) => setMeetDate(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50 text-gray-700 cursor-pointer">
                            <option value="">Select a weekend...</option>
                            {availableWeekends.map((date, idx) => {
                              // Format date value correctly for local timezone
                              const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                              const displayDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                              return <option key={idx} value={dateValue}>{displayDate}</option>;
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                          <select required value={meetTime} onChange={(e) => setMeetTime(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50 text-gray-700 cursor-pointer">
                            <option value="">Select a time...</option>
                            {["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"].map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-1">Additional Information</label>
                          <textarea rows="3" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#104b57] bg-gray-50 text-gray-700 resize-none" placeholder="Tell us anything else we should know..."></textarea>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-8 mt-6 flex justify-between items-center border-t-2 border-gray-100">
                    {formStep > 1 ? (
                      <button type="button" onClick={prevFormStep} className="bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold px-6 py-3 rounded-xl">Back</button>
                    ) : <div></div>}
                    
                    {formStep < 3 ? (
                      <button type="button" onClick={nextFormStep} className="bg-[#104b57] text-white font-black px-8 py-3 rounded-xl hover:bg-[#0c3942]">Next Step</button>
                    ) : (
                      <button type="submit" disabled={isSubmitting} className="bg-[#d65a47] hover:bg-[#c44a38] text-white font-black px-10 py-3 rounded-xl shadow-lg transform transition-all hover:-translate-y-1 disabled:opacity-50">
                        {isSubmitting ? "Sending..." : "Request Interview"}
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      )}

      {/* Promo Section - VIP Pass */}
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
              <li key={i} className="flex items-center gap-4">
                <CheckCircleIcon className="w-7 h-7 text-[#d65a47] flex-shrink-0" />
                <span className="text-[#3a302a] font-bold text-base md:text-lg">{item}</span>
              </li>
            ))}
          </ul>

          {/* Smart CTA for VIP Pass */}
          <button onClick={openForm} className="bg-[#104b57] text-white hover:bg-[#0c3942] font-black text-lg px-10 py-4 rounded-full shadow-lg transition-all transform hover:-translate-y-1 w-full mt-auto">
            {isLoggedIn ? "Request VIP Pass Update" : "Schedule Interview to Unlock"}
          </button>
        </div>
      </section>

      {/* Google Reviews Section (RESTORED) */}
      <section className="w-full bg-white border-y-8 border-[#ffd1bc] py-16 px-4 shadow-inner relative z-20 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="flex items-center gap-2 text-2xl font-black text-[#3a302a] font-serif mb-2">
              <span className="text-4xl text-[#d65a47]">5.0</span>
              <div className="flex text-[#d65a47]">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
            </div>
            <h2 className="text-3xl font-black text-[#3a302a] mt-4 font-serif">See what our pet parents are saying!</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <div key={i} className={`animate-on-scroll ${i % 2 === 0 ? 'slide-left' : 'slide-right'} bg-[#fdf8f5] p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${review.color}`}>
                    {review.initial}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#3a302a] text-sm">{review.name}</h4>
                    <div className="flex text-gray-300 text-xs mt-0.5 gap-0.5">
                      {[...Array(5)].map((_, idx) => (
                        <svg key={idx} className={`w-3.5 h-3.5 fill-current ${idx < review.rating ? 'star-animate' : ''}`} style={{ animationDelay: `${0.3 + (idx * 0.15)}s` }} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <div className="ml-auto opacity-20">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-[#3a302a]"><path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section (RESTORED) */}
      <section className="bg-[#ffd1bc] py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
             <h2 className="text-4xl font-black text-[#3a302a] font-serif mb-4">Questions? We got answers! 🦴</h2>
             <p className="text-[#3a302a]/80 font-medium text-lg">Everything you need to know about your pet's stay.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden transition-all duration-300 hover:shadow-md">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-bold text-[#3a302a] text-lg">{faq.q}</span>
                  <span className={`text-[#d65a47] transform transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </span>
                </button>
                <div className={`px-6 overflow-hidden transition-all duration-500 ease-in-out ${openFaq === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-gray-600 font-medium leading-relaxed border-t border-gray-100 pt-4">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
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
              <a key={idx} href="https://www.instagram.com/pawsandtails_nj/" target="_blank" rel="noopener noreferrer" className="aspect-square bg-gray-100 overflow-hidden shadow-sm hover:shadow-xl transform transition-all duration-300 group relative">
                <img src={imgUrl} alt="Instagram Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#ffd1bc] py-12 flex flex-col items-center text-center px-4 relative border-t border-black/10">
         <div className="w-20 h-20 rounded-full border-2 border-white shadow-md mb-6 overflow-hidden bg-[#3a302a] hover:rotate-12 transition-transform duration-300 cursor-pointer flex items-center justify-center">
           <img src={logoUrl} alt="Paws & Tails" className="w-full h-full object-cover object-center transform scale-[1.2]" />
         </div>
         <div className="font-black text-2xl text-[#3a302a] mb-2">(201) 822-5535</div>
      </footer>

      {/* AI Receptionist Floating Widget (RESTORED) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white w-80 rounded-[2rem] shadow-2xl border-2 border-[#104b57]/20 mb-4 overflow-hidden flex flex-col transform transition-all duration-300 origin-bottom-right" style={{ height: '400px' }}>
            <div className="bg-[#3a302a] p-4 flex justify-between items-center text-[#ffd1bc]">
              <div className="flex items-center gap-2">
                <span className="bg-[#104b57] p-1.5 rounded-full"><HeartIcon className="w-4 h-4 text-white" /></span>
                <span className="font-bold text-sm">Virtual Paw-ssistant</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-[#fdf8f5] flex flex-col gap-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium ${msg.sender === 'ai' ? 'bg-white text-gray-700 self-start border border-gray-200 shadow-sm rounded-tl-none' : 'bg-[#d65a47] text-white self-end rounded-tr-none shadow-md'}`}>
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me a question..." 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#104b57] focus:ring-1 focus:ring-[#104b57]"
              />
              <button type="submit" className="bg-[#104b57] hover:bg-[#0c3942] text-white p-2 rounded-full transition-colors shadow-md">
                <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </form>
          </div>
        )}

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-[#104b57] hover:bg-[#0c3942] text-white p-4 rounded-full shadow-[0_8px_30px_rgba(16,75,87,0.4)] transform hover:scale-110 transition-all duration-300 flex items-center justify-center animate-bounce"
          style={{ animationDuration: '3s' }}
        >
          {isChatOpen ? (
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          )}
        </button>
      </div>

    </div>
  );
}

// Icons
function HeartIcon({ className }) { return (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>); }
function PawIcon({ className }) { return (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.5c-3.5 0-5.8 2.2-6.5 4.5-.4 1.3 0 2.5 1.5 3 2.2.8 3.5 1 5 1s2.8-.2 5-1c1.5-.5 1.9-1.7 1.5-3-.7-2.3-3-4.5-6.5-4.5zM5 11c1.5 0 2.8-1.3 2.8-3s-1.3-3-2.8-3S2.2 6.3 2.2 8s1.3 3 2.8 3zM19 11c1.5 0 2.8-1.3 2.8-3s-1.3-3-2.8-3S16.2 6.3 16.2 8s1.3 3 2.8 3zM9.5 7.5c1.5 0 2.8-1.5 2.8-3.5S11 0 9.5 0 6.7 1.5 6.7 3.5s1.3 4 2.8 4zM14.5 7.5C16 7.5 17.3 6 17.3 4S16 0 14.5 0 11.7 1.5 11.7 3.5s1.3 4 2.8 4z" /></svg>); }
function SunIcon({ className }) { return (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>); }
function MoonIcon({ className }) { return (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>); }
function CloudIcon({ className }) { return (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 19C19.985 19 22 16.985 22 14.5C22 12.128 20.17 10.19 17.838 10.015C17.382 6.618 14.448 4 10.875 4C6.985 4 3.829 7.025 3.526 10.852C1.564 11.233 0 12.981 0 15C0 17.209 1.791 19 4 19H17.5Z"/></svg>); }
function StarIcon({ className }) { return (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>); }
function CheckCircleIcon({ className }) { return (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path></svg>); }
function UserIcon({ className }) { return (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>); }