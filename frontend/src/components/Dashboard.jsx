import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SiteCard from './SiteCard';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Activity, Server, Filter,
    AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight, Search, LogOut, LayoutDashboard, X
} from 'lucide-react';

const Dashboard = () => {
    const [sites, setSites] = useState([]);
    const [newUrl, setNewUrl] = useState('');

    // 1️⃣ EXISTING: Loading for "Add Button"
    const [loading, setLoading] = useState(false);

    // 2️⃣ NEW: Loading for "Initial Page Load"
    const [isFetching, setIsFetching] = useState(true);

    const [filter, setFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const [notification, setNotification] = useState({
        show: false,
        type: 'info',
        title: '',
        message: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const navigate = useNavigate();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchSites = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/monitor`, getAuthHeaders());
            // Sort by ID (Creation Time) to prevent UI shuffling
            const sortedSites = res.data.sort((a, b) => b._id.localeCompare(a._id));
            setSites(sortedSites);
        } catch (error) {
            console.error("Error fetching sites:", error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                window.location.reload();
            }
        } finally {
            // 3️⃣ TURN OFF LOADING: Once first fetch is done (success or fail)
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchSites();
        const interval = setInterval(fetchSites, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery]);

    const closeNotification = () => {
        setNotification({ ...notification, show: false });
    };

    const showToast = (type, title, message) => {
        setNotification({ show: true, type, title, message });
        if (type === 'success') {
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
        }
    };

    const handleUrlChange = (e) => {
        const val = e.target.value.replace(/^https?:\/\//, '').replace(/\s/g, '').toLowerCase();
        setNewUrl(val);
    };

    const addSite = async (e) => {
        e.preventDefault();
        const cleanUrl = newUrl.trim();
        if (!cleanUrl) return;
        setLoading(true);

        try {
            const fullUrl = `https://${cleanUrl.toLowerCase()}`;
            await axios.post(`${API_URL}/api/monitor/add`, { url: fullUrl }, getAuthHeaders());

            setNewUrl('');
            fetchSites();
            showToast('success', 'Monitor Added', (
                <span>
                    Successfully started tracking <strong className="font-bold text-gray-900">{fullUrl}</strong>.
                </span>
            ));

        } catch (error) {
            if (error.response && error.response.status === 409) {
                showToast('warning', 'Duplicate Entry', (
                    <span>
                        The website <strong className="font-bold text-gray-900">{newUrl.toLowerCase()}</strong> is already in your dashboard.
                    </span>
                ));
            } else {
                showToast('error', 'Operation Failed', 'Could not add the site. Please try again.');
            }
        }
        setLoading(false);
    };

    const deleteSite = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/monitor/${id}`, getAuthHeaders());
            setSites(prevSites => prevSites.filter(site => site._id !== id));
            showToast('success', 'Deleted', 'Site removed successfully.');
        } catch (error) {
            showToast('error', 'Error', 'Failed to delete site.');
            fetchSites();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload();
    };

    const getFilteredSites = () => {
        return sites.filter(site => {
            if (searchQuery && !site.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filter === 'ALL') return true;
            if (filter === 'UP') return site.status === 'UP';
            if (filter === 'DOWN') return site.status === 'DOWN';
            if (filter === 'SSL_EXP') return site.sslInfo && (!site.sslInfo.valid || site.sslInfo.daysRemaining <= 30);
            return true;
        });
    };

    const filteredSites = getFilteredSites();
    const upCount = sites.filter(s => s.status === 'UP').length;
    const downCount = sites.filter(s => s.status === 'DOWN').length;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSites = filteredSites.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const FilterButton = ({ value, label, icon: Icon, colorClass }) => (
        <button
            onClick={() => setFilter(value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === value
                ? `bg-gray-900 text-white shadow-md transform scale-105`
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
        >
            {Icon && <Icon size={16} className={filter === value ? 'text-white' : colorClass} />}
            {label}
        </button>
    );

    // 4️⃣ NEW: Component for Loading Skeleton
    const SkeletonCard = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse h-48 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

            <Header showSearch={true} searchQuery={searchQuery} setSearchQuery={setSearchQuery} sites={sites} isAuthenticated={true}>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-md hover:bg-red-50">
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </Header>

            {/* Hero */}
            <div className="bg-white border-b border-gray-200 pb-12 pt-10">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Monitor Your Digital Assets</h1>
                    <p className="text-gray-500 mb-8 text-lg">Real-time tracking for SSL and Server Uptime.</p>

                    <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-10 text-sm font-medium">
                        <div className="flex items-center gap-2 text-gray-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> {upCount} Online
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> {downCount} Offline
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> {sites.length} Total
                        </div>
                    </div>

                    {/* Add Site Form */}
                    <form onSubmit={addSite} className="relative max-w-lg mx-auto">
                        <div className="flex items-center w-full rounded-full border border-gray-300 shadow-sm bg-white focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all overflow-hidden">
                            <div className="flex items-center pl-6 pr-1 bg-gray-50 h-full py-4 border-r border-gray-100">
                                <span className="text-gray-500 font-semibold select-none">https://</span>
                            </div>
                            <input value={newUrl} onChange={handleUrlChange} placeholder="example.com" className="flex-1 py-4 px-3 outline-none text-base text-gray-700 placeholder-gray-400 min-w-0" />
                            <button type="submit" disabled={loading} className="mr-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-full font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-md">
                                {loading ? <Activity className="animate-spin" size={18} /> : <Plus size={18} />}
                                <span className="hidden sm:inline">{loading ? 'Adding...' : 'Monitor'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 shrink-0">
                        <Server size={18} className="text-gray-400" /> Monitored Endpoints
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 justify-center">
                        <FilterButton value="ALL" label="All" icon={LayoutDashboard} colorClass="text-gray-500" />
                        <FilterButton value="UP" label="Online" icon={CheckCircle} colorClass="text-green-500" />
                        <FilterButton value="DOWN" label="Offline" icon={XCircle} colorClass="text-red-500" />
                        <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
                        <FilterButton value="SSL_EXP" label="SSL" icon={AlertTriangle} colorClass="text-amber-500" />
                    </div>
                </div>

                {/* 5️⃣ CONDITIONAL RENDERING: Show Skeletons OR Real Data */}
                {isFetching ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Show 6 fake cards while loading */}
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : currentSites.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {currentSites.map((site) => (
                                <SiteCard key={site._id} site={site} onDelete={deleteSite} />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    <ChevronLeft size={20} className="text-gray-600" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button key={i + 1} onClick={() => paginate(i + 1)} className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                                        {i + 1}
                                    </button>
                                ))}
                                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    <ChevronRight size={20} className="text-gray-600" />
                                </button>
                            </div>
                        )}
                        <div className="text-center text-xs text-gray-400 mt-4">
                            Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredSites.length)} of {filteredSites.length} sites
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                            <Search size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No matching sites</h3>
                        <p className="text-gray-500 mt-1">
                            {searchQuery ? `No sites match "${searchQuery}"` : "Try adjusting your filters."}
                        </p>
                        {(filter !== 'ALL' || searchQuery) && (
                            <button onClick={() => { setFilter('ALL'); setSearchQuery(''); }} className="mt-4 text-blue-600 font-medium hover:underline">
                                Clear Search & Filters
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* Notification Modal */}
            {notification.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative transform transition-all scale-100 zoom-in-95">
                        <button onClick={closeNotification} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 
                                ${notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                    notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                        'bg-amber-100 text-amber-600'}`}>
                                {notification.type === 'success' && <CheckCircle size={24} />}
                                {notification.type === 'error' && <XCircle size={24} />}
                                {notification.type === 'warning' && <AlertTriangle size={24} />}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{notification.title}</h3>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">{notification.message}</p>
                            <button onClick={closeNotification} className={`w-full px-4 py-2.5 rounded-lg font-medium text-white shadow-sm transition-colors
                                    ${notification.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' :
                                    notification.type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                                        'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}>
                                {notification.type === 'success' ? 'Okay!' : 'Okay, got it'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;