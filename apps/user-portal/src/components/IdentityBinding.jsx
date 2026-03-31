import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const IdentityBinding = (props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [publicKey, setPublicKey] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!publicKey) {
            setError("Please enter a valid Public Key");
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            // Determines the backend URL based on environment
            // Check vite.config.js for proxy or use env var
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

            const response = await axios.post(`${backendUrl}/register`, {
                public_key_hex: publicKey
            });

            if (response.data.success) {
                setIsRegistered(true);
                if (props.onRegisterSuccess) props.onRegisterSuccess();
            } else {
                setError(response.data.message || "Registration failed");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to connect to the ZKP Engine. Is the backend running?");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        Zero-Knowledge Identity
                    </h2>
                    <p className="text-slate-400 text-center text-sm mb-8">
                        Bind your identity securely. No personal data leaves your device until you prove it.
                    </p>

                    <AnimatePresence mode="wait">
                        {!isRegistered ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider ml-1">
                                        Wallet Public Key (Hex)
                                    </label>
                                    <input
                                        type="text"
                                        value={publicKey}
                                        onChange={(e) => setPublicKey(e.target.value)}
                                        placeholder="e.g. a1b2c3d4..."
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                                    />
                                </div>

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-red-400 text-xs text-center"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                <button
                                    onClick={handleRegister}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Bind Identity
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                </motion.div>
                                <h3 className="text-xl font-semibold text-white mb-2">Identity Bound</h3>
                                <p className="text-slate-400 text-sm mb-6">
                                    Your wallet is now linked. You can proceed to upload documents for verification.
                                </p>
                                <button
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-lg border border-slate-700 transition-colors"
                                >
                                    Proceed to Dashboard
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-slate-950/50 p-4 border-t border-slate-800/50">
                    <p className="text-center text-xs text-slate-600">
                        Secured by <span className="text-indigo-400 font-semibold">Zero-Knowledge Proofs</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default IdentityBinding;
