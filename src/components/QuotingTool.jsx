'use client';
import React, { useState, useEffect } from 'react';

// SVG Icons for the UI
const CalculatorIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
  </svg>
);

export default function QuotingTool() {
  const [dropDate, setDropDate] = useState('');
  const [dropTime, setDropTime] = useState('08:00'); // Default 8 AM
  const [pickDate, setPickDate] = useState('');
  const [pickTime, setPickTime] = useState('17:00'); // Default 5 PM
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    calculateQuote();
  }, [dropDate, dropTime, pickDate, pickTime]);

  const calculateQuote = () => {
    if (!dropDate || !dropTime || !pickDate || !pickTime) {
      setQuote(null);
      return;
    }

    // Parse dates to calculate total nights crossed
    const start = new Date(`${dropDate}T00:00:00`);
    const end = new Date(`${pickDate}T00:00:00`);
    const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));

    if (nights < 0) {
      setQuote({ error: "Pick-up date cannot be before drop-off date." });
      return;
    }

    // Parse times into decimal hours (e.g., 14:30 -> 14.5)
    const [dropH, dropM] = dropTime.split(':').map(Number);
    const [pickH, pickM] = pickTime.split(':').map(Number);
    const dropDecimal = dropH + dropM / 60;
    const pickDecimal = pickH + pickM / 60;

    let dayCares = 0;
    let overnights = nights;

    if (nights === 0) {
      // Same day logic
      if (pickDecimal <= dropDecimal) {
        setQuote({ error: "Pick-up time must be after drop-off time." });
        return;
      }
      // Assuming a standard same-day stay is 1 Day Care
      dayCares = 1; 
    } else {
      // If drop-off is BEFORE 7:00 PM (19:00), add a Day Care for the first day
      if (dropDecimal < 19) dayCares += 1;
      
      // If pick-up is AFTER 7:00 AM (07:00), add a Day Care for the last day
      if (pickDecimal > 7) dayCares += 1;
    }

    const dayCareTotal = dayCares * 50;
    const overnightTotal = overnights * 80;
    const grandTotal = dayCareTotal + overnightTotal;

    setQuote({
      dayCares,
      overnights,
      dayCareTotal,
      overnightTotal,
      grandTotal,
      error: null
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl border-4 border-[#ffd1bc] overflow-hidden my-12 relative z-30 transition-all duration-500 hover:shadow-2xl">
      <div className="bg-[#104b57] text-white p-6 flex items-center justify-center gap-3">
        <CalculatorIcon />
        <h3 className="text-2xl font-black font-serif tracking-wide">Instant Price Estimator</h3>
      </div>
      
      <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Side: Inputs */}
        <div className="space-y-6">
          <div className="bg-[#fdf8f5] p-5 rounded-2xl border border-gray-100 shadow-inner">
            <h4 className="font-bold text-[#d65a47] mb-3 uppercase tracking-wider text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d65a47]"></span> Drop-Off
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="date" 
                value={dropDate} 
                onChange={(e) => setDropDate(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#104b57] text-gray-700 bg-white"
              />
              <input 
                type="time" 
                value={dropTime} 
                onChange={(e) => setDropTime(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#104b57] text-gray-700 bg-white"
              />
            </div>
          </div>

          <div className="bg-[#fdf8f5] p-5 rounded-2xl border border-gray-100 shadow-inner">
            <h4 className="font-bold text-[#104b57] mb-3 uppercase tracking-wider text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#104b57]"></span> Pick-Up
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="date" 
                value={pickDate} 
                onChange={(e) => setPickDate(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#104b57] text-gray-700 bg-white"
              />
              <input 
                type="time" 
                value={pickTime} 
                onChange={(e) => setPickTime(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#104b57] text-gray-700 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="flex flex-col justify-center">
          {quote && quote.error ? (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center font-bold">
              {quote.error}
            </div>
          ) : quote ? (
            <div className="bg-[#3a302a] text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d65a47] opacity-10 rounded-full transform translate-x-10 -translate-y-10"></div>
              
              <h4 className="text-[#ffd1bc] font-bold text-sm uppercase tracking-widest mb-6">Estimated Cost</h4>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckIcon />
                    <span className="font-medium text-gray-300">{quote.dayCares}x Day Cares (@ $50)</span>
                  </div>
                  <span className="font-bold text-lg">${quote.dayCareTotal}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckIcon />
                    <span className="font-medium text-gray-300">{quote.overnights}x Overnights (@ $80)</span>
                  </div>
                  <span className="font-bold text-lg">${quote.overnightTotal}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mt-8">
                <span className="text-gray-400 font-medium">Total Estimate</span>
                <span className="text-5xl font-black text-[#d65a47] drop-shadow-sm">${quote.grandTotal}</span>
              </div>
              
              <p className="text-xs text-center text-gray-400 mt-6 mt-auto italic">
                *Quotes are estimates. Drop-offs before 7 PM or pick-ups after 7 AM incur a standard Day Care fee.
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center bg-gray-50">
              <CalculatorIcon className="w-12 h-12 mb-3 opacity-50" />
              <p className="font-medium">Enter your dates and times on the left to see an instant estimate!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}