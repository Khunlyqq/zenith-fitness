import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import { api } from '../utils/api';

function Workout() {
  const { language } = useLanguage();
  const t = translations[language];
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sets, setSets] = useState([]);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [timer, setTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [resting, setResting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const restRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadExercises();
    return () => { clearInterval(restRef.current); clearInterval(timerRef.current); };
  }, []);

  const loadExercises = async () => {
    try {
      const data = await api.get('/exercises');
      setExercises(data);
    } catch (err) { console.error(err); }
  };

  const startSession = async () => {
    try {
      const s = await api.post('/workouts/start', {});
      setSession(s);
      setSets([]);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    } catch (err) { alert(err.message); }
  };

  const logSet = async () => {
    if (!session || !exercises[currentIdx]) return;
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    if (w === 0 && r === 0) return;

    try {
      const setLog = await api.post(`/workouts/${session.id}/sets`, {
        exercise_id: exercises[currentIdx].id,
        set_number: sets.filter(s => s.exercise_id === exercises[currentIdx].id).length + 1,
        weight_kg: w,
        reps: r,
      });
      setSets([...sets, { ...setLog, exercise_id: exercises[currentIdx].id }]);
      setWeight('');
      setReps('');
      startRest(90);
    } catch (err) { alert(err.message); }
  };

  const endSession = async () => {
    if (!session) return;
    try {
      await api.put(`/workouts/${session.id}/end`);
      clearInterval(timerRef.current);
      clearInterval(restRef.current);
      window.location.href = '/statistik';
    } catch (err) { alert(err.message); }
  };

  const startRest = (sec) => {
    setResting(true);
    setRestTimer(sec);
    clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) { clearInterval(restRef.current); setResting(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    clearInterval(restRef.current);
    setResting(false);
    setRestTimer(0);
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const currentExercise = exercises[currentIdx];
  const currentSets = sets.filter(s => s.exercise_id === currentExercise?.id);

  // Pre-session (choose to start)
  if (!session) {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center space-y-8 max-w-sm">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-5xl" aria-hidden="true">fitness_center</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{language === 'id' ? 'Mulai Latihan' : 'Start Workout'}</h1>
            <p className="text-slate-500 text-sm mt-2">{language === 'id' ? 'Tekan tombol di bawah untuk memulai sesi latihan.' : 'Press below to begin your workout session.'}</p>
          </div>
          <button onClick={startSession} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">play_arrow</span>
            {language === 'id' ? 'Mulai Sesi' : 'Start Session'}
          </button>
          <button onClick={() => window.location.href = '/dashboard'} className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
            ← {language === 'id' ? 'Kembali ke Dashboard' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-slate-400">{formatTime(elapsed)}</span>
        </div>
        <h2 className="text-sm font-black uppercase tracking-widest text-primary">
          {language === 'id' ? 'Sesi Aktif' : 'Active Session'}
        </h2>
        <button onClick={endSession} className="bg-red-500/10 text-red-400 px-4 py-1.5 rounded-lg text-sm font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors">
          {language === 'id' ? 'Selesai' : 'End'}
        </button>
      </header>

      {/* Rest Timer Overlay */}
      {resting && (
        <div className="bg-background-dark/95 backdrop-blur-md px-6 py-8 border-b border-primary/20 flex flex-col items-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">{language === 'id' ? 'Istirahat' : 'Rest'}</span>
          <p className="text-6xl font-black tabular-nums text-primary">{formatTime(restTimer)}</p>
          <button onClick={skipRest} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            {language === 'id' ? 'Lewati →' : 'Skip →'}
          </button>
        </div>
      )}

      {/* Exercise Navigation */}
      <div className="px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-6 px-6">
          {exercises.slice(0, 8).map((ex, i) => (
            <button key={ex.id} onClick={() => setCurrentIdx(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                currentIdx === i ? 'bg-primary text-white border-primary' : 'bg-surface-dark text-slate-400 border-slate-800'
              }`}>
              {ex.name.length > 15 ? ex.name.slice(0, 15) + '…' : ex.name}
            </button>
          ))}
        </div>
      </div>

      {currentExercise && (
        <main className="px-6 pb-28 space-y-6 flex-1">
          {/* Current Exercise */}
          <div className="bg-surface-dark rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl" aria-hidden="true">fitness_center</span>
              </div>
              <div>
                <h3 className="text-xl font-black">{currentExercise.name}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{currentExercise.muscle_group} • {currentExercise.difficulty}</p>
              </div>
            </div>
          </div>

          {/* Set Logs */}
          {currentSets.length > 0 && (
            <div className="bg-surface-dark rounded-2xl border border-slate-800 overflow-hidden">
              <div className="grid grid-cols-3 gap-0 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 py-3 px-4">
                <span>SET</span>
                <span>{language === 'id' ? 'BEBAN' : 'WEIGHT'}</span>
                <span>REPS</span>
              </div>
              {currentSets.map((s, i) => (
                <div key={i} className="grid grid-cols-3 gap-0 text-center border-b border-slate-800/50 py-3 px-4 text-sm font-bold">
                  <span className="text-primary">{i + 1}</span>
                  <span>{s.weight_kg} kg</span>
                  <span>{s.reps}</span>
                </div>
              ))}
            </div>
          )}

          {/* Log New Set */}
          <div className="bg-surface-dark rounded-2xl p-5 border border-slate-800 space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Set {currentSets.length + 1}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{language === 'id' ? 'Beban (kg)' : 'Weight (kg)'}</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-lg font-bold text-center outline-none focus:ring-2 focus:ring-primary" 
                  value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" aria-label={language === 'id' ? 'Beban (kg)' : 'Weight (kg)'} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Reps</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-lg font-bold text-center outline-none focus:ring-2 focus:ring-primary" 
                  value={reps} onChange={(e) => setReps(e.target.value)} placeholder="0" aria-label="Reps"
                  onKeyDown={(e) => e.key === 'Enter' && logSet()} />
              </div>
            </div>
            <button onClick={logSet} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined" aria-hidden="true">check</span>
              {language === 'id' ? 'Selesai Set' : 'Complete Set'}
            </button>
          </div>

          {/* Quick Rest Buttons */}
          <div className="flex gap-3">
            {[60, 90, 120, 180].map(sec => (
              <button key={sec} onClick={() => startRest(sec)}
                className="flex-1 py-3 rounded-xl bg-surface-dark border border-slate-800 text-xs font-bold text-slate-400 hover:border-primary/40 hover:text-primary transition-colors">
                {sec}s
              </button>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

export default Workout;
