import sys

with open('src/App.js', 'r') as f:
    content = f.read()

translations_str = """
const translations = {
  en: {
    title: "HELIPAD_DETECTION_SYSTEM",
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
    langToggle: "TR"
  },
  tr: {
    title: "HELİPAD_TESPİT_SİSTEMİ",
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
    langToggle: "EN"
  }
};

function App() {
"""

content = content.replace("function App() {", translations_str)

state_str = """
  const [data, setData] = useState({ distance: 0, status: "IDLE", confidence: 0 });
  const [lang, setLang] = useState('tr');
  const t = translations[lang];
"""
content = content.replace('  const [data, setData] = useState({ distance: 0, status: "IDLE", confidence: 0 });', state_str)

content = content.replace("].map(t => (", "].map(tier => (")
content = content.replace("key={t.label}", "key={tier.label}")
content = content.replace("border ${t.thresh", "border ${tier.thresh")
content = content.replace("${t.color}", "${tier.color}")
content = content.replace(">{t.label}<", ">{tier.label}<")

content = content.replace(">{mode.toUpperCase()}<", ">{t[mode] || mode.toUpperCase()}<")

replacements = {
    ">HELIPAD_DETECTION_SYSTEM<": ">{t.title}<",
    ">Neural Network Vision Analytics<": ">{t.subtitle}<",
    "{isDark ? 'LIGHT' : 'DARK'}": "{isDark ? t.themeLight : t.themeDark}",
    ">KERNEL:": ">{t.kernel}:",
    ">Input<": ">{t.input}<",
    ">CHOOSE FILE<": ">{t.chooseFile}<",
    ">RESUME<": ">{t.resume}<",
    ">PAUSE<": ">{t.pause}<",
    ">Computed_Distance<": ">{t.computedDistance}<",
    ">Confidence_Score<": ">{t.confidenceScore}<",
    "{label: 'LOW',": "{label: t.low,",
    "{label: 'MED',": "{label: t.med,",
    "{label: 'HIGH',": "{label: t.high,",
    ">Descent_Profile_Graph<": ">{t.descentProfile}<",
    ">Export PDF<": ">{t.exportPdf}<",
    ">History<": ">{t.historyBtn}<",
    ">SYSTEM STANDBY<": ">{t.systemStandby}<",
    ">No active input source detected. Please click <": ">{t.standbyDesc1} <",
    '>\\"Choose File\\"<': '>{t.standbyDesc2}<',
    "> in the Input panel on the left to upload a helipad video or image.<": "> {t.standbyDesc3}<",
    ">LOADING FRAME / LINK_OFFLINE<": ">{t.loading}<",
    ">Core:": ">{t.core}:",
    ">Logic:": ">{t.logic}:",
    ">MODE: REAL_TIME_ANALYTICS<": ">{t.mode}<",
    ">System_Log<": ">{t.systemLog}<",
    ">LIVE<": ">{t.live}<",
    "Detections ({detections.length})": "{t.detections} ({detections.length})",
    ">MULTI-TARGET<": ">{t.multiTarget}<",
    "★ PRIMARY": "★ {t.primary}",
    ">Analysis_History<": ">{t.analysisHistory}<",
    "✕ CLOSE": "✕ {t.close}",
    ">No history records found.<": ">{t.noHistory}<",
    "{['#','Timestamp','Source','Detections','Distance','Conf','Min','Max','Avg']": "{['#', t.timestamp, t.source, t.detections, t.distance, t.conf, t.min, t.max, t.avg]"
}

for old, new in replacements.items():
    content = content.replace(old, new)
    
theme_toggle_old = '''          <button
            onClick={() => { setIsDark(d => !d); addLog(isDark ? 'THEME: LIGHT_MODE' : 'THEME: DARK_MODE'); }}
            className={`flex items-center gap-2 border ${theme.panelBorder} px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all duration-200 hover:opacity-80`}
            title="Toggle theme"
          >
            <span>{isDark ? '☀' : '🌙'}</span>
            <span>{isDark ? t.themeLight : t.themeDark}</span>
          </button>'''

theme_toggle_new = theme_toggle_old + '''
          {/* LANGUAGE TOGGLE */}
          <button
            onClick={() => setLang(l => l === 'en' ? 'tr' : 'en')}
            className={`flex items-center gap-2 border ${theme.panelBorder} px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all duration-200 hover:opacity-80`}
            title="Toggle language"
          >
            <span>🌐</span>
            <span>{t.langToggle}</span>
          </button>'''

content = content.replace(theme_toggle_old, theme_toggle_new)

with open('src/App.js', 'w') as f:
    f.write(content)

