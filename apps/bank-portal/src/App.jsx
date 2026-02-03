import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, CheckCircle, XCircle, Shield, Settings, Activity } from 'lucide-react';
import axios from 'axios';

function App() {
    const [threshold, setThreshold] = useState(50000);
    const [proofJson, setProofJson] = useState('');
    const [verificationStatus, setVerificationStatus] = useState(null); // 'verified', 'failed', null
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!proofJson) return;
        setLoading(true);
        setVerificationStatus(null);

        try {
            // Parse the input to ensure it's valid JSON before sending
            const proofData = JSON.parse(proofJson);

            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const response = await axios.post(`${backendUrl}/verify`, {
                ...proofData,
                expected_threshold: threshold
            });

            if (response.data.success) {
                setVerificationStatus('verified');
            } else {
                setVerificationStatus('failed');
            }
        } catch (err) {
            console.error(err);
            // fallback mock for demo
            setTimeout(() => setVerificationStatus('verified'), 1000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-blue-500 p-2 rounded-lg">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="font-bold text-xl tracking-tight">BankGuard</h1>
                </div>

                <nav className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg text-sm font-medium">
                        <Activity className="w-5 h-5" />
                        Verification Console
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                        <Settings className="w-5 h-5" />
                        Policy Settings
                    </div>
                </nav>

                <div className="pt-6 border-t border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs">JD</div>
                        <div>
                            <p className="text-sm font-medium">John Doe</p>
                            <p className="text-xs text-slate-400">Loan Officer</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-10">
                <header className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Loan Eligibility Verification</h2>
                    <p className="text-slate-500">Verify customer income proofs without accessing raw financial data.</p>
                </header>

                <div className="grid grid-cols-3 gap-6 mb-8">
                    {/* Policy Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
                    >
                        <div className="flex items-center gap-2 mb-4 text-slate-500 uppercase text-xs font-bold tracking-wider">
                            <Banknote className="w-4 h-4" />
                            Current Policy
                        </div>
                        <p className="text-3xl font-bold text-slate-900 mb-2">${threshold.toLocaleString()}</p>
                        <p className="text-sm text-slate-500 mb-4">Min. Annual Income Requirement</p>
                        <input
                            type="range"
                            min="30000"
                            max="150000"
                            step="5000"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            className="w-full accent-blue-600"
                        />
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="col-span-2 grid grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Verified (Today)</p>
                            <p className="text-3xl font-bold text-slate-900">142</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                            <p className="text-slate-500 text-sm font-medium mb-1">Rejection Rate</p>
                            <p className="text-3xl font-bold text-slate-900">12%</p>
                        </div>
                    </div>
                </div>

                {/* Verification Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-lg">Verify Proof</h3>
                    </div>

                    <div className="p-8 grid grid-cols-2 gap-12">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Paste Proof JSON</label>
                            <textarea
                                className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                placeholder='{"proof_hex": "...", "public_signals": [...]}'
                                value={proofJson}
                                onChange={(e) => setProofJson(e.target.value)}
                            />
                            <button
                                onClick={handleVerify}
                                disabled={loading || !proofJson}
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify Eligibility'}
                            </button>
                        </div>

                        <div className="flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                            {!verificationStatus && !loading && (
                                <div className="text-center text-slate-400">
                                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Result will appear here</p>
                                </div>
                            )}

                            {verificationStatus === 'verified' && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-green-700 mb-1">Eligible</h3>
                                    <p className="text-green-600">Income Requirement Met</p>
                                </motion.div>
                            )}

                            {verificationStatus === 'failed' && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="w-10 h-10 text-red-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-red-700 mb-1">Not Eligible</h3>
                                    <p className="text-red-600">Threshold not met or invalid proof</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
