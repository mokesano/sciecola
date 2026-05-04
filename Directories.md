/workspace/
├── .github/
│   └── dependabot.yml
├── .gitignore
├── .htaccess
├── Directories.md
├── README.md
├── SECURITY.md
├── index.html
├── index.php
├── debug.php
├── wizdam-sicola.php
│
├── UI-design/                    # Desain UI/UX (mockup & aset desain)
│   ├── 01-Homepage.png
│   ├── 02-Institution-Profile.png
│   ├── 03-JournalProfile.png
│   ├── 04-UserProfile.png
│   ├── 05-Profile-Artikel.png
│   ├── 06-SDGs-Claster.png
│   ├── 07-Analytics.png
│   ├── 08A-Leaderboard.png
│   ├── 08B-Leaderboard.png
│   ├── 09A-AboutTeam.png
│   ├── 09B-AboutTeams.png
│   ├── 10A-History.png
│   ├── 10B-History.png
│   ├── 11-Dashboard.png
│   ├── 11A-DetalDashboard.png
│   ├── 12A-FeedDashboard.png
│   ├── 12B-FeedsPrivate.png
│   ├── Logo3D.png
│   ├── Logo3Ds.png
│   ├── LogoDesign1.png
│   └── LogoDesign2.png
│
├── api/                          # Backend API endpoints
│   ├── index.php
│   ├── SDG_Classification_API.php
│   ├── SdgClassificationApi.php
│   ├── SdgClassificationApi_v11.php
│   ├── ORCID/
│   │   └── ORCID_Profile_API.php
│   ├── scopus/
│   │   ├── .htaccess
│   │   └── journal-checker.php
│   ├── sdgs_v1.0.0/
│   │   ├── SDG_Classification_API.php
│   │   ├── SDG_Classification_API_NEW.php
│   │   ├── SDGsClassification_v518.php
│   │   ├── SDGsClassification_v518E.php
│   │   └── SDGsClassification_v520.php
│   └── sdgs_v1.1.0/
│       ├── SDG_Classification_API.php
│       ├── SDG_Classification_Interface.php
│       └── wizdam-sicola.php
│
├── components/                   # PHP Components (backend)
│   ├── chatbot.php
│   ├── footer.php
│   ├── header.php
│   └── navigation.php
│
├── config/                       # Konfigurasi backend
│   └── config.php
│
├── frontend-src/                 # Frontend Vue.js/React Application
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── assets/             # ⭐ FRONTEND ASSETS
│   │   │   ├── img/            # Gambar ilustrasi & hero
│   │   │   │   ├── Footer-Hero.png
│   │   │   │   ├── Hero-Illustrated.png
│   │   │   │   ├── Hero-Illustration.png
│   │   │   │   └── hero.png
│   │   │   ├── logo/           # Logo partner/sumber data
│   │   │   │   ├── ORCID.svg
│   │   │   │   ├── OpenAlex.png
│   │   │   │   ├── Scopus.svg
│   │   │   │   └── dimensions.png
│   │   │   └── sdg/            # Icon SDGs (1-17)
│   │   │       ├── 1-no_poverty.svg
│   │   │       ├── 2-zero_hunger.svg
│   │   │       ├── 3-good_health_and_well_being.svg
│   │   │       ├── 4-quality_education.svg
│   │   │       ├── 5-gender_equality.svg
│   │   │       ├── 6-clean_water_and_sanitation.svg
│   │   │       ├── 7-affordable_and_clean_energy.svg
│   │   │       ├── 8-decent_work_and_economic_growth.svg
│   │   │       ├── 9-industry_innovation_and_infrastructure.svg
│   │   │       ├── 10-reduced_inequalities.svg
│   │   │       ├── 11-sustainable_cities_and_communities.svg
│   │   │       ├── 12-responsible_consumption_and_production.svg
│   │   │       ├── 13-climate_action.svg
│   │   │       ├── 14-life_below_water.svg
│   │   │       ├── 15-life_on_land.svg
│   │   │       ├── 16-peace_justice_and_strong_institutions.svg
│   │   │       └── 17-partnerships.svg
│   │   ├── components/
│   │   │   ├── layout/         # Komponen layout UI
│   │   │   │   ├── CallToAction.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Hero.jsx
│   │   │   │   ├── HeroSearch.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── TrustedSources.jsx
│   │   │   └── sdg/            # Komponen terkait SDG
│   │   │       ├── InsightsAI.jsx
│   │   │       ├── LatestArticles.jsx
│   │   │       ├── ResearchExplorer.jsx
│   │   │       ├── SdgDistributionChart.jsx
│   │   │       ├── SdgTrendChart.jsx
│   │   │       ├── StatCards.jsx
│   │   │       └── TopSdgsCard.jsx
│   │   └── ...
│   └── node_modules/           # Dependencies (tidak ditampilkan detail)
│
├── includes/                   # Helper functions & konfigurasi PHP
│   ├── config.php
│   ├── functions.php
│   └── sdg_definitions.php
│
├── logs/                       # Log files aplikasi
│   ├── app.log
│   └── error.log
│
├── pages/                      # Halaman PHP backend
│   ├── about.php
│   ├── api-reference.php
│   ├── blog.php
│   ├── careers.php
│   ├── community-forum.php
│   ├── contact.php
│   ├── documentation.php
│   ├── help.php
│   ├── home.php
│   ├── partners.php
│   ├── press-kit.php
│   ├── privacy-policy.php
│   ├── research-papers.php
│   └── tutorials.php
│
└── public/                     # ⭐ BACKEND PUBLIC ASSETS (Web root)
    ├── .htaccess
    ├── .user.ini
    ├── favicon.ico
    ├── index.php
    ├── php.ini
    ├── robots.txt
    ├── sitemap.xml
    └── assets/                 # Assets publik untuk backend PHP
        ├── cover/              # Cover/jurnal images
        │   ├── cover-sicola.jpg
        │   └── sicola-cover.jpg
        ├── css/                # Stylesheets
        │   ├── chatbot.css
        │   ├── navbar.css
        │   └── style.css
        ├── img/                # Gambar untuk backend
        │   └── Scopus.svg
        └── js/                 # JavaScript files
            ├── charts.js
            └── script.js