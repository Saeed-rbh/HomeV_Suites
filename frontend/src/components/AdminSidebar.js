"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, DollarSign, CalendarDays,
    MessageSquare, CheckSquare, Building2, LogOut,
    CalendarRange, ShieldCheck, BookOpen, ChevronRight, Settings
} from 'lucide-react';

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/messaging/unread-count', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await res.json();
            if (data.success) setUnreadCount(data.count);
        } catch (e) { }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000);
        return () => clearInterval(interval);
    }, []);

    const sections = [
        {
            label: "Operations",
            items: [
                { name: "Overview", icon: LayoutDashboard, path: "/admin" },
                { name: "Multi-Calendar", icon: CalendarRange, path: "/admin/calendar" },
                { name: "Inbox", icon: MessageSquare, path: "/admin/inbox", badge: unreadCount },
            ]
        },
        {
            label: "Core Management",
            items: [
                { name: 'Reservations', icon: BookOpen, path: '/admin/reservations' },
                { name: 'Properties', icon: Building2, path: '/admin/properties' },
                { name: 'Financials', icon: DollarSign, path: '/admin/financials' },
                { name: 'Guests', icon: Users, path: '/admin/guests' },
                { name: 'Admin Team', icon: ShieldCheck, path: '/admin/team' },
                { name: 'Policies', icon: Settings, path: '/admin/cancellation-policies' },
            ]
        }
    ];

    const handleLogout = () => {
        document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('adminToken');
        router.push('/login');
    };

    const renderLink = (item) => {
        const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
        const Icon = item.icon;
        return (
            <Link
                key={item.name}
                href={item.path}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                        ? 'bg-[#0c1929] text-white shadow-md shadow-[#0c1929]/30'
                        : 'text-[#0c1929] hover:bg-slate-100 hover:text-[#0c1929]'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#0c1929] group-hover:text-[#0c1929]'}`} />
                    <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {item.badge}
                        </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/60" />}
                </div>
            </Link>
        );
    };

    return (
        <div className="w-60 bg-white border-r border-slate-100 hidden md:flex flex-col overflow-y-auto shrink-0">
            <div className="flex-1 p-4 pt-6 space-y-6">
                {sections.map(section => (
                    <div key={section.label}>
                        <p className="text-[10px] font-bold text-[#0c1929] uppercase tracking-widest mb-2 px-3">
                            {section.label}
                        </p>
                        <nav className="space-y-0.5">
                            {section.items.map(renderLink)}
                        </nav>
                    </div>
                ))}
            </div>

            {/* Bottom Profile / Logout */}
            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#0c1929] hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                >
                    <LogOut className="w-4 h-4 text-[#0c1929] group-hover:text-red-500" />
                    Logout
                </button>
            </div>
        </div>
    );
}
