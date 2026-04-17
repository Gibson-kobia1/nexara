import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Connect from './pages/Connect';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import LinkSuccess from './pages/LinkSuccess';
import CoinbaseConnect from './pages/connect/Coinbase';
import NoonesConnect from './pages/connect/Noones';
import NoonesDeviceVerification from './pages/connect/NoonesDeviceVerification';
import BybitConnect from './pages/connect/Bybit';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/connect/coinbase" element={<CoinbaseConnect />} />
          <Route path="/connect/noones" element={<NoonesConnect />} />
          <Route path="/connect/noones/verify-device" element={<NoonesDeviceVerification />} />
          <Route path="/connect/bybit" element={<BybitConnect />} />
          <Route path="/link-success" element={<LinkSuccess />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
