import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Connect from './pages/Connect';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import CoinbaseConnect from './pages/connect/Coinbase';
import NoonesConnect from './pages/connect/Noones';
import BybitConnect from './pages/connect/Bybit';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/connect/coinbase" element={<CoinbaseConnect />} />
          <Route path="/connect/noones" element={<NoonesConnect />} />
          <Route path="/connect/bybit" element={<BybitConnect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
