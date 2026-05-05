"use client";

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutHeaderButton() {
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('adminToken');
        router.push('/login');
    };

    return (
        <button 
            onClick={handleLogout}
            className="flex items-center gap-2 relative p-2 rounded-lg hover:bg-red-50 text-[#0c1929] hover:text-red-600 transition-colors font-medium text-sm"
            title="Logout"
        >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
        </button>
    );
}
