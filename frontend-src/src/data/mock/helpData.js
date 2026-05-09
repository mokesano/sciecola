export const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using our SDG classification platform',
    icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    articleCount: 8,
    color: 'bg-indigo-500',
  },
  {
    id: 'analysis-guide',
    title: 'Analysis Guide',
    description: 'Understand how our AI analyzes and classifies research',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    articleCount: 12,
    color: 'bg-emerald-500',
  },
  {
    id: 'api-help',
    title: 'API & Integration',
    description: 'Technical documentation and integration guides',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    articleCount: 15,
    color: 'bg-purple-500',
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Solutions to common issues and error messages',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    articleCount: 10,
    color: 'bg-amber-500',
  },
  {
    id: 'account-billing',
    title: 'Account & Billing',
    description: 'Manage your account, subscription, and billing',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    articleCount: 6,
    color: 'bg-blue-500',
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features',
    description: 'Bulk analysis, custom integrations, and enterprise features',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    articleCount: 9,
    color: 'bg-pink-500',
  },
];

export const FAQ_DATA = {
  general: [
    {
      id: 'faq-1',
      question: 'What is SDG classification and how does it work?',
      answer: 'SDG classification is the process of analyzing research publications to determine their relevance to the 17 United Nations Sustainable Development Goals. Our AI system uses four analysis components: keyword matching, semantic similarity, substantive analysis, and causal inference to provide comprehensive classification with confidence scores.',
    },
    {
      id: 'faq-2',
      question: 'What input formats do you support?',
      answer: 'We support two main input types:\n• ORCID IDs: Format 0000-0000-0000-0000 for analyzing all publications by a researcher\n• DOIs: Format 10.xxxx/xxxxx for analyzing individual articles\n\nYou can paste these directly or include the full URLs (e.g., https://orcid.org/0000-0000-0000-0000).',
    },
    {
      id: 'faq-3',
      question: 'How accurate is the SDG classification?',
      answer: 'Our AI system achieves over 95% accuracy in SDG classification when tested against manually curated datasets. We provide confidence scores to indicate the reliability of each classification, with scores above 70% considered highly reliable.',
    },
    {
      id: 'faq-4',
      question: 'Is there a limit to how many publications I can analyze?',
      answer: 'For individual ORCID analysis, we can process researchers with up to 1000 publications. For larger datasets or institutional analysis, we offer bulk processing capabilities through our enterprise plans.',
    },
    {
      id: 'faq-5',
      question: 'Can I export or download my analysis results?',
      answer: 'Yes! You can export results in multiple formats including CSV (for data analysis), PDF (for reports), and JSON (for technical integration). Export options are available after completing your analysis.',
    },
  ],
  technical: [
    {
      id: 'faq-6',
      question: 'Why is my ORCID ID not being recognized?',
      answer: 'Common issues include:\n• Incorrect format - ensure it follows 0000-0000-0000-0000 pattern\n• Invalid checksum digit - the last character must be mathematically correct\n• Private profile - your ORCID profile must be set to public\n• New ORCID - recently created IDs may take 24-48 hours to appear in our system',
    },
    {
      id: 'faq-7',
      question: 'What should I do if analysis takes too long?',
      answer: 'Analysis typically takes 1-5 minutes depending on the number of publications. If it takes longer:\n• Wait patiently - large publication sets (100+ works) can take up to 10 minutes\n• Check your internet connection\n• Try again during off-peak hours\n• Contact support if the issue persists beyond 15 minutes',
    },
    {
      id: 'faq-8',
      question: 'Why do I get "No results found" for some researchers?',
      answer: "This can happen when:\n• The researcher's work is not related to any SDGs\n• Publications lack sufficient text content for analysis\n• Works are behind paywalls and abstracts are insufficient\n• The ORCID profile has very few or no publications",
    },
  ],
  billing: [
    {
      id: 'faq-9',
      question: 'Is the basic service free to use?',
      answer: 'Yes! Our basic SDG classification service is free for individual researchers and includes:\n• Up to 50 analyses per month\n• ORCID and DOI analysis\n• Basic visualizations\n• Standard export options\n\nFor higher usage limits and advanced features, we offer paid plans starting at $29/month.',
    },
    {
      id: 'faq-10',
      question: "What's included in the premium plans?",
      answer: 'Premium plans include:\n• Unlimited monthly analyses\n• Priority processing\n• Advanced visualizations and reports\n• API access\n• Bulk analysis tools\n• Custom export formats\n• Priority email support',
    },
  ],
  api: [
    {
      id: 'faq-11',
      question: 'How do I get API access?',
      answer: 'API access is available with our Professional plan ($99/month) and higher. To get started:\n1. Sign up for a Professional or Enterprise plan\n2. Visit the API Access page in your dashboard\n3. Generate your API keys\n4. Review our API documentation\n5. Start integrating with our RESTful endpoints',
    },
    {
      id: 'faq-12',
      question: 'What are the API rate limits?',
      answer: 'Rate limits depend on your plan:\n• Professional: 100 requests/minute, 10,000/month\n• Enterprise: 500 requests/minute, 100,000/month\n• Custom: Tailored limits based on your needs\n\nContact our sales team for higher limits or custom arrangements.',
    },
  ],
};

export const SUPPORT_OPTIONS = [
  {
    id: 1,
    title: 'Live Chat',
    description: 'Get instant help from our support team',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    buttonText: 'Start Chat',
    action: 'chat',
  },
  {
    id: 2,
    title: 'Email Support',
    description: 'Send us detailed questions or feedback',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    buttonText: 'Contact Us',
    action: 'email',
    link: '/contact',
  },
  {
    id: 3,
    title: 'Community Forum',
    description: 'Connect with other users and experts',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    buttonText: 'Join Forum',
    action: 'forum',
    link: '/community',
  },
  {
    id: 4,
    title: 'Documentation',
    description: 'Comprehensive guides and tutorials',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    buttonText: 'Read Docs',
    action: 'docs',
    link: '/docs',
  },
];

export const TUTORIALS = [
  {
    id: 1,
    title: 'Analyzing Your Research Profile',
    description: 'Learn how to analyze all your publications using your ORCID ID',
    icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
    duration: '3 min',
    level: 'Beginner',
    link: '#tutorial-orcid',
  },
  {
    id: 2,
    title: 'Single Article Analysis',
    description: 'Analyze individual research papers using DOI identifiers',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    duration: '2 min',
    level: 'Beginner',
    link: '#tutorial-doi',
  },
  {
    id: 3,
    title: 'Understanding Results',
    description: 'Interpret confidence scores, SDG classifications, and analysis components',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    duration: '5 min',
    level: 'Intermediate',
    link: '#tutorial-results',
  },
  {
    id: 4,
    title: 'Exporting Your Data',
    description: 'Export analysis results in various formats for reports and further analysis',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    duration: '3 min',
    level: 'Beginner',
    link: '#tutorial-export',
  },
];

export const POPULAR_SEARCHES = ['ORCID format', 'Confidence scores', 'API integration', 'Export results'];
