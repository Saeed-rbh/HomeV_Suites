import { Search } from "lucide-react";

export default function SearchBar() {
    return (
        <div className="glass-panel mx-auto flex max-w-5xl flex-col gap-3 rounded-[28px] p-3 md:flex-row md:items-center">
            <div className="glass-input flex-1 rounded-[22px] px-4 py-3 md:px-5">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0c1929]/70">Where</label>
                <input
                    type="text"
                    placeholder="Search destinations"
                    className="w-full bg-transparent text-sm font-medium outline-none"
                />
            </div>

            <div className="glass-input flex-1 rounded-[22px] px-4 py-3 md:px-5">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0c1929]/70">Check in - Check out</label>
                <input
                    type="text"
                    placeholder="Add dates"
                    className="w-full bg-transparent text-sm font-medium outline-none"
                />
            </div>

            <div className="glass-input flex-1 rounded-[22px] px-4 py-3 md:px-5">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0c1929]/70">Who</label>
                <input
                    type="text"
                    placeholder="Add guests"
                    className="w-full bg-transparent text-sm font-medium outline-none"
                />
            </div>

            <button className="glass-button flex items-center justify-center rounded-[22px] px-5 py-4 font-semibold md:min-w-32">
                <Search className="w-5 h-5" />
                <span className="ml-2 text-sm">Search</span>
            </button>
        </div>
    );
}
