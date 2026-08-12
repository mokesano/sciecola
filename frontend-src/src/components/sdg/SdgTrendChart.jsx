import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SDG_DICTIONARY } from '../../utils/sdgDataAdapter';

const LINE_COLORS = ['#4c9f38', '#c5192d', '#3f7e44', '#fd6925', '#8b5cf6'];

function buildTrendFromWorks(works) {
  const byYear = {};
  works.forEach((w) => {
    const year = w.publication_year || w.year;
    if (!year) return;
    if (!byYear[year]) byYear[year] = {};
    (w.sdgs || []).forEach((code) => {
      byYear[year][code] = (byYear[year][code] || 0) + 1;
    });
  });

  return Object.entries(byYear)
    .sort((a, b) => a[0] - b[0])
    .map(([year, counts]) => ({ year: String(year), ...counts }));
}

/**
 * SdgTrendChart — line chart of SDG publication trends by year.
 * Props:
 *  rawData – raw API response object with .works array
 *            (from ORCID analysis). Empty state shown when absent.
 */
const SdgTrendChart = ({ rawData }) => {
  const { t } = useTranslation('dashboard');

  const { chartData, lines } = useMemo(() => {
    if (!rawData || !Array.isArray(rawData.works) || rawData.works.length === 0) {
      return { chartData: [], lines: [] };
    }

    const built = buildTrendFromWorks(rawData.works);

    const totals = {};
    built.forEach((row) => {
      Object.entries(row).forEach(([k, v]) => {
        if (k !== 'year') totals[k] = (totals[k] || 0) + v;
      });
    });
    const top5 = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code]) => code);

    const dynamicLines = top5.map((code, i) => ({
      key:   code,
      name:  SDG_DICTIONARY[code]?.name || code,
      color: LINE_COLORS[i % LINE_COLORS.length],
    }));

    return { chartData: built, lines: dynamicLines };
  }, [rawData]);

  const hasData = chartData.length > 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-900">{t('sdg_trend.title')}</h3>
        <Link to="/trends-analysis" className="text-[15px] text-blue-600 hover:text-blue-800 font-semibold transition-colors pb-0.5">
          {t('sdg_trend.view_all')}
        </Link>
      </div>

      {!hasData ? (
        <div className="h-[300px] w-full flex items-center justify-center text-center text-[15px] text-gray-500 px-6">
          {t('sdg_trend.empty')}
        </div>
      ) : (
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#e5e7eb" />
              <XAxis dataKey="year" axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} dy={15} />
              <YAxis axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} dx={-15} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} verticalAlign="top" align="center" />
              {lines.map((l) => (
                <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SdgTrendChart;
