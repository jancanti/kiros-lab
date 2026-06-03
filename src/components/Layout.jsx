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
    Droplets,
    FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect } from 'react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Painel', path: '/' },
    { icon: Droplets, label: 'Calculadora', path: '/calc' },
    { icon: Beaker, label: 'Ingredientes', path: '/ingredientes' },
    { icon: BookOpen, label: 'Produtos', path: '/produtos' },
    { icon: FileText, label: 'Orçamentos', path: '/orcamentos' },
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
            <div className="lg:hidden md:hidden fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center border border-brand/20">
                        <Droplets className="text-brand" size={16} />
                    </div>
                    <span className="text-base font-serif font-black tracking-widest uppercase">Kiros</span>
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
                "fixed inset-y-0 left-0 z-40 w-64 bg-slate-50/85 dark:bg-card/90 backdrop-blur-md border-r border-border transition-transform lg:translate-x-0 md:translate-x-0 pb-20",
                !isMobileMenuOpen && "-translate-x-full"
            )}>
                <div className="p-6">
                    <Link to="/" className="flex items-center gap-3 group mb-8">
                        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20 group-hover:bg-brand/20 transition-all">
                            <Droplets className="text-brand shrink-0" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-serif font-black tracking-widest leading-none text-foreground group-hover:text-brand transition-colors">KIROS</h1>
                            <p className="text-[9px] text-brand font-sans font-bold uppercase tracking-[0.1em] mt-1 leading-none">Aromas para Casa</p>
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
                                            <div className="ml-auto w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="pt-8 mt-8 border-t border-border">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background/50 dark:bg-muted/40 border border-border/50 hover:border-brand/35 transition-all text-muted-foreground hover:text-foreground group"
                        >
                            <span className="font-medium text-xs tracking-wider uppercase">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                            <div className="w-8 h-8 rounded-lg bg-muted dark:bg-background/80 flex items-center justify-center group-hover:bg-brand/10 group-hover:text-brand transition-colors shadow-sm">
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </div>
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
