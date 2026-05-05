import { create } from 'zustand';

export const useAppStore = create((set) => ({
    allProperties: [],
    addProperty: (prop) => set((state) => ({ allProperties: [...state.allProperties, prop] })),
    
    // Abstracting out the mock bookings to exist dynamically globally
    bookings: [],
    setBookings: (bookings) => set({ bookings })
}));
