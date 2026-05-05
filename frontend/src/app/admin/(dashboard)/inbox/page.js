"use client";
import { useState, useEffect, useRef } from 'react';
import { Search, Send, CheckCircle2, Filter, MessageSquare, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InboxModule() {
    const router = useRouter();

    const [threads, setThreads] = useState([]);
    const [allProperties, setAllProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState("All Listings");
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    const [activeThreadId, setActiveThreadId] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef(null);

    const fetchThreads = async () => {
        try {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/messaging/threads', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                const fetchedThreads = data.data.map(t => {
                    const guestName = t.guest ? `${t.guest.firstName || ''} ${t.guest.lastName || ''}`.trim() || 'Guest' : 'Guest';
                    const propTitle = t.property ? t.property.title : 'Unknown Property';
                    const msgs = t.messages || [];
                    const lastMsgTime = msgs.length > 0 ? new Date(msgs[msgs.length - 1].createdAt) : new Date(t.updatedAt);

                    const res = t.reservation;
                    const now = new Date();
                    const isArchived = !res || new Date(res.endDate) < now || res.status === 'CANCELLED';

                    return {
                        id: t.id,
                        guest: guestName,
                        property: propTitle,
                        status: isArchived ? 'Archived' : 'Active',
                        statusColor: isArchived ? 'text-[#0c1929]' : 'text-blue-500',
                        time: lastMsgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        lastMsgDate: lastMsgTime,
                        unread: t.unreadCount > 0,
                        unreadCount: t.unreadCount,
                        isArchived,
                        messages: msgs.map(m => ({
                            sender: m.senderRole === 'GUEST' ? 'Guest' : 'Host',
                            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            text: m.content
                        }))
                    };
                }).sort((a, b) => b.lastMsgDate - a.lastMsgDate); // sort descending by last msg

                setThreads(fetchedThreads);

                // extract unique properties
                const props = Array.from(new Set(fetchedThreads.map(t => t.property)));
                setAllProperties(props);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchThreads();
        const interval = setInterval(fetchThreads, 10000); // Polling every 10s for new messages
        return () => clearInterval(interval);
    }, []);

    // Apply Filter intelligently tracking both Property and Read Status
    const filteredThreads = threads.filter(t =>
        (selectedProperty === "All Listings" || t.property === selectedProperty) &&
        (!showUnreadOnly || t.unread) &&
        (t.isArchived === showArchived)
    );

    const activeThread = threads.find(t => t.id === activeThreadId) || filteredThreads[0];

    const markAsRead = async (id) => {
        // UI optimistic
        setThreads(threads.map(t => t.id === id ? { ...t, unread: false, unreadCount: 0 } : t));
        setActiveThreadId(id);

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/messaging/threads/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
        } catch (e) { console.error(e); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeThread) return;

        const text = newMessage;
        setNewMessage("");

        // Optimistically update UI
        setThreads(threads.map(t => t.id === activeThread.id ? {
            ...t,
            messages: [...t.messages, { sender: "Host", time: "Just now", text: text }]
        } : t));

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/messaging/threads/${activeThread.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ senderRole: 'ADMIN', content: text })
            });
            // Background sync
            fetchThreads();
        } catch (e) { console.error(e); }
    };

    // Auto-scroll mechanics on new message arrivals natively
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeThread?.messages]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#0c1929] tracking-tight">Inbox Threads</h1>

                <div className="flex gap-4 items-center">
                    <div className="relative flex items-center">
                        <Filter className="absolute left-3 w-4 h-4 text-[#0c1929]" />
                        <select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                            className="w-full bg-white border border-slate-200 shadow-sm pl-9 pr-8 py-2 rounded-xl text-sm text-[#0c1929] outline-none cursor-pointer font-medium min-w-[240px] focus:ring-2 focus:ring-[#0c1929]"
                        >
                            <option value="All Listings">All Listings</option>
                            {allProperties.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden flex min-h-[500px]">
                {/* Threads Sidebar */}
                <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
                    <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#0c1929]" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                className="w-full bg-white border border-slate-300 placeholder:text-[#0c1929] pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1929] shadow-sm transition-all"
                            />
                        </div>

                        <div className="flex justify-between items-center px-1">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition flex items-center gap-1.5 uppercase tracking-wider ${showArchived
                                            ? 'bg-[#0c1929] text-white shadow-md border border-[#0c1929]'
                                            : 'bg-white text-[#0c1929] hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    Archived
                                </button>
                                <button
                                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition flex items-center gap-1.5 uppercase tracking-wider ${showUnreadOnly
                                            ? 'bg-blue-500 text-white shadow-md border border-blue-600'
                                            : 'bg-white text-[#0c1929] hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    <Mail className="w-3 h-3" />
                                    Unread
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredThreads.map((t) => {
                            const isSelected = activeThread?.id === t.id;
                            const lastMsg = t.messages[t.messages.length - 1];

                            return (
                                <div
                                    key={t.id}
                                    onClick={() => markAsRead(t.id)}
                                    className={`p-4 border-b border-slate-100 cursor-pointer transition flex flex-col justify-start ${isSelected ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' :
                                            t.unread ? 'bg-blue-50/50 border-l-4 border-l-blue-400' :
                                                'hover:bg-slate-100/50 border-l-4 border-l-transparent'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm ${t.unread ? 'font-bold text-[#0c1929]' : 'font-semibold text-[#0c1929]'}`}>{t.guest}</h4>
                                            {t.unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                    {t.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-[#0c1929] font-bold">{t.time}</span>
                                    </div>
                                    <p className="text-xs text-blue-600 font-bold mb-2 truncate">{t.property}</p>
                                    {lastMsg ? (
                                        <p className={`text-xs truncate ${t.unread ? 'font-semibold text-[#0c1929]' : 'text-[#0c1929]'}`}>
                                            {lastMsg.sender === 'Host' ? 'You: ' : ''}{lastMsg.text}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-[#0c1929] italic font-medium">No messages yet.</p>
                                    )}
                                </div>
                            );
                        })}
                        {filteredThreads.length === 0 && (
                            <div className="p-8 text-center text-[#0c1929] text-sm font-medium">
                                No matching messages.
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Thread Window */}
                {activeThread ? (
                    <div className="flex-1 flex flex-col bg-white">
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="font-bold text-[#0c1929]">{activeThread.guest}</h3>
                                <p className="text-xs text-[#0c1929] font-bold flex items-center gap-1 mt-1">
                                    <CheckCircle2 className={`w-3 h-3 ${activeThread.statusColor}`} />
                                    {activeThread.status} • {activeThread.property}
                                </p>
                            </div>
                            <button onClick={() => router.push('/admin/reservations')} className="px-4 py-1.5 text-xs font-bold shadow-sm hover:shadow transition bg-white text-[#0c1929] border border-slate-200 rounded-[12px]">
                                View Reservation
                            </button>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth bg-slate-50/20" ref={scrollRef}>
                            <div className="flex justify-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0c1929] bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                                    Conversation History
                                </span>
                            </div>

                            {activeThread.messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col gap-1 ${msg.sender === 'Host' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 rounded-2xl max-w-[80%] border shadow-sm ${msg.sender === 'Host'
                                            ? 'bg-blue-500 text-white rounded-tr-sm border-blue-600'
                                            : 'bg-white text-[#0c1929] rounded-tl-sm border-slate-100'
                                        }`}>
                                        <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                    </div>
                                    <span className="text-[11px] text-[#0c1929] font-bold mx-1 mt-0.5">{msg.time}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-white">
                            <form onSubmit={handleSendMessage} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a reply…"
                                    className="w-full pr-12 pl-4 py-3 rounded-2xl border border-slate-300 placeholder:text-[#0c1929] text-[#0c1929] bg-white outline-none focus:ring-2 focus:ring-[#0c1929] transition shadow-sm"
                                />
                                <button type="submit" className="absolute right-2 p-1.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition shadow-sm hover:shadow-md">
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#0c1929] bg-slate-50">
                        <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
                        <p className="font-semibold">Select a thread to view messages</p>
                    </div>
                )}
            </div>
        </div>
    );
}
