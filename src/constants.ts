import { DayPlan } from './types';

export const PRAGUE_ITINERARY: DayPlan[] = [
  {
    id: "day1",
    date: "4.30 (목)",
    dayNumber: 1,
    title: "프라하로 출발 및 도착",
    activities: [
      { id: "1-1", time: "07:00", title: "공항(T2) 이동", description: "인천공항 제2여객터미널로 이동", type: "transport" },
      { id: "1-2", time: "08:00", title: "수속 및 아침식사", description: "아시아나항공 수속 후 아침식사", type: "food" },
      { id: "1-3", time: "10:45", title: "비행기 탑승 (OZ545)", description: "프라하행 비행기 탑승 (약 13시간 소요)", type: "transport", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80", infoLink: "https://www.flyasiana.com" },
      { id: "1-4", time: "17:00", title: "입국수속", description: "프라하 바츨라프 하벨 국제공항 도착 및 입국수속", type: "transport", location: "프라하 바츨라프 하벨 공항", infoLink: "https://www.prg.aero/en" },
      { id: "1-5", time: "17:30", title: "AE버스 탑승", description: "공항에서 프라하 중앙역으로 이동", type: "transport", location: "프라하 중앙역" },
      { id: "1-6", time: "19:00", title: "호텔 도착", description: "엑스시티파크호텔 체크인", type: "accommodation", location: "Exe City Park Hotel", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", infoLink: "https://www.exehotels.co.uk/exe-city-park.html" },
      { id: "1-7", time: "19:30", title: "저녁식사: 히베른스카", description: "메뉴: 꼴레뇨 (체코식 족발 요리)", type: "food", location: "Hybernska", imageUrl: "https://images.unsplash.com/photo-1606131731446-5568d87113aa?auto=format&fit=crop&w=800&q=80", infoLink: "https://ko.wikipedia.org/wiki/%EB%BC%B4%EB%A0%88%EB%87%A8" },
      { id: "1-8", time: "21:00", title: "휴식", description: "호텔에서 휴식", type: "leisure" }
    ]
  },
  {
    id: "day2",
    date: "5.1 (금)",
    dayNumber: 2,
    title: "프라하 시내 오전 투어",
    activities: [
      { id: "2-1", time: "07:00", title: "아침식사 및 준비", description: "일정 시작 전 든든하게 아침식사", type: "food" },
      { id: "2-2", time: "09:00", title: "오전투어 미팅", description: "구시가지 얀후스 동상 앞 투어 시작", type: "sightseeing", location: "얀 후스 동상", imageUrl: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80", infoLink: "https://ko.wikipedia.org/wiki/%EA%B5%AC%EC%8B%9C%EA%B0%80_%EA%B4%91%EC%9E%A5_(%ED%94%84%EB%9D%BC%ED%95%98)" },
      { id: "2-3", time: "투어중", title: "주요 명소 관광", description: "구시가광장, 천문시계, 하벨시장, 바츨라프광장, 프라하성, 까를교 등 투어 진행", type: "sightseeing", imageUrl: "https://images.unsplash.com/photo-1513805959324-96eb66ca8713?auto=format&fit=crop&w=800&q=80", infoLink: "https://www.prague.eu/en" },
      { id: "2-4", time: "13:30", title: "점심식사", description: "오전 투어 종료 후 점심식사", type: "food" },
      { id: "2-5", time: "오후", title: "휴식 및 낮잠", description: "투어 후 체력 보충을 위한 휴식", type: "leisure" }
    ]
  },
  {
    id: "day3",
    date: "5.2 (토)",
    dayNumber: 3,
    title: "독일 드레스덴 근교 여행",
    activities: [
      { id: "3-1", time: "06:30", title: "아침식사 및 준비", description: "드레스덴 이동을 위한 이른 아침 준비", type: "food" },
      { id: "3-2", time: "08:00", title: "관광버스 출발", description: "드레스덴으로 버스 이동", type: "transport" },
      { id: "3-3", time: "10:00", title: "드레스덴 관광", description: "젬퍼오퍼, 츠빙거궁전, 카톨릭 궁정교회, 브륄의 테라스 등 탐방", type: "sightseeing", location: "드레스덴", imageUrl: "https://images.unsplash.com/photo-1590059516397-94d707f1540c?auto=format&fit=crop&w=800&q=80", infoLink: "https://ko.wikipedia.org/wiki/%EB%93%9C%EB%A0%88%EC%8A%A4%EB%8D%B4" },
      { id: "3-4", time: "12:00", title: "점심시간 및 자유시간", description: "작센스위스 국립공원, 바슈타이 다리 관람", type: "sightseeing", location: "작센 스위스", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", infoLink: "https://ko.wikipedia.org/wiki/%EC%9E%91%EC%84%BC%EC%8A%A4%EC%9C%84%EC%8A%A4_%EA%B5%AD%EB%A6%BD%EA%B3%B5%EC%9B%90" },
      { id: "3-5", time: "16:30", title: "프라하로 귀환", description: "관광버스 탑승하여 프라하로 복귀", type: "transport" },
      { id: "3-6", time: "19:00", title: "저녁식사: 데민카", description: "메뉴: 굴라쉬, 버팔로윙 (가이드북 195p 참고)", type: "food", location: "Deminka", infoLink: "https://www.deminka.com" },
      { id: "3-7", time: "21:00", title: "휴식", description: "호텔 복귀 및 휴식", type: "leisure" }
    ]
  },
  {
    id: "day4",
    date: "5.3 (일)",
    dayNumber: 4,
    title: "아름다운 프라하 야경 투어",
    activities: [
      { id: "4-1", time: "야간", title: "경관 야경 투어", description: "공화국광장, 시내야경, 유람선 탑승, 프라하성 야경 등 로맨틱한 밤 산책", type: "sightseeing", imageUrl: "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=800&q=80", infoLink: "https://ko.wikipedia.org/wiki/%ED%94%84%EB%9D%BC%ED%95%98_%EC%84%B1" }
    ]
  },
  {
    id: "day5",
    date: "5.4 (월)",
    dayNumber: 5,
    title: "아쉬운 마지막 날과 출국",
    activities: [
      { id: "5-1", time: "오전", title: "시내 트램 투어", description: "42번 트램 타고 프라하 시내 한 바퀴", type: "sightseeing", imageUrl: "https://images.unsplash.com/photo-1563812247731-975971a1c97a?auto=format&fit=crop&w=800&q=80" },
      { id: "5-2", time: "15:00", title: "AE버스 탑승", description: "프라하 중앙역에서 공항으로 이동", type: "transport", location: "프라하 중앙역" },
      { id: "5-3", time: "16:00", title: "출국 수속", description: "대한항공 수속 진행", type: "transport", location: "프라하 바츨라프 하벨 공항" },
      { id: "5-4", time: "19:05", title: "비행기 탑승 (KE970)", description: "프라하 출발 한국행 비행기 탑승 (약 11.5시간 소요)", type: "transport", infoLink: "https://www.koreanair.com" }
    ]
  },
  {
    id: "day6",
    date: "5.5 (화)",
    dayNumber: 6,
    title: "한국 도착 및 귀가",
    activities: [
      { id: "6-1", time: "13:20", title: "인천 도착", description: "한국 도착 및 입국 수속", type: "transport", location: "인천국제공항" },
      { id: "6-2", time: "16:00", title: "집 도착", description: "모든 여행 일정 마무리. 수고하셨습니다!", type: "leisure" }
    ]
  }
];

export const EXCHANGE_RATE_CZK_TO_KRW = 60.15; // Approximate rate: 1 CZK ≈ 60 KRW

export const CATEGORY_COLORS = {
  food: 'bg-orange-100 text-orange-700 border-orange-200',
  transport: 'bg-blue-100 text-blue-700 border-blue-200',
  sightseeing: 'bg-green-100 text-green-700 border-green-200',
  shopping: 'bg-pink-100 text-pink-700 border-pink-200',
  accommodation: 'bg-purple-100 text-purple-700 border-purple-200',
  leisure: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200'
};

export const CATEGORY_LABELS = {
  food: '식비',
  transport: '교통',
  sightseeing: '관광',
  shopping: '쇼핑',
  accommodation: '숙박',
  leisure: '여가',
  other: '기타'
};
