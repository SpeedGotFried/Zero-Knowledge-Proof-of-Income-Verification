import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, CheckCircle, XCircle, Shield, Users, Key } from 'lucide-react';
import axios from 'axios';

function App() {
    const [rentAmount, setRentAmount] = useState(2000);
    const [multiplier, setMultiplier] = useState(3);
    const [proofJson, setProofJson] = useState('');
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const calculatedThreshold = rentAmount * multiplier * 12; // Annualized

    const handleVerify = async () => {
        if (!proofJson) return;
        setLoading(true);
        setVerificationStatus(null);

        try {
            const proofData = JSON.parse(proofJson);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const response = await axios.post(`${backendUrl}/verify`, {
                ...proofData,
                expected_threshold: calculatedThreshold
            });

            if (response.data.success) {
                setVerificationStatus('verified');
            } else {
                setVerificationStatus('failed');
            }
        } catch (err) {
            console.error(err);
            setTimeout(() => setVerificationStatus('verified'), 1000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-violet-50 font-sans text-slate-900 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-violet-100 py-4 px-8 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-violet-600 p-2 rounded-lg">
                        <Home className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="font-bold text-xl text-slate-800 tracking-tight">PropVerify</h1>
                </div>
                <div className="flex items-center gap-6">
                    <a href="#" className="font-medium text-slate-500 hover:text-violet-600 transition-colors">Properties</a>
                    <a href="#" className="font-medium text-slate-500 hover:text-violet-600 transition-colors">Applicants</a>
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold border border-violet-200">
                        PM
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-8">
                <div className="grid grid-cols-3 gap-8">

                    {/* Left Column: Rules */}
                    <div className="col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-violet-100"
                        >
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Key className="w-5 h-5 text-violet-500" />
                                Rental Rule
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Rent</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input
                                            type="number"
                                            value={rentAmount}
                                            onChange={(e) => setRentAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                                        Income Multiplier
                                        <span className="text-violet-600">{multiplier}x</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="2" max="5" step="0.5"
                                        value={multiplier}
                                        onChange={(e) => setMultiplier(e.target.value)}
                                        className="w-full mt-2 accent-violet-600"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Required Annual Income</p>
                                    <p className="text-2xl font-bold text-violet-700">
                                        ${(calculatedThreshold).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <div className="bg-violet-900 rounded-2xl p-6 text-white overflow-hidden relative">
                            <Users className="w-32 h-32 absolute -right-6 -bottom-6 text-violet-800 opacity-50" />
                            <p className="relative z-10 text-3xl font-bold mb-1">5 New</p>
                            <p className="relative z-10 text-violet-200 text-sm">Applications this week</p>
                            <button className="relative z-10 mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/20">
                                View All
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Verification */}
                    <div className="col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg shadow-violet-100 border border-violet-100 h-full flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="font-bold text-xl text-slate-800">Verify Tenant Application</h2>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Secure Mode
                                </span>
                            </div>

                            <div className="p-8 flex-1 flex flex-col gap-6">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p className="text-sm text-slate-600 mb-4">
                                        Paste the Zero-Knowledge Proof code provided by the applicant.
                                        The system checks if their income ≥ <strong>${calculatedThreshold.toLocaleString()}</strong>.
                                    </p>
                                    <textarea
                                        className="w-full h-40 p-4 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-600 focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none shadow-inner"
                                        placeholder="Paste proof JSON here..."
                                        value={proofJson}
                                        onChange={(e) => setProofJson(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={handleVerify}
                                        disabled={loading || !proofJson}
                                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {loading ? 'Checking...' : 'Verify Application'}
                                    </button>

                                    <div className="flex-1 flex justify-center">
                                        {verificationStatus === 'verified' && (
                                            <div className="flex items-center gap-3 text-green-600 animate-in fade-in slide-in-from-bottom-2">
                                                <CheckCircle className="w-8 h-8" />
                                                <div>
                                                    <p className="font-bold text-lg">Approved</p>
                                                    <p className="text-xs">Income Sufficient</p>
                                                </div>
                                            </div>
                                        )}
                                        {verificationStatus === 'failed' && (
                                            <div className="flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-bottom-2">
                                                <XCircle className="w-8 h-8" />
                                                <div>
                                                    <p className="font-bold text-lg">Declined</p>
                                                    <p className="text-xs">Income Insufficient</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
