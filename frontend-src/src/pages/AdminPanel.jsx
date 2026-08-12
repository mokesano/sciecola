import React, { useState } from 'react';
import {
  Plus, Edit2, Trash2, Save, X, User, Briefcase, Lightbulb,
  Building2, DollarSign, Calendar, AlertCircle, CheckCircle,
  BarChart3, TrendingUp
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('researchers');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const forms = {
    researchers: {
      title: 'Manage Researchers',
      icon: User,
      fields: [
        { name: 'orcid', label: 'ORCID', type: 'text', required: true, placeholder: '0000-0002-5152-9727' },
        { name: 'name', label: 'Name', type: 'text', required: true },
        // Identifier selain ORCID. Kolomnya sudah ada di tabel researchers dan
        // dipakai strip identifier pada halaman profil anggota tim.
        { name: 'scopus_id', label: 'Scopus Author ID', type: 'text', placeholder: '57204244163' },
        { name: 'sinta_id', label: 'SINTA ID', type: 'text', placeholder: '6032151' },
        { name: 'researcher_id', label: 'ResearcherID / Publons', type: 'text', placeholder: 'S-9066-2016' },
        { name: 'institution_id', label: 'Institution ID', type: 'number' },
        { name: 'collaboration_status', label: 'Collaboration Status', type: 'select', options: ['open', 'busy', 'limited'] },
        { name: 'bio', label: 'Bio', type: 'textarea' },
        { name: 'research_keywords', label: 'Research Keywords (JSON)', type: 'textarea' },
        { name: 'profile_photo_url', label: 'Profile Photo URL', type: 'url' }
      ],
      endpoint: '/api/admin/researchers'
    },
    projects: {
      title: 'Manage Projects',
      icon: Briefcase,
      fields: [
        { name: 'title', label: 'Project Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'lead_orcid', label: 'Lead Researcher ORCID', type: 'text', required: true },
        { name: 'institution_id', label: 'Institution ID', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['planning', 'active', 'completed', 'paused'] },
        { name: 'start_date', label: 'Start Date', type: 'date' },
        { name: 'end_date', label: 'End Date', type: 'date' },
        { name: 'budget', label: 'Budget ($)', type: 'number' },
        { name: 'progress', label: 'Progress (%)', type: 'number', min: 0, max: 100 },
        { name: 'sdg_focus', label: 'SDG Focus (comma-separated)', type: 'text' }
      ],
      endpoint: '/api/admin/projects'
    },
    opportunities: {
      title: 'Manage Innovation Opportunities',
      icon: Lightbulb,
      fields: [
        { name: 'title', label: 'Opportunity Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'organization_id', label: 'Organization ID', type: 'number', required: true },
        { name: 'category_id', label: 'Category ID', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['open', 'in-progress', 'closed'] },
        { name: 'budget_range', label: 'Budget Range', type: 'text', placeholder: '$1M - $2M' },
        { name: 'deadline', label: 'Application Deadline', type: 'date' },
        { name: 'sdg_alignment', label: 'SDG Alignment (JSON)', type: 'textarea' },
        { name: 'required_skills', label: 'Required Skills (JSON)', type: 'textarea' }
      ],
      endpoint: '/api/admin/opportunities'
    },
    expertise: {
      title: 'Add Researcher Expertise',
      icon: BarChart3,
      fields: [
        { name: 'orcid', label: 'Researcher ORCID', type: 'text', required: true },
        { name: 'field_name', label: 'Expertise Field', type: 'text', required: true, placeholder: 'e.g., AI, Climate Science' },
        { name: 'experience_years', label: 'Years of Experience', type: 'number' },
        { name: 'sdg_number', label: 'SDG Focus (1-17)', type: 'number', min: 1, max: 17 },
        { name: 'expertise_level', label: 'Expertise Level', type: 'select', options: ['beginner', 'intermediate', 'expert'] }
      ],
      endpoint: '/api/admin/expertise'
    }
  };

  const currentForm = forms[activeTab];
  const FormIcon = currentForm.icon;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(currentForm.endpoint, {
        method: formMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setSubmitStatus({
          type: 'success',
          message: `${activeTab.slice(0, -1)} ${formMode === 'create' ? 'created' : 'updated'} successfully`
        });
        setFormData({});
        setShowForm(false);
        setTimeout(() => setSubmitStatus(null), 3000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message || 'Failed to save'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Network error: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setFormMode('create');
    setFormData({});
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setFormMode('edit');
    setFormData(item);
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({});
  };

  return (
    <main className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-700 to-slate-900 text-white py-12">
        <div className="container max-w-7xl mx-auto px-8">
          <div className="flex items-center gap-4 mb-6">
            <FormIcon className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-gray-300 max-w-2xl">Manage researchers, projects, opportunities, and expertise data</p>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-8 border-b border-gray-200">
        <div className="container max-w-7xl mx-auto px-8">
          <div className="flex gap-2 overflow-x-auto pb-4">
            {Object.entries(forms).map(([key, form]) => {
              const Icon = form.icon;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key);
                    setShowForm(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    activeTab === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {form.title}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Status Messages */}
      {submitStatus && (
        <div className={`mt-4 mx-8 p-4 rounded-lg flex items-center gap-2 ${
          submitStatus.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {submitStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {submitStatus.message}
        </div>
      )}

      {/* Form Section */}
      <section className="py-8">
        <div className="container max-w-7xl mx-auto px-8">
          {!showForm ? (
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium mb-6"
            >
              <Plus className="w-5 h-5" />
              Add New {activeTab.slice(0, -1)}
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formMode === 'create' ? 'Add New' : 'Edit'} {activeTab.slice(0, -1)}
                </h2>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {currentForm.fields.map(field => (
                  <div key={field.name}>
                    <label className="block text-[15px] font-semibold text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={formData[field.name] ?? ''}
                        onChange={handleInputChange}
                        required={field.required}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        value={formData[field.name] ?? ''}
                        onChange={handleInputChange}
                        required={field.required}
                        placeholder={field.placeholder}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name] ?? ''}
                        onChange={handleInputChange}
                        required={field.required}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Info Box */}
      <section className="py-8 bg-blue-50">
        <div className="container max-w-7xl mx-auto px-8">
          <div className="bg-white rounded-lg p-6 border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-2">API Integration Required</h3>
            <p className="text-gray-600 text-[15px]">
              Admin endpoints need to be implemented in the backend. Create corresponding API files:<br/>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">api/admin/researchers.php</code>,
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">api/admin/projects.php</code>,
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">api/admin/opportunities.php</code>,
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">api/admin/expertise.php</code>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default AdminPanel;
