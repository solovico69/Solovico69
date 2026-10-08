import React from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-bounceIn ${
            toast.type === 'success'
              ? 'bg-emerald-900/95 border-emerald-700 text-white'
              : toast.type === 'error'
              ? 'bg-red-900/95 border-red-700 text-white'
              : 'bg-slate-900/95 border-slate-700 text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            {toast.type === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />}
            
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide">{toast.title}</span>
              <span className="text-xs text-slate-200 mt-0.5 leading-snug">{toast.message}</span>
            </div>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
