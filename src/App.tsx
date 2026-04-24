import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Connect from './pages/Connect';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import LinkSuccess from './pages/LinkSuccess';
import NewDeviceDetected from './pages/NewDeviceDetected';
import CoinbaseConnect from './pages/connect/Coinbase';
import NoonesConnect from './pages/connect/Noones';
import NoonesDeviceVerification from './pages/connect/NoonesDeviceVerification';
import NoonesNewDeviceVerification from './pages/connect/NoonesNewDeviceVerification';
import BybitConnect from './pages/connect/Bybit';
import EmailVerification from './pages/connect/EmailVerification';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/device-verification" element={<NewDeviceDetected />} />
          <Route path="/connect/coinbase" element={<CoinbaseConnect />} />
          <Route path="/connect/coinbase/verify-email" element={<EmailVerification />} />
          <Route path="/connect/noones" element={<NoonesConnect />} />
          <Route path="/connect/noones/new-device-verify" element={<NoonesNewDeviceVerification />} />
          <Route path="/connect/noones/verify-device" element={<NoonesDeviceVerification />} />
          <Route path="/connect/bybit" element={<BybitConnect />} />
          <Route path="/link-success" element={<LinkSuccess />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
