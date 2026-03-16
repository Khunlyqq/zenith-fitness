import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import { api } from '../utils/api';

function Jadwal() {
  const { language } = useLanguage();
  const t = translations[language];
  const [selectedDate, setSelectedDate] = useState(new Date().getDate().toString());
  const [schedules, setSchedules] = useState({});
  const [showForm, setShowForm] = useState(false);

  // Exercise picker
  const [allExercises, setAllExercises] = useState([]);

  // Weekly templates
  const [showTemplates, setShowTemplates] = useState(false);

  // Weekly planner state: 7 days, each can be train or rest
  const defaultWeekPlan = () => Array.from({ length: 7 }, () => ({
    active: false,
    title: '',
    type: 'Push',
    time_minutes: 60,
    estimated_calories: 350,
    exercises: [],
    showPicker: false,
    searchQuery: '',
  }));
  const [weekPlan, setWeekPlan] = useState(defaultWeekPlan());
  const [editingDayIdx, setEditingDayIdx] = useState(null);

  // Calendar scroll ref
  const calendarRef = useRef(null);
  const todayRef = useRef(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthNames = language === 'id' 
    ? ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    : ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  const shortDayNames = language === 'id'
    ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Weekly templates data
  const weeklyTemplates = [
    {
      name: 'Push Pull Legs (PPL)',
      desc: language === 'id' ? 'Siklus 6 hari + 1 istirahat' : '6-day cycle + 1 rest day',
      days: [
        { active: true, title: 'Push Day', type: 'Push', time_minutes: 60, estimated_calories: 400, exercises: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Lateral Raise', 'Tricep Pushdown'] },
        { active: true, title: 'Pull Day', type: 'Pull', time_minutes: 60, estimated_calories: 380, exercises: ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Face Pull', 'Bicep Curl'] },
        { active: true, title: 'Leg Day', type: 'Legs', time_minutes: 55, estimated_calories: 450, exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Extension', 'Calf Raise'] },
        { active: true, title: 'Push Day B', type: 'Push', time_minutes: 55, estimated_calories: 380, exercises: ['Dumbbell Press', 'Cable Fly', 'Arnold Press', 'Skull Crusher', 'Dips'] },
        { active: true, title: 'Pull Day B', type: 'Pull', time_minutes: 55, estimated_calories: 360, exercises: ['Pull Up', 'Cable Row', 'Reverse Fly', 'Hammer Curl', 'Shrug'] },
        { active: true, title: 'Leg Day B', type: 'Legs', time_minutes: 50, estimated_calories: 420, exercises: ['Front Squat', 'Walking Lunge', 'Leg Curl', 'Hip Thrust', 'Calf Raise'] },
        { active: false },
      ],
    },
    {
      name: 'Upper Lower Split',
      desc: language === 'id' ? '4 hari latihan + 3 istirahat' : '4 training days + 3 rest',
      days: [
        { active: true, title: 'Upper Body A', type: 'Chest', time_minutes: 60, estimated_calories: 400, exercises: ['Bench Press', 'Overhead Press', 'Barbell Row', 'Lateral Raise', 'Bicep Curl', 'Tricep Pushdown'] },
        { active: true, title: 'Lower Body A', type: 'Legs', time_minutes: 55, estimated_calories: 450, exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'] },
        { active: false },
        { active: true, title: 'Upper Body B', type: 'Back', time_minutes: 60, estimated_calories: 380, exercises: ['Pull Up', 'Dumbbell Press', 'Cable Row', 'Face Pull', 'Hammer Curl', 'Dips'] },
        { active: true, title: 'Lower Body B', type: 'Legs', time_minutes: 55, estimated_calories: 430, exercises: ['Front Squat', 'Hip Thrust', 'Walking Lunge', 'Leg Extension', 'Calf Raise'] },
        { active: false },
        { active: false },
      ],
    },
    {
      name: 'Full Body 3x',
      desc: language === 'id' ? '3 hari latihan + 4 istirahat' : '3 training days + 4 rest',
      days: [
        { active: true, title: 'Full Body A', type: 'Push', time_minutes: 70, estimated_calories: 500, exercises: ['Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Bicep Curl'] },
        { active: false },
        { active: true, title: 'Full Body B', type: 'Pull', time_minutes: 70, estimated_calories: 480, exercises: ['Deadlift', 'Incline Dumbbell Press', 'Pull Up', 'Lateral Raise', 'Tricep Pushdown'] },
        { active: false },
        { active: true, title: 'Full Body C', type: 'Legs', time_minutes: 70, estimated_calories: 520, exercises: ['Front Squat', 'Dumbbell Press', 'Cable Row', 'Hip Thrust', 'Face Pull'] },
        { active: false },
        { active: false },
      ],
    },
  ];

  useEffect(() => { loadSchedules(); loadExercises(); }, []);

  // Auto-scroll calendar to today
  useEffect(() => {
    if (todayRef.current && calendarRef.current) {
      const container = calendarRef.current;
      const todayEl = todayRef.current;
      const scrollLeft = todayEl.offsetLeft - container.offsetWidth / 2 + todayEl.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [schedules]);

  const loadSchedules = async () => {
    try {
      const data = await api.get(`/schedules?month=${currentMonth}&year=${currentYear}`);
      const map = {};
      data.forEach(s => {
        const day = parseInt(s.date.split('-')[2]).toString();
        map[day] = s;
      });
      setSchedules(map);
    } catch (err) { console.error(err); }
  };

  const loadExercises = async () => {
    try {
      const data = await api.get('/exercises');
      setAllExercises(data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm(language === 'id' ? 'Hapus jadwal ini?' : 'Delete this schedule?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      await loadSchedules();
    } catch (err) { alert(err.message); }
  };

  // Apply weekly plan (either from template or custom)
  const applyWeekPlan = async (plan) => {
    const todayDate = now.getDate();
    let created = 0;
    for (let i = 0; i < 7; i++) {
      const day = plan[i];
      if (!day || !day.active) continue;
      const targetDay = todayDate + i;
      if (targetDay > daysInMonth) break;
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      const dStr = targetDay.toString();
      if (schedules[dStr]) continue;
      try {
        await api.post('/schedules', {
          date: dateStr,
          title: day.title || `Day ${i + 1}`,
          type: day.type || 'Push',
          time_minutes: parseInt(day.time_minutes) || 60,
          estimated_calories: parseInt(day.estimated_calories) || 350,
          exercises_list: day.exercises || [],
        });
        created++;
      } catch (err) { console.error(err); }
    }
    setShowForm(false);
    setShowTemplates(false);
    setWeekPlan(defaultWeekPlan());
    setEditingDayIdx(null);
    await loadSchedules();
    alert(language === 'id' ? `${created} jadwal berhasil dibuat!` : `${created} schedules created!`);
  };

  // Load template into week planner for customization
  const loadTemplateIntoPlanner = (tpl) => {
    const plan = tpl.days.map(d => {
      if (!d || !d.active) return { active: false, title: '', type: 'Push', time_minutes: 60, estimated_calories: 350, exercises: [], showPicker: false, searchQuery: '' };
      return { ...d, showPicker: false, searchQuery: '' };
    });
    setWeekPlan(plan);
    setShowTemplates(false);
    setShowForm(true);
    setEditingDayIdx(null);
  };

  // Update a specific day in week plan
  const updateDayPlan = (idx, field, value) => {
    setWeekPlan(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Toggle exercise for a specific day
  const toggleDayExercise = (dayIdx, exName) => {
    setWeekPlan(prev => {
      const updated = [...prev];
      const day = { ...updated[dayIdx] };
      day.exercises = day.exercises.includes(exName)
        ? day.exercises.filter(e => e !== exName)
        : [...day.exercises, exName];
      updated[dayIdx] = day;
      return updated;
    });
  };

  const activeSchedule = schedules[selectedDate];

  const dayNames = [
    t.dashboard_day_su, t.dashboard_day_m, t.dashboard_day_t, 
    t.dashboard_day_w, t.dashboard_day_th, t.dashboard_day_f, 
    t.dashboard_day_s
  ];

  const muscleIcon = (g) => {
    const icons = { Chest: 'sports_martial_arts', Back: 'accessibility_new', Legs: 'directions_run', Shoulders: 'fitness_center', Arms: 'front_hand' };
    return icons[g] || 'fitness_center';
  };

  // Get day name for the weekly planner (based on today)
  const getPlannerDayName = (idx) => {
    const dayOfWeek = (now.getDay() + idx) % 7;
    return shortDayNames[dayOfWeek];
  };

  const getPlannerDate = (idx) => {
    const d = now.getDate() + idx;
    return d <= daysInMonth ? d : null;
  };

  const activeDaysCount = weekPlan.filter(d => d.active).length;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto transition-all">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-primary/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl" aria-hidden="true">calendar_month</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{t.jadwal_title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowTemplates(!showTemplates); setShowForm(false); }} className="bg-surface-dark hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-xl font-semibold text-sm flex items-center gap-1 transition-colors border border-slate-700">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">auto_awesome</span>
            <span className="hidden sm:inline">Template</span>
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowTemplates(false); if (!showForm) { setWeekPlan(defaultWeekPlan()); setEditingDayIdx(null); } }} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">{showForm ? 'close' : 'add'}</span>
            <span>{showForm ? (language === 'id' ? 'Batal' : 'Cancel') : t.jadwal_new}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-8">

          {/* Weekly Templates Selector */}
          {showTemplates && (
            <section className="space-y-3">
              <h3 className="font-bold text-lg">{language === 'id' ? 'Template Mingguan' : 'Weekly Templates'}</h3>
              <p className="text-xs text-slate-500 font-medium">{language === 'id' ? 'Pilih template lalu atur sesuai keinginan, atau terapkan langsung' : 'Pick a template to customize, or apply directly'}</p>
              <div className="grid gap-3">
                {weeklyTemplates.map((tpl, idx) => (
                  <div key={idx} className="bg-surface-dark border border-slate-800 rounded-2xl p-5 hover:border-primary/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-black text-base">{tpl.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{tpl.desc}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => loadTemplateIntoPlanner(tpl)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                          {language === 'id' ? 'Atur' : 'Customize'}
                        </button>
                        <button onClick={() => applyWeekPlan(tpl.days)} className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95">
                          {language === 'id' ? 'Terapkan' : 'Apply'}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {tpl.days.map((day, i) => (
                        <div key={i} className={`flex-1 py-2 rounded-lg text-center text-[9px] font-bold uppercase tracking-wider ${
                          day.active ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-800/50 text-slate-600 border border-slate-800'
                        }`}>
                          {day.active ? (day.type || '').slice(0, 4) : 'Rest'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Weekly Planner Form */}
          {showForm && (
            <section className="bg-surface-dark border border-primary/30 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{language === 'id' ? 'Atur Jadwal Mingguan' : 'Plan Your Week'}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {language === 'id' 
                      ? `Mulai dari hari ini (${now.getDate()} ${monthNames[currentMonth]}) • ${activeDaysCount} hari latihan, ${7 - activeDaysCount} istirahat`
                      : `Starting today (${monthNames[currentMonth]} ${now.getDate()}) • ${activeDaysCount} training, ${7 - activeDaysCount} rest`}
                  </p>
                </div>
              </div>

              {/* Day toggles — visual week overview */}
              <div className="grid grid-cols-7 gap-2">
                {weekPlan.map((day, idx) => {
                  const pDate = getPlannerDate(idx);
                  if (!pDate) return <div key={idx} className="rounded-xl bg-slate-800/30 border border-slate-800 py-3 text-center opacity-40">
                    <span className="text-[9px] font-bold text-slate-600 block">—</span>
                  </div>;

                  return (
                    <button key={idx} type="button"
                      onClick={() => {
                        if (!day.active) {
                          updateDayPlan(idx, 'active', true);
                          setEditingDayIdx(idx);
                        } else if (editingDayIdx === idx) {
                          updateDayPlan(idx, 'active', false);
                          setEditingDayIdx(null);
                        } else {
                          setEditingDayIdx(idx);
                        }
                      }}
                      className={`rounded-xl py-3 flex flex-col items-center gap-1 transition-all border ${
                        day.active
                          ? editingDayIdx === idx
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105 z-10'
                            : 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-slate-800/50 text-slate-500 border-slate-800 hover:border-slate-600'
                      }`}
                      aria-label={`${getPlannerDayName(idx)} ${pDate} - ${day.active ? 'Training' : 'Rest'}`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest">{getPlannerDayName(idx)}</span>
                      <span className="text-sm font-black">{pDate}</span>
                      <span className="material-symbols-outlined text-xs" aria-hidden="true">
                        {day.active ? 'fitness_center' : 'bedtime'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-500 font-medium text-center">
                {language === 'id' ? 'Klik untuk toggle latihan/istirahat • Klik hari aktif untuk edit' : 'Click to toggle train/rest • Click active day to edit'}
              </p>

              {/* Edit selected day */}
              {editingDayIdx !== null && weekPlan[editingDayIdx]?.active && (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center text-xs font-black">{editingDayIdx + 1}</span>
                      {getPlannerDayName(editingDayIdx)} {getPlannerDate(editingDayIdx)} {monthNames[currentMonth]}
                    </h4>
                    <button type="button" onClick={() => { updateDayPlan(editingDayIdx, 'active', false); setEditingDayIdx(null); }} 
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">event_busy</span>
                      {language === 'id' ? 'Jadikan Rest' : 'Set as Rest'}
                    </button>
                  </div>

                  <input className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder={language === 'id' ? 'Judul (mis: Push Day)' : 'Title (e.g. Push Day)'}
                    value={weekPlan[editingDayIdx].title}
                    onChange={(e) => updateDayPlan(editingDayIdx, 'title', e.target.value)}
                    aria-label={language === 'id' ? 'Judul latihan' : 'Workout title'} />

                  <div className="grid grid-cols-3 gap-3">
                    <select className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm"
                      value={weekPlan[editingDayIdx].type}
                      onChange={(e) => updateDayPlan(editingDayIdx, 'type', e.target.value)}
                      aria-label={language === 'id' ? 'Tipe latihan' : 'Workout type'}>
                      <option>Push</option><option>Pull</option><option>Legs</option><option>Chest</option><option>Back</option><option>Arms</option><option>Shoulders</option><option>Cardio</option>
                    </select>
                    <input className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm" type="number"
                      placeholder={language === 'id' ? 'Menit' : 'Minutes'}
                      value={weekPlan[editingDayIdx].time_minutes}
                      onChange={(e) => updateDayPlan(editingDayIdx, 'time_minutes', e.target.value)}
                      aria-label={language === 'id' ? 'Durasi (menit)' : 'Duration (minutes)'} />
                    <input className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm" type="number"
                      placeholder={language === 'id' ? 'Kalori' : 'Calories'}
                      value={weekPlan[editingDayIdx].estimated_calories}
                      onChange={(e) => updateDayPlan(editingDayIdx, 'estimated_calories', e.target.value)}
                      aria-label={language === 'id' ? 'Estimasi kalori' : 'Estimated calories'} />
                  </div>

                  {/* Exercise Picker */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {language === 'id' ? 'Latihan' : 'Exercises'} ({weekPlan[editingDayIdx].exercises.length})
                      </p>
                      <button type="button" onClick={() => updateDayPlan(editingDayIdx, 'showPicker', !weekPlan[editingDayIdx].showPicker)}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">{weekPlan[editingDayIdx].showPicker ? 'expand_less' : 'fitness_center'}</span>
                        {weekPlan[editingDayIdx].showPicker ? (language === 'id' ? 'Tutup' : 'Close') : (language === 'id' ? 'Pilih Latihan' : 'Browse')}
                      </button>
                    </div>

                    {weekPlan[editingDayIdx].exercises.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {weekPlan[editingDayIdx].exercises.map((name, i) => (
                          <span key={i} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-primary/20 flex items-center gap-1.5">
                            {name}
                            <button type="button" onClick={() => toggleDayExercise(editingDayIdx, name)} className="hover:text-red-400 transition-colors" aria-label={`Remove ${name}`}>
                              <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {weekPlan[editingDayIdx].showPicker && (
                      <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="relative p-3 border-b border-slate-700/50">
                          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" aria-hidden="true">search</span>
                          <input
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-600"
                            placeholder={language === 'id' ? 'Cari latihan...' : 'Search exercises...'}
                            value={weekPlan[editingDayIdx].searchQuery}
                            onChange={(e) => updateDayPlan(editingDayIdx, 'searchQuery', e.target.value)}
                            aria-label={language === 'id' ? 'Cari latihan' : 'Search exercises'}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {allExercises
                            .filter(ex => ex.name.toLowerCase().includes((weekPlan[editingDayIdx].searchQuery || '').toLowerCase()) ||
                              ex.muscle_group.toLowerCase().includes((weekPlan[editingDayIdx].searchQuery || '').toLowerCase()))
                            .map(ex => {
                              const isSelected = weekPlan[editingDayIdx].exercises.includes(ex.name);
                              return (
                                <button key={ex.id} type="button" onClick={() => toggleDayExercise(editingDayIdx, ex.name)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-800/50 last:border-0 ${isSelected ? 'bg-primary/5' : ''}`}>
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary/20 text-primary' : 'bg-slate-700/50 text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-base" aria-hidden="true">{isSelected ? 'check' : muscleIcon(ex.muscle_group)}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-primary' : ''}`}>{ex.name}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{ex.muscle_group}</p>
                                  </div>
                                  {isSelected && <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">check_circle</span>}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Apply Week Plan Button */}
              <button onClick={() => applyWeekPlan(weekPlan)} disabled={activeDaysCount === 0}
                className={`w-full font-bold py-3.5 rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 ${
                  activeDaysCount > 0 
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}>
                <span className="material-symbols-outlined text-lg" aria-hidden="true">event_available</span>
                {language === 'id' 
                  ? `Terapkan ${activeDaysCount} Jadwal` 
                  : `Apply ${activeDaysCount} Schedule${activeDaysCount !== 1 ? 's' : ''}`}
              </button>
            </section>
          )}

          {/* Calendar */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-black text-xl tracking-tight">{monthNames[currentMonth]} {currentYear}</h2>
              <button onClick={() => {
                setSelectedDate(now.getDate().toString());
                if (todayRef.current && calendarRef.current) {
                  const container = calendarRef.current;
                  const todayEl = todayRef.current;
                  container.scrollTo({ left: Math.max(0, todayEl.offsetLeft - container.offsetWidth / 2 + todayEl.offsetWidth / 2), behavior: 'smooth' });
                }
              }} className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">today</span>
                {language === 'id' ? 'Hari Ini' : 'Today'}
              </button>
            </div>
            <div ref={calendarRef} className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dStr = day.toString();
                const isSelected = selectedDate === dStr;
                const hasWorkout = schedules[dStr];
                const dayIndex = (firstDayOfWeek + i) % 7;
                const dayName = dayNames[dayIndex];
                const isToday = day === now.getDate();

                return (
                  <button key={i} 
                    ref={isToday ? todayRef : null}
                    onClick={() => setSelectedDate(dStr)}
                    className={`flex-shrink-0 w-14 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all border ${
                      isSelected ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105 z-10' 
                      : isToday ? 'bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20'
                      : 'bg-surface-dark text-slate-400 border-slate-800 hover:border-slate-600'
                    }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">{dayName}</span>
                    <span className="text-lg font-black">{dStr}</span>
                    {isToday && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
                    {hasWorkout && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary/60'}`}></div>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Schedule Detail */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary font-black"></span>
                {t.jadwal_title} {selectedDate} {monthNames[currentMonth]}
              </h3>
              {activeSchedule && (
                <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-primary/20">
                  {activeSchedule.type} Session
                </span>
              )}
            </div>
            
            {activeSchedule ? (
              <div className="bg-surface-dark border border-slate-800 rounded-3xl p-6 relative overflow-hidden group transition-all hover:border-primary/40">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div>
                      <h4 className="text-2xl font-black text-white tracking-tight mb-1">{activeSchedule.title}</h4>
                      <p className="text-sm font-medium text-slate-400 max-w-xl leading-relaxed">
                        {activeSchedule.exercises_list ? JSON.parse(activeSchedule.exercises_list).join(', ') : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">fitness_center</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{language === 'id' ? 'Latihan' : 'Exercises'}</span>
                          <span className="text-sm font-black text-white px-1 leading-none">
                            {activeSchedule.exercises_list ? JSON.parse(activeSchedule.exercises_list).length : 0} {t.jadwal_items}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">schedule</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{language === 'id' ? 'Durasi' : 'Duration'}</span>
                          <span className="text-sm font-black text-white px-1 leading-none">{activeSchedule.time_minutes}m</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">local_fire_department</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{language === 'id' ? 'Estimasi' : 'Estimate'}</span>
                          <span className="text-sm font-black text-white px-1 leading-none">{activeSchedule.estimated_calories} Kcal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleDelete(activeSchedule.id)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20" aria-label={language === 'id' ? 'Hapus jadwal' : 'Delete schedule'}>
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                    <button className="bg-primary hover:bg-primary/90 text-white w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-xl shadow-primary/20"
                      onClick={() => window.location.href = '/workout'} aria-label={language === 'id' ? 'Mulai latihan' : 'Start workout'}>
                      <span className="material-symbols-outlined text-4xl" aria-hidden="true">play_arrow</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-4 bg-surface-dark/30">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined text-4xl" aria-hidden="true">bedtime</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-400">Rest Day</h4>
                  <p className="text-sm text-slate-600 font-medium">{language === 'id' ? 'Waktunya otot beristirahat.' : 'Time to rest your muscles.'}</p>
                  <button onClick={() => { setShowForm(true); setWeekPlan(defaultWeekPlan()); }} className="mt-4 text-sm font-semibold text-primary hover:underline">
                    {language === 'id' ? '+ Atur jadwal mingguan' : '+ Plan your week'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Jadwal;
