import React, { useState } from 'react';
import axios from 'axios';
import Header from './Header'; // <--- Import Header
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

const Login = ({ setToken }) => {
    const [creds, setCreds] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.BACKEND_API_URL || 'http://localhost:5000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, creds);
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">

            {/* --- REUSABLE HEADER --- */}
            {/* No children passed, so it just shows the Logo */}
            <Header />

            {/* --- LOGIN FORM SECTION --- */}
            <div className="flex-1 flex items-center justify-center px-8 sm:px-6 lg:px-8 pb-20 pt-5">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                    {/* Form Header */}
                    <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex flex-col items-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-4">
                            <Lock className="text-blue-600 w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
                        <p className="text-gray-500 text-sm mt-1">Sign in to manage your monitors</p>
                    </div>

                    {/* Form Body */}
                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-sm">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Enter your username"
                                    onChange={e => setCreds({ ...creds, username: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    onChange={e => setCreds({ ...creds, password: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    </div>

                    {/* Footer / Hint */}
                    <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            Protected System • Authorized Access Only
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;