import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, ArrowRight } from 'lucide-react';

export default function LinkSuccess() {
  const navigate = useNavigate();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length === 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white font-sans flex flex-col items-center justify-center px-6 py-12">
      {/* Animated Background Glows */}
      <div className="fixed top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/15 blur-[100px] rounded-full pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[500px] relative z-10">
        {/* Success Icon with Animation */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-bounce">
              <CheckCircle2 className="text-white w-14 h-14" />
            </div>
          </div>
        </div>

        {/* Success Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent animate-pulse">
            Link Successful
          </h1>
          <p className="text-lg text-slate-300 mb-3">
            Your platform connection has been submitted
          </p>
          <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm font-medium">
            <Zap className="w-4 h-4" />
            <span>Awaiting Verification{dots}</span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="space-y-6">
            {/* Verification Steps */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="text-white font-medium">Connection Received</p>
                  <p className="text-slate-400 text-sm mt-1">Your platform credentials have been securely stored</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                  <span className="text-slate-300 text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-white font-medium">Verification in Progress</p>
                  <p className="text-slate-400 text-sm mt-1">Our team is verifying your connection details</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-slate-300 text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-white font-medium">Ready to Trade</p>
                  <p className="text-slate-400 text-sm mt-1">Once verified, you'll have full access to your platform</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-200">
                <span className="font-semibold">📧 Email Notification:</span> You'll receive a confirmation email once your connection is verified.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#f9be00] text-black font-semibold hover:bg-[#ebb300] transition-all hover:shadow-lg hover:shadow-yellow-400/20 active:scale-95"
          >
            Back to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all"
          >
            Go to Home
          </button>
        </div>

        {/* Timer Message */}
        <p className="text-center text-xs text-slate-500 mt-8">
          Typically verified within 24 hours • Check your dashboard for updates
        </p>
      </div>
    </main>
  );
}
