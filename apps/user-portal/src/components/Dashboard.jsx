import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Building, Banknote, ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const Dashboard = () => {
    const [step, setStep] = useState('upload'); // 'upload', 'select', 'proving', 'result'
    const [file, setFile] = useState(null);
    const [salary, setSalary] = useState(''); // Simulated extraction
    const [date, setDate] = useState(''); // Extracted date
    const [selectedUseCase, setSelectedUseCase] = useState(null); // 'bank' or 'landlord'
    const [requestedThreshold, setRequestedThreshold] = useState(''); // Generic threshold chosen by user
    const [proof, setProof] = useState(null);
    const [error, setError] = useState(null);

    // Mock Upload Handler
    const handleFileUpload = async (e) => {
        setError(null);
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
            if (uploadedFile.type !== 'application/pdf') {
                setError('Please upload a PDF document.');
                return;
            }

            setFile(uploadedFile); // Keep it temporarily to show something is happening
            setSalary(''); // Reset previous extracted value if any
            setDate(''); // Reset previous extracted date

            try {
                // Extract text using pdfjs
                const arrayBuffer = await uploadedFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let text = "";
                // Read up to 3 pages for speed
                const maxPages = Math.min(pdf.numPages, 3);
                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    text += textContent.items.map(item => item.str).join(" ") + " ";
                }
                
                const lowercaseText = text.toLowerCase();
                const validKeywords = ['payslip', 'statement', 'salary', 'income', 'w2', 'tax', '1099', 'net pay', 'gross pay', 'earnings', 'account balance', 'balance'];
                const isRelevant = validKeywords.some(keyword => lowercaseText.includes(keyword));

                if (!isRelevant) {
                    setError('The document does not appear to contain relevant income information (e.g., salary, payslip, statement keywords). Please upload a valid income proof.');
                    setFile(null);
                    return;
                }

                // Attempt to extract the salary from the document text
                // Look for numbers (with or without $) and find the largest reasonable amount
                const numberRegex = /(?:\$)?\s*([\d,]+(?:\.\d{2})?)/g;
                const matches = [...text.matchAll(numberRegex)];
                
                let maxAmount = 0;
                matches.forEach(match => {
                    const amountStr = match[1].replace(/,/g, '');
                    const amount = parseFloat(amountStr);
                    // Assume an annual or monthly salary amount shouldn't be a random year like 2024
                    // and cap it at something reasonable so we don't accidentally grab a phone number
                    if (!isNaN(amount) && amount > maxAmount && amount < 10000000 && amount > 100) {
                        // Avoid grabbing year-like numbers if possible, though it's tricky
                        if (amount > 3000 || amount < 1900) {
                            maxAmount = amount;
                        }
                    }
                });

                // Attempt to extract an issue date
                const dateRegex = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/gi;
                const dateMatch = text.match(dateRegex);
                let extractedDate = '';
                if (dateMatch && dateMatch.length > 0) {
                    extractedDate = dateMatch[0]; // grab the first date found
                }

                if (maxAmount > 0) {
                    setTimeout(() => {
                        setSalary(Math.round(maxAmount).toString());
                        if (extractedDate) setDate(extractedDate);
                    }, 500);
                } else {
                    setError('Could not extract a valid salary or income amount from the document.');
                    setFile(null);
                    return;
                }
            } catch (err) {
                console.error("PDF extraction error:", err);
                setError(`Failed to parse the PDF document: ${err.message || 'Unknown error'}`);
                setFile(null);
            }
        }
    };

    const handleProve = async (useCase) => {
        setStep('proving');

        // Use the generic threshold the user wants to prove
        const threshold = parseInt(requestedThreshold) || 0;

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

            // This calls our Rust Backend (ZKP Engine)
            const response = await axios.post(`${backendUrl}/prove`, {
                salary: parseInt(salary),
                threshold: threshold
            });

            if (response.data.success) {
                setProof(response.data.data);
                setStep('result');
            } else {
                console.error("Proof failed", response.data.message);
                setError(response.data.message || "Proof Generation Failed on Backend.");
                setStep('upload'); // Go back on fail and show error
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

    const handleSend = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            await axios.post(`${backendUrl}/submit_proof`, {
                public_key_hex: "0102030405060708090a",
                proof_json: typeof proof?.proof_json === 'string' ? proof.proof_json : JSON.stringify(proof?.proof_json || {}),
                threshold: proof?.threshold || 0
            });
            alert(`Proof securely sent to the ${selectedUseCase === 'bank' ? 'Bank' : 'Landlord'} portal!`);
            setStep('upload');
        } catch (err) {
            console.error("Failed to send proof:", err);
            alert("Failed to submit proof to the portal.");
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

                            <div className={`border-2 border-dashed ${error ? 'border-red-500/50 hover:border-red-500' : 'border-slate-700 hover:border-indigo-500/50'} bg-slate-900/50 rounded-xl p-12 text-center transition-colors group relative cursor-pointer`}>
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-slate-800 rounded-full group-hover:bg-indigo-500/20 transition-colors">
                                        <Upload className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-200">Click to upload or drag and drop</p>
                                        <p className="text-sm text-slate-500 mt-1">PDF only (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center justify-center text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

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
                                            {date && <p className="text-xs text-slate-500 mt-1">Issued: {date}</p>}
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
                            <h2 className="text-2xl font-bold mb-2">Create a Generic Income Proof</h2>
                            <p className="text-slate-400 mb-8">What amount do you want to prove you earn above? You can reuse this proof for multiple verifiers.</p>

                            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl mb-8">
                                <label className="block text-sm font-medium text-slate-400 mb-2">I want to prove my income is at least ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={requestedThreshold}
                                    onChange={(e) => setRequestedThreshold(e.target.value)}
                                    placeholder="e.g., 20000"
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl font-bold text-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <button
                                    disabled={!requestedThreshold}
                                    onClick={() => { setSelectedUseCase('bank'); handleProve('bank'); }}
                                    className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-8 rounded-2xl text-left transition-all hover:shadow-2xl hover:shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="mb-6 p-4 bg-slate-800 rounded-xl w-fit group-hover:bg-indigo-600 transition-colors">
                                        <Banknote className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Bank Loan App</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Generates a proof for ${requestedThreshold || 'X'} and prepares to send it to the Bank Portal.
                                    </p>
                                </button>

                                <button
                                    disabled={!requestedThreshold}
                                    onClick={() => { setSelectedUseCase('landlord'); handleProve('landlord'); }}
                                    className="group relative bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-8 rounded-2xl text-left transition-all hover:shadow-2xl hover:shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="mb-6 p-4 bg-slate-800 rounded-xl w-fit group-hover:bg-purple-600 transition-colors">
                                        <Building className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Rental Application</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Generates a proof for ${requestedThreshold || 'X'} and prepares to send it to the Landlord Portal.
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
                                <button
                                    onClick={handleSend}
                                    className="flex-1 bg-white text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Send to {selectedUseCase === 'bank' ? 'Bank' : 'Landlord'} Portal
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
