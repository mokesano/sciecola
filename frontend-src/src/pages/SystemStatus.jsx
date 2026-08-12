import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

// Mock incidents / services stay in source pending a real status API.
// Only chrome is translated; service status labels (Operational, Degraded
// Performance) are used verbatim in the badgeStyle map so we keep them as
// English literals.
const incidents = [
  {
    id: 1,
    title: 'Peningkatan latensi API pada region Asia Tenggara',
    status: 'Monitoring',
    time: '19 Mei 2026, 09:45 UTC',
    detail: 'Tim infrastruktur telah menerapkan mitigasi autoscaling dan sedang memonitor stabilitas respon API.',
    color: 'amber',
  },
  {
    id: 2,
    title: 'Pemeliharaan terjadwal cache index',
    status: 'Selesai',
    time: '18 Mei 2026, 22:00 UTC',
    detail: 'Pemeliharaan selesai tanpa downtime. Performa query meningkat rata-rata 12%.',
    color: 'emerald',
  },
];

const services = [
  { name: 'Web Application',    uptime: '99.98%', latency: '182 ms', status: 'Operational' },
  { name: 'Public API',         uptime: '99.95%', latency: '236 ms', status: 'Operational' },
  { name: 'Auth Service',       uptime: '99.99%', latency: '121 ms', status: 'Operational' },
  { name: 'Background Queue',   uptime: '99.90%', latency: '1.2 s',  status: 'Degraded Performance' },
];

const badgeStyle = {
  'Operational':         'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Degraded Performance':'bg-amber-100 text-amber-700 border-amber-200',
};

const incidentStyle = {
  amber:   'bg-amber-50 border-amber-200',
  emerald: 'bg-emerald-50 border-emerald-200',
};

const SystemStatus = () => {
  const { t } = useTranslation('system_status');
  return (
    <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-2">{t('subtitle')}</p>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[15px] font-semibold w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {t('core_up')}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { key: 'uptime30',    value: '99.96%' },
          { key: 'active',      value: '1' },
          { key: 'maintenance', value: '0' },
        ].map(s => (
          <div key={s.key} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[15px] text-gray-500">{t(`stats.${s.key}`)}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('services_title')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[15px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-semibold">{t('table.service')}</th>
                <th className="pb-3 font-semibold">{t('table.uptime')}</th>
                <th className="pb-3 font-semibold">{t('table.latency')}</th>
                <th className="pb-3 font-semibold">{t('table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.name} className="border-b last:border-b-0 border-gray-100">
                  <td className="py-3 text-gray-900 font-medium">{service.name}</td>
                  <td className="py-3 text-gray-700">{service.uptime}</td>
                  <td className="py-3 text-gray-700">{service.latency}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full border text-sm font-semibold ${badgeStyle[service.status]}`}>
                      {service.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('incidents_title')}</h2>
        <div className="space-y-3">
          {incidents.map((incident) => (
            <article key={incident.id} className={`rounded-xl border p-4 ${incidentStyle[incident.color]}`}>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                <span className="text-sm font-semibold px-2 py-0.5 rounded-full border border-gray-300 bg-white text-gray-700">
                  {incident.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{incident.time}</p>
              <p className="text-[15px] text-gray-700">{incident.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <Link
            to="/help"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            {t('help')}
          </Link>
          <a
            href="mailto:support@sciecola.com"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {t('report')}
          </a>
        </div>
      </section>
    </main>
  );
};

export default SystemStatus;