import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react'

// MOCK DATA - In real app, this fetches from API
const MOCK_REQUESTS = [
    { id: '1', user: 'Alice', amount: 'HIDDEN', commitment: '0x8f...2a', status: 'pending', timestamp: '2 mins ago' },
    { id: '2', user: 'Bob', amount: 'HIDDEN', commitment: '0xa1...9c', status: 'approved', timestamp: '1 hour ago' },
    { id: '3', user: 'Charlie', amount: 'HIDDEN', commitment: '0x7b...1d', status: 'rejected', timestamp: '5 hours ago' },
]

function App() {
    const [requests, setRequests] = useState(MOCK_REQUESTS)

    const handleApprove = (id) => {
        setRequests(requests.map(req =>
            req.id === id ? { ...req, status: 'approved' } : req
        ))
        alert(`Approved request ${id}. Signed commitment sent to user.`)
    }

    const handleReject = (id) => {
        setRequests(requests.map(req =>
            req.id === id ? { ...req, status: 'rejected' } : req
        ))
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Bank Oracle Console</h1>
                    </div>
                    <div className="text-sm text-slate-400">
                        ZK-Income Verification System
                    </div>
                </header>

                <main>
                    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-white">Income Verification Requests</h2>
                            <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full">{requests.filter(r => r.status === 'pending').length} Pending</span>
                        </div>

                        <div className="divide-y divide-slate-700">
                            {requests.map((req) => (
                                <div key={req.id} className="p-6 flex items-center justify-between hover:bg-slate-750 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-white">{req.user}</h3>
                                            <span className="text-xs text-slate-500">• {req.timestamp}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-400 font-mono">
                                            <span>Amount: <span className="bg-slate-700 px-1 rounded text-slate-300">CONFIDENTIAL</span></span>
                                            <span>Commitment: {req.commitment}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 ml-4">
                                        {req.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    className="flex items-center gap-1 bg-green-900/50 hover:bg-green-900 text-green-400 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-green-800"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="flex items-center gap-1 bg-red-900/50 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-red-800"
                                                >
                                                    <XCircle className="w-4 h-4" /> Reject
                                                </button>
                                            </>
                                        ) : (
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border ${req.status === 'approved'
                                                    ? 'bg-green-950/30 text-green-500 border-green-900/50'
                                                    : 'bg-red-950/30 text-red-500 border-red-900/50'
                                                }`}>
                                                {req.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                <span className="capitalize">{req.status}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {requests.length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                No requests found.
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default App
