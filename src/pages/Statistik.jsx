import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import { api } from '../utils/api';

function Statistik() {
  const { language } = useLanguage();
  const t = translations[language];
  const [period, setPeriod] = useState('1M');
  const [volumeData, setVolumeData] = useState({ total_volume: 0, data: [] });
  const [weightData, setWeightData] = useState({ latest_weight: 0, change_kg: 0, data: [] });
  const [records, setRecords] = useState([]);
  const [activeChart, setActiveChart] = useState('volume');

  useEffect(() => { loadStats(); }, [period]);

  const loadStats = async () => {
    try {
      const [vol, bw, prs] = await Promise.all([
        api.get(`/stats/volume?period=${period}`),
        api.get(`/stats/body-weight?period=${period}`),
        api.get('/stats/personal-records'),
      ]);
      setVolumeData(vol);
      setWeightData(bw);
      setRecords(prs);
    } catch (err) { console.error(err); }
  };

  const periods = ['1W', '1M', '3M', 'All'];

  const maxVolume = volumeData.data.length > 0 ? Math.max(...volumeData.data.map(d => d.volume)) : 1;
  const maxWeight = weightData.data.length > 0 ? Math.max(...weightData.data.map(d => d.weight_kg)) : 1;
  const minWeight = weightData.data.length > 0 ? Math.min(...weightData.data.map(d => d.weight_kg)) : 0;
  const weightRange = maxWeight - minWeight || 1;

  const badgeColor = (b) => {
    if (b === 'gold') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (b === 'silver') return 'bg-slate-400/10 text-slate-300 border-slate-400/30';
    return 'bg-orange-800/10 text-orange-400 border-orange-800/30';
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto transition-all">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-primary/20 px-6 py-4 flex items-center gap-3">
        <div className="bg-primary p-1.5 rounded-lg"><span className="material-symbols-outlined text-white text-xl" aria-hidden="true">analytics</span></div>
        <h1 className="text-xl font-bold tracking-tight">{t.statistik_title}</h1>
      </header>

      <main className="px-6 pb-28 space-y-8 pt-6">
        {/* Period Filter */}
        <div className="flex gap-2">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                period === p ? 'bg-primary text-white border-primary' : 'bg-surface-dark text-slate-400 border-slate-800'
              }`}>
              {p === 'All' ? (language === 'id' ? 'Semua' : 'All') : p}
            </button>
          ))}
        </div>

        {/* Chart Type Toggle */}
        <div className="flex bg-surface-dark rounded-2xl p-1 border border-slate-800">
          <button onClick={() => setActiveChart('volume')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeChart === 'volume' ? 'bg-primary text-white' : 'text-slate-400'}`}>
            {t.statistik_volume_title}
          </button>
          <button onClick={() => setActiveChart('weight')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeChart === 'weight' ? 'bg-primary text-white' : 'text-slate-400'}`}>
            {t.statistik_body_weight_title}
          </button>
        </div>

        {/* Chart */}
        <section className="bg-surface-dark rounded-3xl p-6 border border-slate-800">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h3 className="font-black text-lg">{activeChart === 'volume' ? t.statistik_volume_title : t.statistik_body_weight_title}</h3>
              <p className="text-sm text-slate-500 font-medium">
                {activeChart === 'volume' 
                  ? `${Math.round(volumeData.total_volume).toLocaleString()} kg ${language === 'id' ? 'total' : 'total volume'}`
                  : `${weightData.latest_weight} kg ${weightData.change_kg >= 0 ? '+' : ''}${weightData.change_kg} kg`
                }
              </p>
            </div>
          </div>

          {/* Bar/Line Chart */}
          <div className="h-48 flex items-end gap-1.5 overflow-x-auto pb-2">
            {activeChart === 'volume' ? (
              volumeData.data.length > 0 ? volumeData.data.map((d, i) => (
                <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{Math.round(d.volume)}</span>
                  <div className="w-full bg-primary/80 hover:bg-primary rounded-t-lg transition-all cursor-default" 
                    style={{ height: `${Math.max((d.volume / maxVolume) * 140, 4)}px` }}></div>
                  <span className="text-[8px] text-slate-600 font-bold">{d.date?.slice(5)}</span>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-sm py-16">
                  {language === 'id' ? 'Belum ada data' : 'No data yet'}
                </div>
              )
            ) : (
              weightData.data.length > 0 ? weightData.data.map((d, i) => (
                <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">{d.weight_kg}</span>
                  <div className="w-full bg-emerald-500/80 hover:bg-emerald-500 rounded-t-lg transition-all cursor-default" 
                    style={{ height: `${Math.max(((d.weight_kg - minWeight) / weightRange) * 140 + 10, 4)}px` }}></div>
                  <span className="text-[8px] text-slate-600 font-bold">{d.date?.slice(5)}</span>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-sm py-16">
                  {language === 'id' ? 'Belum ada data' : 'No data yet'}
                </div>
              )
            )}
          </div>
        </section>

        {/* Personal Records */}
        <section>
          <h3 className="font-black text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500" aria-hidden="true">emoji_events</span>
            {t.statistik_pr_title}
          </h3>
          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">{language === 'id' ? 'Belum ada personal record' : 'No personal records yet'}</div>
            ) : records.map((pr, i) => (
              <div key={i} className="bg-surface-dark border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${badgeColor(pr.badge)}`}>
                    <span className="material-symbols-outlined text-2xl" aria-hidden="true">emoji_events</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{pr.exercise_name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{pr.muscle_group} • {pr.achieved_at?.slice(0, 10)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">{pr.max_weight_kg}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">KG</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Statistik;
