import { useState, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { EXCHANGE_RATE_CZK_TO_KRW } from '../constants';

export default function Currency() {
  const [czk, setCzk] = useState<string>('100');
  const [krw, setKrw] = useState<string>(String(100 * EXCHANGE_RATE_CZK_TO_KRW));
  const [rate, setRate] = useState<number>(EXCHANGE_RATE_CZK_TO_KRW);
  const [focusedInput, setFocusedInput] = useState<'czk'|'krw'>('czk');

  useEffect(() => {
    if (focusedInput === 'czk') {
      const parsed = parseFloat(czk);
      setKrw(isNaN(parsed) ? '' : Math.round(parsed * rate).toString());
    }
  }, [czk, rate, focusedInput]);

  useEffect(() => {
    if (focusedInput === 'krw') {
      const parsed = parseFloat(krw);
      setCzk(isNaN(parsed) ? '' : (parsed / rate).toFixed(2).replace(/\.00$/, ''));
    }
  }, [krw, rate, focusedInput]);

  return (
    <div className="flex flex-col gap-8 px-6 pt-2 pb-8">
      <div className="mb-2">
        <h2 className="text-3xl font-black tracking-tighter mb-1">환전 및 팁</h2>
        <div className="w-full h-px bg-[#1a1a1a] mt-4"></div>
      </div>

      {/* Calculator Card */}
      <div className="border border-[#1a1a1a] bg-white p-6 relative">
        <div className="relative mb-6">
          <label className="block text-[11px] font-sans font-bold tracking-[0.2em] opacity-60 mb-3 text-[#1a1a1a]">체코 코루나 (CZK)</label>
          <div className="border border-[#1a1a1a] flex">
            <input 
              type="number"
              value={czk}
              onFocus={() => setFocusedInput('czk')}
              onChange={(e) => setCzk(e.target.value)}
              className="w-full bg-transparent p-4 text-4xl font-bold tracking-tighter focus:outline-none rounded-none"
            />
            <div className="w-16 bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-xl">Kč</div>
          </div>
        </div>

        <div className="flex justify-center my-4">
          <div className="border border-[#1a1a1a] p-2 rounded-full cursor-default hover:bg-[#fcfaf7] transition-colors">
             <ArrowUpDown className="w-4 h-4 opacity-70" />
          </div>
        </div>

        <div className="relative mb-6 mt-4">
          <label className="block text-[11px] font-sans font-bold tracking-[0.2em] opacity-60 mb-3 text-[#1a1a1a]">대한민국 원 (KRW)</label>
          <div className="border border-[#1a1a1a] flex">
            <input 
              type="number"
              value={krw}
              onFocus={() => setFocusedInput('krw')}
              onChange={(e) => setKrw(e.target.value)}
              className="w-full bg-transparent p-4 text-4xl font-bold tracking-tighter focus:outline-none rounded-none"
            />
            <div className="w-16 bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-xl">₩</div>
          </div>
        </div>

        <div className="pt-5 border-t border-dashed border-[#1a1a1a]/30 flex justify-between items-center text-xs font-sans">
          <span className="tracking-widest font-bold opacity-60 text-[11px]">적용 환율</span>
          <div className="flex items-center gap-2">
            <span className="opacity-60 text-[11px] font-bold tracking-widest">1 CZK =</span>
            <input
              type="number"
              value={rate}
              step="0.1"
              onChange={(e) => setRate(parseFloat(e.target.value) || EXCHANGE_RATE_CZK_TO_KRW)}
              className="w-16 bg-transparent border-b border-[#1a1a1a] text-right font-bold focus:outline-none rounded-none pb-1"
            />
            <span className="opacity-60 text-[11px] font-bold tracking-widest">원</span>
          </div>
        </div>
      </div>

      {/* Quick reference guide */}
      <div className="border-l border-t border-[#1a1a1a] pt-5 pl-5">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] block mb-5">프라하 여행 안내사항</span>
        <ul className="space-y-5">
          <li className="flex flex-col border-b border-[#1a1a1a]/10 pb-3">
            <span className="text-lg font-bold">환전</span>
            <span className="text-[13px] font-sans opacity-70 leading-relaxed mt-1 break-keep">국내에서 유로(EUR) 환전 후 프라하 시내에서 코루나(CZK)로 환전하거나, 트래블 카드를 주로 사용하세요.</span>
          </li>
          <li className="flex flex-col border-b border-[#1a1a1a]/10 pb-3">
            <span className="text-lg font-bold">팁 문화</span>
            <span className="text-[13px] font-sans opacity-70 leading-relaxed mt-1 break-keep">일반적으로 영수증 금액의 5~10% 정도입니다. 영수증에 '서비스 차지가 포함'되었다면 생략해도 좋습니다.</span>
          </li>
          <li className="flex flex-col border-b border-[#1a1a1a]/10 pb-3">
            <span className="text-lg font-bold">대중교통</span>
            <span className="text-[13px] font-sans opacity-70 leading-relaxed mt-1 break-keep">종이 티켓은 승차 전 반드시 노란 기계에서 펀칭(개찰)해야 벌금을 물지 않습니다.</span>
          </li>
          <li className="flex flex-col border-b border-[#1a1a1a]/10 pb-3">
            <span className="text-lg font-bold">봄 날씨</span>
            <span className="text-[13px] font-sans opacity-70 leading-relaxed mt-1 break-keep">일교차가 큰 편입니다. 낮과 밤의 기온차에 대비해 얇은 겉옷을 여러 벌 겹쳐 입으세요.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
