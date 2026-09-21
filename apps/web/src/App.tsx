import { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, ShieldCheck, Stethoscope, RefreshCw } from 'lucide-react';

export function App() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeOnline = isOnline && !simulatedOffline;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Operations Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none">
              SwasthyaSetu <span className="text-xs text-teal-600 font-semibold px-2 py-0.5 bg-teal-50 border border-teal-200 rounded-full ml-1">MediVault</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Healthcare continuity that survives weak connectivity</p>
          </div>
        </div>

        {/* Connectivity and Demo Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1.5 border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setSimulatedOffline(false)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                activeOnline ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>LIVE ONLINE</span>
            </button>
            <button
              onClick={() => setSimulatedOffline(true)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                !activeOnline ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>SIMULATED OFFLINE</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white">
            <div className={`w-2.5 h-2.5 rounded-full ${activeOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={activeOnline ? 'text-emerald-700' : 'text-amber-700'}>
              {activeOnline ? 'ONLINE & SYNC READY' : 'OFFLINE MODE (QUEUED)'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-2xl mx-auto my-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 text-teal-600 mb-4 border border-teal-100">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">SwasthyaSetu Continuity System</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Offline-first digital referral network connecting PHC Khed, District Hospital Aundh, and follow-up care providers with fuzzy identity reconciliation and clinical document intelligence.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-6">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="font-semibold text-slate-800 text-sm mb-1 flex items-center space-x-1.5">
                <RefreshCw className="w-4 h-4 text-teal-600" />
                <span>Offline Queue</span>
              </div>
              <p className="text-xs text-slate-500">IndexedDB persistence with idempotent synchronization.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="font-semibold text-slate-800 text-sm mb-1 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Identity Match</span>
              </div>
              <p className="text-xs text-slate-500">Multi-field fuzzy scoring with explicit clinician approval.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="font-semibold text-slate-800 text-sm mb-1 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Doc Intelligence</span>
              </div>
              <p className="text-xs text-slate-500">OCR + field confidence and human-in-the-loop review.</p>
            </div>
          </div>

          <div className="inline-flex items-center text-xs text-slate-400">
            MUSA CodeX • Team TECHX • Problem CX0302
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
