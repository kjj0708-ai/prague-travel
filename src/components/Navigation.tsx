import { MapPin, Calculator, Wallet, CloudSun } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs = [
    { id: 'itinerary', label: '일정표', icon: MapPin },
    { id: 'weather', label: '날씨', icon: CloudSun },
    { id: 'expenses', label: '가계부', icon: Wallet },
    { id: 'currency', label: '환전/팁', icon: Calculator },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#fcfaf7] border-t border-[#1a1a1a]/10 px-4 py-3 pb-safe max-w-md mx-auto">
      <div className="flex justify-between items-center max-w-sm mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-colors ${
                isActive ? 'text-[#b45309]' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'
              }`}
            >
              <div className={`p-1.5 transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10px] font-sans tracking-widest ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
