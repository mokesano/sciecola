import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_INSIGHTS = [
  {
    id: 1,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
    ),
    text: "Publikasi terkait SDG 13 (Climate Action) meningkat 32% dalam 3 tahun terakhir."
  },
  {
    id: 2,
    iconColor: "text-red-400",
    iconBg: "bg-red-500/20",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
    ),
    text: "Topik Quality Education (SDG 4) paling banyak diteliti oleh peneliti dari Indonesia."
  },
  {
    id: 3,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/20",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
    ),
    text: "Kolaborasi internasional pada riset SDG 3 meningkat 28% dibanding tahun lalu."
  }
];

// Icon color cycle for API-fetched items
const ICON_STYLES = [
  { iconColor: "text-green-400", iconBg: "bg-green-500/20" },
  { iconColor: "text-red-400",   iconBg: "bg-red-500/20"   },
  { iconColor: "text-orange-400",iconBg: "bg-orange-500/20"},
];

const InsightsAI = () => {
  const [insightsData, setInsightsData] = useState(DEFAULT_INSIGHTS);

  useEffect(() => {
    fetch('/api/insights.php')
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'ok' && Array.isArray(json.insights) && json.insights.length > 0) {
          const top3 = json.insights.slice(0, 3).map((item, i) => ({
            id: item.id,
            ...ICON_STYLES[i % ICON_STYLES.length],
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
            text: item.text,
          }));
          setInsightsData(top3);
        }
      })
      .catch(() => {
        // keep defaults
      });
  }, []);

  return (
    <div className="bg-[#1e1b4b] rounded-2xl p-6 text-white h-full flex flex-col shadow-lg relative overflow-hidden">
      {/* Dekorasi Background Cahaya (Opsional untuk efek glow seperti di desain) */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          <h3 className="font-semibold text-lg">Insights AI</h3>
        </div>
        <Link to="/insights" className="text-sm text-gray-300 hover:text-white transition-colors">
          Lihat semua
        </Link>
      </div>

      {/* List Insights */}
      <div className="flex-grow space-y-4 relative z-10">
        {insightsData.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start transition hover:bg-white/10">
            <div className={`p-2 rounded-lg ${item.iconBg} ${item.iconColor} shrink-0`}>
              {item.icon}
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {/* Tombol Bawah */}
      <Link to="/insights" className="mt-6 w-full py-3 px-4 border border-white/20 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex justify-center items-center gap-2 relative z-10">
        Lihat semua insight
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </Link>
    </div>
  );
};

export default InsightsAI;