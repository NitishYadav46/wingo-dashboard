
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { runBacktest, StrategyResults, HistoryRecord } from '@/utils/strategyEngine';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, AlertOctagon, ListOrdered } from 'lucide-react';

// 🔴 Direct Keys Hardcoded (Testing ke liye)
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
  const maxLevels = 9;

  useEffect(() => {
    async function fetchData() {
      // 1000 records fetch kar rahe hain test ke liye (Oldest to Newest)
      const { data, error } = await supabase
        .from('daman_history')
        .select('period, result_type')
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="pb-4 border-b border-gray-800">
          <h1 className="text-3xl font-extrabold text-white">Research <span className="text-indigo-500">Engine</span></h1>
          <p className="text-gray-400 mt-1">Option B Logic: Wait & Recover (Up to {maxLevels} Levels)</p>
        </header>

        {/* Controls */}
        <div className="flex space-x-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Target</label>
            <select value={target} onChange={(e) => setTarget(e.target.value as 'big' | 'small')} className="bg-gray-700 text-white p-2 rounded focus:outline-none">
              <option value="big">BIG</option>
              <option value="small">SMALL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Alternating Trigger</label>
            <input type="number" value={triggerCount} onChange={(e) => setTriggerCount(Number(e.target.value))} className="bg-gray-700 text-white p-2 rounded w-20 focus:outline-none" min="1" max="10"/>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIWidget title="Total Rows Analyzed" value={results.totalAnalyzed} icon={<ListOrdered />} color="bg-blue-500/20 text-blue-400" />
          <KPIWidget title="Total Triggers Found" value={results.triggersFound} icon={<Target />} color="bg-indigo-500/20 text-indigo-400" />
          <KPIWidget title="Failed (Crossed L9)" value={results.failedCount} icon={<AlertOctagon />} color="bg-rose-500/20 text-rose-400" />
          <KPIWidget title="Safe Recoveries" value={results.triggersFound - results.failedCount} icon={<Activity />} color="bg-emerald-500/20 text-emerald-400" />
        </div>

        {/* Win Distribution Chart */}
        <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl h-96 shadow-lg">
          <h3 className="text-lg font-medium text-gray-100 mb-4">Win Distribution by Level (Total: {results.triggersFound - results.failedCount} Wins)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={results.winDistribution}>
              <XAxis dataKey="level" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip cursor={{fill: '#374151'}} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
