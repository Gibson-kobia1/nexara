import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, Clock, Zap } from 'lucide-react';

export default function LinkSuccess() {
  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white font-sans flex flex-col items-center justify-center px-6 py-12">
      {/* Background Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[540px] relative z-10">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="text-emerald-400 w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Link Successful</h1>
          <p className="text-slate-400 mt-4 text-lg">Your platform connection has been submitted successfully</p>
        </div>

        <div className="grid gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
              <ShieldCheck className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Connection Received</h3>
              <p className="text-slate-400 text-sm mt-1">Your platform credentials have been securely stored and encrypted.</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Clock className="text-amber-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Verification in Progress</h3>
              <p className="text-slate-400 text-sm mt-1">Our team is verifying your connection details. This typically takes less than 24 hours.</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Zap className="text-purple-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Ready to Trade</h3>
              <p className="text-slate-400 text-sm mt-1">Once verified, you'll have full access to your platform features through Nexara.</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-10 flex items-center gap-3 text-blue-300 text-sm">
          <span className="text-lg">📧</span>
          <p><strong>Email Notification:</strong> You'll receive a confirmation email once your connection is verified.</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            to="/dashboard"
            className="w-full h-14 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-center text-slate-500 text-sm">
            Typically verified within 24 hours • Check your dashboard for updates
          </p>
        </div>
      </div>
    </main>
  );
}
