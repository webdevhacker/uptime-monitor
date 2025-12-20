import React, { useState } from 'react';
import { LayoutDashboard, Search, X } from 'lucide-react';

const Header = ({ children, searchQuery, setSearchQuery, showSearch = false }) => {
    // State to toggle search bar visibility on mobile
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">

                {/* --- Left: Logo --- */}
                {/* Hide Logo on Mobile if Search is Open to make room */}
                <div className={`items-center gap-3 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <LayoutDashboard size={20} />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">
                        UptimeGuard
                    </span>
                </div>

                {/* --- Right: Search + Actions --- */}
                <div className={`flex items-center gap-2 sm:gap-4 flex-1 justify-end ${isMobileSearchOpen ? 'w-full' : ''}`}>

                    {showSearch && (
                        <>
                            {/* 1. Mobile Search Trigger Icon (Visible only on mobile when search is closed) */}
                            {!isMobileSearchOpen && (
                                <button
                                    onClick={() => setIsMobileSearchOpen(true)}
                                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <Search size={20} />
                                </button>
                            )}

                            {/* 2. Search Input Container */}
                            {/* Mobile: Flex & Full Width (when open) | Desktop: Block & Fixed Width */}
                            <div className={`
                                ${isMobileSearchOpen ? 'flex flex-1 w-full items-center gap-2' : 'hidden md:block relative w-full max-w-xs group'}
                            `}>
                                <div className="relative w-full">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        autoFocus={isMobileSearchOpen} // Auto-focus when opening on mobile
                                        placeholder="Search sites..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                                    />
                                </div>

                                {/* Close Button (Only for Mobile Search Mode) */}
                                {isMobileSearchOpen && (
                                    <button
                                        onClick={() => {
                                            setIsMobileSearchOpen(false);
                                            setSearchQuery(''); // Optional: Clear search on close
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* --- Action Buttons (Logout) --- */}
                    {/* Hide on Mobile if Search is Open */}
                    <div className={`shrink-0 border-l border-gray-200 pl-4 ml-2 ${isMobileSearchOpen ? 'hidden md:block' : 'block'}`}>
                        {children}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;