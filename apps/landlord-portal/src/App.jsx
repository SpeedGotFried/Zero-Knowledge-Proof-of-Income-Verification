import { useState } from 'react'
import { Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

function App() {
    const [tokenInput, setTokenInput] = useState('')
    const [verificationResult, setVerificationResult] = useState(null)
    const [isVerifying, setIsVerifying] = useState(false)

    const handleVerify = async () => {
        setIsVerifying(true)
        setVerificationResult(null)

        // Simulate verification delay
        await new Promise(r => setTimeout(r, 1500))

        try {
            if (!tokenInput.trim()) {
                throw new Error("Token cannot be empty")
            }

            // MOCK LOGIC: 
            // In reality, this would:
            // 1. Parse JSON token (Commitment, Proof, BankSig)
            // 2. Fetch Bank's Public Key
            // 3. Verify BankSig on Commitment
            // 4. Verify ZKP Proof on Commitment

            // For demo: Fail if input length < 10, else Success
            if (tokenInput.length < 10) {
                throw new Error("Invalid Token Format")
            }

            setVerificationResult({
                success: true,
                details: {
                    issuer: "Bank of ZK",
                    timestamp: new Date().toLocaleString(),
                    valid: true
                }
            })

        } catch (err) {
            setVerificationResult({
                success: false,
                error: err.message
            })
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center py-12 px-4 font-sans">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    Verifier Service
                </h1>
                <p className="text-neutral-400">Validate Proof-of-Income Tokens securely</p>
            </header>

            <main className="w-full max-w-2xl">
                <div className="bg-neutral-800 rounded-2xl shadow-2xl p-8 border border-neutral-700">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Paste Verification Token
                        </label>
                        <textarea
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder='{"commitment": "...", "proof": "...", "signature": "..."}'
                            className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-mono text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all placeholder:text-neutral-600"
                        />
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isVerifying || !tokenInput}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isVerifying
                                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-purple-500/25 active:scale-[0.98]'
                            }`}
                    >
                        {isVerifying ? (
                            <>Verifying Cryptography...</>
                        ) : (
                            <><Search className="w-5 h-5" /> Verify Token</>
                        )}
                    </button>

                    {/* Results Section */}
                    {verificationResult && (
                        <div className={`mt-8 p-6 rounded-xl border animate-in fade-in slide-in-from-top-4 duration-300 ${verificationResult.success
                                ? 'bg-green-950/30 border-green-900/50'
                                : 'bg-red-950/30 border-red-900/50'
                            }`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${verificationResult.success ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                                    }`}>
                                    {verificationResult.success ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                                </div>

                                <div className="flex-1">
                                    <h3 className={`text-xl font-bold mb-1 ${verificationResult.success ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {verificationResult.success ? "Valid Verification Token" : "Verification Failed"}
                                    </h3>

                                    {verificationResult.success ? (
                                        <div className="space-y-2 text-sm text-neutral-300 mt-3">
                                            <div className="flex justify-between border-b border-green-900/30 pb-2">
                                                <span className="text-neutral-500">Issuer Signature</span>
                                                <span className="font-mono text-green-300">Verified (Bank of ZK)</span>
                                            </div>
                                            <div className="flex justify-between border-b border-green-900/30 pb-2">
                                                <span className="text-neutral-500">Zero-Knowledge Proof</span>
                                                <span className="font-mono text-green-300">Valid (Range Check)</span>
                                            </div>
                                            <div className="flex justify-between pt-1">
                                                <span className="text-neutral-500">Timestamp</span>
                                                <span>{verificationResult.details.timestamp}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-red-300/80 mt-1">{verificationResult.error}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default App
