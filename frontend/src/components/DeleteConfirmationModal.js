"use client";

import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, message, itemName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0c1929]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-[28px] shadow-[0_20px_50px_rgba(12,25,41,0.15)] border border-slate-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-50 text-[#0c1929] hover:text-[#0c1929] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6 ring-8 ring-red-50/50">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h3 className="text-xl font-bold text-[#0c1929] mb-2">
              {title || "Confirm Deletion"}
            </h3>
            
            <p className="text-[#0c1929] text-sm leading-relaxed mb-1">
              {message || "Are you sure you want to permanently remove this item? This action cannot be undone."}
            </p>
            
            {itemName && (
              <p className="text-sm font-bold text-[#0c1929] px-3 py-1 bg-slate-50 rounded-lg mt-2 border border-slate-100 italic">
                "{itemName}"
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl bg-slate-50 text-[#0c1929] text-sm font-semibold hover:bg-slate-100 transition-all border border-slate-200/60"
            >
              Cancel, Keep it
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-6 py-3.5 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Confirm Delete
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50/80 px-8 py-4 border-t border-slate-100 flex items-center justify-center">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#0c1929]">Security Safeguard Active</p>
        </div>
      </div>
    </div>
  );
}
