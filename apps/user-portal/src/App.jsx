import React, { useState } from 'react';
import IdentityBinding from './components/IdentityBinding';
import Dashboard from './components/Dashboard';

function App() {
    const [isRegistered, setIsRegistered] = useState(false);

    // In a real app, check localStorage/cookie for existing session

    if (!isRegistered) {
        return <IdentityBinding onRegisterSuccess={() => setIsRegistered(true)} />;
    }

    return <Dashboard />;
}

export default App;
