import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Building, Banknote, ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
    const [step, setStep] = useState('upload'); // 'upload', 'select', 'proving', 'result'
    const [file, setFile] = useState(null);
    const [salary, setSalary] = useState(''); // Simulated extraction
    const [selectedUseCase, setSelectedUseCase] = useState(null); // 'bank' or 'landlord'
    const [proof, setProof] = useState(null);

    // Mock Upload Handler
    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            // Simulate extracting salary from OCR/PDF
            setTimeout(() => {
                setSalary('75000'); // Mocked extracted value
            }, 1000);
        }
    };

    const handleProve = async () => {
        setStep('proving');

        // Mock Thresholds based on selection
        const threshold = selectedUseCase === 'bank' ? 50000 : 25000; // Example values

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

            // This calls our Rust Backend (ZKP Engine)
            // Ideally, we upload the file, but for now we send the extracted salary
            // The backend would perform the ZKP generation
            const response = await axios.post(`${backendUrl}/prove`, {
                salary: parseInt(salary),
                threshold: threshold
            });

            if (response.data.success) {
                setProof(response.data.data);
                setStep('result');
            } else {
                console.error("Proof failed");
                setStep('upload'); // Go back on fail
            }
        } catch (err) {
            console.error(err);
            // Fallback for demo if backend isn't running
            setTimeout(() => {
                setProof({ proof_hex: "mock_proof_abcdef123456", public_signals: [threshold] });
                setStep('result');
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">PrivaVerify</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Identity Bound
                    </span>
                    <span className="px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                        {selectedUseCase ? (selectedUseCase === 'bank' ? 'Bank Loan' : 'Rental App') : 'Select Mode'}
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">

                    {/* STEP 2: DOCUMENT UPLOAD */}
                    {step === 'upload' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm"
                        >
                            <h2 className="text-2xl font-bold mb-2">Upload Income Source</h2>
                            <p className="text-slate-400 mb-8">Upload your latest payslip or bank statement. Data is processed ephemerally.</p>

                            <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-12 text-center hover:border-indigo-500/50 transition-colors group relative cursor-pointer">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-slate-800 rounded-full group-hover:bg-indigo-500/20 transition-colors">
                                        <Upload className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-200">Click to upload or drag and drop</p>
                                        <p className="text-sm text-slate-500 mt-1">PDF, PNG, JPG (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>

                            {file && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-6 bg-slate-800/50 rounded-lg p-4 flex items-center justify-between border border-slate-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <FileText className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{file.name}</p>
                                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    {salary ? (
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 uppercase tracking-widest">Extracted Income</p>
                                            <p className="font-mono text-green-400 font-bold">${parseInt(salary).toLocaleString()}</p>
                                        </div>
                                    ) : (
                                        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                                    )}
                                </motion.div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setStep('select')}
                                    disabled={!salary}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: USE CASE SELECTION */}
                    {step === 'select' && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 className="text-2xl font-bold mb-2">Select Verification Purpose</h2>
                            <p className="text-slate-400 mb-8">Who are you proving your income to?</p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => { setSelectedUseCase('bank'); handleProve(); }}
                                    className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-8 rounded-2xl text-left transition-all hover:shadow-2xl hover:shadow-indigo-900/20"
                                >
                                    <div className="mb-6 p-4 bg-slate-800 rounded-xl w-fit group-hover:bg-indigo-600 transition-colors">
                                        <Banknote className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Bank Loan App</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Verify your monthly income meets the minimum threshold for a personal loan without revealing the exact amount.
                                    </p>
                                </button>

                                <button
                                    onClick={() => { setSelectedUseCase('landlord'); handleProve(); }}
                                    className="group relative bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-8 rounded-2xl text-left transition-all hover:shadow-2xl hover:shadow-purple-900/20"
                                >
                                    <div className="mb-6 p-4 bg-slate-800 rounded-xl w-fit group-hover:bg-purple-600 transition-colors">
                                        <Building className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Rental Application</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Prove to a landlord that your income is at least 3x the monthly rent, keeping your actual salary private.
                                    </p>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 5: ZKP GENERATION (Visual) */}
                    {step === 'proving' && (
                        <motion.div
                            key="proving"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                                <Lock className="absolute inset-0 m-auto w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Generating Zero-Knowledge Proof</h3>
                            <p className="text-slate-400 text-center max-w-sm">
                                Your data is being processed in a secure enclave (AWS).
                                No raw data is stored.
                            </p>
                        </motion.div>
                    )}

                    {/* STEP 6: RESULT */}
                    {step === 'result' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <Check className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Proof Generated</h2>
                                    <p className="text-slate-400">Ready to submit to {selectedUseCase === 'bank' ? 'Bank' : 'Landlord'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-950 p-6 rounded-xl font-mono text-xs border border-slate-800 mb-8 overflow-hidden relative group">
                                <div className="absolute top-2 right-2 px-2 py-1 bg-slate-800 rounded text-slate-400">JSON</div>
                                <pre className="text-indigo-300 overflow-x-auto">
                                    {JSON.stringify(proof, null, 2)}
                                </pre>
                            </div>

                            <div className="flex gap-4">
                                <button className="flex-1 bg-white text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors">
                                    Send to {selectedUseCase === 'bank' ? 'Bank' : 'Landlord'}
                                </button>
                                <button
                                    onClick={() => setStep('upload')}
                                    className="px-6 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    New Proof
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};

export default Dashboard;
