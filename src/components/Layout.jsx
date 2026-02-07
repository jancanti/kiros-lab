import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Beaker,
    BookOpen,
    ClipboardList,
    Menu,
    X,
    Sun,
    Moon,
    Monitor,
    Droplets
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Painel', path: '/' },
    { icon: Droplets, label: 'Calculadora', path: '/calc' },
    { icon: Beaker, label: 'Ingredientes', path: '/ingredientes' },
    { icon: BookOpen, label: 'Produtos', path: '/produtos' },
    { icon: ClipboardList, label: 'Produção', path: '/prod' },
];

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('kiros-theme');
            if (saved) return saved;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('kiros-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <div className="flex min-h-screen h-[100dvh] bg-background text-foreground font-sans overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden md:hidden fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border p-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center border border-brand/20">
                        <Beaker className="text-brand" size={18} />
                    </div>
                    <span className="text-lg font-black tracking-tighter uppercase">Kiros Lab</span>
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-muted-foreground hover:text-foreground"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border transition-transform lg:translate-x-0 md:translate-x-0 pb-20",
                !isMobileMenuOpen && "-translate-x-full"
            )}>
                <div className="p-6">
                    <Link to="/" className="flex items-center gap-3 group mb-8">
                        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20 group-hover:bg-brand/20 transition-all">
                            <Beaker className="text-brand" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter leading-none">KIROS LAB</h1>
                            <p className="text-[10px] text-brand font-bold uppercase tracking-widest mt-1">Scent Studio</p>
                        </div>
                    </Link>
                    <nav className="space-y-2">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                                    isActive
                                        ? "bg-brand/10 text-foreground border border-brand/20"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon size={20} className={cn("transition-colors", isActive ? "text-brand" : "")} />
                                        <span className="font-medium">{item.label}</span>
                                        {isActive && (
                                            <div className="ml-auto w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_10px_rgba(190,253,94,0.5)]" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="pt-8 mt-8 border-t border-border">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </div>
                            <span className="font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                        </button>
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
