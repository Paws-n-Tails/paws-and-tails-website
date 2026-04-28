import React, { useState } from 'react';
import Home from './pages/Home';
import Admin from './pages/Admin';

export default function App() {
  const [isAdminView, setIsAdminView] = useState(false);
  
  // Database Mock State (will be replaced by your actual Supabase calls)
  const [leads, setLeads] = useState([
    { id: 1, ownerName: "Sarah Jenkins", email: "sarah@example.com", phone: "(555) 123-4567", petName: "Buster", breed: "Golden Retriever", age: "2 years", date: "2026-05-02", time: "10:00 AM", status: "pending", createdAt: Date.now() - 600000 }
  ]);
  const [systemLogs, setSystemLogs] = useState([{ id: 101, text: "System Online.", time: "Just now", active: true }]);
  
  const logoUrl = "https://ngjloklpwtdzfeezrvru.supabase.co/storage/v1/object/public/images/admin-generations/unassigned-exterior-4:3-standard-1777350618285.jpg";

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins/60)}h ago`;
  };

  const submitLeadToSupabase = async (e, formData, meetDate, meetTime) => {
    e.preventDefault();
    const newLead = { ...formData, id: Date.now(), date: meetDate, time: meetTime, status: "pending", createdAt: Date.now() };
    
    // Replace this setTimeout with your actual Supabase Insert
    return new Promise((resolve) => {
      setTimeout(() => {
        setLeads([newLead, ...leads]);
        setSystemLogs([{ id: Date.now(), text: `New Request from ${newLead.ownerName}: SMS & Email dispatched. AI Call countdown started (60m).`, time: "Just now", active: true }, ...systemLogs]);
        resolve();
      }, 1000);
    });
  };

  const handleAdminDecision = async (id, decision) => {
    let newStatus = decision === 'confirm' ? 'confirmed' : decision === 'reschedule' ? 'reschedule' : 'declined';
    let logMsg = `Action taken on Lead #${id}. Email sent.`;
    
    // Replace with actual Supabase Update
    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
    setSystemLogs([{ id: Date.now(), text: logMsg, time: "Just now", active: false }, ...systemLogs]);
  };

  return isAdminView ? (
    <Admin leads={leads} systemLogs={systemLogs} handleAdminDecision={handleAdminDecision} setIsAdminView={setIsAdminView} logoUrl={logoUrl} formatTimeAgo={formatTimeAgo} />
  ) : (
    <Home submitLeadToSupabase={submitLeadToSupabase} setIsAdminView={setIsAdminView} logoUrl={logoUrl} />
  );
}