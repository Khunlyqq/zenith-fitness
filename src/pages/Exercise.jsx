import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import { api } from '../utils/api';

function Exercise() {
  const { language } = useLanguage();
  const t = translations[language];
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);

  const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

  useEffect(() => { loadExercises(); }, [search, filter]);

  const loadExercises = async () => {
    try {
      const params = new URLSearchParams();
      if (filter && filter !== 'All') params.set('muscle_group', filter);
      if (search) params.set('q', search);
      const data = await api.get(`/exercises?${params.toString()}`);
      setExercises(data);
    } catch (err) { console.error(err); }
  };

  const difficultyColor = (d) => {
    if (d === 'Beginner') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (d === 'Advanced') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  const muscleIcon = (g) => {
    const icons = { Chest: 'sports_martial_arts', Back: 'accessibility_new', Legs: 'directions_run', Shoulders: 'fitness_center', Arms: 'front_hand' };
    return icons[g] || 'fitness_center';
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto transition-all">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-primary/20 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary p-1.5 rounded-lg"><span className="material-symbols-outlined text-white text-xl" aria-hidden="true">fitness_center</span></div>
          <h1 className="text-xl font-bold tracking-tight">{t.exercise_title}</h1>
          <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">{exercises.length} {language === 'id' ? 'latihan' : 'exercises'}</span>
        </div>
        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" aria-hidden="true">search</span>
          <input
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-surface-dark border border-slate-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-600 font-medium"
            placeholder={t.exercise_search || (language === 'id' ? 'Cari latihan...' : 'Search exercises...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t.exercise_search || (language === 'id' ? 'Cari latihan' : 'Search exercises')}
          />
        </div>
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-6 px-6">
          {muscleGroups.map(group => (
            <button key={group} onClick={() => setFilter(group)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                filter === group 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-surface-dark text-slate-400 border-slate-800 hover:border-slate-600'
              }`}>
              {group === 'All' ? (language === 'id' ? 'Semua' : 'All') : group}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 pb-28 space-y-3 pt-4">
        {exercises.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4" aria-hidden="true">search_off</span>
            <p className="font-medium">{language === 'id' ? 'Tidak ada latihan ditemukan' : 'No exercises found'}</p>
          </div>
        ) : exercises.map(ex => (
          <button key={ex.id} onClick={() => setSelectedExercise(selectedExercise?.id === ex.id ? null : ex)}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${
              selectedExercise?.id === ex.id 
                ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20' 
                : 'bg-surface-dark border-slate-800 hover:border-slate-600'
            }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl" aria-hidden="true">{muscleIcon(ex.muscle_group)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{ex.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{ex.muscle_group}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${difficultyColor(ex.difficulty)}`}>
                    {ex.difficulty}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-600 flex-shrink-0 text-lg" aria-hidden="true">
                {selectedExercise?.id === ex.id ? 'expand_less' : 'expand_more'}
              </span>
            </div>
            {selectedExercise?.id === ex.id && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-sm text-slate-400 leading-relaxed">{ex.description || (language === 'id' ? 'Tidak ada deskripsi' : 'No description')}</p>
              </div>
            )}
          </button>
        ))}
      </main>
    </div>
  );
}

export default Exercise;
