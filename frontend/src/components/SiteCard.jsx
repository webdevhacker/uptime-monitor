import React, { useState } from 'react';
import { ShieldCheck, Server, Activity, Trash2, CheckCircle, XCircle, Clock, Cloud, AlertTriangle } from 'lucide-react';

const SiteCard = ({ site, onDelete }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // --- 1. DETERMINE STATUS LOGIC ---
    const isDown = site.status === 'DOWN';
    const isPending = site.status === 'PENDING' || !site.status;
    const isSSLWarning = !isDown && !isPending && site.sslInfo && (
        !site.sslInfo.valid || site.sslInfo.daysRemaining <= 30
    );

    const isHealthy = !isDown && !isPending && !isSSLWarning;

    // --- 2. DYNAMIC STYLING CONFIGURATION ---
    let statusConfig = {
        // Default (Pending)
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        topBarColor: 'bg-blue-400',
        icon: <Clock size={14} />,
        label: 'PENDING'
    };

    if (isDown) {
        statusConfig = {
            textColor: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            topBarColor: 'bg-red-500',
            icon: <XCircle size={14} />,
            label: 'OFFLINE'
        };
    } else if (isSSLWarning) {
        statusConfig = {
            textColor: 'text-amber-700',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-300',
            topBarColor: 'bg-amber-500',
            icon: <AlertTriangle size={14} />,
            label: 'SSL WARNING'
        };
    } else if (isHealthy) {
        statusConfig = {
            textColor: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            topBarColor: 'bg-green-500',
            icon: <CheckCircle size={14} />,
            label: 'ONLINE'
        };
    }

    const handleDeleteClick = () => setShowDeleteModal(true);
    const confirmDelete = () => {
        onDelete(site._id);
        setShowDeleteModal(false);
    };

    return (
        <>
            {/* --- MAIN CARD --- */}
            <div className={`relative group h-full bg-white rounded-xl border ${statusConfig.borderColor} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}>

                {/* Top Colored Line */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${statusConfig.topBarColor}`} />

                <div className="p-6 flex-1 flex flex-col">

                    {/* Header: Status + URL + Delete */}
                    <div className="flex justify-between items-start mb-5">
                        <div className="flex-1 min-w-0 pr-4">

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 mb-2">
                                {/* FIX APPLIED HERE:
                                    1. Removed 'w-28' (fixed width)
                                    2. Added 'min-w-28' (minimum width to keep small badges consistent)
                                    3. Added 'w-fit' (allows growth for long text)
                                    4. Added 'whitespace-nowrap' (forces single line)
                                */}
                                <div className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full min-w-28 w-fit whitespace-nowrap ${statusConfig.textColor} ${statusConfig.bgColor}`}>
                                    {statusConfig.icon}
                                    <span className="text-[11px] font-bold uppercase tracking-wider">
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </div>

                            {/* URL */}
                            <h3 className="text-lg font-bold text-gray-900 truncate h-7" title={site.url}>
                                {site.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </h3>
                            <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-500 transition-colors truncate block h-5">
                                {site.url}
                            </a>
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={handleDeleteClick}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Stop Monitoring"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {/* Metrics Grid */}
                    <div className="space-y-3 mt-auto">

                        {/* Response Time */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-transparent">
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                <Activity size={16} className="text-blue-500" />
                                <span>Latency</span>
                            </div>
                            <span className={`font-mono text-sm font-bold ${site.responseTime > 1000 ? 'text-orange-500' : 'text-gray-700'}`}>
                                {site.responseTime ? `${site.responseTime}ms` : '—'}
                            </span>
                        </div>

                        {/* SSL Info */}
                        <div className="flex items-center justify-between px-1 h-6">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <ShieldCheck size={16} />
                                <span>SSL Valid</span>
                            </div>
                            <span className={`text-sm font-medium ${isSSLWarning ? 'text-amber-600 font-bold' : isHealthy ? 'text-green-600' : 'text-gray-400'}`}>
                                {site.sslInfo ? `${site.sslInfo.daysRemaining} days` : 'Checking...'}
                            </span>
                        </div>

                        <div className="h-px bg-gray-100 my-2"></div>

                        {/* IP Info */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 px-1 h-5">
                            <Server size={14} className="text-gray-400 shrink-0" />
                            <span className="uppercase tracking-wider font-semibold min-w-[40px]">IP address:</span>
                            <span className="text-gray-600 font-medium font-mono truncate">
                                {site.ipAddress || '...'}
                            </span>
                        </div>

                        {/* Hosting Info */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 px-1 h-5">
                            <Cloud size={14} className="text-gray-400 shrink-0" />
                            <span className="uppercase tracking-wider font-semibold min-w-[40px]">Running on:</span>
                            <span className="text-gray-600 font-medium truncate flex-1" title={site.hosting}>
                                {site.hosting || '...'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DELETE MODAL --- */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="text-red-600 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Stop Monitoring?</h3>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                You are about to remove <strong className="text-gray-800 break-all">{site.url}</strong>. This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors">
                                    Cancel
                                </button>
                                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SiteCard;