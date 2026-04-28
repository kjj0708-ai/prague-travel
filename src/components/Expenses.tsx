import * as React from 'react';
import { useState, useEffect } from 'react';
import { Expense } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { Trash2 } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('prague_expenses');
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse expenses");
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('prague_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      date,
      amount: Number(amount),
      currency: 'CZK',
      category,
      note,
      createdAt: Date.now(),
    };

    setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setAmount('');
    setNote('');
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setExpenses(prev => prev.filter(e => e.id !== deleteId));
    setDeleteId(null);
  };

  const totalCZK = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalKRW = totalCZK * 60; // Approximate for quick view

  return (
    <div className="flex flex-col gap-8 px-6 pt-2 pb-8">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 sm:max-w-md sm:mx-auto">
          <div className="bg-white p-6 w-full shadow-2xl border border-[#1a1a1a]">
            <h3 className="text-2xl font-black tracking-tighter mb-2">
              지출 내역 삭제
            </h3>
            <p className="text-[13px] font-sans opacity-70 mb-6 leading-relaxed">
              이 지출 내역을 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 text-[#1a1a1a] font-sans text-[11px] font-bold tracking-[0.2em] transition-colors"
              >
                취소
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-sans text-[11px] font-bold tracking-[0.2em] transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-2">
        <h2 className="text-3xl font-black tracking-tighter mb-1">여행 경비</h2>
        <div className="w-full h-px bg-[#1a1a1a] mt-4"></div>
      </div>

      {/* Summary Card */}
      <div className="border border-[#1a1a1a] p-5 bg-[#1a1a1a] text-white">
        <div className="flex justify-between items-start mb-6">
          <span className="font-sans text-[10px] font-bold tracking-[0.2em] opacity-80">총 지출 금액</span>
          <span className="bg-white text-[#1a1a1a] px-2 py-0.5 text-[10px] font-sans font-bold tracking-widest uppercase">실시간</span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-5xl font-bold tracking-tighter">{totalCZK.toLocaleString()}</span>
          <span className="font-sans text-sm opacity-60">CZK</span>
        </div>
        
        <div className="mt-6 pt-4 border-t border-dashed border-white/20">
          <div className="flex justify-between text-sm font-sans tracking-tight">
            <span className="opacity-70 text-xs">예상 원화</span>
            <span className="font-bold">{totalKRW.toLocaleString()} ₩</span>
          </div>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={handleAddExpense} className="border border-[#1a1a1a] p-5 flex flex-col gap-5 bg-white">
        <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
          <h3 className="font-sans text-[11px] font-bold tracking-[0.2em] text-[#1a1a1a]">빠른 기록</h3>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-[10px] font-sans font-bold text-[#1a1a1a] mb-2 tracking-widest opacity-60">금액 (CZK)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              min="0"
              step="0.01"
              className="w-full bg-transparent border-b border-[#1a1a1a] pb-2 text-xl font-bold focus:outline-none focus:border-[#b45309] transition-colors rounded-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-sans font-bold text-[#1a1a1a] mb-2 tracking-widest opacity-60">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-transparent border-b border-[#1a1a1a] pb-2 text-sm font-sans focus:outline-none focus:border-[#b45309] transition-colors rounded-none"
            />
          </div>
        </div>

        <div>
           <label className="block text-[10px] font-sans font-bold text-[#1a1a1a] mb-3 tracking-widest opacity-60">카테고리</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-2 text-[11px] font-sans font-bold tracking-wider transition-colors border ${
                  category === cat 
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' 
                    : 'bg-transparent text-[#1a1a1a] border-[#1a1a1a]/20 hover:border-[#1a1a1a]'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-sans font-bold text-[#1a1a1a] mb-2 tracking-widest opacity-60">내용</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="어디에 쓰셨나요?"
            required
            className="w-full bg-transparent border-b border-[#1a1a1a] pb-2 text-lg focus:outline-none focus:border-[#b45309] transition-colors rounded-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#1a1a1a] text-white font-sans text-[12px] font-bold tracking-[0.2em] py-4 mt-2 hover:bg-black transition-colors"
        >
          추가하기
        </button>
      </form>

      {/* Expense List */}
      <div className="flex flex-col">
        <h3 className="font-sans text-[11px] font-bold tracking-[0.2em] border-b border-[#1a1a1a] pb-3 mb-4">
          지출 내역
        </h3>
        {expenses.length === 0 ? (
          <div className="py-8 text-center border border-[#1a1a1a] border-dashed">
            <p className="text-sm opacity-50">기록된 지출이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {expenses.map(exp => (
              <div key={exp.id} className="flex justify-between items-center py-4 border-b border-[#1a1a1a]/20 group">
               <div className="flex flex-col">
                   <span className="font-bold text-lg mb-0.5">{exp.note}</span>
                   <span className="font-sans text-[10px] tracking-[0.1em] opacity-60">
                     {new Date(exp.date).toLocaleDateString('ko-KR', {day: 'numeric', month: 'short'})} / {CATEGORY_LABELS[exp.category as keyof typeof CATEGORY_LABELS]}
                   </span>
               </div>
               
               <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                   <span className="font-bold">{exp.amount.toLocaleString()} CZK</span>
                   <span className="font-sans text-[10px] opacity-60">≈ {(exp.amount * 60).toLocaleString()} KRW</span>
                 </div>
                 <button 
                   onClick={() => setDeleteId(exp.id)}
                   className="text-[#1a1a1a] opacity-30 hover:opacity-100 hover:text-red-700 transition-colors p-1"
                   aria-label="Delete"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
