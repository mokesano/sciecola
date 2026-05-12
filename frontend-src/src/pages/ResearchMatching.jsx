import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Users, 
  Target, 
  Zap, 
  Search, 
  Filter, 
  Sparkles,
  TrendingUp,
  Award,
  BookOpen,
  Building2,
  MapPin,
  Mail,
  ExternalLink,
  CheckCircle,
  Star,
  Lightbulb,
  Network,
  ArrowRight,
  Heart,
  MessageSquare,
  Share2
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const ResearchMatching = () => {
  const navigate = useNavigate();
  const [searchCriteria, setSearchCriteria] = useState({
    keywords: '',
    sdgGoals: [],
    institution: '',
    location: '',
    expertise: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Mock data untuk AI-powered matches
  const aiMatches = [
    {
      id: 1,
      name: 'Dr. Sarah Chen',
      title: 'Professor of Climate Science',
      institution: 'MIT',
      location: 'Cambridge, MA, USA',
      matchScore: 96,
      matchReasons: [
        'Similar research focus on climate change',
        'Complementary expertise in ocean systems',
        'Active in SDG 13 & 14',
        'Previous collaboration success rate: 94%'
      ],
      sdgFocus: [13, 14, 15],
      hIndex: 52,
      publications: 234,
      collaborations: 47,
      avatar: 'https://i.pravatar.cc/150?img=1',
      availability: 'Available for new projects',
      responseTime: '< 24 hours',
      recentWork: ['Ocean Acidification Study', 'Carbon Capture Technology']
    },
    {
      id: 2,
      name: 'Prof. Ahmed Hassan',
      title: 'Director of Renewable Energy Lab',
      institution: 'Cairo University',
      location: 'Cairo, Egypt',
      matchScore: 93,
      matchReasons: [
        'Expertise in sustainable energy systems',
        'Strong publication record in related fields',
        'Active collaboration network',
        'Geographic diversity for global impact'
      ],
      sdgFocus: [7, 9, 11],
      hIndex: 48,
      publications: 189,
      collaborations: 63,
      avatar: 'https://i.pravatar.cc/150?img=2',
      availability: 'Available for new projects',
      responseTime: '< 48 hours',
      recentWork: ['Solar Grid Optimization', 'Smart City Initiative']
    },
    {
      id: 3,
      name: 'Dr. James Wong',
      title: 'AI & Ethics Researcher',
      institution: 'Stanford University',
      location: 'Stanford, CA, USA',
      matchScore: 89,
      matchReasons: [
        'AI methodology expertise complements your work',
        'Ethics framework alignment',
        'High citation impact',
        'Open to interdisciplinary projects'
      ],
      sdgFocus: [9, 10, 16],
      hIndex: 45,
      publications: 178,
      collaborations: 52,
      avatar: 'https://i.pravatar.cc/150?img=4',
      availability: 'Limited availability',
      responseTime: '< 72 hours',
      recentWork: ['AI Fairness Framework', 'Digital Inclusion']
    },
    {
      id: 4,
      name: 'Prof. Emma Larsson',
      title: 'Sustainable Agriculture Expert',
      institution: 'Swedish University of Agricultural Sciences',
      location: 'Uppsala, Sweden',
      matchScore: 87,
      matchReasons: [
        'Sustainability focus alignment',
        'Strong European network',
        'Funding opportunity potential',
        'Methodology compatibility'
      ],
      sdgFocus: [2, 12, 15],
      hIndex: 39,
      publications: 142,
      collaborations: 41,
      avatar: 'https://i.pravatar.cc/150?img=5',
      availability: 'Available for new projects',
      responseTime: '< 24 hours',
      recentWork: ['Organic Farming Methods', 'Soil Conservation']
    },
    {
      id: 5,
      name: 'Dr. Maria Santos',
      title: 'Head of Public Health Research',
      institution: 'University of São Paulo',
      location: 'São Paulo, Brazil',
      matchScore: 84,
      matchReasons: [
        'Public health perspective adds value',
        'South American representation',
        'Strong policy impact record',
        'Interdisciplinary approach'
      ],
      sdgFocus: [3, 1, 2],
      hIndex: 41,
      publications: 156,
      collaborations: 38,
      avatar: 'https://i.pravatar.cc/150?img=3',
      availability: 'Selective about new projects',
      responseTime: '< 48 hours',
      recentWork: ['Vaccine Distribution', 'Nutrition Programs']
    }
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

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered Collaboration</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Research Matching
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              Discover perfect research collaborators using advanced AI algorithms that analyze expertise, interests, and compatibility
            </p>
          </div>
        </div>
      </section>

      {/* Search Criteria Section */}
      <section className="py-12 -mt-8">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Match</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Tell us about your research interests and we'll find researchers with complementary expertise
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Research Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="e.g., climate change, AI ethics..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    value={searchCriteria.keywords}
                    onChange={(e) => setSearchCriteria({...searchCriteria, keywords: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SDG Focus Areas</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                  <option>Select SDG goals...</option>
                  {[...Array(17)].map((_, i) => (
                    <option key={i} value={i + 1}>SDG {i + 1}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Type</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                  <option>Any institution</option>
                  <option>University</option>
                  <option>Research Institute</option>
                  <option>Government</option>
                  <option>Industry</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Geographic Preference</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="e.g., Europe, North America..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    value={searchCriteria.location}
                    onChange={(e) => setSearchCriteria({...searchCriteria, location: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expertise Level</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                  <option>Any level</option>
                  <option>Leading Expert (H-index > 40)</option>
                  <option>Established Researcher (H-index 20-40)</option>
                  <option>Emerging Researcher (H-index < 20)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Collaboration Type</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                  <option>Any type</option>
                  <option>Joint Research Project</option>
                  <option>Co-authorship</option>
                  <option>Grant Application</option>
                  <option>Knowledge Exchange</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-12 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing Profiles...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Find Matches
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Matching Features */}
          {!showResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  icon: Brain,
                  title: 'Deep Learning Analysis',
                  description: 'Our AI analyzes 50+ factors including publication history, research topics, and collaboration patterns',
                  color: 'from-purple-500 to-indigo-600'
                },
                {
                  icon: Target,
                  title: 'Compatibility Scoring',
                  description: 'Get match scores based on research alignment, complementary skills, and successful collaboration indicators',
                  color: 'from-blue-500 to-cyan-600'
                },
                {
                  icon: Zap,
                  title: 'Real-time Updates',
                  description: 'Continuously learn from new publications and collaborations to improve match quality over time',
                  color: 'from-yellow-500 to-orange-600'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Results Section */}
          {showResults && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Top Matches Found</h2>
                  <p className="text-gray-600">Based on your research profile and preferences</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                    <Filter className="w-4 h-4" />
                    Refine Filters
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                    <Share2 className="w-4 h-4" />
                    Share Results
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {aiMatches.map((match, index) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer group"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex items-start gap-6">
                      {/* Rank Number */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                          {index + 1}
                        </div>
                      </div>

                      {/* Avatar */}
                      <img
                        src={match.avatar}
                        alt={match.name}
                        className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                      />

                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {match.name}
                            </h3>
                            <p className="text-gray-600 mb-1">{match.title}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {match.institution}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {match.location}
                              </span>
                            </div>
                          </div>

                          {/* Match Score */}
                          <div className={`px-4 py-2 rounded-xl border-2 font-bold ${getMatchScoreColor(match.matchScore)}`}>
                            <div className="text-2xl">{match.matchScore}%</div>
                            <div className="text-xs uppercase tracking-wide">Match</div>
                          </div>
                        </div>

                        {/* SDG Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {match.sdgFocus.map(sdg => (
                            <span
                              key={sdg}
                              className={`w-8 h-8 rounded-full ${sdgColors[sdg]} text-white text-xs font-bold flex items-center justify-center`}
                              title={`SDG ${sdg}`}
                            >
                              {sdg}
                            </span>
                          ))}
                        </div>

                        {/* Match Reasons */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-purple-900">Why This Match?</span>
                          </div>
                          <ul className="space-y-1">
                            {match.matchReasons.map((reason, idx) => (
                              <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-indigo-600">{match.hIndex}</div>
                            <div className="text-xs text-gray-500">H-Index</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-indigo-600">{match.publications}</div>
                            <div className="text-xs text-gray-500">Publications</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-indigo-600">{match.collaborations}</div>
                            <div className="text-xs text-gray-500">Collaborations</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-green-600">{match.availability}</div>
                            <div className="text-xs text-gray-500">{match.responseTime}</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                          <button className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium flex items-center justify-center gap-2">
                            <Mail className="w-4 h-4" />
                            Contact Researcher
                          </button>
                          <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-medium flex items-center justify-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            View Full Profile
                          </button>
                          <button className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                            <Heart className="w-5 h-5" />
                          </button>
                          <button className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      {!showResults && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How AI Matching Works</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our advanced algorithm analyzes multiple dimensions to find your ideal research partners
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: 1, title: 'Profile Analysis', desc: 'AI scans your research history, publications, and expertise areas', icon: Search },
                { step: 2, title: 'Pattern Recognition', desc: 'Identifies complementary skills and research synergies', icon: Brain },
                { step: 3, title: 'Compatibility Scoring', desc: 'Calculates match scores based on 50+ success factors', icon: Target },
                { step: 4, title: 'Continuous Learning', desc: 'Improves recommendations based on collaboration outcomes', icon: TrendingUp }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-purple-300 transform -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default ResearchMatching;
