import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// ✅ Import komponen SponsorshipTiers
import SponsorshipTiers from '../components/layout/SponsorshipTiers';

const BecomeSponsor = () => {
  // Form state
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    country: '',
    tierInterest: '', // ✅ Akan diisi otomatis dari SponsorshipTiers
    message: '',
    newsletter: false,
    privacy: false
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [expandedFaq, setExpandedFaq] = useState(null);
  // ✅ State untuk menyimpan tier yang dipilih dari komponen
  const [selectedTier, setSelectedTier] = useState('');

  // ✅ Handler: Dipanggil ketika user memilih tier
  const handleTierSelect = (tierId) => {
    setSelectedTier(tierId);
    setFormData(prev => ({ ...prev, tierInterest: tierId }));
    // ✅ Auto-scroll ke form
    setTimeout(() => {
      document.getElementById('sponsor-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Helper function: Get tier badge class (untuk testimonials)
  const getTierBadgeClass = (tier) => {
    const colors = {
      platinum: 'bg-gray-100 text-gray-800 border-gray-300',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      silver: 'bg-gray-100 text-gray-700 border-gray-300',
      bronze: 'bg-amber-100 text-amber-800 border-amber-300'
    };
    return colors[tier] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Benefits data (tetap sama)
  const benefits = [
    {
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      title: 'Visibilitas Global',
      description: 'Logo dan profil sponsor ditampilkan di platform yang diakses peneliti dari 150+ negara.'
    },
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Credibility & Trust',
      description: 'Asosiasi dengan platform terverifikasi yang digunakan oleh institusi riset terkemuka.'
    },
    {
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      title: 'Akses Data Eksklusif',
      description: 'Dashboard analitik khusus sponsor dengan insights tren riset dan dampak SDGs.'
    },
    {
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      title: 'Co-Branding Opportunities',
      description: 'Kesempatan kolaborasi konten, webinar, dan publikasi bersama tim editorial Wizdam.'
    },
    {
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Impact Reporting',
      description: 'Laporan triwulanan terukur tentang kontribusi sponsor terhadap pencapaian SDGs.'
    },
    {
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      title: 'Priority Support',
      description: 'Tim dedicated account manager dan prioritas dalam pengembangan fitur custom.'
    }
  ];

  // FAQ data (tetap sama)
  const faqs = [
    {
      id: 'faq-1',
      question: 'Berapa lama proses review proposal sponsorship?',
      answer: 'Tim kami akan meninjau proposal dalam 5-7 hari kerja. Jika disetujui, kami akan menghubungi Anda untuk diskusi lebih lanjut mengenai kontrak dan implementasi.'
    },
    {
      id: 'faq-2',
      question: 'Apakah saya bisa mengubah tier sponsorship di tengah periode?',
      answer: 'Ya, sponsor dapat upgrade tier kapan saja. Untuk downgrade, perubahan akan berlaku pada periode perpanjangan berikutnya. Tim account manager kami akan membantu proses transisi.'
    },
    {
      id: 'faq-3',
      question: 'Bagaimana cara kerja dashboard analitik untuk sponsor?',
      answer: 'Setelah aktivasi, Anda akan menerima akses ke dashboard khusus yang menampilkan metrics seperti: traffic dari logo sponsor, engagement dengan konten co-branded, dan impact report terkait SDGs. Dashboard dapat diakses 24/7 via portal sponsor.'
    },
    {
      id: 'faq-4',
      question: 'Apakah ada komitmen minimum periode sponsorship?',
      answer: 'Ya, semua tier sponsorship memiliki komitmen minimum 12 bulan. Ini memungkinkan kami untuk merencanakan integrasi branding dan mengukur impact secara meaningful. Perpanjangan dapat dilakukan dengan notice 30 hari sebelum expiry.'
    },
    {
      id: 'faq-5',
      question: 'Bagaimana jika organisasi kami berbasis di luar Indonesia?',
      answer: 'Kami menerima sponsor dari seluruh dunia! Platform Wizdam diakses oleh peneliti global, sehingga kemitraan Anda akan memiliki jangkauan internasional. Tim kami juga mendukung komunikasi dalam Bahasa Inggris.'
    },
    {
      id: 'faq-6',
      question: 'Apa yang terjadi jika platform mengalami downtime?',
      answer: 'Kami menjamin uptime 99.5% dengan SLA tertulis untuk tier Platinum dan Gold. Jika terjadi downtime yang mempengaruhi visibilitas sponsor, kami akan memberikan kompensasi berupa perpanjangan periode atau credit untuk layanan tambahan.'
    }
  ];

  // Testimonials data (tetap sama)
  const testimonials = [
    {
      id: 1,
      quote: 'Kemitraan dengan Wizdam telah meningkatkan visibilitas riset kami di kalangan akademisi Asia Tenggara. Dashboard analitiknya sangat membantu dalam mengukur impact program CSR kami.',
      author: 'Dr. Sari Wijayanti',
      role: 'Head of Sustainability, PT Telkom Indonesia',
      avatar: 'https://i.pravatar.cc/150?img=5',
      tier: 'Silver'
    },
    {
      id: 2,
      quote: 'Sebagai lembaga riset, kolaborasi dengan Wizdam membuka peluang baru untuk mempublikasikan temuan kami ke audiens global. Tim support-nya sangat responsif dan profesional.',
      author: 'Prof. Ahmad Fauzi',
      role: 'Director of Research, BRIN',
      avatar: 'https://i.pravatar.cc/150?img=12',
      tier: 'Platinum'
    },
    {
      id: 3,
      quote: 'Impact report yang disediakan Wizdam sangat detail dan actionable. Kami bisa melihat langsung bagaimana dukungan kami berkontribusi pada pencapaian SDGs di Indonesia.',
      author: 'Maria Fernandez',
      role: 'Program Manager, UNDP Indonesia',
      avatar: 'https://i.pravatar.cc/150?img=44',
      tier: 'Gold'
    }
  ];

  // Organization types
  const orgTypes = [
    { value: '', label: 'Pilih jenis organisasi' },
    { value: 'government', label: 'Pemerintah / Lembaga Publik' },
    { value: 'academic', label: 'Universitas / Institusi Riset' },
    { value: 'corporate', label: 'Perusahaan / Korporasi' },
    { value: 'ngo', label: 'NGO / Organisasi Nirlaba' },
    { value: 'international', label: 'Organisasi Internasional' },
    { value: 'other', label: 'Lainnya' }
  ];

  // Countries list
  const countries = [
    { value: '', label: 'Pilih negara' },
    { value: 'indonesia', label: 'Indonesia' },
    { value: 'malaysia', label: 'Malaysia' },
    { value: 'singapore', label: 'Singapore' },
    { value: 'thailand', label: 'Thailand' },
    { value: 'philippines', label: 'Philippines' },
    { value: 'vietnam', label: 'Vietnam' },
    { value: 'australia', label: 'Australia' },
    { value: 'japan', label: 'Jepang' },
    { value: 'south-korea', label: 'Korea Selatan' },
    { value: 'other', label: 'Negara Lainnya' }
  ];

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.organizationName.trim()) newErrors.organizationName = 'Nama organisasi diperlukan';
      if (!formData.organizationType) newErrors.organizationType = 'Jenis organisasi diperlukan';
      if (!formData.contactName.trim()) newErrors.contactName = 'Nama kontak diperlukan';
      if (!formData.email.trim()) {
        newErrors.email = 'Email diperlukan';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format email tidak valid';
      }
    }
    
    if (step === 2) {
      if (!formData.message.trim()) {
        newErrors.message = 'Silakan jelaskan minat kemitraan Anda';
      } else if (formData.message.trim().length < 20) {
        newErrors.message = 'Pesan minimal 20 karakter';
      }
      // ✅ Tier sudah divalidasi saat pemilihan, tidak perlu validasi ulang
    }
    
    if (step === 3) {
      if (!formData.privacy) newErrors.privacy = 'Anda harus menyetujui Kebijakan Privasi';
    }
    
    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(activeStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setActiveStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const finalErrors = validateStep(activeStep);
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
      setActiveStep(4);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  // Progress steps - ✅ Hanya 2 step karena tier sudah dipilih di awal
  const steps = [
    { num: 1, label: 'Informasi Organisasi' },
    { num: 2, label: 'Review & Kirim' }
  ];

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/sponsors" className="hover:text-indigo-600 transition-colors">Sponsor</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">Jadi Sponsor</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Jadilah Mitra Strategis Wizdam
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Dukung percepatan dampak riset Indonesia terhadap SDGs global. 
          Bergabunglah dengan ekosistem inovasi yang menghubungkan peneliti, institusi, dan pembuat kebijakan.
        </p>
      </div>

      {/* Success State */}
      {submitStatus === 'success' && activeStep === 4 && (
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Terkirim!</h2>
            <p className="text-gray-600 mb-6">
              Terima kasih telah mengajukan proposal sponsorship. Tim kami akan meninjau aplikasi Anda dan menghubungi dalam 5-7 hari kerja.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/sponsors" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                Lihat Daftar Sponsor
              </Link>
              <button 
                onClick={() => {
                  setFormData({
                    organizationName: '', organizationType: '', contactName: '', email: '',
                    phone: '', website: '', country: '', tierInterest: '', message: '',
                    newsletter: false, privacy: false
                  });
                  setSelectedTier('');
                  setActiveStep(1);
                  setSubmitStatus(null);
                }}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Ajukan Proposal Lain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeStep < 4 && (
        <>
          {/* Benefits Preview */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.slice(0, 3).map((benefit, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={benefit.icon} />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ✅ Sponsorship Tiers Component */}
          {!selectedTier && (
            <SponsorshipTiers 
              onSelectTier={handleTierSelect} 
              selectedTier={selectedTier} 
            />
          )}

          {/* Form Container - Muncul setelah tier dipilih */}
          {selectedTier && (
            <>
              {/* Progress Steps */}
              <div className="mb-8" id="sponsor-form">
                <div className="flex items-center justify-center gap-2">
                  {steps.map((step, idx) => (
                    <React.Fragment key={step.num}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                          activeStep >= step.num 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {activeStep > step.num ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : step.num}
                        </div>
                        <span className={`text-sm font-medium hidden sm:inline ${
                          activeStep >= step.num ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-12 sm:w-24 h-0.5 ${
                          activeStep > step.num ? 'bg-indigo-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
                  
                  {/* Step 1: Organization Info */}
                  {activeStep === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Informasi Organisasi</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTierBadgeClass(formData.tierInterest)}`}>
                          {formData.tierInterest?.charAt(0).toUpperCase() + formData.tierInterest?.slice(1)} Sponsor
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nama Organisasi *
                          </label>
                          <input
                            type="text"
                            id="organizationName"
                            name="organizationName"
                            value={formData.organizationName}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                              errors.organizationName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                            }`}
                            placeholder="Contoh: PT Telkom Indonesia"
                          />
                          {errors.organizationName && <p className="mt-1 text-xs text-red-600">{errors.organizationName}</p>}
                        </div>

                        <div>
                          <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Jenis Organisasi *
                          </label>
                          <select
                            id="organizationType"
                            name="organizationType"
                            value={formData.organizationType}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer ${
                              errors.organizationType ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                            }`}
                          >
                            {orgTypes.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          {errors.organizationType && <p className="mt-1 text-xs text-red-600">{errors.organizationType}</p>}
                        </div>

                        <div>
                          <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nama Kontak *
                          </label>
                          <input
                            type="text"
                            id="contactName"
                            name="contactName"
                            value={formData.contactName}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                              errors.contactName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                            }`}
                            placeholder="Nama lengkap penanggung jawab"
                          />
                          {errors.contactName && <p className="mt-1 text-xs text-red-600">{errors.contactName}</p>}
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email Kerja *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                              errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                            }`}
                            placeholder="nama@organisasi.id"
                          />
                          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nomor Telepon
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="+62 812 3456 7890"
                          />
                        </div>

                        <div>
                          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Website Organisasi
                          </label>
                          <input
                            type="url"
                            id="website"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="https://organisasi.id"
                          />
                        </div>

                        <div>
                          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Negara
                          </label>
                          <select
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                          >
                            {countries.map((country) => (
                              <option key={country.value} value={country.value}>{country.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Review & Submit */}
                  {activeStep === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Review & Konfirmasi</h2>
                      
                      {/* Summary Card */}
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Ringkasan Proposal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Organisasi</p>
                            <p className="font-medium text-gray-900">{formData.organizationName || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Jenis</p>
                            <p className="font-medium text-gray-900">
                              {orgTypes.find(t => t.value === formData.organizationType)?.label || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Kontak</p>
                            <p className="font-medium text-gray-900">{formData.contactName || '-'} • {formData.email || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Tier Dipilih</p>
                            <p className="font-medium text-gray-900 capitalize">
                              {formData.tierInterest?.charAt(0).toUpperCase() + formData.tierInterest?.slice(1) || '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Ceritakan Minat Kemitraan Anda *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={4}
                          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none ${
                            errors.message ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                          placeholder="Jelaskan tujuan kemitraan, target SDGs yang ingin didukung, dan ekspektasi kolaborasi..."
                        />
                        <div className="flex justify-between items-center mt-1.5">
                          {errors.message && <p className="text-xs text-red-600">{errors.message}</p>}
                          <p className={`text-xs ml-auto ${formData.message.length > 400 ? 'text-orange-600' : 'text-gray-500'}`}>
                            {formData.message.length} / 500 karakter
                          </p>
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="newsletter"
                            checked={formData.newsletter}
                            onChange={handleChange}
                            className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">
                            Saya ingin menerima newsletter bulanan tentang update platform dan insights riset SDGs
                          </span>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="privacy"
                            checked={formData.privacy}
                            onChange={handleChange}
                            className={`w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 ${
                              errors.privacy ? 'border-red-500' : ''
                            }`}
                          />
                          <span className="text-sm text-gray-700">
                            Saya menyetujui <Link to="/privacy" className="text-indigo-600 hover:underline">Kebijakan Privasi</Link> dan <Link to="/terms" className="text-indigo-600 hover:underline">Syarat & Ketentuan</Link> sponsorship *
                          </span>
                        </label>
                        {errors.privacy && <p className="text-xs text-red-600">{errors.privacy}</p>}
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={activeStep === 1}
                      className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                        activeStep === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      ← Kembali
                    </button>
                    
                    {activeStep < 2 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Lanjutkan →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 ${
                          isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Mengirim...
                          </>
                        ) : (
                          'Kirim Proposal'
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}

          {/* FAQ Section */}
          <section className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pertanyaan Umum</h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedFaq === faq.id ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Testimonials */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Kata Mereka Tentang Kemitraan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={testimonial.avatar} alt={testimonial.author} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.author}</p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 italic mb-3">"{testimonial.quote}"</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getTierBadgeClass(testimonial.tier)}`}>
                    {testimonial.tier} Sponsor
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default BecomeSponsor;