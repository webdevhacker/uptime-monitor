import React, { useState } from 'react';
import { ShieldCheck, Server, Activity, Trash2, CheckCircle, XCircle, Clock, Cloud, AlertTriangle } from 'lucide-react';

const SiteCard = ({ site, onDelete }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const isUp = site.status === 'UP';
    const isDown = site.status === 'DOWN';
    const isPending = !isUp && !isDown;

    // Dynamic styling
    const statusColor = isUp ? 'text-green-600 bg-green-50' : isDown ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';
    const borderColor = isUp ? 'border-green-200' : isDown ? 'border-red-200' : 'border-amber-200';
    const topBarColor = isUp ? 'bg-green-500' : isDown ? 'bg-red-500' : 'bg-amber-400';

    const handleDeleteClick = () => setShowDeleteModal(true);
    const confirmDelete = () => {
        onDelete(site._id);
        setShowDeleteModal(false);
    };

    return (
        <>
            {/* --- MAIN CARD --- */}
            {/* Added h-full to ensure card stretches to fill grid row */}
            <div className={`relative group h-full bg-white rounded-xl border ${borderColor} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}>

                {/* Top Colored Line */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${topBarColor}`} />

                <div className="p-6 flex-1 flex flex-col">

                    {/* Header: Status + URL + Delete */}
                    <div className="flex justify-between items-start mb-5">
                        <div className="flex-1 min-w-0 pr-4">

                            {/* Status Badge - FIXED WIDTH (w-24) to prevent jumping */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full w-28 ${statusColor}`}>
                                    {isUp ? <CheckCircle size={14} /> : isDown ? <XCircle size={14} /> : <Clock size={14} />}
                                    <span className="text-[11px] font-bold uppercase tracking-wider">
                                        {site.status || 'PENDING'}
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

                    {/* Metrics Grid - Pushed to bottom with mt-auto if needed */}
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
                            <span className={`text-sm font-medium ${site.sslInfo?.valid ? 'text-green-600' : 'text-amber-500'}`}>
                                {site.sslInfo ? `${site.sslInfo.daysRemaining} days` : 'Checking...'}
                            </span>
                        </div>

                        {/* Divider */}
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

            {/* --- DELETE MODAL (Same as before) --- */}
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