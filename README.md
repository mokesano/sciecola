# Sciecola

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-18.3.1-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-4.3.0-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)

A comprehensive restructuring of the SDG Classification Analysis platform built with PHP, JavaScript, and modern web technologies. This project provides AI-powered analysis of research contributions to the United Nations Sustainable Development Goals (SDGs).

## 🚀 Features

### ✅ Core Functionality
- **SDG Analysis Engine**: AI-powered classification of research papers against 17 SDGs
- **ORCID Integration**: Analyze complete researcher profiles
- **DOI Analysis**: Single article SDG classification
- **Confidence Scoring**: Advanced confidence metrics with 4-component analysis
- **Real-time Processing**: Fast, efficient analysis with progress tracking

## 🛠️ Technology Stack

### External Services
- **ORCID API**: Researcher profile and publication data
- **Crossref API**: DOI resolution and metadata
- **Sciecola AI API**: SDG classification engine
- **CDN Integration**: External resource optimization

## 📋 Requirements

- **PHP**: Version 7.4 or higher
- **Extensions**: cURL, JSON, GD (optional for image processing)
- **Web Server**: Apache/Nginx with mod_rewrite
- **Browser**: Modern browsers supporting ES6+

## 🚀 Installation

1. **Clone or download** the project files to your web server
2. **Configure web server** to point to the `sdg/` directory
3. **Set permissions** for cache directory:
   ```bash
   chmod 755 cache/
   chmod 644 cache/*
   ```
4. **Update configuration** in `includes/config.php`:
   ```php
   $CONFIG = [
       'API_BASE_URL' => 'https://your-api-endpoint.com/api',
       'CACHE_TTL' => 3600,
       // ... other settings
   ];
   ```
5. **Test installation** by visiting the homepage

## 🔧 Configuration

### Basic Configuration (`includes/config.php`)
```php
// Site settings
define('SITE_NAME', 'SDGs Classification Analysis');
define('SITE_URL', 'https://your-domain.com');
define('VERSION', '5.1.8');

// API Configuration
$CONFIG = [
    'API_BASE_URL' => 'https://api.sangia.org/v1',
    'CACHE_TTL' => 3600,
    'MAX_WORKS_LIMIT' => 50,
    'TIMEOUT_CONNECT' => 5,
    'TIMEOUT_EXECUTE' => 10
];

// Optional: Analytics
define('GOOGLE_ANALYTICS_ID', 'GA_MEASUREMENT_ID');
```

### SDG Definitions (`includes/sdg_definitions.php`)
The SDG definitions array contains metadata for all 17 Sustainable Development Goals:
```php
$SDG_DEFINITIONS = [
    'SDG1' => [
        'title' => 'No Poverty',
        'color' => '#e5243b',
        'svg_url' => 'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_1.svg'
    ],
    // ... additional SDGs
];
```

## 📖 Usage

### Basic Analysis
1. **Visit the homepage** (`index.php` or `?page=home`)
2. **Enter an identifier**:
   - ORCID ID: `0000-0002-1825-0097`
   - DOI: `10.1038/nature12373`
3. **Click "Analyze"** and wait for results
4. **Explore results** with interactive charts and detailed breakdowns

### Navigation
The platform uses a clean URL structure:
- Homepage: `index.php` or `?page=home`
- About: `?page=about`
- Documentation: `?page=documentation`
- Help: `?page=help`
- Contact: `?page=contact`

### API Integration (Future)
```javascript
const response = await fetch('/api/analyze/orcid', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
        orcid: '0000-0002-1825-0097',
        include_details: true
    })
});
```
## 🔧 API Reference

### Analysis Endpoints

#### ORCID Analysis
```http
POST /api/analyze/orcid
Content-Type: application/json

{
    "orcid": "0000-0002-1825-0097",
    "include_details": true
}
```

#### DOI Analysis
```http
POST /api/analyze/doi
Content-Type: application/json

{
    "doi": "10.1038/nature12373",
    "include_evidence": true
}
```

### Response Format
```json
{
    "status": "success",
    "data": {
        "researcher_info": {
            "name": "John Doe",
            "orcid": "0000-0002-1825-0097",
            "affiliation": "University Example"
        },
        "sdg_summary": {
            "SDG3": {
                "work_count": 15,
                "avg_confidence": 0.85
            }
        },
        "works": [
            {
                "title": "Research Title",
                "doi": "10.1038/example",
                "sdg_classifications": ["SDG3", "SDG6"],
                "confidence_scores": {
                    "SDG3": 0.92,
                    "SDG6": 0.78
                }
            }
        ]
    }
}
```

## 🐛 Troubleshooting

### Common Issues

#### ORCID Not Found
**Problem**: "Invalid ORCID ID" error message
**Solutions**:
- Verify ORCID format: 0000-0000-0000-0000
- Check if profile is set to public
- Ensure checksum digit is correct

#### Analysis Timeout
**Problem**: Processing takes too long or times out
**Solutions**:
- Check for researchers with 100+ publications
- Verify internet connection stability
- Try during off-peak hours
- Contact support for bulk analysis options

#### No Results
**Problem**: "No SDG classifications found"
**Solutions**:
- Research may not be SDG-related
- Check if publications have sufficient abstracts
- Verify DOI is accessible and not behind paywall

### Error Codes
| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check input format |
| 401 | Unauthorized | Verify API credentials |
| 404 | Not Found | Check identifier exists |
| 429 | Rate Limited | Wait before retry |
| 500 | Server Error | Contact support |

### Debug Mode
Enable debug mode in `includes/config.php`:
```php
define('DEBUG_MODE', true);
```

## 👥 Team

### Core Development Team
- **Project Lead**: Rochmady
- **AI Development**: Sciecola and AI Team
- **Frontend**: Sciecola and AI Team
- **Backend**: Sciecola and AI Team
- **Design**: Rochmady, Sciecola & AI Team

### Special Thanks
- **UN SDG Team**: For providing SDG framework and guidelines
- **ORCID**: For researcher identification infrastructure
- **Crossref**: For DOI resolution services
- **Open Source Community**: For tools and libraries used


<p align="center">
  <br>
  <creator>Built with ❤️ by <strong>Sangia Publishing House</strong> for the global scholarly community</creator>
  <br><br>
  <a href="https://github.com/mokesano/sciecola/stargazers">
    <img src="https://img.shields.io/github/stars/mokesano/sciecola?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/mokesano/sciecola/network/members">
    <img src="https://img.shields.io/github/forks/mokesano/sciecola?style=social" alt="GitHub Forks">
  </a>
  <br><br>
  <copyright>© 2019 Sangia Publishing House. Licensed under GPL v3.0.</copyright>
</p>