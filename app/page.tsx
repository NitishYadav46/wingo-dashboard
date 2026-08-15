'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { runBacktestWithDetails, HistoryRecord } from '@/utils/strategyEngine';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, AlertOctagon, ListOrdered, Table } from 'lucide-react';

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
  
  const [target, setTarget] = useState<'big' | 'small'>('big');
  const [triggerCount, setTriggerCount] = useState(3);
  const [maxLevels, setMaxLevels] = useState(9);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('daman_history')
        .select('*')
        .order('period', { ascending: true })
        .limit(10000); 

      if (!error && data) {
        setHistory(data as HistoryRecord[]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-indigo-500 font-bold">Fetching Supabase Data...</div>;

  const results = runBacktestWithDetails(history, target, triggerCount, maxLevels);

  const formatIST = (timestampVal: any) => {
    if (!timestampVal) return 'N/A';
    try {
      const date = new Date(timestampVal);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      }
    } catch (e) {}
    return timestampVal;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="pb-4 border-b border-gray-800">
          <h1 className="text-3xl font-extrabold text-white">Research <span className="text-indigo-500">Engine</span> with Direct Indicators</h1>
          <p className="text-gray-400 mt-1">Option B Logic: Pattern Validation & Table Indicators</p>
        </header>

        {/* Controls */}
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
            <label className="block text-sm text-gray-400 mb-1">Max Levels</label>
            <input type="number" value={maxLevels} onChange={(e) => setMaxLevels(Number(e.target.value))} className="w-full bg-gray-700 text-white p-2 rounded focus:outline-none" min="1" max="20"/>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIWidget title="Total Rows Analyzed" value={results.totalAnalyzed} icon={<ListOrdered />} color="bg-blue-500/20 text-blue-400" />
          <KPIWidget title="Total Triggers Found" value={results.triggersFound} icon={<Target />} color="bg-indigo-500/20 text-indigo-400" />
          <KPIWidget title={`Failed (>L${maxLevels})`} value={results.failedCount} icon={<AlertOctagon />} color="bg-rose-500/20 text-rose-400" />
          <KPIWidget title="Safe Recoveries" value={results.triggersFound - results.failedCount} icon={<Activity />} color="bg-emerald-500/20 text-emerald-400" />
        </div>

        {/* Chart */}
        <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl h-96 shadow-lg">
          <h3 className="text-lg font-medium text-gray-100 mb-4">Win Distribution by Level</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={results.winDistribution}>
              <XAxis dataKey="level" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip cursor={{fill: '#374151'}} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Live Table with Direct Indicators */}
        <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-700 pb-3">
            <Table className="text-indigo-400" size={20} />
            <h3 className="text-lg font-medium text-gray-100">Live Database Records with Strategy Indicators</h3>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-700/50 text-gray-400 text-sm sticky top-0">
                  <th className="p-3">Period ID</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Number / Color</th>
                  <th className="p-3">Time (IST)</th>
                  <th className="p-3">Strategy Indicator / Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {results.analyzedRows.slice().reverse().map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-700/30">
                    <td className="p-3 font-mono text-indigo-300">{row.period}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${row.result_type === 'big' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {row.result_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">{row.number} ({row.color})</td>
                    <td className="p-3 text-gray-400 text-xs">{formatIST(row.created_at || row.period)}</td>
                    <td className="p-3 font-medium">
                      {row.signalStatus === 'TRIGGER' && (
                        <span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full text-xs border border-indigo-500/30">
                          🎯 {row.levelInfo}
                        </span>
                      )}
                      {row.signalStatus === 'WIN' && (
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs border border-emerald-500/30 font-bold">
                          ✅ {row.levelInfo}
                        </span>
                      )}
                      {row.signalStatus === 'LOSS_RECOVERY' && (
                        <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-xs border border-amber-500/30">
                          ⚠️ {row.levelInfo}
                        </span>
                      )}
                      {row.signalStatus === 'NORMAL' && (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </td>
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
