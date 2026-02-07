import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Beaker,
    BookOpen,
    ClipboardList,
    Menu,
    X,
    Cloud,
    Droplets
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

const menuItems = [
    { icon: LayoutDashboard, label: 'Painel', path: '/' },
    { icon: Droplets, label: 'Calculadora', path: '/essence' },
    { icon: Beaker, label: 'Ingredientes', path: '/ingredients' },
    { icon: BookOpen, label: 'Receitas', path: '/recipes' },
    { icon: ClipboardList, label: 'Produção', path: '/orders' },
];

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isCloudEnabled = !!supabase;

    return (
        <div className="flex min-h-screen h-[100dvh] bg-slate-950 text-slate-50 font-sans overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                <Link to="/" className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                    Kiros Lab
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform lg:translate-x-0 md:translate-x-0 pb-20",
                !isMobileMenuOpen && "-translate-x-full"
            )}>
                <div className="p-6">
                    <Link to="/" className="block text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8 hover:opacity-80 transition-opacity">
                        Kiros Lab
                    </Link>
                    <nav className="space-y-2">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
                                )}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Cloud Status Indicator */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50 bg-slate-900/50">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                        isCloudEnabled ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                        <Cloud size={14} className={isCloudEnabled ? "text-green-500" : "text-amber-500"} />
                        <span>{isCloudEnabled ? 'Nuvem Conectada' : 'Modo Offline'}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 md:ml-64 p-4 md:p-8 mt-16 md:mt-0 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
