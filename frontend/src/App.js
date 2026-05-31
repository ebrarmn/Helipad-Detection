import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const translations = {
  en: {
    title: "HELIPAD DETECTION SYSTEM",
    subtitle: "Neural Network Vision Analytics",
    themeLight: "LIGHT",
    themeDark: "DARK",
    kernel: "KERNEL",
    input: "Input",
    chooseFile: "CHOOSE FILE",
    pause: "PAUSE",
    resume: "RESUME",
    normal: "NORMAL",
    thermal: "THERMAL",
    night: "NIGHT",
    computedDistance: "Computed_Distance",
    confidenceScore: "Confidence_Score",
    low: "LOW",
    med: "MED",
    high: "HIGH",
    descentProfile: "Descent_Profile_Graph",
    exportPdf: "Export PDF",
    historyBtn: "History",
    systemStandby: "SYSTEM STANDBY",
    standbyDesc1: "No active input source detected. Please click",
    standbyDesc2: '"Choose File"',
    standbyDesc3: "in the Input panel on the left to upload a helipad video or image.",
    loading: "LOADING FRAME / LINK_OFFLINE",
    core: "Core",
    logic: "Logic",
    mode: "MODE: REAL_TIME_ANALYTICS",
    systemLog: "System_Log",
    live: "LIVE",
    detections: "Detections",
    multiTarget: "MULTI-TARGET",
    primary: "PRIMARY",
    analysisHistory: "Analysis_History",
    close: "CLOSE",
    noHistory: "No history records found.",
    timestamp: "Timestamp",
    source: "Source",
    distance: "Distance",
    conf: "Conf",
    min: "Min",
    max: "Max",
    avg: "Avg",
    IDLE: "IDLE",
    SYSTEM_ONLINE: "SYSTEM_ONLINE",
    AWAITING_INPUT: "AWAITING_INPUT",
    STREAM_RESUMED: "STREAM_RESUMED",
    STREAM_PAUSED: "STREAM_PAUSED",
    PDF_REPORT_EXPORTED: "PDF_REPORT_EXPORTED",
    langToggle: "TR"
  },
  tr: {
    title: "HELİPAD TESPİT SİSTEMİ",
    subtitle: "Sinir Ağı Görüntü Analitiği",
    themeLight: "AÇIK",
    themeDark: "KOYU",
    kernel: "ÇEKİRDEK",
    input: "Girdi",
    chooseFile: "DOSYA SEÇ",
    pause: "DURAKLAT",
    resume: "DEVAM ET",
    normal: "NORMAL",
    thermal: "TERMAL",
    night: "GECE",
    computedDistance: "Hesaplanan_Mesafe",
    confidenceScore: "Güven_Skoru",
    low: "DÜŞÜK",
    med: "ORTA",
    high: "YÜKSEK",
    descentProfile: "İniş_Profili_Grafiği",
    exportPdf: "PDF İndir",
    historyBtn: "Geçmiş",
    systemStandby: "SİSTEM BEKLEMEDE",
    standbyDesc1: "Aktif giriş kaynağı algılanmadı. Lütfen sol taraftaki panelden",
    standbyDesc2: '"Dosya Seç"',
    standbyDesc3: "butonuna tıklayarak bir helipad videosu veya görseli yükleyin.",
    loading: "KARE YÜKLENİYOR / BAĞLANTI_ÇEVRİMDIŞI",
    core: "Çekirdek",
    logic: "Mantık",
    mode: "MOD: GERÇEK_ZAMANLI_ANALİTİK",
    systemLog: "Sistem_Günlüğü",
    live: "CANLI",
    detections: "Tespitler",
    multiTarget: "ÇOKLU-HEDEF",
    primary: "BİRİNCİL",
    analysisHistory: "Analiz_Geçmişi",
    close: "KAPAT",
    noHistory: "Geçmiş kaydı bulunamadı.",
    timestamp: "Zaman Damgası",
    source: "Kaynak",
    distance: "Mesafe",
    conf: "Güven",
    min: "Min",
    max: "Maks",
    avg: "Ort",
    IDLE: "BOŞTA",
    SYSTEM_ONLINE: "SİSTEM_AKTİF",
    AWAITING_INPUT: "GİRDİ_BEKLENİYOR",
    STREAM_RESUMED: "YAYIN_DEVAM_EDİYOR",
    STREAM_PAUSED: "YAYIN_DURAKLATILDI",
    PDF_REPORT_EXPORTED: "PDF_RAPORU_DIŞA_AKTARILDI",
    langToggle: "EN"
  }
};

