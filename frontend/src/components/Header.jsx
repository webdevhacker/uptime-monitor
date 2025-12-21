import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Search, X, Bell, AlertTriangle } from 'lucide-react';

// 👇 ADD isAuthenticated to props (default false)
const Header = ({ children, searchQuery, setSearchQuery, showSearch = false, sites = [], isAuthenticated = false }) => {
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    const expiringSites = sites.filter(site =>
        site.sslInfo &&
        site.sslInfo.valid &&
        site.sslInfo.daysRemaining <= 7
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">

                {/* Left: Logo */}
                <div className={`items-center gap-3 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <LayoutDashboard size={20} />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">
                        UptimeGuard
                    </span>
                </div>

                {/* Right: Search + Notifications + Actions */}
                <div className={`flex items-center gap-2 sm:gap-4 flex-1 justify-end ${isMobileSearchOpen ? 'w-full' : ''}`}>

                    {/* Search Bar (Only shows if showSearch is true AND authenticated) */}
                    {showSearch && isAuthenticated && (
                        <>
                            {!isMobileSearchOpen && (
                                <button
                                    onClick={() => setIsMobileSearchOpen(true)}
                                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <Search size={20} />
                                </button>
                            )}

                            <div className={`${isMobileSearchOpen ? 'flex flex-1 w-full items-center gap-2' : 'hidden md:block relative w-full max-w-xs group'}`}>
                                <div className="relative w-full">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        autoFocus={isMobileSearchOpen}
                                        placeholder="Search sites..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                                    />
                                </div>
                                {isMobileSearchOpen && (
                                    <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* --- NOTIFICATION BELL (Only visible if Authenticated) --- */}
                    {!isMobileSearchOpen && isAuthenticated && (
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Bell size={20} />
                                {expiringSites.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                        {expiringSites.length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className={`
                                    bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50
                                    animate-in fade-in zoom-in-95 origin-top-right
                                    fixed left-4 right-4 top-16 mt-2
                                    md:absolute md:right-0 md:left-auto md:top-full md:w-80 md:mt-2
                                `}>
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto">
                                        {expiringSites.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 text-sm">
                                                <div className="mx-auto w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                                                    <Bell size={18} className="text-gray-400" />
                                                </div>
                                                <p>All certificates are healthy.</p>
                                            </div>
                                        ) : (
                                            expiringSites.map(site => (
                                                <div key={site._id} className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                    <div className="flex items-start gap-3">
                                                        <div className="bg-amber-100 text-amber-600 p-2 rounded-full shrink-0">
                                                            <AlertTriangle size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                                                                {site.url.replace(/^https?:\/\//, '')}
                                                            </p>
                                                            <p className="text-xs text-amber-600 font-semibold mt-0.5">
                                                                SSL Expires in {site.sslInfo.daysRemaining} days
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons (Logout) - Always show children if provided */}
                    <div className={`shrink-0 border-l border-gray-200 pl-4 ml-2 ${isMobileSearchOpen ? 'hidden md:block' : 'block'}`}>
                        {children}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;