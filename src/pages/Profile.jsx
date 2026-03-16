import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function Profile() {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get('/users/profile');
      setProfile(data);
    } catch (err) { console.error(err); }
  };

  const handleSave = async (field, value) => {
    try {
      if (field === 'height_cm' || field === 'weight_kg' || field === 'target_weight_kg') {
        await api.put('/users/biometrics', { [field]: parseFloat(value) });
      } else {
        await api.put('/users/profile', { [field]: value });
      }
      await loadProfile();
      setEditing(null);
      setMsg('');
    } catch (err) { setMsg(err.message); }
  };

  const handlePasswordChange = async () => {
    try {
      await api.put('/users/password', { currentPassword: currentPw, newPassword: newPw });
      setMsg(language === 'id' ? 'Password berhasil diubah!' : 'Password changed!');
      setChangingPw(false); setCurrentPw(''); setNewPw('');
    } catch (err) { setMsg(err.message); }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleDelete = async () => {
    if (!confirm(language === 'id' ? 'Yakin ingin menghapus akun? Ini tidak bisa dibatalkan.' : 'Are you sure? This cannot be undone.')) return;
    try {
      await api.delete('/users/account');
      logout();
      window.location.href = '/';
    } catch (err) { setMsg(err.message); }
  };

  const EditableField = ({ label, value, field, icon, iconColor }) => (
    <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center`}>
          <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          {editing === field ? (
            <input
              autoFocus
              className="text-base font-bold bg-transparent border-b border-primary outline-none w-24"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave(field, editValue)}
              onBlur={() => handleSave(field, editValue)}
              aria-label={label}
            />
          ) : (
            <p className="text-base font-bold">{value}</p>
          )}
        </div>
      </div>
      <button
        className="text-sm font-semibold text-primary px-3 py-1 hover:bg-primary/5 rounded-lg transition-colors"
        onClick={() => { setEditing(field); setEditValue(String(value).replace(/[^\d.]/g, '')); }}
      >
        {t.profile_edit}
      </button>
    </div>
  );

  if (!profile) return <div className="flex-1 flex items-center justify-center"><span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span></div>;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto transition-all relative pb-24 border-x border-slate-200 dark:border-slate-800">
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight">{t.profile_title}</h1>
        <button 
          className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          onClick={handleLogout}
        >
          {t.profile_logout}
        </button>
      </header>

      <section className="flex flex-col items-center py-8 px-6">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full border-4 border-primary p-1 bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-5xl" aria-hidden="true">person</span>
          </div>
        </div>
        <div className="text-center mt-4">
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{profile.email}</p>
          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
            {profile.role}
          </span>
        </div>
      </section>

      {msg && (
        <div className="mx-6 mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-primary text-center">
          {msg}
        </div>
      )}

      <section className="px-6 mb-8">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-1">{t.profile_active_goal}</label>
        <div className="relative group">
          <select 
            className="w-full appearance-none bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
            value={profile.active_goal}
            onChange={(e) => handleSave('active_goal', e.target.value)}
          >
            <option value="Fat Loss">{t.goal_fat_loss}</option>
            <option value="Muscle Gain">{t.goal_muscle_gain}</option>
            <option value="Maintenance">{t.goal_maintenance}</option>
            <option value="Endurance training">{t.goal_endurance}</option>
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400" aria-hidden="true">expand_more</span>
          </div>
        </div>
      </section>

      <section className="px-6 mb-8">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-1">{t.profile_language}</label>
        <div className="relative group">
          <select 
            className="w-full appearance-none bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
            value={language}
            onChange={(e) => { setLanguage(e.target.value); handleSave('language', e.target.value); }}
          >
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400" aria-hidden="true">language</span>
          </div>
        </div>
      </section>

      <section className="px-6 mb-10">
        <h3 className="font-bold text-lg mb-4">{t.profile_biometrics}</h3>
        <div className="grid grid-cols-1 gap-4">
          <EditableField label={t.profile_height} value={`${profile.height_cm || 0} cm`} field="height_cm" icon="height" iconColor="bg-primary/10 text-primary" />
          <EditableField label={t.profile_weight} value={`${profile.weight_kg || 0} kg`} field="weight_kg" icon="monitor_weight" iconColor="bg-emerald-500/10 text-emerald-500" />
          <EditableField label={t.profile_target_weight} value={`${profile.target_weight_kg || 0} kg`} field="target_weight_kg" icon="ads_click" iconColor="bg-amber-500/10 text-amber-500" />
        </div>
      </section>

      <section className="px-6 mb-10">
        <h3 className="font-bold text-lg mb-4">{t.profile_security_center}</h3>
        <div className="space-y-1">
          <button onClick={() => setChangingPw(!changingPw)} className="w-full flex items-center justify-between py-3 cursor-pointer group">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors" aria-hidden="true">lock</span>
              <span className="text-sm font-medium">{t.profile_change_password}</span>
            </div>
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600" aria-hidden="true">{changingPw ? 'expand_less' : 'chevron_right'}</span>
          </button>
          {changingPw && (
            <div className="pl-10 pb-4 space-y-3">
              <input className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm outline-none focus:ring-2 focus:ring-primary" type="password" placeholder={language === 'id' ? 'Password lama' : 'Current password'} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} aria-label={language === 'id' ? 'Password lama' : 'Current password'} />
              <input className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm outline-none focus:ring-2 focus:ring-primary" type="password" placeholder={language === 'id' ? 'Password baru' : 'New password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} aria-label={language === 'id' ? 'Password baru' : 'New password'} />
              <button onClick={handlePasswordChange} className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">{language === 'id' ? 'Simpan' : 'Save'}</button>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 mb-12">
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
          <h3 className="text-red-500 font-bold text-sm mb-2">{t.profile_danger_zone}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">{t.profile_danger_desc}</p>
          <button onClick={handleDelete} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
            {t.profile_delete_account}
          </button>
        </div>
      </section>
    </div>
  );
}

export default Profile;
