import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { Bell } from 'lucide-react';
import LogoutHeaderButton from '@/components/LogoutHeaderButton';

export default function AdminLayout({ children }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#f8f9fb]">
            {/* Top Header */}
            <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-6 shadow-sm">
                <Link href="/" className="flex items-center gap-2.5 text-[#0c1929]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0c1929] to-[#24456e] text-sm font-black text-white shadow-md">
                        H
                    </span>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-bold tracking-[0.15em] text-[#0c1929] uppercase">HomEV</p>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Admin Console</span>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    <LogoutHeaderButton />
                    <button className="relative p-2 rounded-lg hover:bg-slate-100 text-[#0c1929] hover:text-[#0c1929] transition-colors">
                        <Bell className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0c1929] to-[#24456e] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        A
                    </div>
                </div>
            </header>
            
            <div className="flex flex-1 overflow-hidden">
                <AdminSidebar />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
