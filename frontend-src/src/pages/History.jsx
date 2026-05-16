import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/shared';
import { IconSparkles, IconChartBar, IconTrendingUp, IconStar, IconBolt, IconGlobe, IconCalendar, IconOfficeBuilding, IconHandshake, IconUsers } from '../components/shared/icons';

const History = () => {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);

  // Fetch timeline on mount
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/platform_timeline.php?limit=50&sort=date');
        const data = response.json();
        if (data.status === 'success' && data.timeline) {
          const groupedByYear = Object.entries(data.timeline).map(([year, events]) => ({
            year,
            events: events.map(event => ({
              month: new Date(event.date).toLocaleDateString('id-ID', { month: 'long' }),
              type: event.type,
              title: event.title,
              description: event.description,
              side: Math.random() > 0.5 ? 'left' : 'right'
            }))
          }));
          setTimelineData(groupedByYear);
          setError(null);
        } else {
          setTimelineData(getSampleTimelineData());
        }
      } catch (err) {
        console.error('Error fetching timeline:', err);
        setTimelineData(getSampleTimelineData());
        setError('Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

  const getSampleTimelineData = () => [
    {
      year: '2026',
      events: [
        {
          month: 'Mei',
          type: 'milestone',
          title: 'Platform Memasuki Beta Phase',
          description: 'Sciecola/SDGs Mapper resmi memasuki fase beta dengan fitur core lengkap.',
          side: 'left'
        }
      ]
    },
    {
      year: '2025',
      events: [
        {
          month: 'Desember',
          type: 'feature',
          title: 'Peluncuran Insights AI',
          description: 'Fitur analisis berbasis AI untuk mengidentifikasi tren riset.',
          side: 'right'
        }
      ]
    },
    {
      year: '2024',
      events: [
        {
          month: 'Desember',
          type: 'milestone',
          icon: 'chart',
          title: '1 Juta Publikasi',
          description: 'Mencapai 1 juta publikasi yang dianalisis dalam platform Wizdam.',
          side: 'right'
        },
        {
          month: 'September',
          type: 'partnership',
          icon: 'star',
          title: 'UNDP Indonesia',
          description: 'UNDP Indonesia bergabung sebagai mitra untuk alignment indikator SDGs.',
          logo: 'UNDP',
          side: 'left'
        },
        {
          month: 'Juni',
          type: 'launch',
          icon: 'launch',
          title: 'Dashboard Analitik',
          description: 'Peluncuran dashboard analitik interaktif untuk visualisasi dampak riset.',
          side: 'right'
        },
        {
          month: 'Maret',
          type: 'award',
          icon: 'award',
          title: 'Innovation Award',
          description: 'Menerima penghargaan Innovation Award untuk kontribusi terhadap SDGs.',
          side: 'left'
        }
      ]
    },
    {
      year: '2021',
      events: [
        {
          month: 'Oktober',
          type: 'launch',
          icon: 'launch',
          title: 'Wizdam Impact Score',
          description: 'Peluncuran sistem Wizdam Impact Score dengan 4 pilar: Academic, Social, Economic, dan SDG.',
          side: 'right'
        },
        {
          month: 'Juli',
          type: 'partnership',
          icon: 'star',
          title: 'Telkom Indonesia',
          description: 'PT Telkom Indonesia menjadi sponsor untuk infrastruktur cloud platform.',
          logo: 'Telkom',
          side: 'left'
        },
        {
          month: 'April',
          type: 'milestone',
          icon: 'trend',
          title: '50 Institusi Mitra',
          description: 'Lima puluh universitas dan lembaga penelitian bergabung dengan Wizdam.',
          side: 'right'
        },
        {
          month: 'Januari',
          type: 'launch',
          icon: 'launch',
          title: 'Platform Beta',
          description: 'Peluncuran versi beta platform Wizdam untuk pengujian terbatas.',
          side: 'left'
        }
      ]
    },
    {
      year: '2020',
      events: [
        {
          month: 'November',
          type: 'milestone',
          icon: 'idea',
          title: 'Konsep Wizdam',
          description: 'Ide awal Wizdam muncul dari tantangan mengukur dampak riset terhadap SDGs.',
          side: 'right'
        },
        {
          month: 'Agustus',
          type: 'team',
          icon: 'team',
          title: 'Tim Pendiri',
          description: 'Pembentukan tim inti yang terdiri dari peneliti dan ahli AI.',
          side: 'left'
        },
        {
          month: 'Maret',
          type: 'foundation',
          icon: 'building',
          title: 'Foundation',
          description: 'Wizdam didirikan dengan visi mempercepat dampak riset Indonesia terhadap SDGs global.',
          side: 'right'
        }
      ]
    }
  ];

  // Helper function to get icon color based on type
  const getIconColor = (type) => {
    const colors = {
      launch: 'bg-indigo-100 text-indigo-600 border-indigo-300',
      partnership: 'bg-purple-100 text-purple-600 border-purple-300',
      milestone: 'bg-green-100 text-green-600 border-green-300',
      award: 'bg-amber-100 text-amber-600 border-amber-300',
      team: 'bg-blue-100 text-blue-600 border-blue-300',
      foundation: 'bg-gray-100 text-gray-600 border-gray-300',
      feature: 'bg-blue-100 text-blue-600 border-blue-300',
      research: 'bg-green-100 text-green-600 border-green-300'
    };
    return colors[type] || colors.launch;
  };

  if (loading) {
    return (
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <Link to="/about" className="hover:text-indigo-600 transition-colors">Tentang Kami</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Sejarah</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Perjalanan Wizdam
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Dari ide sederhana menjadi platform analitik riset terdepan untuk pencapaian SDGs
        </p>
      </div>

      {/* Timeline */}
      <div className="relative max-w-6xl mx-auto">
        {/* Central Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-300 via-orange-400 to-orange-300 transform md:-translate-x-1/2"></div>

        {/* Timeline Items */}
        <div className="space-y-12">
          {timelineData.map((yearData, yearIndex) => (
            <div key={yearData.year} className="relative">
              {/* Year Header */}
              <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-bold text-orange-500 bg-white inline-block px-6 py-2 rounded-2xl">
                  {yearData.year}
                </h2>
              </div>

              {/* Events for this year */}
              <div className="space-y-4">
                {yearData.events.map((event, eventIndex) => (
                  <div 
                    key={eventIndex}
                    className={`relative flex items-center gap-8 ${
                      event.side === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'
                    }`}
                  >
                    {/* Content Side */}
                    <div className={`ml-12 md:ml-0 md:w-1/2 ${
                      event.side === 'left' ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'
                    }`}>
                      <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                        {/* Month Badge */}
                        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold mb-3">
                          {event.month}
                        </span>
                        
                        {/* Title & Description */}
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{event.title}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                        
                        {/* Logo if exists */}
                        {event.logo && (
                          <div className={`mt-3 pt-3 border-t border-gray-100 ${
                            event.side === 'left' ? 'md:text-right' : 'md:text-left'
                          }`}>
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                              {event.logo}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Center Icon */}
                    <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 z-10">
                      <div className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${getIconColor(event.type)}`}>
                        {event.icon === 'launch'    && <IconBolt           className="w-5 h-5" />}
                        {event.icon === 'chart'     && <IconChartBar       className="w-5 h-5" />}
                        {event.icon === 'trend'     && <IconTrendingUp     className="w-5 h-5" />}
                        {event.icon === 'star'      && <IconStar           className="w-5 h-5" />}
                        {event.icon === 'idea'      && <IconSparkles       className="w-5 h-5" />}
                        {event.icon === 'building'  && <IconOfficeBuilding className="w-5 h-5" />}
                        {event.icon === 'handshake' && <IconHandshake      className="w-5 h-5" />}
                        {event.icon === 'award'     && <IconStar           className="w-5 h-5" />}
                        {event.icon === 'team'      && <IconUsers          className="w-5 h-5" />}
                        {!['launch','chart','trend','star','idea','building','handshake','award','team'].includes(event.icon) && <IconSparkles className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Empty Side for spacing */}
                    <div className="hidden md:block md:w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {[
          { label: 'Tahun Berdiri', value: '4+', icon: <IconCalendar className="w-7 h-7" /> },
          { label: 'Publikasi Dianalisis', value: '5M+', icon: <IconChartBar className="w-7 h-7" /> },
          { label: 'Institusi Mitra', value: '100+', icon: <IconOfficeBuilding className="w-7 h-7" /> },
          { label: 'Negara Terjangkau', value: '50+', icon: <IconGlobe className="w-7 h-7" /> }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-orange-200 shadow-md text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-2 text-orange-500">{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-20 text-center">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-3">Ingin Menjadi Bagian dari Perjalanan Kami?</h3>
          <p className="text-indigo-100 mb-6">
            Bergabunglah sebagai mitra atau sponsor untuk mendukung percepatan dampak riset Indonesia terhadap SDGs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/become-sponsor" 
              className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
            >
              Jadi Sponsor
            </Link>
            <Link 
              to="/contact" 
              className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-400 transition-colors"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default History;