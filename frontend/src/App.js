import React, { useState, useEffect, useRef } from 'react';
// Recharts bileşenlerini içe aktarıyoruz
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [data, setData] = useState({ distance: 0, status: "IDLE", confidence: 0 });
  const [processedImg, setProcessedImg] = useState(null);
  const [logs, setLogs] = useState(["SYSTEM_ONLINE", "AWAITING_INPUT"]);
  const [viewMode, setViewMode] = useState('normal');
  const [distanceHistory, setDistanceHistory] = useState([]);
  
  // --- GRAFİK VERİSİ ---
  const [chartData, setChartData] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const isAnalyzing = useRef(false);

  const windowSize = 10;

  const addLog = (msg) => {
    setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const getFilterClass = () => {
    switch (viewMode) {
      case 'thermal': return "invert hue-rotate-[180deg] brightness-[1.2] contrast-[1.5]";
      case 'night': return "sepia-[1] hue-rotate-[100deg] brightness-[1.4] contrast-[1.2]";
      default: return "";
    }
  };

  const sendFrameToBackend = async () => {
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

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

        if (result.distance > 0) {
          // Yumuşatma (Moving Average)
          setDistanceHistory(prev => {
            const newHistory = [...prev, result.distance].slice(-windowSize);
            const avg = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
            const smoothDist = parseFloat(avg.toFixed(2));
            
            setData({ ...result, distance: smoothDist });

            // GRAFİK VERİSİNİ GÜNCELLE (Son 20 ölçüm)
            setChartData(prevChart => [
              ...prevChart.slice(-19), 
              { time: new Date().toLocaleTimeString().slice(-5), dist: smoothDist }
            ]);

            return newHistory;
          });
        } else {
          setData(result);
          setDistanceHistory([]);
        }
        setProcessedImg(`data:image/jpeg;base64,${result.image}`);
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        isAnalyzing.current = false;
        setTimeout(() => { requestRef.current = requestAnimationFrame(sendFrameToBackend); }, 100);
      }
    }, 'image/jpeg', 0.7);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(sendFrameToBackend);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    addLog(`ANALYSIS_START: ${file.name.toUpperCase()}`);
    videoRef.current.src = URL.createObjectURL(file);
    videoRef.current.playbackRate = 0.5;
    videoRef.current.play();
  };

  const downloadPDF = () => {
    window.open("http://127.0.0.1:8000/generate-report", "_blank");
    addLog("PDF_EXPORTED");
  };

  return (
    <div className="min-h-screen bg-black text-emerald-500 font-mono p-4 flex flex-col overflow-hidden">
      <header className="border-b border-emerald-900 pb-2 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter">HELIPAD_DETECTION_SYSTEM</h1>
          <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-[0.3em]">Neural Network Vision Analytics</p>
        </div>
        <div className="text-[10px] text-emerald-900 font-bold">KERNEL: yolo26s</div>
      </header>

      <div className="grid grid-cols-12 gap-6 flex-grow">
        
        {/* SOL PANEL */}
        <div className="col-span-3 flex flex-col gap-4">
          
          <div className="border border-emerald-900 p-3 bg-slate-950/40">
            <p className="text-[9px] mb-2 opacity-40 uppercase">Input</p>
            <input type="file" onChange={handleFile} className="text-[10px] w-full text-transparent file:bg-emerald-900 file:text-white file:border-0 file:px-3 file:py-1 file:cursor-pointer" />
          </div>

          <div className="border border-emerald-900 p-3 bg-black">
            <div className="grid grid-cols-3 gap-1">
              {['normal', 'thermal', 'night'].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`py-1 text-[8px] font-bold border ${viewMode === mode ? 'bg-emerald-600 text-black border-emerald-400' : 'border-emerald-900 text-emerald-900 hover:border-emerald-500'}`}>{mode.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {/* MESAFE VERİSİ */}
          <div className="border-2 border-emerald-500 p-4 bg-emerald-950/10 relative">
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></div>
            <p className="text-[9px] opacity-40 uppercase mb-1">Computed_Distance</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">{data.distance}</span>
              <span className="text-xl font-bold">m</span>
            </div>
            <div className={`mt-3 text-center text-[10px] p-2 font-black tracking-widest uppercase ${data.distance > 0 ? 'bg-emerald-600 text-black animate-pulse' : 'bg-red-900/20 text-red-500 border border-red-900'}`}>{data.status}</div>
          </div>

          {/* CANLI GRAFİK PANELİ (YENİ!) */}
          <div className="border border-emerald-900 p-3 bg-black flex-grow flex flex-col">
            <p className="text-[9px] mb-3 opacity-40 uppercase tracking-widest border-b border-emerald-900 pb-1">Descent_Profile_Graph</p>
            <div className="flex-grow w-full min-h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" />
                  <XAxis dataKey="time" hide={true} />
                  <YAxis domain={[0, 'auto']} stroke="#065f46" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#059669', fontSize: '10px' }} itemStyle={{ color: '#10b981' }} />
                  <Line type="monotone" dataKey="dist" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button onClick={downloadPDF} className="border border-red-900 text-red-700 py-3 text-[10px] hover:bg-red-900 hover:text-white transition-all font-black uppercase tracking-widest">Export PDF Report</button>
        </div>

        {/* SAĞ PANEL */}
        <div className="col-span-9 flex flex-col">
          <div className="relative w-full aspect-video border-2 border-emerald-900 bg-slate-950 overflow-hidden">
            <video ref={videoRef} className="hidden" playsInline muted loop />
            <canvas ref={canvasRef} className="hidden" />

            {processedImg ? (
              <img src={processedImg} className={`w-full h-full object-contain transition-all duration-300 ${getFilterClass()}`} alt="Vision" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20"><div className="w-10 h-10 border-t-2 border-emerald-500 rounded-full animate-spin mb-4"></div><p className="text-xl font-black">LINK_OFFLINE</p></div>
            )}

            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute top-6 left-6 w-12 h-12 border-t border-l border-emerald-500/20"></div>
               <div className="absolute top-6 right-6 w-12 h-12 border-t border-r border-emerald-500/20"></div>
               <div className="absolute bottom-6 left-6 w-12 h-12 border-b border-l border-emerald-500/20"></div>
               <div className="absolute bottom-6 right-6 w-12 h-12 border-b border-r border-emerald-500/20"></div>
            </div>
          </div>
          <div className="mt-2 bg-emerald-950/10 border border-emerald-900 p-3 flex justify-between text-[9px] uppercase opacity-40">
            <span>Core: Neural_Engine_v2.6</span>
            <span>Logic: yolo26s_inference</span>
            <div className="flex gap-4">
              <span>FPS: {processedImg ? "15.0" : "0.0"}</span>
              <span className="text-emerald-500 font-bold">MODE: REAL_TIME_ANALYTICS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;