import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { generateSignatureToken, getSignatureStatus } from '../services/api';

const POLL_INTERVAL = 2500; // ms

export default function SignatureQRModal({ visit, onClose, onSigned }) {
  const [step,       setStep]       = useState('loading'); // loading | ready | signed | error
  const [token,      setToken]      = useState(null);
  const [qrDataUrl,  setQrDataUrl]  = useState(null);
  const [signUrl,    setSignUrl]    = useState(null);
  const [expiresAt,  setExpiresAt]  = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [errorMsg,   setErrorMsg]   = useState('');
  const pollRef  = useRef(null);
  const timerRef = useRef(null);

  /* ── Générer token + QR ───────────────────────────────────────────── */
  const generate = useCallback(async () => {
    setStep('loading');
    try {
      const res    = await generateSignatureToken(visit.id);
      const { token: t, expires_at, appHost } = res.data;
      const port    = window.location.port || '80';
      const signUrl = `http://${appHost}:${port}/sign/${t}`;
      const dataUrl = await QRCode.toDataURL(signUrl, {
        width: 240, margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      });
      setToken(t);
      setQrDataUrl(dataUrl);
      setSignUrl(signUrl);
      setExpiresAt(new Date(expires_at));
      setStep('ready');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur génération QR';
      if (err.response?.data?.already_signed) {
        setStep('signed');
      } else {
        setErrorMsg(msg);
        setStep('error');
      }
    }
  }, [visit.id]);

  useEffect(() => { generate(); }, [generate]);

  /* ── Countdown ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (step !== 'ready' || !expiresAt) return;
    const tick = () => {
      const s = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s === 0) { clearInterval(timerRef.current); setStep('expired'); }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [step, expiresAt]);

  /* ── Polling statut ───────────────────────────────────────────────── */
  useEffect(() => {
    if (step !== 'ready' || !token) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await getSignatureStatus(token);
        if (res.data.signed) {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setStep('signed');
          onSigned?.();
        }
        if (res.data.expired) {
          clearInterval(pollRef.current);
          setStep('expired');
        }
      } catch { /* ignore */ }
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [step, token, onSigned]);

  /* ── Formatage timer ──────────────────────────────────────────────── */
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fadein">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 animate-slideup overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Signature électronique</h3>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-slate-700 hover:bg-slate-200 transition-colors duration-150">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5">

          {/* Visiteur */}
          <div className="flex items-center gap-2.5 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {visit.visitor?.full_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{visit.visitor?.full_name}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{visit.purpose}</p>
            </div>
          </div>

          {/* État : chargement */}
          {step === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Génération du QR code...</p>
            </div>
          )}

          {/* État : prêt */}
          {step === 'ready' && qrDataUrl && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 border-2 border-slate-200 rounded-xl bg-white shadow-sm">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-xs text-slate-500">
                  Scannez ce QR avec le téléphone, puis donnez-le au visiteur pour signer
                </p>
                {signUrl && (
                  <p className="text-[10px] text-slate-400 font-mono break-all bg-slate-50 rounded-lg px-2 py-1 border border-slate-200">
                    {signUrl}
                  </p>
                )}
                {secondsLeft !== null && (
                  <p className={`text-xs font-semibold tabular-nums ${secondsLeft < 60 ? 'text-red-500' : 'text-slate-400'}`}>
                    Expire dans {formatTime(secondsLeft)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                En attente de signature...
              </div>
            </div>
          )}

          {/* État : signé */}
          {step === 'signed' && (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-900">Signature reçue</p>
              <p className="text-xs text-slate-400">La signature a été enregistrée avec succès.</p>
              <button className="btn-primary mt-2" onClick={onClose}>Fermer</button>
            </div>
          )}

          {/* État : expiré */}
          {step === 'expired' && (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-900">QR Code expiré</p>
              <p className="text-xs text-slate-400">Le lien a expiré. Générez un nouveau QR code.</p>
              <button className="btn-primary mt-2" onClick={generate}>Régénérer</button>
            </div>
          )}

          {/* État : erreur */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">{errorMsg}</p>
              <button className="btn-secondary mt-1" onClick={onClose}>Fermer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
