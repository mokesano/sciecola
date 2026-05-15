import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Users, Calendar, CheckCircle, Clock, AlertCircle, Plus,
  Search, Filter, MoreVertical, Edit2, Trash2, Share2, Download, MessageSquare,
  FileText, BarChart3, Settings, Eye, Star, Zap, Target, TrendingUp, Award
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const ProjectManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Mock data untuk projects
  const projects = [
    {
      id: 1,
      title: 'Ocean Acidification Impact Study',
      description: 'Comprehensive analysis of ocean acidification effects on marine ecosystems across Pacific regions',
      status: 'active',
      progress: 67,
      startDate: '2024-01-15',
      endDate: '2025-06-30',
      sdgFocus: [13, 14],
      team: [
        { name: 'Dr. Sarah Chen', role: 'PI', avatar: 'https://i.pravatar.cc/150?img=1' },
        { name: 'Prof. Ahmed Hassan', role: 'Co-PI', avatar: 'https://i.pravatar.cc/150?img=2' },
        { name: 'Dr. Maria Santos', role: 'Researcher', avatar: 'https://i.pravatar.cc/150?img=3' }
      ],
      budget: 450000,
      spent: 287500,
      publications: 3,
      collaborators: 12,
      institution: 'MIT',
      lastUpdate: '2 days ago'
    },
    {
      id: 2,
      title: 'Solar Grid Optimization Initiative',
      description: 'Developing AI-powered optimization algorithms for renewable energy grid distribution',
      status: 'active',
      progress: 45,
      startDate: '2024-03-01',
      endDate: '2025-12-31',
      sdgFocus: [7, 9, 11],
      team: [
        { name: 'Prof. Ahmed Hassan', role: 'PI', avatar: 'https://i.pravatar.cc/150?img=2' },
        { name: 'Dr. James Wong', role: 'AI Specialist', avatar: 'https://i.pravatar.cc/150?img=4' }
      ],
      budget: 680000,
      spent: 245000,
      publications: 1,
      collaborators: 8,
      institution: 'Cairo University',
      lastUpdate: '5 days ago'
    },
    {
      id: 3,
      title: 'Urban Water Management System',
      description: 'Smart water purification and distribution system for rapidly growing urban areas',
      status: 'planning',
      progress: 15,
      startDate: '2024-06-01',
      endDate: '2026-05-31',
      sdgFocus: [6, 11, 13],
      team: [
        { name: 'Dr. Raj Patel', role: 'PI', avatar: 'https://i.pravatar.cc/150?img=6' },
        { name: 'Dr. Sarah Chen', role: 'Advisor', avatar: 'https://i.pravatar.cc/150?img=1' }
      ],
      budget: 520000,
      spent: 45000,
      publications: 0,
      collaborators: 6,
      institution: 'IIT Delhi',
      lastUpdate: '1 week ago'
    },
    {
      id: 4,
      title: 'Sustainable Agriculture Methods',
      description: 'Research on organic farming techniques and soil conservation practices for small-scale farmers',
      status: 'completed',
      progress: 100,
      startDate: '2022-09-01',
      endDate: '2024-08-31',
      sdgFocus: [2, 12, 15],
      team: [
        { name: 'Prof. Emma Larsson', role: 'PI', avatar: 'https://i.pravatar.cc/150?img=5' },
        { name: 'Dr. Maria Santos', role: 'Co-PI', avatar: 'https://i.pravatar.cc/150?img=3' }
      ],
      budget: 380000,
      spent: 375000,
      publications: 8,
      collaborators: 15,
      institution: 'Swedish University of Agricultural Sciences',
      lastUpdate: '2 weeks ago'
    },
    {
      id: 5,
      title: 'AI Fairness Framework Development',
      description: 'Creating ethical guidelines and technical frameworks for unbiased AI systems in healthcare',
      status: 'active',
      progress: 78,
      startDate: '2023-11-01',
      endDate: '2025-04-30',
      sdgFocus: [9, 10, 16],
      team: [
        { name: 'Dr. James Wong', role: 'PI', avatar: 'https://i.pravatar.cc/150?img=4' },
        { name: 'Dr. Sarah Chen', role: 'Ethics Advisor', avatar: 'https://i.pravatar.cc/150?img=1' }
      ],
      budget: 590000,
      spent: 425000,
      publications: 5,
      collaborators: 10,
      institution: 'Stanford University',
      lastUpdate: '3 days ago'
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'planning': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'on-hold': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return Zap;
      case 'planning': return Clock;
      case 'completed': return CheckCircle;
      case 'on-hold': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && project.status === 'active';
    if (activeTab === 'planning') return matchesSearch && project.status === 'planning';
    if (activeTab === 'completed') return matchesSearch && project.status === 'completed';
    
    return matchesSearch;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    planning: projects.filter(p => p.status === 'planning').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    totalPublications: projects.reduce((sum, p) => sum + p.publications, 0)
  };

  return (
    <main className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <FolderOpen className="w-5 h-5" />
                <span className="text-sm font-medium">Research Collaboration Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Project Management</h1>
              <p className="text-xl text-white/90 max-w-2xl">
                Manage your research collaborations, track progress, and accelerate impact
              </p>
            </div>
            <button 
              onClick={() => setShowNewProjectModal(true)}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-8">
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Projects', value: stats.total, icon: FolderOpen, color: 'from-blue-500 to-indigo-600' },
              { label: 'Active', value: stats.active, icon: Zap, color: 'from-green-500 to-emerald-600' },
              { label: 'Planning', value: stats.planning, icon: Clock, color: 'from-orange-500 to-red-600' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'from-purple-500 to-pink-600' },
              { label: 'Total Budget', value: `$${(stats.totalBudget / 1000000).toFixed(1)}M`, icon: BarChart3, color: 'from-cyan-500 to-blue-600' },
              { label: 'Publications', value: stats.totalPublications, icon: FileText, color: 'from-yellow-500 to-orange-600' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs & Search */}
      <section className="py-6">
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'all', label: 'All Projects', count: stats.total },
                  { id: 'active', label: 'Active', count: stats.active },
                  { id: 'planning', label: 'Planning', count: stats.planning },
                  { id: 'completed', label: 'Completed', count: stats.completed }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const StatusIcon = getStatusIcon(project.status);
              
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer group"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {project.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(project.status)} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {project.collaborators} collaborators
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {project.publications} publications
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.sdgFocus.map(sdg => (
                          <span
                            key={sdg}
                            className={`w-8 h-8 rounded-full ${sdgColors[sdg]} text-white text-xs font-bold flex items-center justify-center`}
                            title={`SDG ${sdg}`}
                          >
                            {sdg}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-indigo-600">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Team & Budget */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 4).map((member, idx) => (
                        <img
                          key={idx}
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-full border-2 border-white"
                          title={`${member.name} - ${member.role}`}
                        />
                      ))}
                      {project.team.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          +{project.team.length - 4}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Budget Used</div>
                        <div className="font-semibold text-gray-900">
                          ${(project.spent / 1000).toFixed(0)}K / ${(project.budget / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Institution</div>
                        <div className="font-semibold text-gray-900">{project.institution}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group/btn">
                          <Eye className="w-5 h-5 text-gray-400 group-hover/btn:text-indigo-600" />
                        </button>
                        <button className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group/btn">
                          <Edit2 className="w-5 h-5 text-gray-400 group-hover/btn:text-indigo-600" />
                        </button>
                        <button className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group/btn">
                          <MessageSquare className="w-5 h-5 text-gray-400 group-hover/btn:text-indigo-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-3 text-right">
                    Last updated {project.lastUpdate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 bg-white">
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Plus, title: 'Create Project', desc: 'Start a new research collaboration', color: 'from-blue-500 to-indigo-600' },
              { icon: Users, title: 'Invite Collaborators', desc: 'Add team members to your projects', color: 'from-green-500 to-emerald-600' },
              { icon: BarChart3, title: 'Generate Report', desc: 'Export project analytics and metrics', color: 'from-purple-500 to-pink-600' },
              { icon: Target, title: 'Set Milestones', desc: 'Define key deliverables and deadlines', color: 'from-orange-500 to-red-600' }
            ].map((action, index) => (
              <button
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group text-left border border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProjectManagement;
