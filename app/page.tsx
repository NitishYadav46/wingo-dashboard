'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { runBacktest, StrategyResults, HistoryRecord } from '@/utils/strategyEngine';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, AlertOctagon, ListOrdered, Layers, Table } from 'lucide-react';

// 🔴 Direct Keys Hardcoded
const supabaseUrl = "https://mjoqhqruzocmbhhjkjtv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qb3FocXJ1em9jbWJoaGpranR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDg2NjYsImV4cCI6MjEwMjIyNDY2Nn0.MU1awKKiUp3x0laQvazM_nMuj96vyXmw2uG7qEZIR7M";
const supabase = createClient(supabaseUrl, supabaseKey);

const KPIWidget = ({ title, value, icon, color }: any) => (
  <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl shadow-lg flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
    <div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI Controls 
  const [target, setTarget] = useState<'big' | 'small'>('big');
  const [triggerCount, setTriggerCount] = useState(3);
  const [maxLevels, setMaxLevels] = useState(9); // 👈 Ab dynamic level control hai

  useEffect(() => {
    async function fetchData() {
      // 1000 records fetch kar rahe hain test ke liye
      const { data, error } = await supabase
        .from('daman_history')
        .select('*')
        .order('period', { ascending: true })
        .limit(1000); 

      if (!error && data) {
        setHistory(data as HistoryRecord[]);
      } else {
        console.error("Fetch error:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-indigo-500 font-bold">Fetching Supabase Data...</div>;

  const results = runBacktest(history, target, triggerCount, maxLevels);

  // Format timestamp/period to Indian Time Zone if applicable, or display as is
  const formatIST = (timestampVal: any) => {
    if (!timestampVal) return 'N/A';
    try {
      const date = new Date(timestampVal);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      }
    } catch (e) {
      // fallback
    }
    return timestampVal;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="pb-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Research <span className="text-indigo-500">Engine</span></h1>
            <p className="text-gray-400 mt-1">Option B Logic: Wait & Recover (Dynamic Levels)</p>
          </div>
        </header>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Target Result</label>
            <select value={target} onChange={(e) => setTarget(e.target.value as 'big' | 'small')} className="w-full bg-gray-700 text-white p-2 rounded focus:outline-none">
              <option value="big">BIG</option>
              <option value="small">SMALL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Alternating Trigger Count</label>
            <input type="number" value={triggerCount} onChange={(e) => setTriggerCount(Number(e.target.value))} className="w-full bg-gray-700 text-white p-2 rounded focus:outline-none" min="1" max="10"/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Levels (Martingale)</label>
            <input type="number" value={maxLevels} onChange={(e) => setMaxLevels(Number(e.target.value))} className="w-full bg-gray-700 text-white p-2 rounded focus:outline-none" min="1" max="20"/>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIWidget title="Total Rows Analyzed" value={results.totalAnalyzed} icon={<ListOrdered />} color="bg-blue-500/20 text-blue-400" />
          <KPIWidget title="Total Triggers Found" value={results.triggersFound} icon={<Target />} color="bg-indigo-500/20 text-indigo-400" />
          <KPIWidget title={`Failed (Crossed L${maxLevels})`} value={results.failedCount} icon={<AlertOctagon />} color="bg-rose-500/20 text-rose-400" />
          <KPIWidget title="Safe Recoveries" value={results.triggersFound - results.failedCount} icon={<Activity />} color="bg-emerald-500/20 text-emerald-400" />
        </div>

        {/* Win Distribution Chart */}
        <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl h-96 shadow-lg">
          <h3 className="text-lg font-medium text-gray-100 mb-4">Win Distribution by Level (Up to L{maxLevels})</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={results.winDistribution}>
              <XAxis dataKey="level" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip cursor={{fill: '#374151'}} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Data Table Section: All History & IST Time */}
        <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-700 pb-3">
            <Table className="text-indigo-400" size={20} />
            <h3 className="text-lg font-medium text-gray-100">Live Database Records (Supabase History & IST)</h3>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-700/50 text-gray-400 text-sm sticky top-0">
                  <th className="p-3">Period ID</th>
                  <th className="p-3">Result Type</th>
                  <th className="p-3">Number</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">Indian Standard Time (IST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {history.slice().reverse().map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-700/30">
                    <td className="p-3 font-mono text-indigo-300">{row.period}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${row.result_type === 'big' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {row.result_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-bold">{row.number ?? '-'}</td>
                    <td className="p-3 capitalize">{row.color ?? '-'}</td>
                    <td className="p-3 text-gray-400">{formatIST(row.created_at || row.period)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
