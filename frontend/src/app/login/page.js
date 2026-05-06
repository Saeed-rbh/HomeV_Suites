import UnifiedAuthForm from "@/components/UnifiedAuthForm";
import { ShieldCheck } from "lucide-react";

export const metadata = {
    title: "Sign In",
    description: "Sign in or create a HomEV account to manage your reservations and access exclusive member perks.",
    robots: { index: false, follow: false },
};

export default function UnifiedLogin() {
    return (
        <UnifiedAuthForm 
            title="Login / Sign Up" 
            subtitle="Welcome to HomEV Suites" 
            icon={<ShieldCheck className="w-8 h-8" />}
        />
    );
}
