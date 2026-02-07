import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBasket, ScrollText, CheckSquare, Calculator, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTabletSidebarCollapsed, setIsTabletSidebarCollapsed] = useState(false);

    const navItems = [
        { href: '/', label: 'Painel', icon: LayoutDashboard },
        { href: '/essence', label: 'Calculadora', icon: Calculator },
        { href: '/ingredients', label: 'Ingredientes', icon: ShoppingBasket },
        { href: '/recipes', label: 'Receitas', icon: ScrollText },
        { href: '/orders', label: 'Produção', icon: CheckSquare },
    ];

    const handleNavClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-50 font-sans">
            {/* Mobile Header (visible only on phones) */}
            <div className="lg:hidden md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Kiros Lab
                </h1>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-slate-400 hover:text-white p-2"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-all duration-300",
                // Desktop (lg+): always visible, full width
                "hidden lg:flex lg:w-64 lg:relative",
                // Tablet (md-lg): collapsible sidebar
                "md:flex md:relative",
                isTabletSidebarCollapsed ? "md:w-16 lg:w-64" : "md:w-64",
                // Mobile: overlay when open
                isMobileMenuOpen && "fixed inset-y-0 left-0 w-64 flex md:hidden"
            )}>
                {/* Header */}
                <div className="p-6 border-b border-slate-800 hidden md:flex items-center justify-between">
                    <h1 className={cn(
                        "text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent transition-opacity",
                        isTabletSidebarCollapsed ? "lg:opacity-100 md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100"
                    )}>
                        Kiros Lab
                    </h1>
                    {/* Tablet collapse toggle (visible only on md-lg) */}
                    <button
                        onClick={() => setIsTabletSidebarCollapsed(!isTabletSidebarCollapsed)}
                        className="hidden md:block lg:hidden text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800"
                    >
                        {isTabletSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Mobile: add top padding to account for header */}
                <nav className={cn(
                    "flex-1 p-4 space-y-2 pt-20 md:pt-4",
                    isTabletSidebarCollapsed && "md:px-2 lg:px-4"
                )}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={handleNavClick}
                                title={isTabletSidebarCollapsed ? item.label : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    isTabletSidebarCollapsed && "md:px-3 md:justify-center lg:px-4 lg:justify-start",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                                )}
                            >
                                <Icon size={20} />
                                <span className={cn(
                                    "font-medium transition-opacity",
                                    isTabletSidebarCollapsed ? "lg:opacity-100 md:hidden lg:inline" : ""
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={cn(
                    "p-4 border-t border-slate-800 text-xs text-slate-500 text-center",
                    isTabletSidebarCollapsed && "md:px-1 lg:px-4"
                )}>
                    <span className={cn(
                        isTabletSidebarCollapsed ? "lg:inline md:hidden" : ""
                    )}>
                        Modo Offline Ativo
                    </span>
                    {isTabletSidebarCollapsed && (
                        <span className="hidden md:inline lg:hidden">●</span>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-950 p-4 md:p-6 lg:p-8 pt-20 md:pt-6 lg:pt-8">
                <div className="max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
