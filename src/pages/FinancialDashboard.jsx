import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// --- INLINE ICONS ---
const DollarIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);
const ReceiptIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>);
const ChartIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>);
const UploadIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>);
const CheckCircleIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);
const EnvelopeIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>);
const PawIcon = ({ className }) => (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path></svg>);
const TrophyIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>);

export default function FinancialDashboard({ leads, appointments }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('all');
  const [topDogsLimit, setTopDogsLimit] = useState(5);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false); 
  const [receiptFile, setReceiptFile] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Dog Food',
    description: ''
  });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalPhotoUrl = null;
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
        finalPhotoUrl = publicUrlData.publicUrl;
      }
      const { error } = await supabase.from('expenses').insert([{
        date: expenseForm.date, amount: parseFloat(expenseForm.amount), category: expenseForm.category, description: expenseForm.description, receipt_photo: finalPhotoUrl
      }]);
      if (error) throw error;
      await fetchExpenses();
      setIsExpenseModalOpen(false);
      setExpenseForm({ date: new Date().toISOString().split('T')[0], amount: '', category: 'Dog Food', description: '' });
      setReceiptFile(null);
    } catch (error) { alert(error.message); } finally { setIsSaving(false); }
  };

  const getMonthStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const filteredAppointments = appointments.filter(a => filterMonth === 'all' || getMonthStr(a.date_start) === filterMonth);
  const filteredExpenses = expenses.filter(e => filterMonth === 'all' || getMonthStr(e.date) === filterMonth);

  const totalRevenue = filteredAppointments.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const totalExpensesAmount = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpensesAmount;

  // --- Top Dogs Logic (All Time) ---
  const allTimeDogTotals = leads.map(lead => {
    const totalSpent = appointments
      .filter(a => a.lead_id === lead.id)
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    return { ...lead, totalSpent };
  }).filter(d => d.totalSpent > 0).sort((a, b) => b.totalSpent - a.totalSpent);

  const topDogsDisplay = topDogsLimit === 'all' ? allTimeDogTotals : allTimeDogTotals.slice(0, Number(topDogsLimit));
  const maxDogRevenue = allTimeDogTotals.length > 0 ? allTimeDogTotals[0].totalSpent : 1;

  const monthOptions = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    monthOptions.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) });
  }

  const generateChartData = () => {
    const data = [];
    const today = new Date();
    for (let i = 12; i >= -2; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const filterStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const monthlyRevenue = appointments.filter(a => getMonthStr(a.date_start) === filterStr).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      data.push({ 
        label: targetDate.toLocaleDateString('en-US', { month: 'short' }) + " '" + targetDate.getFullYear().toString().slice(2), 
        revenue: monthlyRevenue, 
        isCurrent: i === 0, 
        isFuture: i < 0 
      });
    }
    return data;
  };

  const chartData = generateChartData();
  const maxChartRevenue = Math.max(...chartData.map(d => d.revenue), 100);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Financials...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center z-20 flex-shrink-0 sticky top-0">
        <div><h1 className="text-2xl font-black text-[#3a302a] font-serif">Financial Dashboard</h1></div>
        <div className="flex items-center gap-3">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border-2 border-gray-200 rounded-xl px-4 py-2 font-bold text-[#104b57] bg-white">
            <option value="all">All Time</option>
            {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <button onClick={() => setIsExpenseModalOpen(true)} className="bg-[#d65a47] text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-md hover:bg-[#c44a38] transition-colors flex items-center gap-2">
            <ReceiptIcon className="w-4 h-4" /> Log Expense
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-10">
        {/* SECTION 1: METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><DollarIcon className="w-8 h-8" /></div>
            <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Revenue</p><h2 className="text-3xl font-black text-[#3a302a]">${totalRevenue.toFixed(2)}</h2></div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><ReceiptIcon className="w-8 h-8" /></div>
            <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Expenses</p><h2 className="text-3xl font-black text-[#3a302a]">${totalExpensesAmount.toFixed(2)}</h2></div>
          </div>
          <div className="bg-[#104b57] p-6 rounded-[2rem] shadow-lg border border-[#0c3942] flex items-center gap-4 text-white">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center"><ChartIcon className="w-8 h-8" /></div>
            <div><p className="text-xs font-bold text-white/70 uppercase tracking-widest">Net Profit</p><h2 className="text-3xl font-black">${netProfit.toFixed(2)}</h2></div>
          </div>
        </div>

        {/* SECTION 2: REVENUE PIPELINE BAR CHART */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 w-full flex flex-col">
          <h3 className="font-black text-[#104b57] uppercase tracking-widest text-xs mb-10">Revenue Pipeline (15 Months)</h3>
          <div className="h-[200px] w-full flex items-end justify-between gap-1 sm:gap-3 pb-2 border-b-2 border-gray-100">
            {chartData.map((data, index) => {
              const h = Math.max((data.revenue / maxChartRevenue) * 100, 3);
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                  <div className="absolute -top-8 bg-black text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                    ${data.revenue.toFixed(0)}
                  </div>
                  <div 
                    className={`w-full rounded-t-md transition-all duration-500 ${data.isCurrent ? 'bg-[#d65a47]' : data.isFuture ? 'bg-[#a3b1c6]' : 'bg-[#104b57]'}`} 
                    style={{ height: `${h}%` }}
                  ></div>
                  <div className="absolute -bottom-8 text-[9px] font-bold text-gray-400 uppercase text-center w-full whitespace-nowrap">
                    {data.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: TOP DOGS CHART */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 w-full flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-black text-[#d65a47] uppercase tracking-widest text-xs flex items-center gap-2"><TrophyIcon className="w-4 h-4" /> Top Dogs by Revenue</h3>
            <select value={topDogsLimit} onChange={(e) => setTopDogsLimit(e.target.value)} className="text-xs font-bold border border-gray-200 rounded-lg p-1.5 focus:outline-none bg-white">
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="flex flex-col gap-6">
            {topDogsDisplay.map((dog, idx) => (
              <div key={dog.id} className="flex items-center gap-4">
                <span className="w-4 text-[10px] font-black text-gray-300">{idx+1}.</span>
                <div className="w-12 h-12 rounded-full border-2 border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0">
                  {dog.pet_photo ? <img src={dog.pet_photo} className="w-full h-full object-cover" /> : <PawIcon className="w-6 h-6 m-3 text-gray-200"/>}
                </div>
                <div className="w-32 truncate font-black text-[#3a302a] text-sm">{dog.pet_name}</div>
                <div className="flex-1 h-8 bg-gray-50 rounded-full border border-gray-100 overflow-hidden relative">
                  <div 
                    className="bg-gradient-to-r from-[#104b57] to-[#258296] h-full transition-all duration-1000 ease-out rounded-full" 
                    style={{ width: `${(dog.totalSpent / maxDogRevenue) * 100}%` }}
                  ></div>
                </div>
                <div className="w-20 text-right text-base font-black text-green-600">${dog.totalSpent.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: EXPENSE LOG */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden mb-10 flex flex-col">
          <div className="p-6 border-b border-gray-100"><h3 className="font-black text-[#3a302a] text-lg">Expense Log</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-200">
                  <th className="p-4 pl-8">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right pr-8">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr><td colSpan="4" className="p-10 text-center text-gray-400 font-bold">No expenses found.</td></tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id} className="border-b border-gray-50 text-sm hover:bg-gray-50 transition-colors">
                      <td className="p-4 pl-8 font-bold text-gray-700">{new Date(exp.date + 'T12:00:00').toLocaleDateString()}</td>
                      <td className="p-4"><span className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase px-3 py-1 rounded-full">{exp.category}</span></td>
                      <td className="p-4 text-gray-500">{exp.description || '-'}</td>
                      <td className="p-4 text-right pr-8 font-black text-red-500">-${Number(exp.amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: ADD EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-[slideInRight_0.2s_ease-out]">
            <div className="bg-[#d65a47] p-5 text-white flex justify-between items-center"><h2 className="text-xl font-black font-serif flex items-center gap-2">Log New Expense</h2><button onClick={() => setIsExpenseModalOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>
            <form onSubmit={handleAddExpense} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label><input type="date" required value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl p-2.5" /></div>
                <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount ($)</label><input type="number" step="0.01" required value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl p-2.5 font-black text-[#d65a47]" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label><select required value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl p-2.5 bg-white"><option value="Dog Food">Dog Food</option><option value="Toys">Toys</option><option value="Supplies">Supplies</option><option value="Maintenance">Maintenance</option><option value="Permits">Permits / Licenses</option><option value="Insurance">Insurance</option><option value="Other">Other</option></select></div>
              <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label><input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl p-2.5" /></div>
              <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Receipt</label><input type="file" onChange={(e) => setReceiptFile(e.target.files[0])} className="w-full text-xs text-gray-400" /></div>
              <button type="submit" disabled={isSaving} className="w-full bg-[#d65a47] text-white py-3 rounded-xl font-black shadow-lg">{isSaving ? "Saving..." : "Save Expense"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}