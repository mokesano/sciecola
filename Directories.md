/workspace/
├── .git/                          
├── api/                           # [BACKEND API] Endpoint PHP murni (JSON)
│   ├── cache/                     
│   ├── ORCID/                     
│   ├── SDG_Classification_API.php # Menerima request dari React & merespons JSON
│   └── index.php
├── components/                    # [BACKEND TEMPLATE] Kerangka luar HTML
│   ├── chatbot.php
│   ├── footer.php
│   ├── header.php
│   └── navigation.php
├── config/                        
│   └── config.php
├── frontend-src/                  # [BARU - FRONTEND WORKSPACE] Dapur React & Vite
│   ├── node_modules/              
│   ├── src/                       # Di sinilah kita akan banyak menulis kode UI
│   │   ├── components/            
│   │   │   ├── layout/            # Komponen layout React (Cards, dll)
│   │   │   └── sdg/               # Grafik Recharts, Peta Leaflet, Form Pencarian
│   │   ├── hooks/                 # Logika fetch ke folder /api/
│   │   ├── App.jsx                # Komponen induk React
│   │   └── main.jsx               # Entry point React
│   ├── package.json               # Daftar library (Recharts, Leaflet, Tailwind)
│   ├── tailwind.config.js         # Pengaturan warna brand Wizdam
│   └── vite.config.js             # Konfigurasi pengiriman build ke /public/
├── includes/                      
│   ├── config.php
│   ├── functions.php
│   └── sdg_definitions.php
├── logs/                          
├── pages/                         # [BACKEND VIEW] Halaman web untuk pengguna
│   ├── about.php
│   ├── home.php                   # [PENTING] Memanggil file JS/CSS hasil build React
│   └── ... (halaman statis lainnya)
├── public/                        # [PUBLIC ROOT] Akses utama browser
│   ├── assets/
│   │   ├── cover/
│   │   ├── css/
│   │   ├── js/
│   │   └── react-app/             # [BARU - AUTO GENERATED] Hasil build dari frontend-src
│   │       ├── css/
│   │       │   └── sdg-app.css    # File CSS final (Tailwind)
│   │       └── js/
│   │           └── sdg-app.js     # File JS final (React)
│   ├── .htaccess
│   ├── index.php
│   ├── robots.txt
│   └── sitemap.xml
├── .htaccess                      
├── debug.php                      
├── index.html                     
├── index.php                      
├── README.md                      
└── wizdam-sicola.php              # Entry point aplikasi PHP