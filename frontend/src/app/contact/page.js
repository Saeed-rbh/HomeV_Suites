"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Link as LinkIcon, Send, Globe } from "lucide-react";
import Link from "next/link";

// Helper to render an icon for social platforms
const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
        case "whatsapp": return <MessageCircle className="w-5 h-5" />;
        default: return <Globe className="w-5 h-5" />;
    }
};

export default function ContactPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success) setSettings(data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSending(true);
        // Simple mailto fallback since no API endpoint for generic contact form yet
        const targetEmail = settings?.contact_email || "support@homev.ca";
        window.location.href = `mailto:${targetEmail}?subject=Contact from ${name}&body=${encodeURIComponent(message)}%0D%0A%0D%0AReply to: ${email}`;
        setTimeout(() => {
            setSending(false);
            setSent(true);
            setName("");
            setEmail("");
            setMessage("");
            setTimeout(() => setSent(false), 5000);
        }, 1000);
    };

    if (loading) {
        return <div className="min-h-screen bg-[#f3f5f8] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-[#0c1929] border-t-transparent animate-spin" />
        </div>;
    }

    const emailAddress = settings?.contact_email || "support@homev.ca";
    const phoneNumber = settings?.contact_phone || "+1 (888) 123-4567";
    const address = settings?.contact_address || "Toronto, ON, Canada";
    const socialLinks = Array.isArray(settings?.social_links) ? settings.social_links : [];

    return (
        <div className="min-h-screen bg-[#f3f5f8] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-[#0c1929]">Contact Us</h1>
                    <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                        Have a question about a property, a booking, or our services? We'd love to hear from you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Contact Info Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-[#0c1929] mb-6">Get in Touch</h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-[#0c1929]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Email</p>
                                        <a href={`mailto:${emailAddress}`} className="text-[#0c1929] hover:underline font-medium">{emailAddress}</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                        <Phone className="w-5 h-5 text-[#0c1929]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Phone</p>
                                        <a href={`tel:${phoneNumber}`} className="text-[#0c1929] hover:underline font-medium">{phoneNumber}</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-[#0c1929]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Location</p>
                                        <p className="text-[#0c1929] font-medium">{address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {socialLinks.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-slate-100">
                                <h3 className="text-lg font-semibold text-[#0c1929] mb-4">Follow Us</h3>
                                <div className="flex flex-wrap gap-3">
                                    {socialLinks.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-[#0c1929] transition-colors border border-slate-200 font-medium text-sm"
                                        >
                                            {getSocialIcon(link.platform)}
                                            {link.label || link.platform}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-semibold text-[#0c1929] mb-6">Send a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1929] transition-all"
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1929] transition-all"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Message</label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1929] transition-all resize-none"
                                    placeholder="How can we help?"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sending || sent}
                                className="w-full py-4 rounded-[20px] bg-[#0c1929] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#152b47] transition-all disabled:opacity-70 mt-2"
                            >
                                {sent ? "Opened Email Client!" : sending ? "Sending..." : <><Send className="w-4 h-4" /> Send Message</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
