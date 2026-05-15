import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Handshake, Building2, TrendingUp, Search, Filter, ArrowRight,
  DollarSign, Users, Calendar, MapPin, Target, Zap, Award, BookOpen, Globe, MessageSquare,
  Share2, ExternalLink, Star, CheckCircle, Clock, Briefcase
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const InnovationMarketplace = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Mock data untuk innovation opportunities
  const opportunities = [
    {
      id: 1,
      title: 'Carbon Capture Technology Partnership',
      organization: 'Tesla Energy',
      type: 'industry',
      category: 'Climate Tech',
      description: 'Seeking academic partners for next-generation carbon capture and storage solutions. Joint research opportunity with full funding.',
      sdgFocus: [13, 9, 7],
      budget: 2500000,
      duration: '3 years',
      location: 'Global (Remote + Lab Access)',
      postedDate: '2024-11-15',
      deadline: '2025-02-28',
      requirements: ['PhD in Environmental Science or Engineering', 'Publication record in carbon capture', 'Lab facilities preferred'],
      benefits: ['Full funding', 'Patent sharing', 'Industry mentorship', 'Commercialization support'],
      applicants: 47,
      status: 'open',
      logo: 'https://logo.clearbit.com/tesla.com'
    },
    {
      id: 2,
      title: 'AI-Driven Drug Discovery Collaboration',
      organization: 'Pfizer Research',
      type: 'industry',
      category: 'Healthcare',
      description: 'Revolutionary AI platform for accelerating drug discovery. Looking for computational biology experts to join our consortium.',
      sdgFocus: [3, 9],
      budget: 4200000,
      duration: '4 years',
      location: 'New York, USA + Remote',
      postedDate: '2024-11-10',
      deadline: '2025-01-31',
      requirements: ['Expertise in ML/AI', 'Background in pharmacology or bioinformatics', 'Python/TensorFlow proficiency'],
      benefits: ['$4.2M funding', 'Access to proprietary datasets', 'Co-authorship rights', 'Equity options'],
      applicants: 89,
      status: 'open',
      logo: 'https://logo.clearbit.com/pfizer.com'
    },
    {
      id: 3,
      title: 'Sustainable Agriculture Innovation Grant',
      organization: 'Bill & Melinda Gates Foundation',
      type: 'foundation',
      category: 'Agriculture',
      description: 'Supporting breakthrough research in climate-resilient crops for smallholder farmers in developing nations.',
      sdgFocus: [2, 1, 13],
      budget: 1800000,
      duration: '2 years',
      location: 'Africa, Asia (Field Work Required)',
      postedDate: '2024-11-20',
      deadline: '2025-03-15',
      requirements: ['Experience in agricultural science', 'Field research capability', 'Developing country partnerships'],
      benefits: ['Grant funding', 'Network access', 'Policy influence', 'Impact measurement support'],
      applicants: 156,
      status: 'open',
      logo: 'https://logo.clearbit.com/gatesfoundation.org'
    },
    {
      id: 4,
      title: 'Smart City Infrastructure Project',
      organization: 'Singapore Government',
      type: 'government',
      category: 'Urban Development',
      description: 'National initiative for IoT-enabled urban infrastructure. Seeking universities for R&D partnership on sustainable smart cities.',
      sdgFocus: [11, 9, 7],
      budget: 5600000,
      duration: '5 years',
      location: 'Singapore',
      postedDate: '2024-11-05',
      deadline: '2025-01-15',
      requirements: ['Urban planning expertise', 'IoT/sensor technology', 'Data analytics capability'],
      benefits: ['Government backing', 'Real-world testing environment', 'Policy implementation', 'Long-term partnership'],
      applicants: 73,
      status: 'open',
      logo: 'https://logo.clearbit.com/gov.sg'
    },
    {
      id: 5,
      title: 'Ocean Plastic Recycling Technology',
      organization: 'The Ocean Cleanup',
      type: 'nonprofit',
      category: 'Environment',
      description: 'Developing scalable solutions for converting ocean plastic into usable materials. Multi-disciplinary research team needed.',
      sdgFocus: [14, 12, 13],
      budget: 980000,
      duration: '18 months',
      location: 'Netherlands + Ocean Sites',
      postedDate: '2024-11-18',
      deadline: '2025-02-10',
      requirements: ['Materials science background', 'Chemical engineering', 'Environmental impact assessment'],
      benefits: ['Mission-driven work', 'Global visibility', 'Patent opportunities', 'Field deployment'],
      applicants: 112,
      status: 'open',
      logo: 'https://logo.clearbit.com/theoceancleanup.com'
    },
    {
      id: 6,
      title: 'Renewable Energy Storage Breakthrough',
      organization: 'Siemens Energy',
      type: 'industry',
      category: 'Energy',
      description: 'Next-generation battery technology for grid-scale energy storage. Academic-industry collaboration with commercialization pathway.',
      sdgFocus: [7, 9, 13],
      budget: 3300000,
      duration: '3 years',
      location: 'Germany + Partner Universities',
      postedDate: '2024-11-12',
      deadline: '2025-02-20',
      requirements: ['Electrochemistry expertise', 'Battery technology experience', 'Scale-up knowledge'],
      benefits: ['Industry partnership', 'Lab resources', 'IP sharing', 'Career opportunities'],
      applicants: 64,
      status: 'open',
      logo: 'https://logo.clearbit.com/siemens-energy.com'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Opportunities', count: opportunities.length, icon: Lightbulb },
    { id: 'climate', name: 'Climate Tech', count: opportunities.filter(o => o.category === 'Climate Tech').length, icon: Target },
    { id: 'healthcare', name: 'Healthcare', count: opportunities.filter(o => o.category === 'Healthcare').length, icon: Zap },
    { id: 'agriculture', name: 'Agriculture', count: opportunities.filter(o => o.category === 'Agriculture').length, icon: BookOpen },
    { id: 'energy', name: 'Energy', count: opportunities.filter(o => o.category === 'Energy').length, icon: DollarSign },
    { id: 'environment', name: 'Environment', count: opportunities.filter(o => o.category === 'Environment').length, icon: Globe }
  ];

  const types = [
    { id: 'all', name: 'All Types' },
    { id: 'industry', name: 'Industry' },
    { id: 'government', name: 'Government' },
    { id: 'foundation', name: 'Foundation' },
    { id: 'nonprofit', name: 'Non-Profit' }
  ];

  const sdgColors = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-green-500',
    4: 'bg-red-600',
    5: 'bg-orange-600',
    6: 'bg-cyan-500',
    7: 'bg-yellow-500',
    8: 'bg-red-700',
    9: 'bg-orange-700',
    10: 'bg-pink-500',
    11: 'bg-orange-800',
    12: 'bg-brown-500',
    13: 'bg-green-600',
    14: 'bg-blue-500',
    15: 'bg-green-700',
    16: 'bg-blue-600',
    17: 'bg-navy-500'
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'industry': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'government': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'foundation': return 'bg-green-100 text-green-700 border-green-200';
      case 'nonprofit': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || 
                           (activeCategory === 'climate' && opp.category === 'Climate Tech') ||
                           (activeCategory === 'healthcare' && opp.category === 'Healthcare') ||
                           (activeCategory === 'agriculture' && opp.category === 'Agriculture') ||
                           (activeCategory === 'energy' && opp.category === 'Energy') ||
                           (activeCategory === 'environment' && opp.category === 'Environment');
    
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalOpportunities: 247,
    totalFunding: '$127M+',
    activePartnerships: 89,
    successRate: '73%'
  };

  return (
    <main className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-orange-50 to-yellow-50">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-600 via-yellow-600 to-amber-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Handshake className="w-5 h-5" />
              <span className="text-sm font-medium">Industry-Academia Bridge</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Innovation Marketplace
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              Connect your research with industry leaders, government agencies, and foundations. Turn ideas into real-world impact.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {[
                { label: 'Opportunities', value: stats.totalOpportunities, icon: Lightbulb },
                { label: 'Total Funding', value: stats.totalFunding, icon: DollarSign },
                { label: 'Partnerships', value: stats.activePartnerships, icon: Handshake },
                { label: 'Success Rate', value: stats.successRate, icon: CheckCircle }
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 opacity-80" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-12 -mt-8">
        <div className="container px-8 max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search opportunities by keyword, organization, or technology..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <button className="flex items-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium whitespace-nowrap">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </button>
            </div>
            
            {/* Category Tabs */}
            <div className="flex gap-3 mt-8 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <category.icon className="w-5 h-5" />
                  {category.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeCategory === category.id ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Type Filter */}
            <div className="flex gap-2 mt-6 flex-wrap">
              <span className="text-sm font-semibold text-gray-700 py-2">Organization Type:</span>
              {types.map(type => (
                <button
                  key={type.id}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunities Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
                onClick={() => setSelectedOpportunity(opp)}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={opp.logo}
                        alt={opp.organization}
                        className="w-12 h-12 rounded-lg bg-white p-1 object-contain"
                      />
                      <div>
                        <div className="text-sm opacity-90">{opp.organization}</div>
                        <div className="font-bold text-lg">{opp.title}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border bg-white/20 backdrop-blur-sm`}>
                      {opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${(opp.budget / 1000000).toFixed(1)}M
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {opp.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {opp.applicants} applicants
                    </span>
                  </div>
                </div>
                
                {/* Body */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-3">{opp.description}</p>
                  
                  {/* SDG Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {opp.sdgFocus.map(sdg => (
                      <span
                        key={sdg}
                        className={`w-8 h-8 rounded-full ${sdgColors[sdg]} text-white text-xs font-bold flex items-center justify-center`}
                        title={`SDG ${sdg}`}
                      >
                        {sdg}
                      </span>
                    ))}
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {opp.category}
                    </span>
                  </div>
                  
                  {/* Key Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span className="truncate">{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Requirements Preview */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">KEY REQUIREMENTS</div>
                    <div className="flex flex-wrap gap-2">
                      {opp.requirements.slice(0, 2).map((req, idx) => (
                        <span key={idx} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                          {req}
                        </span>
                      ))}
                      {opp.requirements.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{opp.requirements.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Benefits Preview */}
                  <div className="mb-6">
                    <div className="text-xs font-semibold text-gray-500 mb-2">BENEFITS</div>
                    <div className="flex flex-wrap gap-2">
                      {opp.benefits.slice(0, 2).map((benefit, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all font-medium flex items-center justify-center gap-2">
                      Apply Now
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                      <Star className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="mt-3 text-center">
                    <span className="text-xs text-gray-500">
                      Posted {new Date(opp.postedDate).toLocaleDateString()} • Deadline {new Date(opp.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Innovation Marketplace Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From discovery to deployment - we streamline the path from research to real-world impact
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Discover Opportunities', desc: 'Browse curated research partnerships from leading organizations', icon: Search, color: 'from-orange-500 to-yellow-500' },
              { step: 2, title: 'Submit Proposal', desc: 'Apply with your research proposal and team credentials', icon: Briefcase, color: 'from-yellow-500 to-amber-500' },
              { step: 3, title: 'Match & Collaborate', desc: 'Get matched and start your funded research project', icon: Handshake, color: 'from-amber-500 to-orange-500' },
              { step: 4, title: 'Deploy & Scale', desc: 'Transform research into deployed solutions with commercialization support', icon: TrendingUp, color: 'from-orange-500 to-red-500' }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl text-center border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 via-yellow-600 to-amber-600 text-white">
        <div className="container px-8 max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Research?</h2>
          <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">
            Join hundreds of researchers who have secured funding and partnerships through Sciecola Innovation Marketplace
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2">
              Browse All Opportunities
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30 flex items-center gap-2">
              Post an Opportunity
            </button>
          </div>
        </div>
      </section>

    </main>
  );
};

export default InnovationMarketplace;
