import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Banknote, CheckCircle, XCircle, Shield, Settings, Activity, Clock } from 'lucide-react';
import axios from 'axios';

function App() {
    // List of proofs: { id, proof_json, user_threshold, status: 'pending'|'verified'|'failed', message, timestamp }
    const [proofsList, setProofsList] = useState([]); 
    const [requiredThresholds, setRequiredThresholds] = useState({}); // Map of proof.id -> bank's required threshold

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    // Poll for incoming proofs and add them to pending list
    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                const response = await axios.get(`${backendUrl}/pending_proofs`);
                if (response.data.success && response.data.data.length > 0) {
                    const newProofs = response.data.data;
                    
                    // Clear them from backend so we don't fetch them again
                    await axios.post(`${backendUrl}/clear_proofs`);

                    setProofsList(prev => {
                        const added = newProofs.map(p => ({
                            id: p.id,
                            proof_json: p.proof_json,
                            user_threshold: p.threshold,
                            status: 'pending',
                            timestamp: new Date().toLocaleTimeString()
                        }));
                        return [...added, ...prev];
                    });
                }
            } catch (err) {
                console.error("Failed to poll proofs", err);
            }
        }, 2000); // Check every 2 seconds

        return () => clearInterval(intervalId);
    }, []);

    const handleVerifySingle = async (proofId) => {
        const proof = proofsList.find(p => p.id === proofId);
        const requiredThresh = parseInt(requiredThresholds[proofId]) || 0;

        if (proof.user_threshold < requiredThresh) {
            updateProofStatus(proofId, 'failed', `Rejected: User claimed $${proof.user_threshold}, but you require $${requiredThresh}.`);
            return;
        }

        try {
            const verifyResponse = await axios.post(`${backendUrl}/verify`, {
                public_key_hex: "0102030405060708090a",
                proof_json: proof.proof_json,
                threshold: proof.user_threshold 
            });
            
            if (verifyResponse.data.success) {
                updateProofStatus(proofId, 'verified', `Verified: Cryptography confirms income is at least $${proof.user_threshold}.`);
            } else {
                updateProofStatus(proofId, 'failed', 'Invalid cryptographic proof. Data may be tampered.');
            }
        } catch (e) {
            updateProofStatus(proofId, 'failed', 'System error during verification.');
        }
    };

    const updateProofStatus = (id, status, message) => {
        setProofsList(prev => prev.map(p => p.id === id ? { ...p, status, message } : p));
    };

    // 2. Poll for pending proofs and auto-verify

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
                    {/* Removed global policy card because policy is per-proof */}

                    {/* Stats Cards */}
                    <div className="col-span-3 grid grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                            <p className="text-slate-500 text-sm font-medium mb-1">Pending Reviews</p>
                            <p className="text-3xl font-bold text-slate-900">{proofsList.filter(p => p.status === 'pending').length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Verified</p>
                            <p className="text-3xl font-bold text-slate-900">{proofsList.filter(p => p.status !== 'pending').length + 142}</p>
                        </div>
                    </div>
                </div>

                {/* Verification Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-lg">Verify Proof</h3>
                    </div>

                    <div className="p-8">
                        {proofsList.length === 0 ? (
                            <div className="text-center text-slate-400 py-12">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20 animate-pulse" />
                                <p>Waiting for incoming Zero-Knowledge Proofs...</p>
                                <p className="text-xs mt-2">Proofs submitted by users will appear here for manual review.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {proofsList.map((vp) => (
                                    <motion.div
                                        key={vp.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex flex-col p-6 rounded-xl border ${vp.status === 'verified' ? 'bg-green-50 border-green-200' : vp.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                {vp.status === 'verified' ? (
                                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                                ) : vp.status === 'failed' ? (
                                                    <XCircle className="w-8 h-8 text-red-600" />
                                                ) : (
                                                    <Shield className="w-8 h-8 text-blue-600" />
                                                )}
                                                <div>
                                                    <h4 className={`font-bold ${vp.status === 'verified' ? 'text-green-800' : vp.status === 'failed' ? 'text-red-800' : 'text-slate-900'}`}>
                                                        {vp.status === 'verified' ? 'Eligible: Requirement Met' : vp.status === 'failed' ? 'Not Eligible' : 'Pending Review'}
                                                    </h4>
                                                    {vp.message && (
                                                        <p className={`text-sm ${vp.status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {vp.message}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Received at {vp.timestamp} | Request ID: {vp.id.substring(0, 8)} | User claims >= ${vp.user_threshold}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {vp.status === 'pending' && (
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <span className="text-slate-400 font-medium">$</span>
                                                        </div>
                                                        <input 
                                                            type="number"
                                                            placeholder="Required Threshold"
                                                            value={requiredThresholds[vp.id] || ''}
                                                            onChange={(e) => setRequiredThresholds(prev => ({ ...prev, [vp.id]: e.target.value }))}
                                                            className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => handleVerifySingle(vp.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                                    >
                                                        Verify
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
