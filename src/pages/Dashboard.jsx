import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function Dashboard() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [summary, setSummary] = useState({ streak: 0, calories: 0, weight_kg: 0, water_ml: 0 });
  const [nutrition, setNutrition] = useState({ protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [waterIntake, setWaterIntake] = useState(0);
  const [nextSession, setNextSession] = useState(null);
  const [bodyStats, setBodyStats] = useState([]);

  // Feature: Nutrition Input
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [nutritionForm, setNutritionForm] = useState({ protein_g: '', carbs_g: '', fat_g: '', calories: '' });

  // Feature: Body Weight Logger
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightForm, setWeightForm] = useState({ weight_kg: '', body_fat_pct: '' });

  // Feature: Custom Hydration
  const [customWater, setCustomWater] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [sum, nut, next, stats] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/nutrition/today'),
        api.get('/dashboard/next-session'),
        api.get('/dashboard/body-stats'),
      ]);
      setSummary(sum);
      setNutrition(nut);
      setWaterIntake(sum.water_ml || 0);
      setNextSession(next);
      setBodyStats(stats);
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  };

  const addWater = async (amount = 250) => {
    try {
      const result = await api.post('/dashboard/hydration', { amount_ml: amount });
      setWaterIntake(result.water_ml);
      setCustomWater('');
    } catch (err) {
      console.error('Hydration error:', err);
    }
  };

  const logNutrition = async () => {
    try {
      await api.post('/nutrition/log', {
        protein_g: parseFloat(nutritionForm.protein_g) || 0,
        carbs_g: parseFloat(nutritionForm.carbs_g) || 0,
        fat_g: parseFloat(nutritionForm.fat_g) || 0,
        calories: parseFloat(nutritionForm.calories) || 0,
      });
      setShowNutritionForm(false);
      setNutritionForm({ protein_g: '', carbs_g: '', fat_g: '', calories: '' });
      loadDashboard();
    } catch (err) {
      console.error('Nutrition log error:', err);
    }
  };

  const logBodyStats = async () => {
    try {
      const stats = await api.post('/dashboard/body-stats', {
        weight_kg: parseFloat(weightForm.weight_kg) || null,
        body_fat_pct: parseFloat(weightForm.body_fat_pct) || null,
      });
      setBodyStats(stats);
      setShowWeightForm(false);
      setWeightForm({ weight_kg: '', body_fat_pct: '' });
      loadDashboard();
    } catch (err) {
      console.error('Body stats error:', err);
    }
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const proteinPct = nutrition.protein_g ? Math.min((nutrition.protein_g / 180) * 100, 100) : 0;
  const carbsPct = nutrition.carbs_g ? Math.min((nutrition.carbs_g / 280) * 100, 100) : 0;
  const fatPct = nutrition.fat_g ? Math.min((nutrition.fat_g / 70) * 100, 100) : 0;
  const waterPct = waterIntake ? Math.min((waterIntake / 2500) * 100, 100) : 0;

  const latestWeight = bodyStats[0];
  const weightChange = bodyStats.length >= 2 ? (bodyStats[0].weight_kg - bodyStats[bodyStats.length - 1].weight_kg).toFixed(1) : 0;
  const fatChange = bodyStats.length >= 2 ? (bodyStats[0].body_fat_pct - bodyStats[bodyStats.length - 1].body_fat_pct).toFixed(1) : 0;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto transition-all">
      <header className="flex items-center justify-between px-6 py-6 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40 border-b border-transparent md:border-slate-200 dark:md:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-primary text-2xl" aria-hidden="true">bubble_chart</span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t.dashboard_greeting}{user ? `, ${user.name.split(' ')[0]}` : ''}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-slate-800 hover:bg-slate-800 transition-colors" aria-label="Notifications">
            <span className="material-symbols-outlined text-slate-100" aria-hidden="true">notifications</span>
          </button>
          <button 
            className="w-10 h-10 rounded-full border-2 border-primary/40 p-0.5 bg-primary/20 flex items-center justify-center"
            onClick={() => window.location.href = '/profile'}
            aria-label="Go to profile"
          >
            <span className="material-symbols-outlined text-primary" aria-hidden="true">person</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 space-y-8 pb-12">
        {/* Next Up */}
        <section className="bg-gradient-to-r from-primary to-indigo-600 rounded-3xl p-6 shadow-xl shadow-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                {t.dashboard_next_up_title}
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {nextSession ? nextSession.title : (language === 'id' ? 'Tidak ada jadwal' : 'No upcoming session')}
              </h3>
              {nextSession && (
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">schedule</span> {nextSession.time_minutes}m
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">local_fire_department</span> {nextSession.estimated_calories} kcal
                  </span>
                </div>
              )}
            </div>
            <button 
              className="bg-white text-primary hover:bg-slate-50 font-bold py-3 px-8 rounded-2xl transition-all shadow-lg active:scale-95 text-sm"
              onClick={() => window.location.href = '/workout'}
            >
              {t.dashboard_start_now}
            </button>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-dark p-4 rounded-2xl border border-slate-800 hover:border-primary/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
              <span className="material-symbols-outlined" aria-hidden="true">bolt</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t.dashboard_streak}</p>
            <p className="text-2xl font-black">{summary.streak} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.dashboard_days}</span></p>
          </div>
          <div className="bg-surface-dark p-4 rounded-2xl border border-slate-800 hover:border-orange-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-3">
              <span className="material-symbols-outlined" aria-hidden="true">restaurant_menu</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t.dashboard_calories}</p>
            <p className="text-2xl font-black">{Math.round(summary.calories).toLocaleString()} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">kcal</span></p>
          </div>
          <div className="bg-surface-dark p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
              <span className="material-symbols-outlined" aria-hidden="true">monitor_weight</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t.dashboard_weight_title}</p>
            <p className="text-2xl font-black">{summary.weight_kg} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">kg</span></p>
          </div>
          <div className="bg-surface-dark p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
              <span className="material-symbols-outlined" aria-hidden="true">water_drop</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t.dashboard_hydration_title}</p>
            <p className="text-2xl font-black">{waterIntake} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ml</span></p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Nutrition Summary */}
          <section className="bg-surface-dark rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-black text-lg tracking-tight">{t.dashboard_nutrition_title}</h4>
              <button
                onClick={() => setShowNutritionForm(!showNutritionForm)}
                className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">{showNutritionForm ? 'close' : 'add_circle'}</span>
                {showNutritionForm ? (language === 'id' ? 'Tutup' : 'Close') : (language === 'id' ? 'Catat Makanan' : 'Log Food')}
              </button>
            </div>
            {showNutritionForm && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{language === 'id' ? 'Tambah Nutrisi' : 'Add Nutrition'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t.dashboard_protein} (g)</label>
                    <input type="number" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" value={nutritionForm.protein_g} onChange={(e) => setNutritionForm({...nutritionForm, protein_g: e.target.value})} aria-label={`${t.dashboard_protein} (g)`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t.dashboard_carbs} (g)</label>
                    <input type="number" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-orange-500" placeholder="0" value={nutritionForm.carbs_g} onChange={(e) => setNutritionForm({...nutritionForm, carbs_g: e.target.value})} aria-label={`${t.dashboard_carbs} (g)`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t.dashboard_fat} (g)</label>
                    <input type="number" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-amber-500" placeholder="0" value={nutritionForm.fat_g} onChange={(e) => setNutritionForm({...nutritionForm, fat_g: e.target.value})} aria-label={`${t.dashboard_fat} (g)`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t.dashboard_calories} (kcal)</label>
                    <input type="number" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-primary" placeholder="0" value={nutritionForm.calories} onChange={(e) => setNutritionForm({...nutritionForm, calories: e.target.value})} aria-label={`${t.dashboard_calories} (kcal)`} />
                  </div>
                </div>
                <button onClick={logNutrition} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">check</span>
                  {language === 'id' ? 'Simpan' : 'Save'}
                </button>
              </div>
            )}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="font-bold text-sm tracking-wide">{t.dashboard_protein}</p>
                  <p className="text-xs font-bold"><span className="text-emerald-500 text-sm">{Math.round(nutrition.protein_g)}g</span> / 180g</p>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(proteinPct)} aria-valuemin="0" aria-valuemax="100" aria-label="Protein progress">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${proteinPct}%` }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="font-bold text-sm tracking-wide">{t.dashboard_carbs}</p>
                  <p className="text-xs font-bold"><span className="text-orange-500 text-sm">{Math.round(nutrition.carbs_g)}g</span> / 280g</p>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(carbsPct)} aria-valuemin="0" aria-valuemax="100" aria-label="Carbs progress">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${carbsPct}%` }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="font-bold text-sm tracking-wide">{t.dashboard_fat}</p>
                  <p className="text-xs font-bold"><span className="text-amber-500 text-sm">{Math.round(nutrition.fat_g)}g</span> / 70g</p>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(fatPct)} aria-valuemin="0" aria-valuemax="100" aria-label="Fat progress">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${fatPct}%` }}></div>
                </div>
              </div>
            </div>
          </section>

          {/* Hydration Tracker */}
          <section className="bg-surface-dark rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-black text-lg tracking-tight">{t.dashboard_hydration_title}</h4>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">auto_graph</span>
                <span className="text-xs font-bold uppercase tracking-widest">{t.dashboard_target}: 2.5L</span>
              </div>
            </div>
            <div className="flex flex-1 gap-8">
              <div className="w-16 h-full bg-slate-800 rounded-3xl relative overflow-hidden flex flex-col justify-end border border-slate-700/50 min-h-[160px]">
                <div 
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700 ease-out flex flex-col items-center justify-start pt-2"
                  style={{ height: `${waterPct}%` }}
                >
                  <span className="material-symbols-outlined text-white text-lg animate-bounce duration-[2000ms]" aria-hidden="true">water_drop</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div>
                  <p className="text-4xl font-black">{waterIntake} <span className="text-lg text-slate-500 font-bold uppercase tracking-widest">ml</span></p>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                    {language === 'id' ? `Sekitar ${Math.round(waterPct)}% dari target harian` : `About ${Math.round(waterPct)}% of daily target`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {[250, 500, 750].map(ml => (
                    <button key={ml} onClick={() => addWater(ml)}
                      className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 border border-blue-500/20">
                      +{ml}ml
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="number" className="flex-1 px-3 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-blue-500" placeholder="ml" value={customWater} onChange={(e) => setCustomWater(e.target.value)} aria-label={language === 'id' ? 'Jumlah air kustom (ml)' : 'Custom water amount (ml)'} onKeyDown={(e) => e.key === 'Enter' && customWater && addWater(parseInt(customWater))} />
                  <button onClick={() => customWater && addWater(parseInt(customWater))}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">add</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Body Stats */}
         <section className="bg-surface-dark rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black text-lg tracking-tight">{t.dashboard_body_stats_title}</h4>
            <button
              onClick={() => setShowWeightForm(!showWeightForm)}
              className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">{showWeightForm ? 'close' : 'add_circle'}</span>
              {showWeightForm ? (language === 'id' ? 'Tutup' : 'Close') : (language === 'id' ? 'Catat' : 'Log')}
            </button>
          </div>
          {showWeightForm && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{language === 'id' ? 'Catat Hari Ini' : 'Log Today'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t.dashboard_weight_title} (kg)</label>
                  <input type="number" step="0.1" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.0" value={weightForm.weight_kg} onChange={(e) => setWeightForm({...weightForm, weight_kg: e.target.value})} aria-label={`${t.dashboard_weight_title} (kg)`} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t.dashboard_body_fat_title} (%)</label>
                  <input type="number" step="0.1" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-orange-500" placeholder="0.0" value={weightForm.body_fat_pct} onChange={(e) => setWeightForm({...weightForm, body_fat_pct: e.target.value})} aria-label={`${t.dashboard_body_fat_title} (%)`} />
                </div>
              </div>
              <button onClick={logBodyStats} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg" aria-hidden="true">check</span>
                {language === 'id' ? 'Simpan' : 'Save'}
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <span className="material-symbols-outlined" aria-hidden="true">{weightChange <= 0 ? 'trending_down' : 'trending_up'}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.dashboard_weight_title}</p>
                  <p className="text-xl font-black">{weightChange} kg <span className="text-xs font-bold text-emerald-500 ml-1">{language === 'id' ? 'Bulan ini' : 'This month'}</span></p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-600" aria-hidden="true">chevron_right</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <span className="material-symbols-outlined" aria-hidden="true">{fatChange <= 0 ? 'trending_down' : 'trending_up'}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.dashboard_body_fat_title}</p>
                  <p className="text-xl font-black">{fatChange} % <span className="text-xs font-bold text-emerald-500 ml-1">{language === 'id' ? 'Bulan ini' : 'This month'}</span></p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-600" aria-hidden="true">chevron_right</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
