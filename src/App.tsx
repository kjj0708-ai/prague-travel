import { useState } from 'react';
import Itinerary from './components/Itinerary';
import Expenses from './components/Expenses';
import Currency from './components/Currency';
import Weather from './components/Weather';
import Navigation from './components/Navigation';

export default function App() {
  const [activeTab, setActiveTab] = useState('itinerary');

  return (
    <div className="bg-[var(--color-paper)] min-h-screen font-sans text-[var(--color-ink)] selection:bg-[#1a1a1a] selection:text-white pb-safe">
      <div className="max-w-md mx-auto min-h-screen bg-[var(--color-paper)] relative flex flex-col border-x border-[#1a1a1a]/10">
        
        {/* Header Region */}
        <div className="border-b border-[#1a1a1a] pb-4 mb-4 pt-12 px-6 bg-[var(--color-paper)] z-10 sticky top-0">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] tracking-[0.2em] font-sans font-bold mb-1 opacity-60">문화 탐방 / 24</span>
              <h1 className="text-6xl font-black leading-none tracking-tighter mb-[-4px]">프라하</h1>
            </div>
            <div className="text-right flex flex-col items-end pb-1">
              <div className="text-2xl tracking-tighter font-bold">04.30 — 05.05</div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-grow overflow-y-auto pb-[90px]">
          {activeTab === 'itinerary' && <Itinerary />}
          {activeTab === 'weather' && <Weather />}
          {activeTab === 'expenses' && <Expenses />}
          {activeTab === 'currency' && <Currency />}
        </main>

        {/* Bottom Nav */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

