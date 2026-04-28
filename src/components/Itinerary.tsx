import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Activity, DayPlan } from '../types';
import { PRAGUE_ITINERARY } from '../constants';
import { MapPin, Plus, Trash2, Navigation as NavIcon, GripVertical, Image as ImageIcon, ExternalLink, ChevronRight, Search, StickyNote, Upload, Loader2, Check, AlertCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable, uploadString } from 'firebase/storage';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { storage, auth, db } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

const getKoreanType = (type: string) => {
  switch (type) {
    case 'food': return '식사';
    case 'sightseeing': return '관광';
    case 'transport': return '교통';
    case 'leisure': return '휴식';
    case 'shopping': return '쇼핑';
    case 'accommodation': return '숙박';
    default: return type;
  }
};

export default function Itinerary() {
  const [itinerary, setItinerary] = useState<DayPlan[]>(PRAGUE_ITINERARY);
  const [activeDayId, setActiveDayId] = useState<string | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  const [isEditing, setIsEditing] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState<{type: 'day' | 'activity', dayId: string, activityId?: string} | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadActivity, setActiveUploadActivity] = useState<{dayId: string, activityId: string} | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Initial Auth & Data Load
  useEffect(() => {
    console.log("Setting up auth listener...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Authenticated as:", user.uid);
        try {
          const docRef = doc(db, 'itineraries', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data().days || [];
            setItinerary(data);
            if (data.length > 0 && activeDayId === 'all') {
              setActiveDayId(data[0].id);
            }
          } else {
            // New user, use local or default
            const saved = localStorage.getItem('prague_itinerary_v6');
            if (saved) {
              const data = JSON.parse(saved);
              setItinerary(data);
              if (data.length > 0) setActiveDayId(data[0].id);
            } else if (PRAGUE_ITINERARY.length > 0) {
              setActiveDayId(PRAGUE_ITINERARY[0].id);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `itineraries/${user.uid}`);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("No user found, signing in anonymously...");
        signInAnonymously(auth).then(cred => {
          console.log("Anonymous sign-in success:", cred.user.uid);
        }).catch(err => {
          console.error("Auth failed:", err);
          setSyncStatus('error');
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to Firestore & LocalStorage
  useEffect(() => {
    if (isLoading) return;

    const saveTimeout = setTimeout(async () => {
      localStorage.setItem('prague_itinerary_v6', JSON.stringify(itinerary));
      
      if (auth.currentUser) {
        setSyncStatus('syncing');
        try {
          // Flatten doc to avoid nested list mutation issues in some environments
          await setDoc(doc(db, 'itineraries', auth.currentUser.uid), {
            days: itinerary,
            updatedAt: serverTimestamp()
          });
          setSyncStatus('synced');
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `itineraries/${auth.currentUser.uid}`);
          setSyncStatus('error');
        }
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [itinerary, isLoading]);

  const updateDay = (dayId: string, field: keyof DayPlan, value: string | number) => {
    setItinerary(prev => prev.map(day => {
      if (day.id !== dayId) return day;
      return { ...day, [field]: value };
    }));
  };

  const deleteDay = (dayId: string) => {
    setDeletePrompt({ type: 'day', dayId });
  };

  const addDay = () => {
    const newId = `day-${Date.now()}`;
    setItinerary(prev => {
      const nextDayNumber = prev.length > 0 ? Math.max(...prev.map(d => d.dayNumber)) + 1 : 1;
      const newDay: DayPlan = {
        id: newId,
        date: "새 일정 (날짜)",
        dayNumber: nextDayNumber,
        title: "새로운 테마",
        memo: "",
        activities: []
      };
      return [...prev, newDay];
    });
    setActiveDayId(newId);
    setIsEditing(true);
  };

  const updateActivity = (dayId: string, activityId: string, field: keyof Activity, value: string) => {
    console.log(`Updating activity: ${activityId} field: ${field} value: ${value}`);
    setItinerary(prev => prev.map(day => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        activities: day.activities.map(act => {
          if (act.id !== activityId) return act;
          return { ...act, [field]: value };
        })
      };
    }));
  };

  const deleteActivity = (dayId: string, activityId: string) => {
    setDeletePrompt({ type: 'activity', dayId, activityId });
  };
  
  const confirmDelete = () => {
    if (!deletePrompt) return;
    if (deletePrompt.type === 'day') {
      setItinerary(prev => {
        const filtered = prev.filter(day => day.id !== deletePrompt.dayId);
        if (activeDayId === deletePrompt.dayId) {
          setActiveDayId(filtered.length > 0 ? filtered[0].id : 'all');
        }
        return filtered;
      });
    } else if (deletePrompt.type === 'activity' && deletePrompt.activityId) {
      setItinerary(prev => prev.map(day => {
        if (day.id !== deletePrompt.dayId) return day;
        return { ...day, activities: day.activities.filter(a => a.id !== deletePrompt.activityId) };
      }));
    }
    setDeletePrompt(null);
  };

  const addActivity = (dayId: string) => {
    setItinerary(prev => prev.map(day => {
      if (day.id !== dayId) return day;
      const newActivity: Activity = {
        id: Date.now().toString(),
        time: '새 시간',
        title: '',
        description: '',
        type: 'sightseeing',
        location: ''
      };
      return { ...day, activities: [...day.activities, newActivity] };
    }));
  };

  const handleSearch = (query: string, type: 'info' | 'image') => {
    const searchQuery = type === 'image' ? `${query} photo prague` : `${query} prague travel info`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}${type === 'image' ? '&tbm=isch' : ''}`;
    window.open(searchUrl, '_blank');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeUploadActivity) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기가 너무 큽니다. 5MB 이하의 이미지를 업로드해 주세요.");
      return;
    }

    try {
      setUploadingId(activeUploadActivity.activityId);

      // Ensure we are authenticated before uploading
      if (!auth.currentUser) {
        console.log("No active session, signing in before upload...");
        await signInAnonymously(auth);
      }

      if (!auth.currentUser) {
        alert("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      console.log("Starting upload for:", file.name, "Type:", file.type, "Size:", file.size);
      
      const timestamp = Date.now();
      const fileName = `${activeUploadActivity.activityId}_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, `itinerary/${fileName}`);
      
      // Retry logic for unstable connections
      let uploadSnapshot;
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          console.log(`Upload attempt ${4 - retries}...`);
          // Using uploadBytes directly for binary efficiency
          uploadSnapshot = await uploadBytes(storageRef, file);
          break; // Success
        } catch (err: any) {
          lastError = err;
          console.warn(`Attempt failed: ${err.message}. Retries left: ${retries - 1}`);
          if (err.code === 'storage/unauthorized' || err.code === 'storage/quota-exceeded') break; // Don't retry auth/quota errors
          retries--;
          if (retries > 0) await new Promise(r => setTimeout(r, 1000 * (4 - retries))); // Exponential-ish backoff
        }
      }

      if (!uploadSnapshot) throw lastError;

      console.log("Upload successful, fetching URL...");
      const downloadURL = await getDownloadURL(uploadSnapshot.ref);
      
      updateActivity(activeUploadActivity.dayId, activeUploadActivity.activityId, 'imageUrl', downloadURL);
      console.log("Upload complete!");
    } catch (error: any) {
      console.error("Firebase Storage Error:", error);
      let errorMessage = "이미지 업로드에 실패했습니다.";
      
      if (error.code === 'storage/unauthorized') {
        errorMessage += "\n권한이 없습니다. Firebase Console에서 Storage 규칙 설정을 확인해 주세요.";
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage += "\n용량이 초과되었습니다 (무료 티어 제한).";
      } else if (error.message?.includes("net::ERR") || error.code === 'storage/retry-limit-exceeded') {
        errorMessage += "\n네트워크 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.";
      } else {
        errorMessage += `\n(${error.code || 'unknown'}) ${error.message}`;
      }
      alert(errorMessage);
    } finally {
      setUploadingId(null);
      setActiveUploadActivity(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (dayId: string, activityId: string) => {
    setActiveUploadActivity({ dayId, activityId });
    fileInputRef.current?.click();
  };

  const handleDeleteImage = async (dayId: string, activityId: string, imageUrl: string) => {
    console.log("handleDeleteImage triggered:", { dayId, activityId, imageUrl });
    if (!imageUrl) {
      console.log("No imageUrl provided, skipping.");
      return;
    }
    
    if (!window.confirm("이미지를 삭제하시겠습니까?")) {
      console.log("Delete cancelled by user.");
      return;
    }

    try {
      setUploadingId(activityId);
      console.log("Started deletion process for:", activityId);
      
      // Attempt to delete from Firebase Storage if it's an uploaded file
      if (imageUrl.includes('firebasestorage.googleapis.com')) {
        try {
          console.log("Detected Firebase Storage URL, attempting to delete file...");
          // More robust path extraction
          const urlObj = new URL(imageUrl);
          const pathParam = urlObj.pathname.split('/o/')[1];
          if (pathParam) {
            const decodedPath = decodeURIComponent(pathParam);
            console.log("Extracted storage path:", decodedPath);
            const fileRef = ref(storage, decodedPath);
            await deleteObject(fileRef);
            console.log("Firebase Storage file deleted successfully.");
          } else {
            console.warn("Could not extract path from Firebase URL:", imageUrl);
          }
        } catch (storageErr) {
          console.warn("Storage deletion failed or file already missing:", storageErr);
        }
      } else {
        console.log("Not a Firebase Storage URL, just clearing local reference.");
      }

      // Clear from database
      console.log("Updating Firestore to remove imageUrl...");
      updateActivity(dayId, activityId, 'imageUrl', '');
      console.log("Firestore update complete.");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("이미지 삭제에 실패했습니다.");
    } finally {
      setUploadingId(null);
      console.log("Deletion process finished.");
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // Unchanged position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    setItinerary(prev => {
      const newItinerary = JSON.parse(JSON.stringify(prev)); // Deep copy avoiding immer for now
      
      const sourceDayIndex = newItinerary.findIndex((d: DayPlan) => d.id === source.droppableId);
      const destDayIndex = newItinerary.findIndex((d: DayPlan) => d.id === destination.droppableId);
      
      const sourceDay = newItinerary[sourceDayIndex];
      const destDay = newItinerary[destDayIndex];
      
      const [movedActivity] = sourceDay.activities.splice(source.index, 1);
      
      destDay.activities.splice(destination.index, 0, movedActivity);
      
      return newItinerary;
    });
  };

  return (
    <div className="flex flex-col gap-6 px-6 pt-2 pb-8">
      {/* Photo Zoom Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-10"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              className="absolute top-6 right-6 p-3 text-white/50 hover:text-white transition-colors z-[210] bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div 
              layoutId={selectedImage}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                alt="확대 보기" 
                className={`max-w-full max-h-[85vh] object-contain shadow-2xl transition-transform duration-300 cursor-zoom-in ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'}`}
                onClick={() => setIsZoomed(!isZoomed)}
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                <button 
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="text-white/80 hover:text-white flex items-center gap-2 text-[10px] font-sans font-bold tracking-widest uppercase"
                >
                  {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  {isZoomed ? '축소' : '확대'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Delete Confirmation Modal */}
      {deletePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 sm:max-w-md sm:mx-auto">
          <div className="bg-white p-6 w-full shadow-2xl border border-[#1a1a1a]">
            <h3 className="text-2xl font-black tracking-tighter mb-2">
              {deletePrompt.type === 'day' ? '해당 날짜 전체 삭제' : '세부 일정 삭제'}
            </h3>
            <p className="text-[13px] font-sans opacity-70 mb-6 leading-relaxed">
              {deletePrompt.type === 'day' 
                ? '선택하신 날짜의 모든 일정이 삭제됩니다. 정말 삭제하시겠습니까?' 
                : '이 일정을 삭제하시겠습니까?'}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setDeletePrompt(null)}
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

      <div className="sticky top-0 z-50 bg-[#faf9f6]/95 backdrop-blur-md pt-2 pb-4 -mx-6 px-6 shadow-sm border-b border-[#1a1a1a]/5">
        <div className="flex justify-between items-end mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black tracking-tighter">여행 일정</h2>
            <div className="flex items-center gap-2">
              {syncStatus === 'syncing' && (
                <span className="flex items-center gap-1 text-[8px] font-sans font-bold text-[#b45309] uppercase tracking-widest animate-pulse">
                  <Loader2 className="w-2 h-2 animate-spin" /> 클라우드 동기화 중...
                </span>
              )}
              {syncStatus === 'synced' && (
                <span className="flex items-center gap-1 text-[8px] font-sans font-bold text-green-600 uppercase tracking-widest">
                  <Check className="w-2 h-2" /> 동기화 완료
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="flex items-center gap-1 text-[8px] font-sans font-bold text-red-600 uppercase tracking-widest">
                  <AlertCircle className="w-2 h-2" /> 동기화 오류
                </span>
              )}
              {!auth.currentUser && !isLoading && (
                <span className="flex items-center gap-1 text-[8px] font-sans font-bold text-amber-500 uppercase tracking-widest animate-pulse">
                  <Loader2 className="w-2 h-2 animate-spin" /> 연결 중...
                </span>
              )}
              {auth.currentUser && !isLoading && syncStatus === 'idle' && (
                <span className="flex items-center gap-1 text-[8px] font-sans font-bold text-blue-500 uppercase tracking-widest">
                  <Check className="w-2 h-2" /> 연결됨
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className={`text-[9px] font-sans font-bold tracking-[0.2em] uppercase px-3 py-1.5 transition-colors border ${
                isEditing 
                  ? 'bg-[#b45309] text-white border-[#b45309]' 
                  : 'bg-[#1a1a1a] text-white border-[#1a1a1a] hover:bg-transparent hover:text-[#1a1a1a]'
              }`}
            >
              {isEditing ? '편집 종료' : '일정 관리'}
            </button>
          </div>
        </div>

        {!isLoading && itinerary.length > 0 && (
          <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar scroll-smooth">
            <button
              onClick={() => setActiveDayId('all')}
              className={`shrink-0 px-4 py-2 flex flex-col items-center justify-center border transition-all ${
                activeDayId === 'all' 
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' 
                  : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/10 hover:border-[#1a1a1a]'
              }`}
            >
              <span className="text-[9px] font-sans font-bold tracking-[0.2em] uppercase">전체 일정</span>
              <span className="text-[8px] font-bold mt-0.5 opacity-0">요일</span>
            </button>
            {[...itinerary].sort((a, b) => a.dayNumber - b.dayNumber).map((day) => {
              const dayOfWeekMatch = day.date.match(/\(([^)]+)\)/);
              const dayOfWeek = dayOfWeekMatch ? dayOfWeekMatch[1] : '';
              
              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDayId(day.id)}
                  className={`shrink-0 px-4 py-2 flex flex-col items-center border transition-all ${
                    activeDayId === day.id 
                      ? 'bg-[#b45309] text-white border-[#b45309]' 
                      : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/10 hover:border-[#1a1a1a]'
                  }`}
                >
                  <span className="text-[9px] font-sans font-bold tracking-[0.2em] uppercase">{day.dayNumber}일차</span>
                  {dayOfWeek && <span className="text-[8px] font-bold opacity-60 mt-0.5">({dayOfWeek})</span>}
                </button>
              );
            })}
            {isEditing && (
              <button
                onClick={addDay}
                className="shrink-0 px-3 py-2 text-[#b45309] hover:bg-[#b45309]/10 border border-[#b45309]/20 rounded-sm transition-colors text-[9px] font-bold tracking-widest uppercase flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> 일차 추가
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#b45309]" />
          <p className="font-sans text-xs tracking-widest uppercase opacity-50">일정을 불러오는 중입니다...</p>
        </div>
      ) : (
        <>
          {!isEditing && itinerary.length === 0 && (
            <div className="text-center py-12 flex flex-col items-center">
              <p className="font-sans text-sm opacity-60 mb-4">등록된 일정이 없습니다.</p>
              <button 
                onClick={addDay}
                className="flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white font-bold tracking-widest text-xs uppercase"
              >
                <Plus className="w-4 h-4" /> 첫 번째 일정 추가하기
              </button>
            </div>
          )}

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col gap-12 mt-4">
              {[...itinerary]
                .filter(day => activeDayId === 'all' || day.id === activeDayId)
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map((day: DayPlan) => (
                <div key={day.id} className="relative z-0 group/day">
              {isEditing ? (
                <div className="flex flex-col gap-2 mb-6 border-b border-[#1a1a1a]/30 pb-4">
                  <div className="flex gap-4 items-center justify-between">
                     <div className="flex items-center gap-2">
                       <input
                         type="number"
                         value={day.dayNumber}
                         onChange={(e) => updateDay(day.id, 'dayNumber', parseInt(e.target.value) || 1)}
                         className="font-sans text-[10px] w-12 font-bold text-center tracking-[0.2em] bg-[#1a1a1a] text-white px-1 py-0.5"
                       />
                       <span className="font-sans text-[10px] font-bold">일차</span>
                     </div>
                     <button onClick={() => deleteDay(day.id)} className="text-[#1a1a1a] opacity-50 hover:opacity-100 transition-opacity p-1">
                       <Trash2 className="w-4 h-4 text-red-600" />
                     </button>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <input
                      value={day.date}
                      onChange={(e) => updateDay(day.id, 'date', e.target.value)}
                      className="text-2xl font-bold tracking-tighter bg-transparent border-b border-[#1a1a1a]/20 focus:outline-none focus:border-[#b45309] pb-1"
                      placeholder="날짜 (예: 5.6 (수))"
                    />
                    <input
                      value={day.title}
                      onChange={(e) => updateDay(day.id, 'title', e.target.value)}
                      className="text-sm font-sans tracking-tight bg-transparent border-b border-[#1a1a1a]/20 focus:outline-none focus:border-[#b45309] pb-1"
                      placeholder="오늘의 일정 주제 (예: 시내 투어)"
                    />
                    <div className="mt-3 bg-amber-50 p-3 border-l-4 border-amber-200">
                      <label className="text-[9px] font-bold tracking-widest text-amber-600 uppercase flex items-center gap-1 mb-1">
                        <StickyNote className="w-3 h-3" /> 일일 체크포인트 & 메모
                      </label>
                      <textarea
                        value={day.memo || ''}
                        onChange={(e) => updateDay(day.id, 'memo', e.target.value)}
                        className="w-full bg-transparent text-[11px] font-sans leading-relaxed text-[#1a1a1a] focus:outline-none resize-none h-16 opacity-80"
                        placeholder="이 날의 특별한 계획이나 챙길 물건 등을 적어보세요."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-8 overflow-hidden">
                  <div className="flex gap-4 items-baseline mb-4 border-b border-[#1a1a1a]/30 pb-3 group/header">
                     <span className="font-sans text-[10px] font-bold tracking-[0.2em] bg-[#1a1a1a] text-white px-2.5 py-1 rounded-sm">{day.dayNumber}일차</span>
                     <div className="flex flex-col">
                        <span className="text-2xl font-black tracking-tighter leading-none">{day.date}</span>
                        <span className="text-[10px] font-sans tracking-tight opacity-40 font-bold uppercase mt-1">{day.title}</span>
                     </div>
                     <button 
                        onClick={() => {
                          setActiveDayId(day.id);
                          setIsEditing(true);
                        }}
                        className="ml-auto opacity-0 group-hover/day:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#b45309]/5 hover:bg-[#b45309]/10 text-[#b45309] text-[9px] font-sans font-bold tracking-widest uppercase rounded-sm border border-[#b45309]/20"
                     >
                        이 날짜 편집
                     </button>
                  </div>
                  
                  {day.memo && (
                    <div className="mb-6 p-4 bg-amber-50/60 border border-amber-100/50 rounded-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-8 h-8 bg-amber-100/30 -translate-y-4 translate-x-4 rotate-45" />
                      <div className="flex gap-3">
                        <StickyNote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold tracking-widest text-amber-600/80 uppercase mb-1">메모</span>
                          <p className="text-[13px] font-sans leading-relaxed text-[#1a1a1a]/80 whitespace-pre-wrap">{day.memo}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Droppable droppableId={day.id} isDropDisabled={!isEditing}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className={`flex flex-col min-h-[50px] transition-colors ${snapshot.isDraggingOver ? 'bg-amber-50/50 -mx-2 px-2 py-2 rounded-lg border border-dashed border-amber-200' : ''}`}
                  >
                    {day.activities.map((activity: Activity, index: number) => {
                      const draggableElement = (provided: any, snapshot: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex gap-3 p-4 mb-4 bg-white border border-[#1a1a1a]/10 relative group ${
                            snapshot.isDragging ? 'shadow-xl border-[#b45309]/50 opacity-95 z-50 scale-[1.02]' : ''
                          }`}
                        >
                          <div 
                            {...provided.dragHandleProps}
                            className="absolute -left-3 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing bg-white border border-[#1a1a1a]/10 rounded-full shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          >
                            <GripVertical className="w-4 h-4 text-[#1a1a1a]/50" />
                          </div>
                          <div className="flex flex-col gap-3 w-full pl-2">
                            <div className="flex gap-3 items-center mb-1">
                              <input
                                value={activity.time}
                                onChange={(e) => updateActivity(day.id, activity.id, 'time', e.target.value)}
                                className="w-16 bg-transparent border-b border-[#1a1a1a]/30 font-sans text-[11px] font-bold tracking-widest focus:outline-none focus:border-[#b45309] text-center pb-1"
                                placeholder="시간"
                              />
                              <select
                                value={activity.type}
                                onChange={(e) => updateActivity(day.id, activity.id, 'type', e.target.value)}
                                className="bg-transparent border-b border-[#1a1a1a]/30 font-sans text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#b45309] pb-1 cursor-pointer"
                              >
                                <option value="sightseeing">관광</option>
                                <option value="food">식사</option>
                                <option value="transport">교통</option>
                                <option value="shopping">쇼핑</option>
                                <option value="leisure">여가</option>
                                <option value="accommodation">숙박</option>
                              </select>
                              <button 
                                onClick={() => deleteActivity(day.id, activity.id)} 
                                className="ml-auto text-[#1a1a1a] opacity-30 hover:opacity-100 hover:text-red-600 transition-colors bg-black/5 p-1.5"
                                aria-label="일정 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              value={activity.title}
                              onChange={(e) => updateActivity(day.id, activity.id, 'title', e.target.value)}
                              className="w-full bg-transparent border-b border-[#1a1a1a]/30 text-lg font-bold focus:outline-none focus:border-[#b45309] pb-1.5 placeholder:font-normal"
                              placeholder="일정 제목 (예: 까를교 걷기)"
                            />
                            <textarea
                              value={activity.description}
                              onChange={(e) => updateActivity(day.id, activity.id, 'description', e.target.value)}
                              className="w-full bg-transparent border-b border-[#1a1a1a]/30 text-xs opacity-80 leading-relaxed focus:outline-none focus:border-[#b45309] resize-none h-14 placeholder:italic"
                              placeholder="상세 설명 (팁, 유의사항 등)"
                            />
                            <div className="flex flex-col gap-2 mt-2">
                              <div className="flex items-center gap-2 group/field">
                                <NavIcon className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                <input
                                  value={activity.location || ''}
                                  onChange={(e) => updateActivity(day.id, activity.id, 'location', e.target.value)}
                                  className="w-full bg-transparent border-b border-[#1a1a1a]/30 text-[10px] font-sans tracking-widest focus:outline-none focus:border-[#b45309] pb-1"
                                  placeholder="장소명 (구글맵 연동)"
                                />
                              </div>
                              <div className="flex items-center gap-2 group/field">
                                <ImageIcon className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                <input
                                  value={activity.imageUrl || ''}
                                  onChange={(e) => updateActivity(day.id, activity.id, 'imageUrl', e.target.value)}
                                  className="w-full bg-transparent border-b border-[#1a1a1a]/30 text-[10px] font-sans tracking-widest focus:outline-none focus:border-[#b45309] pb-1"
                                  placeholder="이미지 URL 또는 업로드"
                                />
                                <div className="flex gap-1">
                                  {activity.imageUrl ? (
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log("Image delete button clicked for:", activity.id);
                                        handleDeleteImage(day.id, activity.id, activity.imageUrl!);
                                      }}
                                      disabled={uploadingId === activity.id}
                                      className="p-2 hover:bg-red-100 rounded-full transition-all text-red-600 disabled:opacity-50 border border-red-200 shadow-sm bg-white"
                                      title="이미지 삭제"
                                      type="button"
                                    >
                                      {uploadingId === activity.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => triggerUpload(day.id, activity.id)}
                                      disabled={uploadingId === activity.id}
                                      className="p-1 hover:bg-[#1a1a1a]/10 rounded transition-colors text-[#b45309] disabled:opacity-50"
                                      title="이미지 업로드"
                                    >
                                      {uploadingId === activity.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Upload className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleSearch(activity.title || activity.location || '', 'image')}
                                    className="p-1 hover:bg-[#1a1a1a]/10 rounded transition-colors text-[#b45309]"
                                    title="사진 검색"
                                  >
                                    <Search className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 group/field">
                                <ExternalLink className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                <input
                                  value={activity.infoLink || ''}
                                  onChange={(e) => updateActivity(day.id, activity.id, 'infoLink', e.target.value)}
                                  className="w-full bg-transparent border-b border-[#1a1a1a]/30 text-[10px] font-sans tracking-widest focus:outline-none focus:border-[#b45309] pb-1"
                                  placeholder="상세정보 링크 (URL)"
                                />
                                <button 
                                  onClick={() => handleSearch(activity.title || activity.location || '', 'info')}
                                  className="p-1 hover:bg-[#1a1a1a]/10 rounded transition-colors text-[#b45309]"
                                  title="정보 검색"
                                >
                                  <Search className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );

                      if (isEditing) {
                        return (
                          // @ts-ignore - Common incompatibility between dnd types and React 18/19
                          <Draggable draggableId={activity.id} index={index} key={activity.id}>
                            {draggableElement}
                          </Draggable>
                        );
                      }

                      return (
                        <div key={activity.id} className="flex gap-4 mb-8 last:mb-2 group">
                          <div className="flex flex-col items-center pt-1 w-10 shrink-0">
                            <span className="text-[11px] font-sans font-bold tracking-widest leading-tight text-center whitespace-pre-wrap">{activity.time.replace(' ', '\n')}</span>
                            {index !== day.activities.length - 1 && (
                              <div className="w-px h-full bg-[#1a1a1a]/20 mt-2 mb-[-1rem]"></div>
                            )}
                          </div>
                          
                          <div className="flex flex-col pt-0.5 pb-2 border-l-2 border-transparent group-hover:border-[#b45309] pl-4 transition-colors flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-sans font-bold text-[#b45309] uppercase tracking-[0.2em]">{getKoreanType(activity.type)}</span>
                            </div>
                            <h4 className="text-xl font-bold leading-tight mb-2 break-keep">{activity.title}</h4>
                            <p className="text-sm opacity-70 leading-relaxed max-w-[280px] break-keep mb-3">{activity.description}</p>
                            
                            {activity.imageUrl && (
                              <div 
                                className="mb-4 overflow-hidden border border-[#1a1a1a]/10 cursor-pointer group/img"
                                onClick={() => {
                                  setSelectedImage(activity.imageUrl || null);
                                  setIsZoomed(false);
                                }}
                              >
                                <img 
                                  src={activity.imageUrl} 
                                  alt={activity.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-40 object-cover group-hover/img:scale-110 transition-transform duration-700 ease-out" 
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100 pointer-events-none">
                                  <Maximize2 className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
                              {activity.location && (
                                <a 
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activity.location + ' 프라하')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-widest text-[#1a1a1a] hover:text-[#b45309] transition-colors group/link w-fit opacity-80 hover:opacity-100"
                                >
                                  <NavIcon className="w-3.5 h-3.5" />
                                  <span className="border-b border-[#1a1a1a]/30 group-hover/link:border-[#b45309] pb-0.5">{activity.location} 길찾기</span>
                                </a>
                              )}

                              {activity.infoLink && (
                                <a 
                                  href={activity.infoLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-widest text-[#1a1a1a] hover:text-[#b45309] transition-colors group/link w-fit opacity-80 hover:opacity-100"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span className="border-b border-[#1a1a1a]/30 group-hover/link:border-[#b45309] pb-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">상세 정보 보기</span>
                                  <ChevronRight className="w-3 h-3 ml-[-4px]" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {provided.placeholder}

                    {isEditing && (
                      <button
                        onClick={() => addActivity(day.id)}
                        className="flex items-center justify-center gap-2 w-full py-3 mt-2 mb-8 border border-dashed border-[#1a1a1a]/30 text-[11px] font-bold font-sans tracking-[0.2em] uppercase text-[#1a1a1a] opacity-50 hover:opacity-100 hover:border-[#1a1a1a] transition-colors"
                      >
                        <Plus className="w-4 h-4" /> 현재 날짜에 상세 일정 추가
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}

          {isEditing && (
            <button
              onClick={addDay}
              className="mt-4 flex items-center justify-center gap-2 w-full py-5 border-2 border-dashed border-[#1a1a1a] text-[13px] font-bold font-sans tracking-[0.1em] uppercase text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" /> 새 날짜 추가하기 (Day N)
            </button>
          )}
        </div>
      </DragDropContext>
    </>
  )}
</div>
  );
}
