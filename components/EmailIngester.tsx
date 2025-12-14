import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Loader2, Sparkles, CheckCircle, AlertCircle, RefreshCw, Key, Shield, LogIn, Lock, HelpCircle, AlertTriangle, ExternalLink, XCircle, Cookie } from 'lucide-react';
import { parseReservationEmailRest } from '../services/geminiService';
import { searchEmails, getEmailDetails, extractEmailBody, getEmailSubject } from '../services/gmailService';
import { Reservation } from '../types';
import { SAMPLE_EMAILS } from '../constants';

// Declare google on window to fix TypeScript errors
declare global {
  interface Window {
    google?: any;
  }
}

interface EmailIngesterProps {
  onReservationAdded: (reservation: Reservation) => void;
}

type IngestionMode = 'gmail' | 'manual';

const EmailIngester: React.FC<EmailIngesterProps> = ({ onReservationAdded }) => {
  const [mode, setMode] = useState<IngestionMode>('gmail');
  const [emailContent, setEmailContent] = useState('');

  // Gmail & Auth State
  const [googleClientId, setGoogleClientId] = useState('1088380297058-bcviork8fk99bksa328h3btcfc5fltht.apps.googleusercontent.com');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [showTroubleshoot, setShowTroubleshoot] = useState(true);

  // Shared State
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Automation State
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [lastAutoScan, setLastAutoScan] = useState<Date | null>(null);
  const AUTO_SCAN_INTERVAL = 10 * 60 * 1000; // 10 minutes

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '...';

  // Load Token from LocalStorage on Mount
  useEffect(() => {
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
      setAccessToken(storedToken);
      setScanLog(prev => [...prev, "Token récupéré du stockage local."]);
      setShowTroubleshoot(false);
    }
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    if (window.google && googleClientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/gmail.readonly',
          callback: (response: any) => {
            if (response.access_token) {
              setAccessToken(response.access_token);
              localStorage.setItem('google_access_token', response.access_token); // Persist token
              setScanLog(prev => [...prev, "Authentification réussie ! Token reçu."]);
              setError(null);
              setShowTroubleshoot(false);
            } else {
              setError("Erreur d'authentification Google.");
            }
          },
        });
        setTokenClient(client);
      } catch (e) {
        console.error("Error initializing token client:", e);
        setError("Erreur d'initialisation du client Google. Vérifiez l'ID.");
      }
    }
  }, [googleClientId]);

  // Auto-Scan Effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (autoScanEnabled && accessToken) {
      // Initial scan when enabled
      handleGmailScan();

      intervalId = setInterval(() => {
        console.log("Auto-scan triggered...");
        handleGmailScan();
        setLastAutoScan(new Date());
      }, AUTO_SCAN_INTERVAL);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoScanEnabled, accessToken]);

  // Validation Helper
  const validateReservation = (res: Reservation): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!res.customer_name || res.customer_name.trim() === "") errors.push("Nom du client manquant");
    if (!res.activity_date) errors.push("Date de l'activité manquante");
    if (res.total_amount <= 0) errors.push("Montant total invalide");

    // Date validation (simple check)
    const date = new Date(res.activity_date);
    if (isNaN(date.getTime())) errors.push("Format de date invalide");

    return { isValid: errors.length === 0, errors };
  };

  // Helper to process text (used by both modes)
  const processText = async (text: string) => {
    setIsProcessing(true);
    setSuccess(false);

    try {
      const extractedData = await parseReservationEmailRest(text);

      if (extractedData) {
        const newReservation: Reservation = {
          id: Math.random().toString(36).substr(2, 9),
          ...extractedData,
          status: 'Nouveau',
          created_at: new Date().toISOString(),
          adults_count: extractedData.adults_count,
          children_count: extractedData.children_count,
          menu_choice: extractedData.menu_choice
        };

        const validation = validateReservation(newReservation);

        if (!validation.isValid) {
          setError(`Validation échouée: ${validation.errors.join(", ")}`);
          newReservation.status = 'En cours'; // Mark as needing attention
          newReservation.notes += ` [Validation Errors: ${validation.errors.join(", ")}]`;
        }

        onReservationAdded(newReservation);
        setSuccess(true);
        if (mode === 'manual') setEmailContent('');

        setTimeout(() => setSuccess(false), 4000);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      if (mode === 'manual') setError("Erreur lors de l'analyse de l'email.");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualProcess = async () => {
    if (!emailContent.trim()) return;
    setError(null);
    const result = await processText(emailContent);
    if (!result) setError("Impossible d'extraire les données de cet email.");
  };

  const handleAuthClick = () => {
    if (!googleClientId) {
      setError("Veuillez entrer un Client ID Google valide.");
      return;
    }
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      setError("Le client Google n'est pas initialisé. Vérifiez le Client ID.");
    }
  };

  const handleGmailScan = async () => {
    if (isScanning || !accessToken) return;

    setIsScanning(true);
    setScanLog([]);
    setError(null);

    const addLog = (msg: string) => setScanLog(prev => [...prev, msg]);

    try {
      addLog("Recherche d'emails (GetYourGuide, Civitatis, Chems Ayour, Reservation)...");
      const messages = await searchEmails(accessToken, '(subject:(reservation OR booking OR confirmation OR order) OR "GetYourGuide" OR "Civitatis" OR "Chems Ayour") newer_than:7d');

      if (messages.length === 0) {
        addLog("Aucun email récent trouvé correspondant aux critères.");
      } else {
        addLog(`${messages.length} email(s) trouvés. Analyse en cours...`);

        let processedCount = 0;

        for (const msg of messages) {
          addLog(`Téléchargement message ID: ${msg.id.substring(0, 6)}...`);
          try {
            const details = await getEmailDetails(accessToken, msg.id);
            const subject = getEmailSubject(details);
            const body = extractEmailBody(details);

            addLog(`Analyse de: "${subject.substring(0, 30)}..."`);

            // Send to Gemini
            const result = await processText(body);

            if (result) {
              addLog("✅ Réservation détectée et ajoutée !");
              processedCount++;
            } else {
              addLog("ℹ️ Pas de données de réservation valides trouvées.");
            }

            await new Promise(r => setTimeout(r, 800));

          } catch (e) {
            console.error(e);
            addLog("❌ Erreur de lecture de l'email.");
          }
        }

        addLog(`Terminé. ${processedCount} réservation(s) ajoutée(s).`);
      }

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "";

      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setAccessToken(null);
        localStorage.removeItem('google_access_token');
        addLog("❌ Session expirée. Déconnexion...");
      } else {
        setError(`Erreur lors du scan: ${errorMessage}`);
        addLog("❌ Erreur critique lors du scan.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const loadSample = () => {
    const randomSample = SAMPLE_EMAILS[Math.floor(Math.random() * SAMPLE_EMAILS.length)];
    setEmailContent(randomSample.body);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 transition-all duration-300">
      {/* Header Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setMode('gmail')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'gmail' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-gray-50 text-gray-500 hover:text-gray-700'
            }`}
        >
          Intégration Gmail
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-gray-50 text-gray-500 hover:text-gray-700'
            }`}
        >
          Saisie Manuelle
        </button>
      </div>

      <div className="p-6">
        {mode === 'manual' ? (
          // MANUAL MODE
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Simulateur d'Agent IA</h2>
                  <p className="text-sm text-gray-500">Collez un email pour tester l'extraction <span className="text-xs bg-green-100 text-green-800 px-1 rounded">v2.0 REST API</span></p>
                </div>
              </div>
              <button onClick={loadSample} className="text-sm text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded transition-colors">
                Charger un exemple
              </button>
            </div>

            <div className="relative">
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Collez le contenu de l'email ici..."
                className="w-full h-40 p-4 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none text-sm font-mono"
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleManualProcess}
                disabled={isProcessing || !emailContent.trim()}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-all ${isProcessing || !emailContent.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                Traiter l'email <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          // GMAIL MODE
          <div className="flex flex-col text-left">
            {!accessToken ? (
              <div className="py-2">

                {/* ID INPUT */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Client Google</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      placeholder="Collez l'ID ici..."
                      className="pl-10 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border font-mono text-gray-700"
                    />
                  </div>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  onClick={handleAuthClick}
                  disabled={!googleClientId}
                  className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-3 transition-all mb-4 ${!googleClientId
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                    }`}
                >
                  <LogIn className="w-5 h-5" />
                  Autoriser l'accès Gmail
                </button>

                {/* DIAGNOSTIC EXPERT */}
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start cursor-pointer" onClick={() => setShowTroubleshoot(!showTroubleshoot)}>
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-900">
                        Diagnostic de l'erreur "storagerelay" ou "400"
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">
                        Si vous voyez <code>redirect_uri=storagerelay...</code>, vérifiez ces 3 points.
                      </p>
                    </div>
                    <ArrowRight className={`w-4 h-4 text-amber-600 transform transition-transform ${showTroubleshoot ? 'rotate-90' : ''}`} />
                  </div>

                  {showTroubleshoot && (
                    <div className="mt-3 pt-3 border-t border-amber-200 text-sm text-amber-900 space-y-4">

                      <div className="flex items-start gap-3 bg-white p-3 rounded border border-amber-100">
                        <div className="min-w-[20px] font-bold text-amber-600 mt-0.5">1</div>
                        <div>
                          <strong className="block text-gray-900">L'URL est incorrecte</strong>
                          <span className="text-gray-600 text-xs">Copiez cette URL exacte et ajoutez-la dans "Origines JavaScript autorisées" :</span>
                          <div className="flex items-center mt-2 gap-2">
                            <code className="flex-1 bg-gray-100 p-2 rounded text-xs font-mono break-all select-all border border-gray-300">
                              {currentOrigin}
                            </code>
                            <button onClick={() => navigator.clipboard.writeText(currentOrigin)} className="p-2 hover:bg-gray-100 rounded text-amber-600" title="Copier">
                              <Key className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="min-w-[20px] font-bold text-amber-600 mt-0.5">2</div>
                        <div>
                          <strong className="block text-gray-900">Le "/" de fin (Trailing Slash)</strong>
                          <span className="text-gray-600 text-xs">Vérifiez dans Google Cloud que l'URL ne finit PAS par <code>/</code>.</span>
                          <div className="mt-1 text-xs">
                            <span className="text-red-500 mr-2">❌ ...webcontainer.io/</span>
                            <span className="text-green-600 font-bold">✅ ...webcontainer.io</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="min-w-[20px] font-bold text-amber-600 mt-0.5">3</div>
                        <div>
                          <div className="flex items-center gap-1">
                            <strong className="text-gray-900">Cookies Tiers bloqués</strong>
                            <Cookie className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="text-gray-600 text-xs">
                            Si vous utilisez <strong>Brave</strong>, <strong>Safari</strong> ou la <strong>Navigation Privée</strong>, l'authentification Google peut échouer (erreur <code>storagerelay</code>). Essayez sur Chrome standard.
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-center text-amber-700 italic border-t border-amber-200 pt-2 mt-2">
                        Après modification dans Google Cloud, attendez 5 minutes (propagation DNS).
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg p-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-800">Connecté avec succès</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={autoScanEnabled} onChange={() => setAutoScanEnabled(!autoScanEnabled)} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${autoScanEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoScanEnabled ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700">Auto-Scan (10m)</span>
                    </label>
                    <button onClick={() => setAccessToken(null)} className="text-xs text-green-700 hover:underline">
                      Déconnecter
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto text-left font-mono text-xs mb-4 shadow-inner custom-scrollbar">
                  {scanLog.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 italic">
                      Prêt à scanner...
                    </div>
                  ) : (
                    scanLog.map((log, i) => (
                      <div key={i} className="text-green-400 mb-1 border-b border-gray-800 pb-1 last:border-0">{'>'} {log}</div>
                    ))
                  )}
                  {isScanning && <div className="text-gray-400 animate-pulse mt-2">{'>'} Scan en cours...</div>}
                </div>

                <button
                  onClick={handleGmailScan}
                  disabled={isScanning}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium transition-all ${isScanning ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                    }`}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Analyse de la boîte de réception...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" /> Scanner les 7 derniers jours
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Status Footer */}
      {(success || error) && (
        <div className={`px-6 py-3 text-sm font-medium flex items-center ${success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
          {success ? (
            <><CheckCircle className="w-4 h-4 mr-2" /> Action terminée avec succès !</>
          ) : (
            <><AlertCircle className="w-4 h-4 mr-2" /> {error}</>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailIngester;