function App() {


  const [data, setData] = useState({ distance: 0, status: "IDLE", confidence: 0 });
  const [lang, setLang] = useState('tr');
  const t = translations[lang];

  const [processedImg, setProcessedImg] = useState(null);
  const [logs, setLogs] = useState(["SYSTEM_ONLINE", "AWAITING_INPUT"]);
  const [viewMode, setViewMode] = useState('normal');
  const [distanceHistory, setDistanceHistory] = useState([]);
  const [hasFile, setHasFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [chartData, setChartData] = useState([]);
  const [fps, setFps] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [detections, setDetections] = useState([]);       // Feature 8 & 9
  const [isImageMode, setIsImageMode] = useState(false);  // Feature 12
  const [history, setHistory] = useState([]);              // Feature 10
  const [showHistory, setShowHistory] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const isAnalyzing = useRef(false);
  const frameTimestamps = useRef([]);
  const logEndRef = useRef(null);

  const windowSize = 10;

  // ---- THEME ----
  const theme = {
    bg: isDark ? 'bg-black' : 'bg-slate-50',
    text: isDark ? 'text-emerald-500' : 'text-slate-800',
    headerBorder: isDark ? 'border-emerald-900' : 'border-slate-300',
    panelBg: isDark ? 'bg-slate-950/40' : 'bg-white shadow-sm',
    panelBorder: isDark ? 'border-emerald-900' : 'border-slate-200',
    labelOpacity: isDark ? 'opacity-40' : 'text-slate-500 font-bold',
    cardBg: isDark ? 'bg-black' : 'bg-white shadow-sm',
    viewerBg: isDark ? 'bg-slate-950' : 'bg-slate-900',
    footerBg: isDark ? 'bg-emerald-950/10' : 'bg-slate-100',
    logBg: isDark ? 'bg-black' : 'bg-slate-900',
    kernelText: isDark ? 'text-emerald-900' : 'text-slate-400',
    titleText: isDark ? 'text-white' : 'text-slate-900',
    subtitleText: isDark ? 'text-emerald-700' : 'text-slate-500',
    chartGrid: isDark ? '#064e3b' : '#e2e8f0',
    chartAxis: isDark ? '#065f46' : '#64748b',
    chartLine: isDark ? '#10b981' : '#059669',
    tooltipBg: isDark ? '#000' : '#fff',
    tooltipBorder: isDark ? '#059669' : '#cbd5e1',
    tooltipItem: isDark ? '#10b981' : '#0f172a',
    cornerBorder: isDark ? 'border-emerald-500/20' : 'border-slate-500/40',
    footerText: isDark ? 'opacity-40' : 'text-slate-500',
  };

  const addLog = useCallback((msg) => {
    setLogs(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Auto-scroll log panel
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getFilterClass = () => {
    switch (viewMode) {
      case 'thermal': return "invert hue-rotate-[180deg] brightness-[1.2] contrast-[1.5]";
      case 'night': return "sepia-[1] hue-rotate-[100deg] brightness-[1.4] contrast-[1.2]";
      default: return "";
    }
  };

  // ---- REAL FPS CALCULATION ----
  const updateFps = useCallback(() => {
    const now = performance.now();
    frameTimestamps.current.push(now);
    // Keep only last 30 frames
    frameTimestamps.current = frameTimestamps.current.filter(t => now - t < 1000);
    setFps(frameTimestamps.current.length);
  }, []);

  const sendFrameToBackend = useCallback(async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || isAnalyzing.current) {
      requestRef.current = requestAnimationFrame(sendFrameToBackend);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0) {
      requestRef.current = requestAnimationFrame(sendFrameToBackend);
      return;
    }

    const MAX_W = 640;
    const scale = video.videoWidth > MAX_W ? MAX_W / video.videoWidth : 1;
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        requestRef.current = requestAnimationFrame(sendFrameToBackend);
        return;
      }

      isAnalyzing.current = true;
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      try {
        const response = await fetch('http://127.0.0.1:8000/analyze', { method: 'POST', body: formData });
        const result = await response.json();

        updateFps();
        setDetections(result.detections || []);

        if (result.distance > 0) {
          setDistanceHistory(prev => {
            const newHistory = [...prev, result.distance].slice(-windowSize);
            const avg = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
            const smoothDist = parseFloat(avg.toFixed(2));
            setData({ ...result, distance: smoothDist });
            setChartData(prevChart => [
              ...prevChart.slice(-19),
              { time: new Date().toLocaleTimeString().slice(-5), dist: smoothDist }
            ]);
            return newHistory;
          });
          if ((result.detections || []).length > 1)
            addLog(`MULTI_TARGET: ${result.detections.length} helipads | PRIMARY @ ${result.distance.toFixed(1)}m`);
          else
            addLog(`TARGET_LOCKED @ ${result.distance.toFixed(1)}m | CONF: ${(result.confidence * 100).toFixed(0)}%`);
        } else {
          setData(result);
          setDistanceHistory([]);
        }
        setProcessedImg(`data:image/jpeg;base64,${result.image}`);
      } catch (err) {
        console.error("Stream error:", err);
        addLog("STREAM_ERROR: BACKEND_UNREACHABLE");
      } finally {
        isAnalyzing.current = false;
        requestRef.current = requestAnimationFrame(sendFrameToBackend);
      }
    }, 'image/jpeg', 0.5);
  }, [addLog, updateFps]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(sendFrameToBackend);
    return () => cancelAnimationFrame(requestRef.current);
  }, [sendFrameToBackend]);

  const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'bmp', 'webp'];

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) { setHasFile(false); setFileName(''); return; }

    const ext = file.name.split('.').pop().toLowerCase();
    const isImg = IMAGE_EXTS.includes(ext);
    setIsImageMode(isImg);
    setFileName(file.name);
    setHasFile(true);
    setDetections([]);
    frameTimestamps.current = [];
    setFps(0);

    if (isImg) {
      // Feature 12: single image analysis
      addLog(`IMAGE_ANALYSIS: ${file.name.toUpperCase()}`);
      const formData = new FormData();
      formData.append('file', file, file.name);
      try {
        const res = await fetch('http://127.0.0.1:8000/analyze-image', { method: 'POST', body: formData });
        const result = await res.json();
        setDetections(result.detections || []);
        setData(result);
        setProcessedImg(`data:image/jpeg;base64,${result.image}`);
        addLog(`IMAGE_DONE: ${result.detections?.length || 0} target(s) | ${result.distance}m`);
      } catch (err) {
        addLog('IMAGE_ERROR: BACKEND_UNREACHABLE');
      }
    } else {
      // Video mode
      addLog(`ANALYSIS_START: ${file.name.toUpperCase()}`);
      fetch('http://127.0.0.1:8000/session/start?source=' + encodeURIComponent(file.name), { method: 'POST' });
      videoRef.current.src = URL.createObjectURL(file);
      videoRef.current.playbackRate = 0.5;
      videoRef.current.play();
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/history');
      const json = await res.json();
      setHistory(json.history || []);
      setShowHistory(true);
      addLog(`HISTORY_LOADED: ${json.history.length} sessions`);
    } catch {
      addLog('HISTORY_ERROR: BACKEND_UNREACHABLE');
    }
  };

  const togglePause = () => {
    if (!videoRef.current || !hasFile) return;
    if (isPaused) {
      videoRef.current.play();
      setIsPaused(false);
      addLog('STREAM_RESUMED');
    } else {
      videoRef.current.pause();
      setIsPaused(true);
      addLog('STREAM_PAUSED');
    }
  };

  const downloadPDF = () => {
    fetch('http://127.0.0.1:8000/session/end', { method: 'POST' });
    window.open("http://127.0.0.1:8000/generate-report", "_blank");
    addLog("PDF_REPORT_EXPORTED");
  };

  // ---- CONFIDENCE COLOR ----
  const getConfidenceColor = (conf) => {
    if (conf >= 0.75) return { bar: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/50' };
    if (conf >= 0.5) return { bar: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/50' };
    return { bar: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/50' };
  };
  const confColors = getConfidenceColor(data.confidence);
  const confPct = Math.round(data.confidence * 100);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-mono p-4 flex flex-col overflow-hidden transition-colors duration-300`}>

      {/* HEADER */}
      <header className={`border-b ${theme.headerBorder} pb-2 mb-4 flex justify-between items-end`}>
        <div>
          <h1 className={`text-2xl font-black ${theme.titleText} italic tracking-tighter`}>{t.title}</h1>
          <p className={`text-[10px] ${theme.subtitleText} font-bold uppercase tracking-[0.3em]`}>{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-6">
          {/* THEME TOGGLE */}
          <button
            onClick={() => { setIsDark(d => !d); addLog(isDark ? 'THEME: LIGHT_MODE' : 'THEME: DARK_MODE'); }}
            className={`flex items-center gap-2 border ${theme.panelBorder} px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all duration-200 hover:opacity-80`}
            title="Toggle theme"
          >
            <span>{isDark ? '☀' : '🌙'}</span>
            <span>{isDark ? t.themeLight : t.themeDark}</span>
          </button>
          {/* LANGUAGE TOGGLE */}
          <button
            onClick={() => setLang(l => l === 'en' ? 'tr' : 'en')}
            className={`flex items-center gap-2 border ${theme.panelBorder} px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all duration-200 hover:opacity-80`}
            title="Toggle language"
          >
            <span>🌐</span>
            <span>{t.langToggle}</span>
          </button>
          <div className={`text-[10px] ${theme.kernelText} font-bold`}>{t.kernel}: yolo26s</div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 flex-grow">

        {/* LEFT PANEL */}
        <div className="col-span-3 flex flex-col gap-3">

          {/* INPUT */}
          <div className={`border ${theme.panelBorder} p-3 ${theme.panelBg} flex flex-col gap-2`}>
            <p className={`text-[9px] ${theme.labelOpacity} uppercase`}>{t.input}</p>
            <div className="flex items-center gap-3">
              <label htmlFor="file-upload" className="inline-block bg-emerald-900 hover:bg-emerald-800 text-white text-[9px] px-3 py-1.5 cursor-pointer font-black border border-emerald-700 transition-all uppercase tracking-wider">
                {t.chooseFile}
              </label>
              <input id="file-upload" type="file" onChange={handleFile} className="hidden" />
              {fileName && (
                <span className={`text-[8px] text-emerald-400 font-bold truncate max-w-[110px] uppercase tracking-wider`} title={fileName}>
                  {fileName}
                </span>
              )}
            </div>
            {hasFile && (
              <button
                onClick={togglePause}
                className={`flex items-center justify-center gap-2 w-full py-1.5 text-[9px] font-black border transition-all uppercase tracking-widest ${isPaused
                    ? 'bg-emerald-700 border-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-red-950/40 border-red-800 text-red-400 hover:bg-red-900/60 hover:text-white'
                  }`}
              >
                {isPaused ? (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    RESUME
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    PAUSE
                  </>
                )}
              </button>
            )}
          </div>

          {/* VIEW MODE */}
          <div className={`border ${theme.panelBorder} p-3 ${theme.cardBg}`}>
            <div className="grid grid-cols-3 gap-1">
              {['normal', 'thermal', 'night'].map(mode => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); addLog(`VIEW_MODE: ${mode.toUpperCase()}`); }}
                  className={`py-1 text-[8px] font-bold border transition-all ${viewMode === mode ? 'bg-emerald-600 text-black border-emerald-400' : `${theme.panelBorder} ${theme.kernelText} hover:border-emerald-500`}`}
                >
                  {t[mode] || mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* DISTANCE */}
          <div className={`border-2 ${isDark ? 'border-emerald-500 bg-emerald-950/10' : 'border-emerald-500 bg-emerald-50 shadow-sm'} p-4 relative`}>
            <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${isDark ? 'border-emerald-400' : 'border-emerald-600'}`}></div>
            <p className={`text-[9px] ${theme.labelOpacity} uppercase mb-1`}>{t.computedDistance}</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-black ${theme.titleText}`}>{data.distance}</span>
              <span className="text-xl font-bold">m</span>
            </div>
            <div className={`mt-3 text-center text-[10px] p-2 font-black tracking-widest uppercase ${data.distance > 0 ? 'bg-emerald-600 text-black animate-pulse' : 'bg-red-900/20 text-red-500 border border-red-900'}`}>
              {t[data.status] || data.status}
            </div>
          </div>

          {/* CONFIDENCE GAUGE */}
          <div className={`border ${theme.panelBorder} p-3 ${theme.panelBg}`}>
            <div className="flex justify-between items-center mb-2">
              <p className={`text-[9px] ${theme.labelOpacity} uppercase`}>{t.confidenceScore}</p>
              <span className={`text-[11px] font-black ${confColors.text}`}>{confPct}%</span>
            </div>
            {/* Track */}
            <div className={`w-full h-2 ${isDark ? 'bg-slate-900' : 'bg-gray-200'} rounded-full overflow-hidden`}>
              <div
                className={`h-full ${confColors.bar} rounded-full transition-all duration-500 shadow-sm ${confColors.glow}`}
                style={{ width: `${confPct}%` }}
              />
            </div>
            {/* Tick marks */}
            <div className="flex justify-between mt-1">
              {[0, 25, 50, 75, 100].map(tick => (
                <span key={tick} className={`text-[7px] ${theme.labelOpacity} font-bold`}>{tick}</span>
              ))}
            </div>
            {/* Tier labels */}
            <div className="mt-2 flex gap-2 flex-wrap">
              {[
                { label: 'LOW', color: 'text-red-500', thresh: confPct < 50 },
                { label: 'MED', color: 'text-amber-500', thresh: confPct >= 50 && confPct < 75 },
                { label: 'HIGH', color: 'text-emerald-500', thresh: confPct >= 75 },
              ].map(tier => (
                <span
                  key={tier.label}
                  className={`text-[8px] font-black px-1.5 py-0.5 border ${tier.thresh ? `${tier.color} border-current` : `${isDark ? 'border-slate-800 text-slate-700' : 'border-gray-300 text-gray-400'}`} transition-colors duration-300`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* DESCENT PROFILE GRAPH */}
          <div className={`border ${theme.panelBorder} p-3 ${theme.cardBg} flex-grow flex flex-col`}>
            <p className={`text-[9px] mb-3 ${theme.labelOpacity} uppercase tracking-widest border-b ${theme.panelBorder} pb-1`}>{t.descentProfile}</p>
            <div className="flex-grow w-full min-h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                  <XAxis dataKey="time" hide={true} />
                  <YAxis domain={[0, 'auto']} stroke={theme.chartAxis} fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, fontSize: '10px' }}
                    itemStyle={{ color: theme.tooltipItem }}
                  />
                  <Line type="monotone" dataKey="dist" stroke={theme.chartLine} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* EXPORT + HISTORY BUTTONS */}
          <div className="flex gap-2">
            <button
              onClick={downloadPDF}
              className="flex-1 border border-red-900 text-red-700 py-3 text-[9px] hover:bg-red-900 hover:text-white transition-all font-black uppercase tracking-widest"
            >
              {t.exportPdf}
            </button>
            <button
              onClick={fetchHistory}
              className={`flex-1 border ${theme.panelBorder} text-[9px] py-3 font-black uppercase tracking-widest hover:bg-emerald-900/30 transition-all`}
            >
              {t.historyBtn}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-9 flex flex-col gap-3">
          {/* VIDEO VIEWER */}
          <div className={`relative w-full aspect-video border-2 border-emerald-900 ${theme.viewerBg} overflow-hidden`}>
            <video ref={videoRef} className="hidden" playsInline muted loop />
            <canvas ref={canvasRef} className="hidden" />

            {!hasFile ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950/50 backdrop-blur-sm">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-md animate-pulse"></div>
                  <div className="w-16 h-16 border-2 border-amber-500/40 flex items-center justify-center rounded-full bg-amber-950/20 relative z-10">
                    <svg className="w-8 h-8 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-black text-amber-500 tracking-[0.2em] mb-2 uppercase">{t.systemStandby}</h3>
                <p className="text-[11px] text-amber-600/80 max-w-sm uppercase font-bold tracking-wider leading-relaxed">
                  {t.standbyDesc1} <span className="text-white border-b border-white/30 pb-[1px]">{t.standbyDesc2}</span> {t.standbyDesc3}
                </p>
              </div>
            ) : processedImg ? (
              <img src={processedImg} className={`w-full h-full object-contain transition-all duration-300 ${getFilterClass()}`} alt="Vision" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-60">
                <div className="w-12 h-12 border-4 border-emerald-950 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-black tracking-widest text-emerald-500 uppercase animate-pulse">{t.loading}</p>
              </div>
            )}

            {/* Corner decorations */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute top-6 left-6 w-12 h-12 border-t border-l ${theme.cornerBorder}`}></div>
              <div className={`absolute top-6 right-6 w-12 h-12 border-t border-r ${theme.cornerBorder}`}></div>
              <div className={`absolute bottom-6 left-6 w-12 h-12 border-b border-l ${theme.cornerBorder}`}></div>
              <div className={`absolute bottom-6 right-6 w-12 h-12 border-b border-r ${theme.cornerBorder}`}></div>
            </div>
          </div>

          {/* STATUS BAR */}
          <div className={`${theme.footerBg} border ${theme.panelBorder} p-3 flex justify-between text-[9px] uppercase ${theme.footerText}`}>
            <span>{t.core}: Neural_Engine_v2.6</span>
            <span>{t.logic}: yolo26s_inference</span>
            <div className="flex gap-4">
              <span className={fps > 0 ? 'text-emerald-400 font-black' : ''}>
                FPS: <span className="font-black">{fps}</span>
              </span>
              <span className="text-emerald-500 font-bold">{t.mode}</span>
            </div>
          </div>

          {/* LIVE LOG PANEL */}
          <div className={`border ${theme.panelBorder} flex flex-col`} style={{ height: '130px' }}>
            <div className={`flex items-center justify-between px-3 py-1.5 border-b ${theme.panelBorder} ${theme.panelBg}`}>
              <p className={`text-[9px] ${theme.labelOpacity} uppercase tracking-widest font-black`}>{t.systemLog}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] text-emerald-600 font-bold uppercase">{t.live}</span>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-2 ${theme.logBg}`}>
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`text-[8px] font-bold leading-5 transition-all ${i === logs.length - 1 ? 'text-emerald-400' : 'text-emerald-700'}`}
                >
                  <span className="text-emerald-700 mr-1">&gt;</span>
                  {(() => {
                    let text = log;
                    ['SYSTEM_ONLINE', 'AWAITING_INPUT', 'STREAM_RESUMED', 'STREAM_PAUSED', 'PDF_REPORT_EXPORTED'].forEach(k => {
                      if (t[k]) text = text.replace(k, t[k]);
                    });
                    return text;
                  })()}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* DETECTIONS PANEL — Feature 8 & 9 */}
          {detections.length > 0 && (
            <div className={`border ${theme.panelBorder} ${theme.panelBg}`}>
              <div className={`flex items-center justify-between px-3 py-1.5 border-b ${theme.panelBorder}`}>
                <p className={`text-[9px] ${theme.labelOpacity} uppercase tracking-widest font-black`}>{t.detections} ({detections.length})</p>
                {detections.length > 1 && <span className="text-[8px] text-amber-500 font-black">{t.multiTarget}</span>}
              </div>
              <div className="overflow-y-auto max-h-28">
                {detections.map((det, i) => (
                  <div key={i} className={`flex justify-between items-center px-3 py-1 text-[8px] border-b ${theme.panelBorder} last:border-0`}>
                    <span className={`font-black ${i === 0 ? 'text-emerald-400' : theme.labelOpacity}`}>
                      #{i + 1} {i === 0 ? `★ ${t.primary}` : ''}
                    </span>
                    <span className="font-bold">{det.distance}m</span>
                    <span className={det.confidence >= 0.75 ? 'text-emerald-500' : det.confidence >= 0.5 ? 'text-amber-500' : 'text-red-500'}>
                      {Math.round(det.confidence * 100)}%
                    </span>
                    <span className={`${theme.labelOpacity} font-mono`}>
                      [{Math.round(det.bbox.x1)},{Math.round(det.bbox.y1)}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* HISTORY MODAL — Feature 10 */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowHistory(false)}>
          <div
            className={`${theme.panelBg} border ${theme.panelBorder} w-full max-w-2xl max-h-[70vh] flex flex-col`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-4 py-3 border-b ${theme.panelBorder}`}>
              <p className="text-[11px] font-black uppercase tracking-widest">{t.analysisHistory}</p>
              <button onClick={() => setShowHistory(false)} className="text-[9px] font-black hover:text-red-500 transition-colors">✕ {t.close}</button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {history.length === 0 ? (
                <p className={`text-[9px] ${theme.labelOpacity} text-center py-8 uppercase`}>{t.noHistory}</p>
              ) : (
                <table className="w-full text-[8px] font-mono">
                  <thead>
                    <tr className={`border-b ${theme.panelBorder} ${theme.labelOpacity}`}>
                      {['#', t.timestamp, t.source, t.detections, t.distance, t.conf, t.min, t.max, t.avg].map(h => (
                        <th key={h} className="text-left px-2 py-1 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className={`border-b ${theme.panelBorder} hover:bg-emerald-900/10 transition-colors`}>
                        <td className="px-2 py-1 opacity-40">{row.id}</td>
                        <td className="px-2 py-1">{row.timestamp?.slice(0, 19)}</td>
                        <td className="px-2 py-1 max-w-[100px] truncate" title={row.source}>{row.source}</td>
                        <td className="px-2 py-1 text-amber-500 font-black">{row.detections}</td>
                        <td className="px-2 py-1 text-emerald-400">{row.distance}m</td>
                        <td className="px-2 py-1">{Math.round((row.confidence || 0) * 100)}%</td>
                        <td className="px-2 py-1 opacity-60">{row.min_dist}m</td>
                        <td className="px-2 py-1 opacity-60">{row.max_dist}m</td>
                        <td className="px-2 py-1 opacity-60">{row.avg_dist}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;