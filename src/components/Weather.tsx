import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudFog, CloudLightning, CloudSnow, Loader2, ThermometerSun, Umbrella } from 'lucide-react';

interface WeatherData {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
}

export default function Weather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Prague coordinates: 50.088, 14.4208
        const url = "https://api.open-meteo.com/v1/forecast?latitude=50.088&longitude=14.4208&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FBerlin&forecast_days=16";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch weather");
        
        const jsonData = await response.json();
        setData(jsonData.daily);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherInterpretation = (code: number) => {
    if (code === 0) return { label: '맑음', icon: Sun, color: 'text-amber-500' };
    if ([1, 2, 3].includes(code)) return { label: '구름 많음', icon: Cloud, color: 'text-slate-400' };
    if ([45, 48].includes(code)) return { label: '안개', icon: CloudFog, color: 'text-slate-400' };
    if ([51, 53, 55, 56, 57].includes(code)) return { label: '이슬비', icon: CloudRain, color: 'text-blue-400' };
    if ([61, 63, 65, 66, 67].includes(code)) return { label: '비', icon: CloudRain, color: 'text-blue-500' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: '눈', icon: CloudSnow, color: 'text-sky-300' };
    if ([80, 81, 82].includes(code)) return { label: '소나기', icon: CloudRain, color: 'text-blue-600' };
    if ([95, 96, 99].includes(code)) return { label: '뇌우', icon: CloudLightning, color: 'text-indigo-600' };
    return { label: '흐림', icon: Cloud, color: 'text-slate-400' };
  };

  const padZero = (num: number) => num.toString().padStart(2, '0');

  // Filter only from April 30 to May 5
  const getFilteredData = () => {
    if (!data) return [];
    
    const targetDates = [
      '2026-04-30', '2026-05-01', '2026-05-02', 
      '2026-05-03', '2026-05-04', '2026-05-05'
    ];
    
    // Create an array mapping target date to Day 1, Day 2 etc.
    const dayMap = ['1일차 (출국)', '2일차', '3일차', '4일차', '5일차', '6일차 (귀국)'];
    const daysArr = ['일', '월', '화', '수', '목', '금', '토'];

    let results = [];
    
    for (let i = 0; i < targetDates.length; i++) {
        const targetDate = targetDates[i];
        const indexInApiId = data.time.findIndex(t => t === targetDate);
        
        const dateParts = targetDate.split('-');
        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const dayOfWeek = daysArr[dateObj.getDay()];
        
        if (indexInApiId !== -1) {
            results.push({
                dayLabel: dayMap[i],
                date: targetDate, // YYYY-MM-DD
                displayDate: `${targetDate.split('-')[1]}.${targetDate.split('-')[2]}`,
                dayOfWeek,
                maxTemp: Math.round(data.temperature_2m_max[indexInApiId]),
                minTemp: Math.round(data.temperature_2m_min[indexInApiId]),
                precipProb: data.precipitation_probability_max[indexInApiId],
                weather: getWeatherInterpretation(data.weather_code[indexInApiId])
            });
        } else {
            // Fallback for dates beyond 16 days from today, just in case
            results.push({
                dayLabel: dayMap[i],
                date: targetDate,
                displayDate: `${targetDate.split('-')[1]}.${targetDate.split('-')[2]}`,
                dayOfWeek,
                maxTemp: 18,
                minTemp: 9,
                precipProb: 20,
                weather: { label: '예보 대기', icon: Cloud, color: 'text-slate-300' }
            });
        }
    }
    return results;
  };

  const tripForecast = getFilteredData();

  return (
    <div className="flex flex-col gap-6 px-6 pt-2 pb-8">
      <div className="mb-2">
        <h2 className="text-3xl font-black tracking-tighter mb-1">현지 날씨</h2>
        <div className="w-full h-px bg-[#1a1a1a] mt-4"></div>
      </div>

      <div className="flex flex-col gap-5">
        <p className="text-[13px] font-sans opacity-70 leading-relaxed mb-2">여행 일정 (4.30 ~ 5.5) 기준 프라하의 체코 현지 예상 날씨입니다. 얇은 외투를 준비하시는 것이 좋습니다.</p>
        
        {loading ? (
          <div className="flex items-center justify-center p-12 opacity-50">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-3 text-sm tracking-widest font-bold">예보 불러오는 중...</span>
          </div>
        ) : error ? (
           <div className="text-center p-8 border border-dashed border-[#1a1a1a]/30">
            <p className="text-sm opacity-60">날씨 정보를 불러올 수 없습니다.<br/>인터넷 연결을 확인해주세요.</p>
           </div>
        ) : (
          tripForecast.map((day, idx) => {
            const WeatherIcon = day.weather.icon;
            return (
              <div key={idx} className="border border-[#1a1a1a] bg-white p-5 flex items-center justify-between group">
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] font-bold tracking-[0.2em] opacity-60 mb-1">{day.dayLabel}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black tracking-tighter">{day.displayDate}</span>
                    <span className="text-sm font-bold opacity-40">({day.dayOfWeek})</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center -ml-4">
                  <WeatherIcon className={`w-8 h-8 ${day.weather.color} mb-1 stroke-[1.5px] group-hover:scale-110 transition-transform`} />
                  <span className="text-[11px] font-sans font-bold tracking-widest">{day.weather.label}</span>
                </div>

                <div className="flex flex-col items-end gap-1.5 min-w-[70px]">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">Max</span>
                      <span className="text-[15px] font-bold tracking-tighter">{day.maxTemp}°</span>
                    </div>
                    <div className="flex flex-col items-end border-l border-[#1a1a1a]/5 pl-2">
                      <span className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">Min</span>
                      <span className="text-[12px] font-bold text-slate-400 tracking-tighter w-4 text-right">{day.minTemp}°</span>
                    </div>
                  </div>
                  {day.precipProb > 0 && (
                     <div className="flex items-center gap-1 opacity-60 bg-blue-50 px-1.5 py-0.5 border border-blue-100">
                       <Umbrella className="w-3 h-3 text-blue-600" />
                       <span className="text-[9px] font-sans font-bold text-blue-800 tracking-widest mt-0.5">강수 {day.precipProb}%</span>
                     </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
