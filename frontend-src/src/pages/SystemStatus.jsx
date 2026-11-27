import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

// Status diperiksa langsung dari browser terhadap endpoint aplikasi yang nyata.
// Dulu halaman ini menampilkan uptime, latensi, dan insiden karangan.
// Belum ada pencatat uptime historis, jadi kolom uptime menampilkan "—".
const CHECKS = [
  { name: 'Web Application', url: '/',                                        expect: 'html' },
  { name: 'Public API',      url: '/api/platform_stats.php',                  expect: 'json' },
  { name: 'Database',        url: '/api/platform_stats.php',                  expect: 'db'   },
  { name: 'Auth Service',    url: '/api/auth.php?action=me',                  expect: 'auth' },
];

async function runCheck(check) {
  const started = performance.now();
  try {
    const res = await fetch(check.url, { cache: 'no-store', headers: { Accept: check.expect === 'html' ? 'text/html' : 'application/json' } });
    const latency = Math.round(performance.now() - started);
    let status = 'Operational';
    if (check.expect === 'html') {
      if (!res.ok) status = 'Outage';
    } else if (check.expect === 'auth') {
      // 401 (belum masuk) berarti layanan menjawab dengan benar
      if (res.status !== 401 && !res.ok) status = 'Outage';
    } else {
      const json = await res.json().catch(() => null);
      if (!json) status = 'Outage';
      else if (check.expect === 'db' && json.status !== 'success') status = 'Outage';
      else if (check.expect === 'json' && !res.ok && res.status !== 503) status = 'Outage';
      else if (check.expect === 'json' && res.status === 503) status = 'Degraded Performance';
    }
    if (status === 'Operational' && latency > 1500) status = 'Degraded Performance';
    return { name: check.name, uptime: '—', latency: `${latency} ms`, status };
  } catch {
    return { name: check.name, uptime: '—', latency: '—', status: 'Outage' };
  }
}

const badgeStyle = {
  'Operational':         'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Degraded Performance':'bg-amber-100 text-amber-700 border-amber-200',
  'Outage':              'bg-red-100 text-red-700 border-red-200',
  'Checking':            'bg-gray-100 text-gray-600 border-gray-200',
};

const incidentStyle = {
  amber:   'bg-amber-50 border-amber-200',
  emerald: 'bg-emerald-50 border-emerald-200',
  red:     'bg-red-50 border-red-200',
};

const SystemStatus = () => {
  const { t } = useTranslation('system_status');
  const [services, setServices] = useState(CHECKS.map(c => ({ name: c.name, uptime: '—', latency: '—', status: 'Checking' })));
  const [checkedAt, setCheckedAt] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all(CHECKS.map(runCheck)).then(results => {
      if (!alive) return;
      setServices(results);
      setCheckedAt(new Date());
    });
    return () => { alive = false; };
  }, []);

  const down      = services.filter(s => s.status === 'Outage').length;
  const degraded  = services.filter(s => s.status === 'Degraded Performance').length;
  const checking  = services.some(s => s.status === 'Checking');
  const overallOk = !checking && down === 0;

  return (
    <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-2">{t('subtitle')}</p>
          </div>
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[15px] font-semibold w-fit ${overallOk ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : checking ? 'border-gray-200 bg-gray-50 text-gray-600' : 'border-red-200 bg-red-50 text-red-700'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${overallOk ? 'bg-emerald-500 animate-pulse' : checking ? 'bg-gray-400' : 'bg-red-500'}`}></span>
            {checking ? '…' : overallOk ? t('core_up') : `${down} / ${services.length}`}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { key: 'uptime30',    value: '—' },
          { key: 'active',      value: checking ? '…' : String(down + degraded) },
          { key: 'maintenance', value: '—' },
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
        {checkedAt && (
          <p className="text-sm text-gray-500 mb-3">Pemeriksaan langsung: {checkedAt.toLocaleString('id-ID')}</p>
        )}
        <div className="space-y-3">
          {services.filter(s => s.status === 'Outage' || s.status === 'Degraded Performance').map((s) => ({
            id: s.name,
            title: s.name,
            status: s.status,
            time: checkedAt ? checkedAt.toLocaleString('id-ID') : '',
            detail: s.status === 'Outage' ? 'Layanan tidak menjawab dengan benar saat diperiksa.' : `Respons lambat (${s.latency}).`,
            color: s.status === 'Outage' ? 'red' : 'amber',
          })).map((incident) => (
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