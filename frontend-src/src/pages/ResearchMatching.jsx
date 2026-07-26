import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Brain, Users, Target, Zap, Search, Filter, Sparkles, TrendingUp,
  Award, BookOpen, Building2, MapPin, Mail, ExternalLink, CheckCircle,
  Star, Lightbulb, Network, ArrowRight, Heart, MessageSquare, Share2
} from 'lucide-react';

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
  const [aiMatches, setAiMatches] = useState([]);

  // Fallback mock data
  const mockMatches = [
    {
      id: 1,
      name: 'Dr. Sarah Chen',
      title: 'Professor of Climate Science',
      institution: 'MIT',
      location: 'Cambridge, MA, USA',
      match_score: 96,
      match_reasons: ['Similar research focus', 'Complementary expertise', 'Active in SDG 13 & 14'],
      sdg_focus: [13, 14, 15],
      h_index: 52,
      publications: 234,
      collaborations: 47,
      availability: 'Available for new projects'
    },
    {
      id: 2,
      name: 'Prof. Ahmed Hassan',
      title: 'Director of Renewable Energy Lab',
      institution: 'Cairo University',
      location: 'Cairo, Egypt',
      match_score: 93,
      match_reasons: ['Expertise in sustainable energy', 'Strong publication record', 'Active network'],
      sdg_focus: [7, 9, 11],
      h_index: 48,
      publications: 189,
      collaborations: 63,
      availability: 'Available for new projects'
    },
    {
      id: 3,
      name: 'Dr. James Wong',
      title: 'AI & Ethics Researcher',
      institution: 'Stanford University',
      location: 'Stanford, CA, USA',
      match_score: 89,
      match_reasons: ['AI expertise', 'Ethics alignment', 'High citation impact'],
      sdg_focus: [9, 10, 16],
      h_index: 45,
      publications: 178,
      collaborations: 52,
      availability: 'Limited availability'
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

  const handleSearch = async () => {
    setIsSearching(true);

    try {
      const response = await fetch('/api/research_matching.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchCriteria)
      });

      const data = await response.json();

      if (data.status === 'success' && (data.matches || data.data)) {
        setAiMatches(data.matches || data.data);
      } else {
        setAiMatches(mockMatches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setAiMatches(mockMatches);
    } finally {
      setIsSearching(false);
      setShowResults(true);
    }
  };

  return (
    <main className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white py-28 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered Collaboration</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Research Matching
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-4xl mx-auto">
              Discover perfect research collaborators using advanced AI algorithms that analyze expertise, interests, and compatibility
            </p>
          </div>
        </div>
      </section>

      {/* Search Criteria Section */}
      <section className="py-28">
        <div className="container px-8 max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Match</h2>
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
                  <option>Leading Expert (H-index &gt; 40)</option>
                  <option>Established Researcher (H-index 20-40)</option>
                  <option>Emerging Researcher (H-index &lt; 20)</option>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">Top Matches Found</h2>
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
                        src={match.avatar || `https://i.pravatar.cc/150?u=${match.id}`}
                        alt={match.name}
                        className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                        onError={(e) => { e.target.src = '/assets/img/researcher-default.svg'; }}
                      />

                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {match.name}
                            </h3>
                            <p className="text-gray-600 mb-1">{match.title || 'Researcher'}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {match.institution && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {match.institution}
                                </span>
                              )}
                              {match.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {match.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Match Score */}
                          <div className={`px-4 py-2 rounded-xl border-2 font-bold ${getMatchScoreColor(match.match_score)}`}>
                            <div className="text-2xl">{match.match_score}%</div>
                            <div className="text-xs uppercase tracking-wide">Match</div>
                          </div>
                        </div>

                        {/* SDG Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(match.sdg_focus || []).map(sdg => (
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
                            {(match.match_reasons || []).map((reason, idx) => (
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
                            <div className="text-lg font-bold text-indigo-600">{match.h_index}</div>
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
                            <div className="text-xs text-gray-500">{match.response_time}</div>
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
        <section className="pt-20 pb-28 bg-white">
          <div className="container px-8 max-w-7xl mx-auto relative">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How AI Matching Works</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
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
                    <ArrowRight className="hidden md:block absolute top-1/2 -right-8 w-8 h-8 text-purple-300 transform -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default ResearchMatching;