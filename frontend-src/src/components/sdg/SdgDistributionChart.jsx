import React, { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
      startAngle={startAngle} endAngle={endAngle} fill={fill} className="transition-all duration-300" />
  );
};

/**
 * SdgDistributionChart — donut chart of top SDGs.
 * Props:
 *  data          – array of {id, name, value, percent, color} (from API)
 *  totalArticles – string/number displayed in the centre hole
 */
const SdgDistributionChart = ({ data, totalArticles }) => {
  const { t } = useTranslation('dashboard');
  const [activeIndex, setActiveIndex] = useState(null);

  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] border border-gray-100">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-900">{t('sdg_distribution.title')}</h3>
        <Link to="/sdgs" className="text-[15px] text-blue-600 hover:text-blue-800 font-semibold transition-colors pb-0.5">
          {t('sdg_distribution.view_all')}
        </Link>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-[260px] text-center text-[15px] text-gray-500 px-6">
          {t('sdg_distribution.empty')}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
          <div className="relative w-full md:w-[260px] shrink-0 h-[260px] flex justify-center items-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-2xl font-extrabold text-gray-900">{totalArticles ?? ''}</span>
              <span className="text-[15px] font-medium text-gray-500 mt-1">{t('sdg_distribution.centre_label')}</span>
            </div>
            <div className="w-full h-full relative z-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={75} outerRadius={112}
                    paddingAngle={1} dataKey="value" stroke="none"
                    activeIndex={activeIndex} activeShape={renderActiveShape}
                    onMouseEnter={(_, i) => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}>
                    {data.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} className="outline-none cursor-pointer transition-all duration-300" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} ${t('sdg_distribution.tooltip_unit')}`, '']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-full flex-1 flex flex-col gap-2">
            {data.map((item, index) => (
              <div key={index}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-start justify-between gap-3 p-1 -mx-2.5 rounded-xl cursor-pointer transition-all duration-300 border
                  ${activeIndex === index ? '-translate-y-1 bg-white hover:bg-gray-50 border-gray-100' : 'translate-y-0 bg-transparent border-transparent hover:-translate-y-1 hover:bg-white hover:shadow-md hover:border-gray-100'}
                `}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: item.color }}>
                    {item.id}
                  </div>
                  <span className="text-[15px] font-medium text-gray-800 leading-snug">{item.name}</span>
                </div>
                <span className="text-[15px] font-bold text-gray-700 shrink-0 mt-0.5">{item.percent}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SdgDistributionChart;
