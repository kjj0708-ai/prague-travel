export interface DayPlan {
  id: string;
  date: string;
  dayNumber: number;
  title: string;
  memo?: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'sightseeing' | 'food' | 'transport' | 'leisure' | 'accommodation';
  location?: string;
  imageUrl?: string;
  infoLink?: string;
  lat?: number;
  lng?: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  currency: 'CZK' | 'EUR' | 'KRW';
  category: 'food' | 'transport' | 'sightseeing' | 'shopping' | 'accommodation' | 'other';
  note: string;
  createdAt: number;
}
