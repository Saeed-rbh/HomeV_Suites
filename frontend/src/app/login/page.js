"use client";
import UnifiedAuthForm from "@/components/UnifiedAuthForm";
import { ShieldCheck } from "lucide-react";

export default function UnifiedLogin() {
    return (
        <UnifiedAuthForm 
            title="Login / Sign Up" 
            subtitle="Welcome to HomEV Suites" 
            icon={<ShieldCheck className="w-8 h-8" />}
        />
    );
}
