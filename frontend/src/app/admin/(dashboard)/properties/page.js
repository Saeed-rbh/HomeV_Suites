"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Building, MoreHorizontal, BedDouble, Users, X, UploadCloud, MapPin, Clock, ShieldCheck, Image as ImageIcon } from 'lucide-react';

export default function PropertiesModule() {
    const router = useRouter();
    
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/properties')
            .then(res => res.json())
            .then(payload => {
                if (payload.success && payload.data) {
                    setProperties(payload.data.map(p => ({
                        id: p.id,
                        name: p.nickname || p.neighborhood || p.title || 'Uplisting Property',
                        address: p.address || 'Toronto, ON',
                        price: `$${p.pricePerNight || 250}/night`,
                        capacity: p.capacity || 4,
                        status: "Active"
                    })));
                }
            })
            .catch(console.error);
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [newProp, setNewProp] = useState({ name: "", address: "", price: "", capacity: "" });

    // Handles native form injection
    const handleCreateProperty = (e) => {
        e.preventDefault();
        if (!newProp.name || !newProp.address) return;

        const created = {
            id: `P-10${properties.length + 1}`,
            status: "Active",
            ...newProp
        };
        
        // Append sequentially and wipe state
        setProperties([...properties, created]);
        setShowModal(false);
        setNewProp({ name: "", address: "", price: "", capacity: "" });
    };

    return (
        <div className="h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#0c1929] tracking-tight">Property Listings</h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#0c1929]" />
                        <input type="text" placeholder="Search properties..." className="glass-input pl-9 pr-4 py-2 rounded-xl text-sm outline-none" />
                    </div>
                    {/* Intercept to fire modal strictly */}
                    <button onClick={() => setShowModal(true)} className="glass-button rounded-xl px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2 hover:bg-white/80 hover:shadow-lg active:bg-white/40 border border-white/60 shadow-md">
                        <Plus className="w-4 h-4" /> Add Property
                    </button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden flex-1 shadow-lg border border-white/60">
                <div className="overflow-x-auto h-full">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="border-b border-white/40 text-xs text-[#0c1929] uppercase tracking-wider bg-white/20 backdrop-blur-md">
                                <th className="px-6 py-5 font-bold">Property Name</th>
                                <th className="px-6 py-5 font-bold">Location</th>
                                <th className="px-6 py-5 font-bold">Rate</th>
                                <th className="px-6 py-5 font-bold">Specs</th>
                                <th className="px-6 py-5 font-bold">Status</th>
                                <th className="px-6 py-5 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20 text-sm text-[#0c1929] bg-slate-50/20 auto-rows-min">
                            {properties.map((prop, idx) => (
                                <tr key={idx} onClick={() => router.push('/admin/calendar')} className="hover:bg-white/40 transition-colors backdrop-blur-sm cursor-pointer group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex justify-center items-center text-blue-500 shadow-inner border border-white/50">
                                                <Building className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-[#0c1929] group-hover:text-blue-600 transition tracking-tight">{prop.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-[#0c1929] font-semibold">{prop.address}</td>
                                    <td className="px-6 py-5 font-bold text-[#0c1929]">{prop.price}</td>
                                    <td className="px-6 py-5 border-l-transparent">
                                        <span className="flex items-center gap-1.5 text-[#0c1929] text-xs font-bold bg-white/60 px-3 py-1.5 rounded-lg w-max shadow-sm border border-white/80"><Users className="w-3.5 h-3.5 text-[#0c1929]" /> {prop.capacity} guests</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold inline-block border shadow-sm tracking-wide ${prop.status === 'Active' ? 'bg-emerald-100/60 text-emerald-700 border-emerald-300' : 'bg-rose-100/60 text-rose-700 border-rose-300'}`}>
                                            {prop.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="text-[#0c1929] hover:text-[#0c1929] transition p-2 hover:bg-white/70 rounded-full focus:outline-none shadow-sm border border-transparent hover:border-slate-200">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Comprehensive Detail View Modal overlaid natively using conditional React logic */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
                    <div className="absolute inset-0 bg-[#0c1929]/60 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                    <div className="glass-panel-strong w-full h-full max-w-[1600px] p-8 md:p-12 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 bg-white/95 overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500 rounded-xl text-white shadow-md"><Building className="w-6 h-6" /></div>
                                <div>
                                  <h2 className="text-3xl font-bold text-[#0c1929] tracking-tight">New Property Registration</h2>
                                  <p className="text-[#0c1929] font-semibold mt-1">Enter comprehensive details to expand the portfolio.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-[#0c1929] hover:text-[#0c1929] transition bg-slate-100 hover:bg-slate-200 rounded-full p-3 shadow-inner"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <div className="flex-1 max-w-2xl mx-auto w-full pt-4">
                        
                        <form onSubmit={handleCreateProperty} className="space-y-10 pb-12">
                            {/* Core Identity */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#0c1929] border-b border-slate-200/50 pb-2 flex items-center gap-2"><Building className="w-4 h-4 text-blue-500" /> General Identity</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Listing Title / Public Name</label>
                                        <input required type="text" value={newProp.name} onChange={(e) => setNewProp({...newProp, name: e.target.value})} placeholder="e.g. Modern Loft Downtown" className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Property Architect Type</label>
                                        <select className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner bg-white/40 appearance-none">
                                            <option>Entire House</option>
                                            <option>Apartment / Condo</option>
                                            <option>Boutique Hotel Room</option>
                                            <option>Guesthouse / Villa</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Public Description Overview</label>
                                    <textarea rows="4" placeholder="Describe the atmosphere, neighborhood layout, and vibe..." className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner resize-none"></textarea>
                                </div>
                            </div>

                            {/* Location Matrix */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#0c1929] border-b border-slate-200/50 pb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> Geographic Coordinates</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Street Address</label>
                                        <input required type="text" value={newProp.address} onChange={(e) => setNewProp({...newProp, address: e.target.value})} placeholder="123 Main St" className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Apt / Suite / Unit</label>
                                        <input type="text" placeholder="Apt 4B" className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">City</label>
                                        <input type="text" placeholder="e.g. Miami" className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">State / Region</label>
                                        <input type="text" placeholder="e.g. FL" className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">ZIP / Postal</label>
                                        <input type="text" placeholder="e.g. 33101" className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner" />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Rooms Spaces */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#0c1929] border-b border-slate-200/50 pb-2 flex items-center gap-2"><BedDouble className="w-4 h-4 text-purple-500" /> Living Spaces & Room Mapping</h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Max Capacity</label>
                                        <input required type="number" min="1" max="50" value={newProp.capacity} onChange={(e) => setNewProp({...newProp, capacity: e.target.value})} placeholder="e.g. 6 guests" className="glass-input w-full px-4 py-3 rounded-xl text-base outline-none font-bold text-center text-[#0c1929] shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Bedrooms</label>
                                        <input required type="number" min="0" placeholder="e.g. 3" className="glass-input w-full px-4 py-3 rounded-xl text-base outline-none font-bold text-center text-[#0c1929] shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Beds</label>
                                        <input required type="number" min="1" placeholder="e.g. 4" className="glass-input w-full px-4 py-3 rounded-xl text-base outline-none font-bold text-center text-[#0c1929] shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Bathrooms</label>
                                        <input required type="number" min="0.5" step="0.5" placeholder="e.g. 2.5" className="glass-input w-full px-4 py-3 rounded-xl text-base outline-none font-bold text-center text-[#0c1929] shadow-inner" />
                                    </div>
                                </div>

                                {/* Mocking dynamic mapping */}
                                <div className="space-y-4">
                                    {['Master Bedroom', 'Guest Bedroom', 'Living Room', 'Exterior & Patio'].map((room, idx) => (
                                        <div key={idx} className="p-5 border border-slate-200/60 rounded-2xl bg-white/40 shadow-sm hover:shadow-md transition">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="font-bold text-[#0c1929] text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#0c1929]" /> {room} Configuration</span>
                                                {room.includes('Bedroom') && (
                                                    <select className="glass-input px-3 py-1.5 rounded-lg text-xs outline-none bg-white font-bold text-[#0c1929] border-slate-200">
                                                        <option>1 King Bed</option>
                                                        <option>2 Queen Beds</option>
                                                        <option>1 Queen, 1 Twin</option>
                                                    </select>
                                                )}
                                            </div>
                                            {/* Media Upload Mock */}
                                            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white p-6 flex flex-col items-center justify-center text-center hover:bg-blue-50 border-blue-100 hover:border-blue-400 transition cursor-pointer group">
                                                <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-blue-500 transition mb-2" />
                                                <span className="text-sm font-bold text-[#0c1929] group-hover:text-blue-700">Drag & Drop {room} Media</span>
                                                <span className="text-xs text-[#0c1929] mt-1">Supports JPG, PNG (Max 5MB)</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Core Amenities Sync */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#0c1929] border-b border-slate-200/50 pb-2">Feature Synchronizations</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {['High-Speed Wifi', 'Dedicated Workspace', 'Full Kitchen', 'Free Parking', 'Private Pool', 'Hot Tub', 'Air Conditioning', 'Central Heating', 'Washer & Dryer', 'Self Check-in', 'Pet Friendly', 'Balcony / Patio'].map(amenity => (
                                        <label key={amenity} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/50 bg-white/40 hover:bg-white/60 cursor-pointer shadow-sm transition group">
                                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                                            <span className="text-xs font-bold text-[#0c1929] group-hover:text-blue-600 transition tracking-tight">{amenity}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Operations & Rules */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#0c1929] border-b border-slate-200/50 pb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Operational & House Rules</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Check-in Window</label>
                                        <select className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium text-[#0c1929] bg-white/40 appearance-none">
                                            <option>After 3:00 PM</option>
                                            <option>After 4:00 PM</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Checkout Time</label>
                                        <select className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium text-[#0c1929] bg-white/40 appearance-none">
                                            <option>11:00 AM</option>
                                            <option>10:00 AM</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                    <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200/50 bg-white/40 shadow-sm cursor-pointer group hover:bg-white/60"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded"/><span className="text-xs font-bold text-[#0c1929]">Pets Allowed</span></label>
                                    <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200/50 bg-white/40 shadow-sm cursor-pointer group hover:bg-white/60"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded"/><span className="text-xs font-bold text-[#0c1929]">Events Allowed</span></label>
                                    <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200/50 bg-white/40 shadow-sm cursor-pointer group hover:bg-white/60"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded"/><span className="text-xs font-bold text-[#0c1929]">Smoking Allowed</span></label>
                                    <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200/50 bg-white/40 shadow-sm cursor-pointer group hover:bg-white/60"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded"/><span className="text-xs font-bold text-[#0c1929]">Quiet Hours</span></label>
                                </div>
                            </div>

                            {/* Financial Engine Rules */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#0c1929] border-b border-slate-200/50 pb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-rose-500" /> Financial Policies & Constraints</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Base Nightly Rate</label>
                                        <input required type="text" value={newProp.price} onChange={(e) => setNewProp({...newProp, price: e.target.value})} placeholder="$200" className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Cleaning Surcharge</label>
                                        <input type="text" placeholder="$85" className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2">Security Deposit Lock</label>
                                        <input type="text" placeholder="$300" className="glass-input w-full px-4 py-3 rounded-xl text-sm outline-none font-medium text-[#0c1929] shadow-inner" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-2 mt-4">Cancellation Policy Matrix</label>
                                    <select className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium text-[#0c1929] bg-white/40 appearance-none">
                                        <option>Strict (Non-refundable after 48h)</option>
                                        <option>Moderate (Full refund 5 days prior)</option>
                                        <option>Flexible (Full refund 24h prior)</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="glass-button w-full rounded-xl px-4 py-4 text-sm font-bold shadow-md transition-all mt-8 hover:bg-[#0c1929] active:bg-[#0c1929] bg-[#0c1929] text-white border-[#0c1929] uppercase tracking-widest hover:shadow-lg">
                                Synchronize Listing to OTAs
                            </button>
                        </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
