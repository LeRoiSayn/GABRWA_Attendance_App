import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SignaturePad from 'signature_pad';
import { getSignatureInfo, submitSignature } from '../services/api';

export default function SignaturePage() {
  const { token }   = useParams();
  const canvasRef   = useRef(null);
  const padRef      = useRef(null);

  const [step,      setStep]      = useState('loading'); // loading | ready | submitting | done | error
  const [visitInfo, setVisitInfo] = useState(null);
  const [errorMsg,  setErrorMsg]  = useState('');
  const [isEmpty,   setIsEmpty]   = useState(true);

  /* ── Charger les infos de la visite ─────────────────────────────── */
  useEffect(() => {
    getSignatureInfo(token)
      .then((res) => { setVisitInfo(res.data); setStep('ready'); })
      .catch((err) => {
        const d = err.response?.data;
        setErrorMsg(d?.message || 'Lien invalide ou expiré');
        setStep('error');
      });
  }, [token]);

  /* ── Initialiser SignaturePad après rendu du canvas ─────────────── */
  useEffect(() => {
    if (step !== 'ready' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const resize = () => {
      const ratio  = Math.max(window.devicePixelRatio || 1, 1);
      const rect   = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * ratio;
      canvas.height = rect.height * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      padRef.current?.clear();
    };

    padRef.current = new SignaturePad(canvas, {
      minWidth: 1.5,
      maxWidth: 3,
      penColor: '#1e293b',
      backgroundColor: 'rgba(0,0,0,0)',
    });

    padRef.current.addEventListener('endStroke', () => {
      setIsEmpty(padRef.current.isEmpty());
    });

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [step]);

  /* ── Effacer ──────────────────────────────────────────────────────── */
  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
  };

  /* ── Soumettre ────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    setStep('submitting');
    try {
      const dataUrl = padRef.current.toDataURL('image/png');
      await submitSignature(token, dataUrl);
      setStep('done');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de l\'envoi');
      setStep('error');
    }
  };

  /* ── Rendu ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white">GABRWA</p>
          <p className="text-[10px] text-slate-500">Signature électronique</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col px-4 py-6 max-w-md mx-auto w-full">

        {/* Chargement */}
        {step === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Chargement...</p>
          </div>
        )}

        {/* Prêt à signer */}
        {(step === 'ready' || step === 'submitting') && visitInfo && (
          <>
            {/* Infos visite */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-3">Détails de la visite</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] text-slate-400">Visiteur</p>
                  <p className="text-sm font-semibold text-slate-900">{visitInfo.visitor_name}</p>
                </div>
                {visitInfo.host_name && (
                  <div>
                    <p className="text-[11px] text-slate-400">Personne visitée</p>
                    <p className="text-sm text-slate-700">{visitInfo.host_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-slate-400">Motif</p>
                  <p className="text-sm text-slate-700">{visitInfo.purpose}</p>
                </div>
              </div>
            </div>

            {/* Zone de signature */}
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl mb-4 overflow-hidden">
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">Signez ici</p>
                <button
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1
                             rounded-md hover:bg-slate-100 transition-colors"
                >
                  Effacer
                </button>
              </div>
              <canvas
                ref={canvasRef}
                className="w-full touch-none"
                style={{ height: '200px', display: 'block' }}
              />
              {isEmpty && (
                <p className="text-center text-xs text-slate-300 pb-3 pointer-events-none select-none">
                  Tracez votre signature avec le doigt
                </p>
              )}
            </div>

            {/* Bouton */}
            <button
              onClick={handleSubmit}
              disabled={isEmpty || step === 'submitting'}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-150
                ${isEmpty || step === 'submitting'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-700 text-white shadow-md hover:bg-blue-800 active:scale-[0.98]'
                }`}
            >
              {step === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi en cours...
                </span>
              ) : 'Confirmer ma signature'}
            </button>

            <p className="text-center text-xs text-slate-400 mt-4">
              En signant, vous confirmez votre présence et acceptez les conditions de visite.
            </p>
          </>
        )}

        {/* Succès */}
        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Signature enregistrée</p>
              <p className="text-sm text-slate-500 mt-1">Merci, votre signature a bien été reçue.</p>
            </div>
            <div className="bg-slate-100 rounded-xl px-4 py-3 mt-2">
              <p className="text-xs text-slate-500">Vous pouvez rendre le téléphone à l'agent d'accueil.</p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {step === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Lien invalide</p>
              <p className="text-sm text-slate-500 mt-1">{errorMsg}</p>
            </div>
            <p className="text-xs text-slate-400">Demandez un nouveau QR code à l'agent d'accueil.</p>
          </div>
        )}
      </div>
    </div>
  );
}
