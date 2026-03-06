import React, { useState } from 'react';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@guestseat.com' && password === 'password123') {
      onLogin();
    } else {
      setError('Email ose fjalëkalim i pavlefshëm. Ju lutem përdorni kredencialet e dhëna më poshtë.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary text-white mb-6 shadow-xl shadow-primary/20">
            <LogIn size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">GuestSeat</h1>
          <p className="text-slate-500 mt-2 font-medium">Hyni për të menaxhuar ngjarjen tuaj</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Adresa Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 font-medium"
                  placeholder="admin@guestseat.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Fjalëkalimi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <button 
              type="submit"
              className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Hyni</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Kredencialet Demo</p>
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email:</span>
                <span className="font-bold text-slate-900">admin@guestseat.com</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Fjalëkalimi:</span>
                <span className="font-bold text-slate-900">password123</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
