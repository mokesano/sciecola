import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

const Api = () => {
  const { t } = useTranslation('api');
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const contentRef = useRef(null);

  // API Documentation structure
  const sections = [
    {
      id: 'overview',
      title: t('nav.overview.title'),
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      subsections: [
        { id: 'base-url', title: t('nav.overview.sub.base-url') },
        { id: 'endpoints-list', title: t('nav.overview.sub.endpoints-list') }
      ]
    },
    {
      id: 'auth',
      title: t('nav.auth.title'),
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      subsections: [
        { id: 'auth-methods', title: t('nav.auth.sub.auth-methods') },
        { id: 'key-format', title: t('nav.auth.sub.key-format') },
        { id: 'rate-limit', title: t('nav.auth.sub.rate-limit') }
      ]
    },
    {
      id: 'architecture',
      title: t('nav.architecture.title'),
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
      subsections: [
        { id: 'supplied-data', title: t('nav.architecture.sub.supplied-data') },
        { id: 'raw-data', title: t('nav.architecture.sub.raw-data') }
      ]
    },
    {
      id: 'weights',
      title: t('nav.weights.title'),
      icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
      subsections: [
        { id: 'sdg-weights', title: t('nav.weights.sub.sdg-weights') },
        { id: 'impact-weights', title: t('nav.weights.sub.impact-weights') }
      ]
    },
    {
      id: 'batch',
      title: t('nav.batch.title'),
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      subsections: [
        { id: 'batch-flow', title: t('nav.batch.sub.batch-flow') },
        { id: 'batch-code', title: t('nav.batch.sub.batch-code') }
      ]
    },
    {
      id: 'endpoints',
      title: t('nav.endpoints.title'),
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      subsections: [
        { id: 'ep-health', title: 'GET /health' },
        { id: 'ep-sdg-versions', title: 'GET /sdg/versions' },
        { id: 'ep-sdg-classify', title: 'POST /sdg/{version}/classify' },
        { id: 'ep-scopus', title: 'GET /scopus/author' },
        { id: 'ep-orcid', title: 'GET /orcid/profile' },
        { id: 'ep-citation', title: 'GET /citation/doi' },
        { id: 'ep-journal', title: 'GET /journal/metrics' },
        { id: 'ep-sinta', title: 'GET /sinta/score' },
        { id: 'ep-impact', title: 'POST /impact/calculate' },
        { id: 'ep-trend', title: 'POST /trend/analyze' },
        { id: 'ep-policy', title: 'POST /recommendation/policy' },
        { id: 'ep-revoke', title: 'POST /admin/keys/revoke' }
      ]
    },
    {
      id: 'errors',
      title: t('nav.errors.title'),
      icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      subsections: [
        { id: 'error-codes', title: t('nav.errors.sub.error-codes') },
        { id: 'error-format', title: t('nav.errors.sub.error-format') }
      ]
    }
  ];

  // Code snippets for copy functionality
  const codeSnippets = {
    baseUrl: `https://api.sangia.org`,
    apiKeyFormat: `wz_{user_id}_{unix_timestamp}_{hmac16}`,
    apiKeyValidation: `hmac16 = first 16 chars of HMAC-SHA256("{user_id}:{timestamp}", WIZDAM_SHARED_SECRET)
TTL = 365 hari sejak timestamp`,
    apiKeyHeader: `X-API-Key: wz_42_1719000000_a3f8e2c1d5b7`,
    apiKeyBearer: `Authorization: Bearer wz_42_1719000000_a3f8e2c1d5b7`,
    apiKeyQuery: `?api_key=wz_42_1719000000_a3f8e2c1d5b7`,
    error401: `{ "status": "error", "code": 401, "message": "Invalid or expired API key." }`,
    suppliedData: `{
  "orcid": "0000-0002-1234-5678",
  "supplied_works": [
    {
      "title": "Solar Panel Adoption in Rural Java",
      "doi": "10.1234/example",
      "publication_year": 2023,
      "type": "journal-article",
      "journal_title": "Renewable Energy"
    }
  ],
  "supplied_person": {
    "name": "Budi Santoso",
    "given_names": "Budi",
    "family_name": "Santoso"
  },
  "supplied_scopus": {
    "h_index": 18,
    "document_count": 145,
    "citation_count": 3200
  }
}`,
    rawDataResponse: `{
  "status": "success",
  "...": "...",
  "raw_data": {
    "doi": "10.1234/example",
    "metadata": { "..." : "..." },
    "fetched_at": "2025-01-01T00:00:00+00:00"
  }
}`,
    sdgWeights: `{
  "title": "...",
  "weights": {
    "keyword": 0.25,
    "similarity": 0.30,
    "substantive": 0.25,
    "causal": 0.20,
    "max_sdgs": 5,
    "thresholds": {
      "min": 0.18,
      "confidence": 0.28,
      "high": 0.55
    }
  }
}`,
    impactWeights: `{
  "orcid": "0000-0002-1234-5678",
  "weights": {
    "academic": 0.45,
    "social": 0.20,
    "economic": 0.20,
    "sdg": 0.15
  }
}`,
    batchCode: `async function classifyWithBatch(orcid, endpoint) {
  let offset = 0;
  while (true) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ orcid, offset, batch_size: 20 })
    });
    const data = await res.json();
    if (data.status === 'success') return data;
    if (data.status !== 'processing') throw new Error(data.message);
    updateProgressBar(data.progress.percent);
    offset = data.next_offset;
    await delay(300); // jeda 300ms antar batch
  }
}`,
    batchResponse: `{
  "status": "processing",
  "orcid": "0000-0002-1234-5678",
  "progress": { "processed": 20, "total_works": 50, "percent": 40 },
  "next_offset": 20
}`,
    healthResponse: `{ "status": "up", "service": "Sangia API Engine", "time": "2025-01-01T00:00:00+00:00" }`,
    sdgVersionsResponse: `{
  "status": "success",
  "data": {
    "v5": {
      "label": "Causal-boosted stable (v5.1.8)",
      "weights": { "keyword": 0.30, "similarity": 0.30, "substantive": 0.20, "causal": 0.20 },
      "thresholds": { "min": 0.20, "confidence": 0.30, "high": 0.60 }
    }
  }
}`,
    sdgClassifyRequest: `{
  "title": "Renewable Energy Adoption in Rural Indonesia",
  "abstract": "This study examines...",
  "orcid": "0000-0002-1234-5678",
  "doi": "10.1234/example",
  "refresh": false,
  "offset": 0,
  "batch_size": 20,
  "weights": { "keyword": 0.30, "similarity": 0.30, "substantive": 0.20, "causal": 0.20 },
  "supplied_works": []
}`,
    sdgClassifyResponse: `{
  "status": "success",
  "version": "v5",
  "weights_applied": { "keyword": 0.30, "...": "..." },
  "sdg_analysis": {
    "sdgs": ["SDG7", "SDG13"],
    "sdg_confidence": { "SDG7": 0.724, "SDG13": 0.611 },
    "contributor_types": { "SDG7": "Active Contributor" },
    "detailed_analysis": {
      "SDG7": {
        "score": 0.724,
        "confidence_level": "High",
        "components": { "keyword_score": 0.65, "similarity_score": 0.71, "substantive_score": 0.80, "causal_score": 0.75 }
      }
    }
  }
}`,
    scopusRequest: `{
  "supplied_scopus": {
    "author": { "full_name": "Budi Santoso", "h_index": 18, "citation_count": 3200 },
    "publications": []
  }
}`,
    scopusResponse: `{
  "status": "success",
  "author_id": "57200000000",
  "author": {
    "full_name": "Budi Santoso",
    "affiliation": "Universitas Indonesia",
    "h_index": 18,
    "document_count": 145,
    "citation_count": 3200,
    "data_source": "scopus"
  },
  "publications": [ { "doi": "10.1234/example", "title": "...", "year": 2023, "cited_by_count": 42 } ],
  "data_source": "scopus_api",
  "raw_data": { "author": {}, "publications": [], "fetched_at": "2025-01-01T00:00:00+00:00" },
  "cache_info": { "from_cache": false }
}`,
    orcidRequest: `{
  "supplied_works": [ { "title": "...", "doi": "...", "publication_year": 2023 } ],
  "supplied_person": { "name": "Budi Santoso", "given_names": "Budi", "family_name": "Santoso" }
}`,
    orcidResponse: `{
  "status": "success",
  "orcid": "0000-0002-1234-5678",
  "person_summary": {
    "name": "Budi Santoso",
    "emails": ["budi@ui.ac.id"],
    "keywords": ["renewable energy", "SDG"],
    "country": "ID"
  },
  "works": [ { "title": "Solar Panel Adoption in Rural Java", "doi": "10.1234/example", "publication_year": 2023 } ],
  "works_count": 87,
  "data_source": "orcid_api",
  "raw_data": { "person": {}, "works": [], "fetched_at": "2025-01-01T00:00:00+00:00" },
  "cache_info": { "from_cache": false }
}`,
    citationResponse: `{
  "status": "success",
  "doi": "10.1234/example",
  "article_metadata": { "title": "...", "authors": ["Budi Santoso"], "publication_year": 2023, "is_referenced_by": 42 },
  "citations": {
    "opencitations": [ { "citing_doi": "10.5678/...", "source": "opencitations" } ],
    "crossref": [],
    "openalex": [],
    "semantic_scholar": []
  },
  "citation_count": { "opencitations": 12, "crossref": 0, "openalex": 8, "semantic_scholar": 6 },
  "total_unique": 18,
  "data_source": "external_apis",
  "raw_data": { "doi": "10.1234/example", "metadata": {}, "counts": {}, "fetched_at": "2025-01-01T00:00:00+00:00" },
  "cache_info": { "from_cache": false }
}`,
    journalResponse: `{
  "status": "success",
  "journal": {
    "title": "Renewable Energy",
    "issn_print": "0960-1481",
    "publisher": "Elsevier",
    "open_access": false,
    "active": true
  },
  "metrics": {
    "citescore": 13.2,
    "sjr": 1.845,
    "snip": 2.11,
    "quartile": "Q1",
    "subject_areas": [ { "name": "Renewable Energy", "code": "2105", "quartile": "Q1" } ]
  },
  "raw_data": { "issn": "0960-1481", "metrics": {}, "fetched_at": "2025-01-01T00:00:00+00:00" },
  "cache_info": { "from_cache": false }
}`,
    sintaResponse: `{
  "status": "success",
  "issn": "2549-1385",
  "title": "Jurnal Energi Terbarukan Indonesia",
  "impact": "2.45",
  "grade": "S2",
  "sinta_id": "123456",
  "sinta_url": "https://sinta.kemdiktisaintek.go.id/journals/profile/123456",
  "raw_data": { "issn": "2549-1385", "sinta": {}, "fetched_at": "2025-01-01T00:00:00+00:00" },
  "cache_info": { "from_cache": false }
}`,
    impactRequest: `{
  "orcid": "0000-0002-1234-5678",
  "scopus_id": "57200000000",
  "social": {
    "media_mentions": 75,
    "policy_citations": 60,
    "social_shares": 80,
    "news_coverage": 50
  },
  "economic": {
    "industry_adoption": 40,
    "patents": 20,
    "tech_transfer": 35,
    "startup_spinoffs": 10
  },
  "weights": { "academic": 0.40, "social": 0.25, "economic": 0.20, "sdg": 0.15 },
  "refresh": false,
  "offset": 0,
  "batch_size": 20,
  "supplied_works": [],
  "supplied_person": null,
  "supplied_scopus": null
}`,
    impactResponse: `{
  "status": "success",
  "orcid": "0000-0002-1234-5678",
  "name": "Budi Santoso",
  "composite": 68.45,
  "pillars": { "academic": 82.10, "social": 66.25, "economic": 26.25, "sdg": 54.80 },
  "weights": { "academic": 0.40, "social": 0.25, "economic": 0.20, "sdg": 0.15 },
  "sdg_tags": [ { "sdg": 7, "code": "SDG7", "score": 0.724, "count": 12 } ],
  "academic_metrics": { "publication_count": 87, "h_index": 18, "citation_count": 3200 },
  "data_sources": { "orcid": "orcid_api", "scopus": "scopus_api" },
  "raw_data": { "orcid_person": {}, "orcid_works": [], "scopus": {}, "fetched_at": "2025-01-01T00:00:00+00:00" },
  "api_version": "v1.1-batch",
  "calculated_at": "2025-01-01T00:00:00+00:00",
  "cache_info": { "from_cache": false }
}`,
    impactFormula: `Composite = Academic×w_academic + Social×w_social + Economic×w_economic + SDG×w_sdg

Academic  = (min(100, h_index×3.5) × 0.45) + (log10(citations+1)×25 × 0.35) + (min(100, pub_count×1.2) × 0.20)
Social    = avg(media_mentions, policy_citations, social_shares, news_coverage)  [0–100 each]
Economic  = avg(industry_adoption, patents, tech_transfer, startup_spinoffs)     [0–100 each]
SDG       = (coverage_ratio×0.4 + avg_confidence×0.6) × 100
            coverage_ratio = min(1.0, distinct_sdg_count / 5)`,
    trendRequest: `{
  "orcid": "0000-0002-1234-5678",
  "analysis_type": "impact_trajectory",
  "time_range": "5y",
  "scopus_id": "57200000000",
  "refresh": false,
  "supplied_works": [
    {
      "title": "Solar Panel Adoption in Rural Java",
      "doi": "10.1234/example",
      "publication_year": 2023,
      "authors_string": "Budi Santoso, Ani Wijaya"
    }
  ],
  "supplied_scopus": null
}`,
    trendResponse: `{
  "status": "success",
  "orcid": "0000-0002-1234-5678",
  "analysis_type": "impact_trajectory",
  "time_range": "5y",
  "data": {
    "yearly_publications": { "2019": 8, "2020": 12, "2021": 15, "2022": 18, "2023": 22 },
    "growth_trend": "increasing",
    "growth_rate_percent": 175.0,
    "peak_year": 2023,
    "total_works_analyzed": 75
  },
  "data_source": "wizdam_scola_db",
  "api_version": "v1.0-trend"
}`,
    policyRequest: `{
  "stakeholder_type": "government",
  "domain": "sdg_achievement",
  "time_horizon": "medium_term",
  "region": "Indonesia",
  "research_landscape": {
    "total_researchers": 1250,
    "total_publications": 8900,
    "dominant_sdgs": ["SDG4", "SDG7", "SDG13"],
    "weak_sdgs": ["SDG14", "SDG15"],
    "strong_sdgs": ["SDG4", "SDG7"],
    "avg_impact_score": 62.5,
    "collaboration_rate": 0.68,
    "international_collab_rate": 0.23,
    "top_institutions": ["Universitas Indonesia", "ITB"]
  }
}`,
    policyResponse: `{
  "status": "success",
  "stakeholder_type": "government",
  "domain": "sdg_achievement",
  "region": "Indonesia",
  "time_horizon_key": "medium_term",
  "context_summary": {
    "data_driven": true,
    "researchers": 1250,
    "strong_sdgs": ["SDG4", "SDG7"],
    "weak_sdgs": ["SDG14", "SDG15"],
    "region": "Indonesia"
  },
  "recommendations": [
    {
      "id": "GOV-01",
      "priority": "high",
      "category": "infrastructure",
      "target_sdgs": ["SDG4", "SDG9", "SDG17"],
      "activity_keys": ["modernize_research_labs", "expand_digital_library", "build_hpc_center"],
      "expected_impact": { "research_capacity_increase": "40%", "international_collaboration_growth": "60%" },
      "time_horizon_key": "medium_term",
      "implementation": {
        "horizon_key": "medium_term",
        "steps": [
          { "phase": "phase_1", "activity_key": "modernize_research_labs" },
          { "phase": "phase_2", "activity_key": "expand_digital_library" },
          { "phase": "phase_3", "activity_key": "build_hpc_center" }
        ]
      },
      "success_metrics": {
        "tracking_period": "annual",
        "review_mechanism": "periodic_committee_review",
        "targets": { "research_capacity_increase": "40%" }
      }
    }
  ],
  "priority_matrix": {
    "high_priority": ["GOV-01", "GOV-02", "GOV-04"],
    "medium_priority": ["GOV-03"],
    "low_priority": [],
    "total": 4
  },
  "data_driven": true,
  "api_version": "v1.0-recommendation"
}`,
    revokeRequest: `{ "key": "wz_42_1719000000_a3f8e2c1d5b7" }`,
    revokeResponse: `{ "status": "success", "message": "Key revoked" }`,
    errorFormat: `{ "status": "error", "code": 400, "message": "orcid is required" }`
  };

  // Handle copy to clipboard
  const copyToClipboard = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Scroll to section handler
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId.split('-')[0]);
    }
    setIsSidebarOpen(false);
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-doc-section]');
      let current = 'overview';
      
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          current = section.id;
        }
      });
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter sections based on search
  const filteredSections = searchQuery
    ? sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.subsections.some(sub =>
          sub.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : sections;

  // Code Block Component
  const CodeBlock = ({ code, id, language = 'json' }) => (
    <div className="relative group my-4">
      <pre className="bg-gray-900 text-gray-100 p-4 pt-12 rounded-xl text-[15px] overflow-x-auto border border-gray-700">
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
      <span className="absolute top-3 left-3 px-2 py-1 bg-gray-800 text-gray-400 text-sm rounded font-medium">
        {language}
      </span>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        title="Copy to clipboard"
      >
        {copiedCode === id ? (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 1024 1024">
            <path fill="currentColor" d="M464 85.333333H768q70.698667 0 120.661333 50.005334Q938.666667 185.301333 938.666667 256v304a42.666667 42.666667 0 1 1-85.333334 0V256q0-35.328-25.002666-60.330667T768 170.666667h-304a42.666667 42.666667 0 1 1 0-85.333334z m314.666667 714.666667q0 57.429333-40.618667 98.048T640 938.666667H224q-57.429333 0-98.048-40.618667T85.333333 800V384q0-57.429333 40.618667-98.048T224 245.333333H640q57.429333 0 98.048 40.618667T778.666667 384v416z m-85.333334 0V384q0-22.101333-15.616-37.717333T640 330.666667H224q-22.101333 0-37.717333 15.616T170.666667 384v416q0 22.101333 15.616 37.717333T224 853.333333H640q22.101333 0 37.717333-15.616t15.616-37.717333z"/>
        </svg>
        )}
      </button>
    </div>
  );

  // Endpoint Badge Component
  const MethodBadge = ({ method }) => {
    const colors = {
      GET: 'bg-green-100 text-green-700',
      POST: 'bg-blue-100 text-blue-700',
      PUT: 'bg-amber-100 text-amber-700',
      DELETE: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded text-xm font-bold ${colors[method] || 'bg-gray-100 text-gray-700'}`}>
        {method}
      </span>
    );
  };

  // Auth Badge Component
  const AuthBadge = ({ auth }) => (
    <span className={`px-2 py-1 rounded text-xm font-medium ${
      auth === 'Publik' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
    }`}>
      {auth}
    </span>
  );

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xm text-gray-600 mb-16">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/docs/documentation" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.docs')}</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">{t('title')}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sangia API Engine</h1>
        <p className="text-gray-600 max-w-3xl text-lg font-semibold">
          Dokumentasi lengkap API Sangia untuk klasifikasi SDG, perhitungan Wizdam Impact Score, 
          dan analisis tren penelitian. Base URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xm">https://api.sangia.org</code>
        </p>
      </div>

      {/* API Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xm text-gray-500 mb-1">{t('overview.base_url_label')}</p>
          <p className="font-mono text-xm font-semibold text-gray-900 break-all">{codeSnippets.baseUrl}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xm text-gray-500 mb-1">{t('overview.version_label')}</p>
          <p className="font-semibold text-gray-900">v1</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xm text-gray-500 mb-1">{t('nav.auth.title')}</p>
          <p className="font-semibold text-gray-900">{t('auth.hmac_label')}</p>
        </div>
      </div>

      {/* Search & Mobile Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder={t('search_ph')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden px-4 py-3 bg-white border border-gray-200 rounded-xl text-xm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Navigasi
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className={`lg:col-span-1 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4 px-2">{t('overview.endpoints_list')}</h3>
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-m transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className={`w-5 h-5 ${activeSection === section.id ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={section.icon} />
                    </svg>
                    {section.title}
                  </button>
                  {section.subsections.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => scrollToSection(sub.id)}
                      className={`w-full pl-10 pr-3 py-1.5 text-[15px] transition-colors text-left ${
                        activeSection === sub.id
                          ? 'text-indigo-600 font-medium'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg'
                      }`}
                    >
                      {sub.title}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Documentation Content */}
        <div className="lg:col-span-3" ref={contentRef}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8 space-y-12">
            
            {/* Overview Section */}
            <section id="overview" data-doc-section className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Overview
              </h2>
              
              <div id="base-url" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('overview.base_url')}</h3>
                <CodeBlock code={codeSnippets.baseUrl} id="base-url-code" language="url" />
                <p className="text-m text-gray-600 mt-2">
                  Semua endpoint API diawali dengan <code className="bg-gray-100 px-1.5 py-0.5 rounded">/api/v1</code> kecuali endpoint publik seperti <code className="bg-gray-100 px-1.5 py-0.5 rounded">/health</code>.
                </p>
              </div>

              <div id="endpoints-list">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('overview.endpoints_list')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[15px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">{t('overview.th_method')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">{t('overview.th_endpoint')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">{t('overview.th_auth')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">{t('errors.th_note')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="GET" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/health</td>
                        <td className="px-4 py-3"><AuthBadge auth="Publik" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_health')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="GET" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1</td>
                        <td className="px-4 py-3"><AuthBadge auth="Publik" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.catalog')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="GET" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/sdg/versions</td>
                        <td className="px-4 py-3"><AuthBadge auth="Publik" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_versions')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="POST" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/sdg/{'{version}'}/classify</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_classify')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="POST" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/sdg/classify</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('endpoints.alias_v5')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="GET" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/scopus/author</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_scopus')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="GET" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/orcid/profile</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_orcid')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="GET" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/citation/doi</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_citation')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="GET" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/journal/metrics</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_journal')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="GET" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/sinta/score</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_sinta')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="POST" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/impact/calculate</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_impact')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="POST" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/trend/analyze</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_trend')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="POST" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/recommendation/policy</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_policy')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3"><MethodBadge method="POST" /></td>
                        <td className="px-4 py-3 font-mono text-xm">/api/v1/admin/keys/revoke</td>
                        <td className="px-4 py-3"><AuthBadge auth="API Key" /></td>
                        <td className="px-4 py-3 text-gray-600">{t('overview.e_revoke')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Authentication Section */}
            <section id="auth" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                Autentikasi
              </h2>
              
              <p className="text-gray-700 mb-4">
                {t('auth.intro')}
              </p>
              
              <div id="auth-methods" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('auth.methods')}</h3>
                <p className="text-m text-gray-600 mb-3">{t('auth.send_via')}</p>
                <div className="space-y-2">
                  <CodeBlock code={codeSnippets.apiKeyHeader} id="auth-header" language="http" />
                  <CodeBlock code={codeSnippets.apiKeyBearer} id="auth-bearer" language="http" />
                  <CodeBlock code={codeSnippets.apiKeyQuery} id="auth-query" language="url" />
                </div>
              </div>

              <div id="key-format" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('auth.key_format')}</h3>
                <CodeBlock code={codeSnippets.apiKeyFormat} id="key-format-code" language="plaintext" />
                <p className="text-xm text-gray-600 mt-2 mb-3">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded">hmac16</code> = 16 karakter pertama dari:
                </p>
                <CodeBlock code={codeSnippets.apiKeyValidation} id="key-validation" language="plaintext" />
                <p className="text-xm text-gray-600 mt-3">
                  <strong>{t('auth.ttl_label')}</strong> 1 tahun sejak <code className="bg-gray-100 px-1.5 py-0.5 rounded">timestamp</code>
                </p>
              </div>

              <div id="rate-limit">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('auth.rate_title')}</h3>
                <p className="text-xm text-gray-600 mb-3">
                  <strong>{t('auth.rate_label')}</strong> 60 request/60 detik per API key (default). Dapat dikonfigurasi via env.<br/>
                  Header response: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{t('auth.limit_hdr')}</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded">{t('auth.remain_hdr')}</code>
                </p>
                <p className="text-xm text-gray-600 mb-3"><strong>{t('auth.err_401')}</strong></p>
                <CodeBlock code={codeSnippets.error401} id="error-401" language="json" />
              </div>
            </section>

            {/* Architecture Section */}
            <section id="architecture" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </span>
                Arsitektur Data
              </h2>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-lg text-amber-800">
                  <strong>{t('endpoints.caution')}</strong> sangia-apis adalah <strong>pure analysis engine</strong> — tidak menyimpan hasil apapun secara permanen. 
                  Semua persistensi data adalah tanggung jawab <strong>Sangia Scieco</strong>.
                </p>
              </div>

              <div id="supplied-data" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('endpoints.pattern_label')}<code>supplied_data</code></h3>
                <p className="text-xm text-gray-600 mb-3">
                  Jika Sangia Scieco sudah memiliki data di DB, kirimkan dalam request body. 
                  sangia-apis akan menggunakan data tersebut <strong>tanpa melakukan cURL ke API eksternal</strong>.
                </p>
                <CodeBlock code={codeSnippets.suppliedData} id="supplied-data-code" language="json" />
                <p className="text-xm text-gray-600 mt-2">
                  Response saat data disupply: <code className="bg-gray-100 px-1.5 py-0.5 rounded">"data_source": "sangia_scola_db"</code>
                </p>
              </div>

              <div id="raw-data">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('endpoints.pattern_label')}<code>raw_data</code></h3>
                <p className="text-xm text-gray-600 mb-3">
                  Ketika sangia-apis mengambil data dari API eksternal (ORCID/Scopus/dll), response menyertakan field <code className="bg-gray-100 px-1.5 py-0.5 rounded">raw_data</code> berisi data mentah beserta <code className="bg-gray-100 px-1.5 py-0.5 rounded">fetched_at</code>. 
                  Sangia Scieco harus menyimpan ini ke tabelnya (citations_cache, author_profiles_cache, dll).
                </p>
                <CodeBlock code={codeSnippets.rawDataResponse} id="raw-data-code" language="json" />
                <p className="text-xm text-gray-600 mt-2">
                  Response saat data diambil dari API eksternal: <code className="bg-gray-100 px-1.5 py-0.5 rounded">"data_source": "orcid_api"</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded">"external_apis"</code> / dll.
                </p>
              </div>
            </section>

            {/* Weights Override Section */}
            <section id="weights" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </span>
                Override Bobot Analisis
              </h2>
              
              <p className="text-gray-700 mb-4">
                {t('weights.intro')}
              </p>

              <div id="sdg-weights" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('weights.sdg')}</h3>
                <CodeBlock code={codeSnippets.sdgWeights} id="sdg-weights-code" language="json" />
              </div>

              <div id="impact-weights">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('weights.impact')}</h3>
                <CodeBlock code={codeSnippets.impactWeights} id="impact-weights-code" language="json" />
              </div>
            </section>

            {/* Batch Pattern Section */}
            <section id="batch" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
                Pola Batch Anti-Timeout
              </h2>
              
              <p className="text-gray-700 mb-4">
                {t('batch.intro')}
              </p>

              <div id="batch-flow" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('endpoints.param')}</h3>
                <ul className="list-disc list-inside text-xm text-gray-700 space-y-1 mb-4">
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">offset</code> (int, default <code>0</code>) — posisi mulai batch</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">batch_size</code> (int, default <code>20</code>, max <code>50</code>) — jumlah karya per request</li>
                </ul>
              </div>

              <div id="batch-code" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('batch.example')}</h3>
                <CodeBlock code={codeSnippets.batchCode} id="batch-code-js" language="javascript" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('batch.processing')}</h3>
                <CodeBlock code={codeSnippets.batchResponse} id="batch-response" language="json" />
              </div>
            </section>

            {/* Endpoints Detail Section */}
            <section id="endpoints" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </span>
                Endpoint Detail
              </h2>

              {/* /health */}
              <div id="ep-health" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="GET" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/health</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">{t('endpoints.health_desc')}</p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.response')}</h4>
                <CodeBlock code={codeSnippets.healthResponse} id="health-res" language="json" />
              </div>

              {/* /sdg/versions */}
              <div id="ep-sdg-versions" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="GET" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/sdg/versions</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">{t('endpoints.versions_desc')}</p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.response')}</h4>
                <CodeBlock code={codeSnippets.sdgVersionsResponse} id="sdg-versions-res" language="json" />
              </div>

              {/* /sdg/{version}/classify */}
              <div id="ep-sdg-classify" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="POST" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/sdg/{'{version}'}/classify</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">
                  Klasifikasi SDG dari teks, DOI, atau ORCID.<br/>
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded">{'{version}'}</code> = <code>v0</code> | <code>v1</code> | <code>v2</code> | <code>v3</code> | <code>v4</code> | <code>v5</code> | <code>v5e</code>
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.request_body')}</h4>
                <CodeBlock code={codeSnippets.sdgClassifyRequest} id="sdg-classify-req" language="json" />
                <p className="text-xm text-gray-500 mb-3">
                  Gunakan <strong>salah satu</strong>: <code>title+abstract</code>, <code>doi</code>, atau <code>orcid</code>. 
                  Jika <code>orcid</code>, gunakan pola batch.<br/>
                  <code>supplied_works</code> — opsional, kirim data karya dari DB Wizdam Scola untuk skip fetch ORCID.
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.response_title_abstract')}</h4>
                <CodeBlock code={codeSnippets.sdgClassifyResponse} id="sdg-classify-res" language="json" />
              </div>

              {/* /scopus/author */}
              <div id="ep-scopus" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="GET" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/scopus/author</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">
                  Profil author dan daftar publikasi dari Scopus API.<br/>
                  <strong>{t('endpoints.query_params')}</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded">authorid</code> (required), <code>count</code> (1–25, default 10), <code>refresh</code> (bool)
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.request_body_optional')}</h4>
                <CodeBlock code={codeSnippets.scopusRequest} id="scopus-req" language="json" />
                <h4 className="text-xm font-semibold text-gray-900 mb-2 mt-4">{t('endpoints.response')}</h4>
                <CodeBlock code={codeSnippets.scopusResponse} id="scopus-res" language="json" />
              </div>

              {/* /orcid/profile */}
              <div id="ep-orcid" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="GET" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/orcid/profile</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">
                  Profil peneliti lengkap dari ORCID public API.<br/>
                  <strong>{t('endpoints.query_params')}</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded">orcid</code> (required, format <code>0000-0000-0000-0000</code>), <code>refresh</code> (bool), <code>limit</code> (default 50)
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.request_body_optional')}</h4>
                <CodeBlock code={codeSnippets.orcidRequest} id="orcid-req" language="json" />
                <h4 className="text-xm font-semibold text-gray-900 mb-2 mt-4">{t('endpoints.response')}</h4>
                <CodeBlock code={codeSnippets.orcidResponse} id="orcid-res" language="json" />
              </div>

              {/* /citation/doi */}
              <div id="ep-citation" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="GET" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/citation/doi</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">
                  Data sitasi multi-sumber untuk sebuah DOI.<br/>
                  <strong>{t('endpoints.query_params')}</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded">doi</code> (required), <code>limit</code> (1–50, default 15), <code>refresh</code> (bool)<br/>
                  <strong>{t('endpoints.source_label')}</strong> OpenCitations → Crossref → OpenAlex → Semantic Scholar
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.response')}</h4>
                <CodeBlock code={codeSnippets.citationResponse} id="citation-res" language="json" />
              </div>

              {/* /journal/metrics */}
              <div id="ep-journal" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="GET" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/journal/metrics</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">
                  Metrik jurnal dari Scopus Serial Title API.<br/>
                  <strong>{t('endpoints.query_params')}</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded">issn</code> (required, format <code>XXXX-XXXX</code>), <code>refresh</code> (bool)
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.response')}</h4>
                <CodeBlock code={codeSnippets.journalResponse} id="journal-res" language="json" />
              </div>

              {/* /sinta/score */}
              <div id="ep-sinta" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="GET" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/sinta/score</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">
                  Skor dan grade jurnal dari SINTA (Kemenristekdikti).<br/>
                  <strong>{t('endpoints.query_params')}</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded">issn</code> (required), <code>refresh</code> (bool)
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.response')}</h4>
                <CodeBlock code={codeSnippets.sintaResponse} id="sinta-res" language="json" />
              </div>

              {/* /impact/calculate */}
              <div id="ep-impact" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="POST" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/impact/calculate</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">
                  Hitung Wizdam Impact Score (komposit 4 pilar). Mendukung pola batch dan supplied data.
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.request_body')}</h4>
                <CodeBlock code={codeSnippets.impactRequest} id="impact-req" language="json" />
                <h4 className="text-xm font-semibold text-gray-900 mb-2 mt-4">{t('batch.final')}</h4>
                <CodeBlock code={codeSnippets.impactResponse} id="impact-res" language="json" />
                <h4 className="text-xm font-semibold text-gray-900 mb-2 mt-4">{t('endpoints.formula_label')}</h4>
                <CodeBlock code={codeSnippets.impactFormula} id="impact-formula" language="formula" />
              </div>

              {/* /trend/analyze */}
              <div id="ep-trend" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="POST" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/trend/analyze</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">{t('endpoints.trend_desc')}</p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.request_body')}</h4>
                <CodeBlock code={codeSnippets.trendRequest} id="trend-req" language="json" />
                <h4 className="text-xm font-semibold text-gray-900 mb-2 mt-4">{t('endpoints.analysis_type')}<code>analysis_type</code>):</h4>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-xm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">{t('errors.th_value')}</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">{t('errors.th_note')}</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">{t('endpoints.data_needed')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-2 font-mono text-xm"><code>impact_trajectory</code></td>
                        <td className="px-4 py-2 text-gray-600">{t('endpoints.trend_series')}</td>
                        <td className="px-4 py-2 text-gray-600"><code>supplied_works</code> dengan <code>publication_year</code></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-xm"><code>sdg_evolution</code></td>
                        <td className="px-4 py-2 text-gray-600">{t('overview.e_trend')}</td>
                        <td className="px-4 py-2 text-gray-600"><code>supplied_works</code> dengan <code>title</code> + <code>publication_year</code></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-xm"><code>collaboration_network</code></td>
                        <td className="px-4 py-2 text-gray-600">{t('endpoints.orcid_network')}</td>
                        <td className="px-4 py-2 text-gray-600"><code>supplied_works</code> dengan <code>authors_string</code> atau <code>contributors</code></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-xm"><code>citation_growth</code></td>
                        <td className="px-4 py-2 text-gray-600">{t('endpoints.scopus_trend')}</td>
                        <td className="px-4 py-2 text-gray-600"><code>scopus_id</code> wajib + <code>supplied_scopus</code> opsional</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xm text-gray-600 mb-3">
                  <strong>{t('endpoints.param_prefix')}<code>time_range</code>:</strong> <code>1y</code> | <code>3y</code> | <code>5y</code> | <code>10y</code> | <code>all</code>
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.response_prefix')}<code>impact_trajectory</code>):</h4>
                <CodeBlock code={codeSnippets.trendResponse} id="trend-res" language="json" />
              </div>

              {/* /recommendation/policy */}
              <div id="ep-policy" className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="POST" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/recommendation/policy</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">{t('endpoints.policy_desc')}</p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.request_body')}</h4>
                <CodeBlock code={codeSnippets.policyRequest} id="policy-req" language="json" />
                <p className="text-xm text-gray-600 mb-3">
                  <strong>{t('endpoints.stakeholder')}<code>stakeholder_type</code>):</strong> <code>government</code> | <code>institution</code> | <code>industry</code> | <code>researcher</code> | <code>community</code>
                </p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.response')}</h4>
                <CodeBlock code={codeSnippets.policyResponse} id="policy-res" language="json" />
              </div>

              {/* /admin/keys/revoke */}
              <div id="ep-revoke">
                <div className="flex items-center gap-3 mb-3">
                  <MethodBadge method="POST" />
                  <code className="font-mono text-xm font-semibold text-gray-900">/api/v1/admin/keys/revoke</code>
                </div>
                <p className="text-xm text-gray-600 mb-3">{t('endpoints.revoke_desc')}</p>
                <h4 className="text-xm font-semibold text-gray-900 mb-2">{t('endpoints.request_body')}</h4>
                <CodeBlock code={codeSnippets.revokeRequest} id="revoke-req" language="json" />
                <h4 className="text-xm font-semibold text-gray-900 mb-2 mt-4">{t('endpoints.response')}</h4>
                <CodeBlock code={codeSnippets.revokeResponse} id="revoke-res" language="json" />
              </div>
            </section>

            {/* Error Responses Section */}
            <section id="errors" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Error Responses
              </h2>
              
              <div id="error-codes" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('errors.codes_title')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">{t('errors.th_code')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">{t('errors.th_note')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-mono text-m font-bold text-amber-600">400</td>
                        <td className="px-4 py-3 text-gray-600">{t('errors.c_400')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-m font-bold text-red-600">401</td>
                        <td className="px-4 py-3 text-gray-600">{t('errors.c_401')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-m font-bold text-red-600">404</td>
                        <td className="px-4 py-3 text-gray-600">{t('errors.c_404')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-m font-bold text-amber-600">410</td>
                        <td className="px-4 py-3 text-gray-600">{t('errors.c_410')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-m font-bold text-amber-600">429</td>
                        <td className="px-4 py-3 text-gray-600">{t('errors.c_429')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-m font-bold text-red-600">500</td>
                        <td className="px-4 py-3 text-gray-600">{t('errors.c_500')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-m font-bold text-red-600">502</td>
                        <td className="px-4 py-3 text-gray-600">{t('errors.c_502')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono text-m font-bold text-red-600">503</td>
                        <td className="px-4 py-3 text-gray-600">{t('errors.c_503')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="error-format">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('errors.format_title')}</h3>
                <CodeBlock code={codeSnippets.errorFormat} id="error-format-code" language="json" />
              </div>
            </section>

            {/* Footer CTA */}
            <div className="pt-8 border-t border-gray-200">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{t('cta.title')}</h3>
                    <p className="text-indigo-100 text-m">{t('cta.body')}</p>
                  </div>
                  <div className="flex gap-3">
                    <Link to="/contact" className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-[15px] whitespace-nowrap">
                      Hubungi Tim
                    </Link>
                    <a href="https://api.sangia.org" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-400 transition-colors text-[15px] whitespace-nowrap flex items-center gap-2">
                      Try API
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default Api;