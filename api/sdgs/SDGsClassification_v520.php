<?php
/**
 * SDG Classification API Enhanced - Versi yang Benar
 * Hanya menambahkan metadata enhancement tanpa mengubah core analisis SDG
 * 
 * Enhancement yang ditambahkan:
 * - Integrasi OpenAlex untuk metadata lengkap
 * - Pencarian berdasarkan title jika tidak ada DOI
 * - Metadata tambahan: keywords, citations, open access, publisher, dll
 * 
 * TIDAK DIUBAH:
 * - Core logic analisis SDG tetap sama dengan kode original
 * - Fungsi evaluateSDGContribution, scoreSDGs, dll tetap original
 * - Struktur output tetap kompatibel dengan interface
 * 
 * @author Rochmady and Wizdam Team
 * @version 5.2.0-metadata-only
 * @license MIT
 */

header('Content-Type: application/json; charset=utf-8');

// ==============================================
// OPTIMASI TIMEOUT - TAMBAHKAN DI SINI
// ==============================================
set_time_limit(300); // 300 = 5 menit execution time
ini_set('max_execution_time', 300);
ini_set('memory_limit', '512M'); // Tingkatkan memory limit juga

// ==============================================
// KONFIGURASI - SAMA DENGAN ORIGINAL
// ==============================================
$CACHE_DIR = __DIR__ . '/cache';
if (!is_dir($CACHE_DIR)) {
    mkdir($CACHE_DIR, 0755, true);
}

// ==============================================
// KONFIGURASI SDGs DENGAN PENGAYAAN V5
// ==============================================
$CONFIG = [
    'MIN_SCORE_THRESHOLD' => 0.20,  //Skor minimal untuk ditampilkan dalam analisis detail
    'CONFIDENCE_THRESHOLD' => 0.30, //Skor minimal untuk diklaim sebagai kontribusi SDG
    'HIGH_CONFIDENCE_THRESHOLD' => 0.60, // Skor untuk dianggap kontribusi dengan kepercayaan tinggi
    'MAX_SDGS_PER_WORK' => 7,       // Jumlah maksimum SDG per karya
    
    // V4: Perubahan bobot komponen
    'KEYWORD_WEIGHT' => 0.30,    // Bobot skor kata kunci (diturunkan dari 0.40)
    'SIMILARITY_WEIGHT' => 0.30, // Bobot Cosine Similarity (diturunkan dari 0.35)
    'SUBSTANTIVE_WEIGHT' => 0.20, // Bobot Analisis Substantif (turun dari 0.25)
    'CAUSAL_WEIGHT' => 0.20,  // Bobot Analisis Hubungan Kausal (naik dari 0.10)
    
    // Definisi tipe kontributor
    'ACTIVE_CONTRIBUTOR_THRESHOLD' => 0.50,   // Threshold Active Contributor
    'RELEVANT_CONTRIBUTOR_THRESHOLD' => 0.35, // Threshold Relevant Contributor
    'DISCUSSANT_THRESHOLD' => 0.25,           // Threshold Discutor
    
    'CACHE_TTL' => 604800,              // Time-to-live cache: 7 hari dalam detik
    
    // TAMBAHAN: OPTIMASI KONFIGURASI
    'ORCID_PAGE_SIZE' => 20,        // Kurangi dari 50 ke 20
    'API_TIMEOUT' => 8,             // Timeout untuk external APIs
    'API_CONNECT_TIMEOUT' => 3      // Connect timeout
];

// Mengaktifkan semua error kecuali notices untuk memudahkan debugging
error_reporting(E_ALL & ~E_NOTICE);

// Pendefinisian variabel global yang dibutuhkan
if (!isset($MEMORY_CACHE)) {
    $MEMORY_CACHE = array();
}

if (!isset($CAUSAL_PATTERNS)) {
    $CAUSAL_PATTERNS = array(
        'contributes to', 'supports', 'advances', 'helps achieve', 'improves',
        'untuk', 'agar', 'supaya', 'mendukung', 'membantu'
    );
}

if (!isset($TRANSFORMATIVE_VERBS)) {
    $TRANSFORMATIVE_VERBS = array(
        'develop', 'implement', 'improve', 'enhance', 'establish', 'strengthen',
        'mengembangkan', 'mengimplementasikan', 'meningkatkan', 'memperbaiki'
    );
}

// ==============================================
// KONFIGURASI SDGs DENGAN PENGAYAAN KATA KUNCI
// ==============================================
$SDG_KEYWORDS = [
    "SDG1" => [
        // Bahasa Inggris
        "poverty", "inequality", "social protection", "economic disparity", "vulnerable population", 
        "basic services", "financial inclusion", "social security", "welfare", "homelessness",
        "slum", "basic income", "extreme poverty", "social safety net", "underprivileged",
        "income inequality", "marginalized communities", "poverty eradication", "poverty reduction",
        "socioeconomic", "disadvantaged", "low-income", "resource allocation", "poverty line",
        "inclusive growth", "pro-poor", "rural poverty", "urban poverty", "wealth distribution",
        "social mobility", "income distribution", "microfinance",
        // Bahasa Indonesia
        "kemiskinan", "ketimpangan", "perlindungan sosial", "kesenjangan ekonomi", "populasi rentan",
        "layanan dasar", "inklusi keuangan", "jaminan sosial", "kesejahteraan", "tunawisma",
        "permukiman kumuh", "pendapatan dasar", "kemiskinan ekstrem", "jaring pengaman sosial",
        "masyarakat kurang mampu", "pengentasan kemiskinan", "pengurangan kemiskinan",
        "pertumbuhan inklusif", "pendapatan rendah", "ketimpangan pendapatan", "akses layanan dasar",
        "mobilitas sosial", "distribusi kekayaan", "pembangunan pro-rakyat", "pemberdayaan masyarakat miskin",
        "pembiayaan mikro", "komunitas terpinggirkan"
    ],
    "SDG2" => [
        // Bahasa Inggris
        "hunger", "food security", "agriculture", "nutrition", "sustainable farming", "food system",
        "malnutrition", "crop", "livestock", "irrigation", "food production", "agricultural productivity",
        "food access", "food shortage", "farming", "food waste", "food supply", "food safety",
        "rural development", "food sovereignty", "sustainable agriculture", "agro-ecology",
        "food price", "food inflation", "agricultural research", "fisheries", "aquaculture",
        "agricultural innovation", "food distribution", "hunger eradication", "famine", "agricultural policy",
        // Bahasa Indonesia
        "kelaparan", "ketahanan pangan", "pertanian", "nutrisi", "pertanian berkelanjutan",
        "sistem pangan", "malnutrisi", "tanaman", "ternak", "irigasi", "produksi pangan",
        "akses pangan", "kekurangan pangan", "limbah pangan", "keamanan pangan",
        "pengembangan pedesaan", "kedaulatan pangan", "harga pangan", "perikanan", "akuakultur",
        "inovasi pertanian", "distribusi pangan", "penghapusan kelaparan", "krisis pangan",
        "kebijakan pertanian"
    ],
    "SDG3" => [
        // Bahasa Inggris
        "health", "disease", "vaccine", "mental health", "infectious disease", "public health",
        "child mortality", "maternal health", "hospital", "clinical", "HIV", "malaria", "tuberculosis",
        "noncommunicable", "sanitation", "wellbeing", "pandemic", "epidemic", "medical treatment",
        "healthcare", "doctor", "nurse", "surgery", "injury", "medication", "immunization",
        "nutrition", "hospitalization", "health policy", "life expectancy", "patient care", "healthcare access",
        "preventive medicine", "medical research", "wellness",
        // Bahasa Indonesia
        "kesehatan", "penyakit", "vaksin", "kesehatan mental", "penyakit menular", "kesehatan masyarakat",
        "kematian anak", "kesehatan ibu", "rumah sakit", "klinis", "imunisasi", "pengobatan",
        "perawatan", "obat-obatan", "dokter", "perawat", "sanitasi", "gizi", "akses layanan kesehatan",
        "pengobatan preventif", "harapan hidup", "penelitian medis", "pandemi", "epidemi"
    ],
    "SDG4" => [
        // Bahasa Inggris
        "education", "learning", "school", "teaching", "literacy", "higher education", "academic",
        "curriculum", "classroom", "student", "educational policy", "distance learning", "e-learning",
        "teacher training", "vocational training", "lifelong learning", "primary education",
        "secondary education", "university", "educational resources", "scholarship", "educational access",
        "education quality", "schooling", "science education", "pedagogy", "educational inequality",
        "educational technology", "inclusive education", "special education", "early childhood education", "STEM",
        // Bahasa Indonesia
        "pendidikan", "pembelajaran", "sekolah", "pengajaran", "literasi", "pendidikan tinggi",
        "akademik", "kurikulum", "ruang kelas", "siswa", "murid", "pelajar", "mahasiswa",
        "kebijakan pendidikan", "pembelajaran jarak jauh", "e-learning", "pelatihan guru",
        "pelatihan vokasi", "belajar sepanjang hayat", "pendidikan dasar", "pendidikan menengah",
        "akses pendidikan", "kualitas pendidikan", "kesetaraan pendidikan", "teknologi pendidikan",
        "pendidikan inklusif", "pendidikan khusus", "pendidikan anak usia dini", "STEM"
    ],
    "SDG5" => [
        // Bahasa Inggris
        "gender equality", "women empowerment", "gender discrimination", "gender-based violence",
        "gender parity", "equal rights", "gender gap", "female participation", "gender mainstreaming",
        "feminism", "sexual harassment", "gender stereotypes", "gender bias", "women's rights",
        "women in leadership", "women's health", "gender perspective", "gender analysis",
        "gender inclusive", "gender sensitive", "maternal", "women's education", "women entrepreneurship",
        "gender equity", "women workforce", "women representation", "gender pay gap", "sexual violence",
        "women's economic empowerment", "gender diversity", "gender identity", "women in stem",
        // Bahasa Indonesia
        "kesetaraan gender", "pemberdayaan perempuan", "diskriminasi gender", "kekerasan berbasis gender",
        "paritas gender", "hak perempuan", "kesetaraan hak", "partisipasi perempuan",
        "kepemimpinan perempuan", "kesehatan perempuan", "pendidikan perempuan", "pengusaha perempuan",
        "kesenjangan upah", "kekerasan seksual", "keragaman gender", "perspektif gender",
        "analisis gender", "inklusif gender", "sensitivitas gender", "identitas gender"
    ],
    "SDG6" => [
        // Bahasa Inggris
        "clean water", "sanitation", "water quality", "wastewater", "water access", "water shortage",
        "water resource", "water management", "water pollution", "drinking water", "water supply",
        "water scarcity", "water utility", "water treatment", "water reuse", "water conservation",
        "handwashing", "hygiene", "water system", "water infrastructure", "water security",
        "contaminated water", "groundwater", "watershed", "water stress", "water efficiency",
        "water harvesting", "water filtration", "sustainable water", "water monitoring", "hydrological",
        "water governance", "water cycle",
        // Bahasa Indonesia
        "air bersih", "sanitasi", "kualitas air", "air limbah", "akses air", "kelangkaan air",
        "sumber daya air", "pengelolaan air", "pencemaran air", "air minum", "pasokan air",
        "pengolahan air", "konservasi air", "cuci tangan", "kebersihan", "infrastruktur air",
        "keamanan air", "air tanah", "tangkapan air", "daur ulang air", "efisiensi air"
    ],
    "SDG7" => [
        // Bahasa Inggris
        "renewable energy", "clean energy", "energy access", "energy efficiency", "sustainable energy",
        "solar energy", "wind energy", "hydropower", "geothermal", "biomass energy", "biofuel",
        "energy storage", "energy infrastructure", "energy grid", "energy security", "electricity access",
        "power generation", "green energy", "energy poverty", "energy conservation", "energy policy",
        "energy transition", "fossil fuel", "carbon emission", "energy consumption", "energy production",
        "alternative energy", "fuel efficiency", "energy innovation", "energy resources", "energy system",
        "energy technology", "net zero",
        // Bahasa Indonesia
        "energi terbarukan", "energi bersih", "akses energi", "efisiensi energi", "energi berkelanjutan",
        "energi surya", "energi angin", "tenaga air", "panas bumi", "energi biomassa", "biofuel",
        "infrastruktur energi", "jaringan listrik", "keamanan energi", "pembangkit listrik",
        "kemiskinan energi", "konservasi energi", "transisi energi", "energi alternatif"
    ],
    "SDG8" => [
        // Bahasa Inggris
        "economic growth", "employment", "decent work", "job creation", "labor market", "productivity",
        "entrepreneurship", "sustainable tourism", "financial services", "labor rights", "workforce",
        "business development", "small enterprises", "medium enterprises", "job security", "labor policy",
        "economic development", "economic diversification", "economic productivity", "formal employment",
        "informal employment", "unemployment", "underemployment", "labor standards", "economic opportunity",
        "job training", "job skills", "economic resilience", "economic inclusion", "income growth",
        "livelihood", "worker protection", "full employment",
        // Bahasa Indonesia
        "pertumbuhan ekonomi", "lapangan kerja", "pekerjaan layak", "penciptaan lapangan kerja",
        "pasar tenaga kerja", "produktivitas", "kewirausahaan", "pariwisata berkelanjutan",
        "layanan keuangan", "hak tenaga kerja", "pengembangan bisnis", "usaha kecil", "usaha menengah",
        "keamanan kerja", "pengangguran", "setengah pengangguran", "peluang ekonomi", "pelatihan kerja",
        "ketahanan ekonomi", "inklusivitas ekonomi", "pendapatan berkelanjutan"
    ],
    "SDG9" => [
        // Bahasa Inggris
        "infrastructure", "innovation", "industrialization", "technology", "research development",
        "manufacturing", "industrial diversification", "technological capabilities", "industrial policy",
        "sustainable infrastructure", "resilient infrastructure", "industrial growth", "industrial productivity",
        "scientific research", "information technology", "communication technology", "technological innovation",
        "digital divide", "digital access", "digital inclusion", "internet access", "broadband",
        "rural infrastructure", "transportation infrastructure", "clean technology", "technology transfer",
        "R&D investment", "small-scale industry", "medium-scale industry", "engineering", "technical capacity",
        "digital infrastructure", "industrial development",
        // Bahasa Indonesia
        "infrastruktur", "inovasi", "industrialisasi", "teknologi", "penelitian dan pengembangan",
        "manufaktur", "diversifikasi industri", "kapasitas teknologi", "kebijakan industri",
        "infrastruktur berkelanjutan", "infrastruktur tangguh", "pertumbuhan industri",
        "produktivitas industri", "riset ilmiah", "teknologi informasi", "teknologi komunikasi",
        "inovasi teknologi", "akses digital", "inklusivitas digital", "akses internet", "broadband"
    ],
    "SDG10" => [
        // Bahasa Inggris
        "reduced inequalities", "migration", "income inequality", "social inclusion", "equality",
        "equal opportunity", "social protection", "fiscal policy", "discriminatory policies", "social inequality",
        "economic inequality", "wage gap", "social disparity", "economic disparity", "social exclusion",
        "marginalized", "social mobility", "wealth distribution", "income distribution", "migrant rights",
        "minority rights", "racial equality", "gender equality", "social equity", "economic empowerment",
        "inclusive society", "wage discrimination", "social status", "socioeconomic status", "disadvantaged groups",
        "affirmative action", "economic opportunity", "inequality reduction",
        // Bahasa Indonesia
        "ketimpangan berkurang", "migrasi", "ketimpangan pendapatan", "inklusi sosial", "kesetaraan",
        "kesetaraan kesempatan", "perlindungan sosial", "kebijakan fiskal", "kebijakan diskriminatif",
        "kesenjangan sosial", "pengucilan sosial", "disparitas ekonomi", "kelompok terpinggirkan",
        "distribusi pendapatan", "mobilitas sosial", "hak minoritas", "hak migran", "kesetaraan ras",
        "kebijakan afirmatif", "pemberdayaan ekonomi", "masyarakat inklusif"
    ],
    "SDG11" => [
        // Bahasa Inggris
        "sustainable cities", "urban planning", "housing", "transport", "waste management", "air quality",
        "public spaces", "urban development", "slum upgrading", "resilient buildings", "disaster risk reduction",
        "cultural heritage", "city planning", "urban infrastructure", "sustainable transport", "green spaces",
        "urban resilience", "urbanization", "metropolitan planning", "smart cities", "inclusive cities",
        "urban sustainability", "urban policies", "urban environment", "urban health", "urban biodiversity",
        "urban sprawl", "urban slums", "urban governance", "urban mobility", "urban safety", "urban agriculture",
        "green building",
        // Bahasa Indonesia
        "kota berkelanjutan", "permukiman layak", "perencanaan kota", "transportasi umum",
        "perumahan terjangkau", "urbanisasi", "pemukiman kumuh", "pembangunan perkotaan",
        "infrastruktur kota", "ruang publik", "tata ruang kota", "kepadatan penduduk",
        "pembangunan wilayah", "mobilitas perkotaan", "resiliensi kota", "pengurangan risiko bencana",
        "kota pintar", "akses transportasi", "pengelolaan kota", "lingkungan urban"
    ],
    "SDG12" => [
        // Bahasa Inggris
        "responsible consumption", "waste management", "sustainable consumption", "sustainable production",
        "resource efficiency", "natural resources", "material footprint", "ecological footprint",
        "recycling", "reuse", "lifecycle management", "sustainable procurement", "eco-labeling",
        "sustainable practices", "corporate sustainability", "circular economy", "sustainable lifestyle",
        "waste reduction", "food waste", "sustainable supply chain", "industrial ecology", "green products",
        "chemical management", "electronic waste", "plastic waste", "biodegradable", "environmental impact",
        "consumption patterns", "waste disposal", "sustainable materials", "resource management", "zero waste",
        "waste-to-energy",
        // Bahasa Indonesia
        "konsumsi berkelanjutan", "produksi berkelanjutan", "limbah", "daur ulang", "efisiensi sumber daya",
        "polusi", "jejak karbon", "rantai pasok", "ekonomi sirkular", "bahan kimia berbahaya",
        "manajemen limbah", "sampah makanan", "energi efisien", "penggunaan sumber daya",
        "produk ramah lingkungan", "pengurangan limbah", "kesadaran konsumen", "keberlanjutan industri",
        "label ramah lingkungan", "produksi hijau"
    ],
    "SDG13" => [
        // Bahasa Inggris
        "climate change", "global warming", "greenhouse gas", "carbon emission", "carbon footprint",
        "climate action", "climate policy", "climate mitigation", "climate adaptation", "emission reduction",
        "climate resilience", "carbon neutral", "carbon sequestration", "climate finance", "climate technology",
        "climate science", "climate impact", "extreme weather", "climate vulnerability", "carbon pricing",
        "low carbon", "carbon dioxide", "methane emission", "fossil fuel", "renewable energy",
        "climate justice", "climate agreement", "climate risk", "climate education", "climate model",
        "decarbonization", "climate emergency", "climate crisis",
        // Bahasa Indonesia
        "perubahan iklim", "pemanasan global", "adaptasi iklim", "mitigasi iklim", "gas rumah kaca",
        "emisi karbon", "energi bersih", "risiko iklim", "bencana iklim", "strategi iklim",
        "kebijakan iklim", "kerentanan iklim", "cuaca ekstrem", "pengurangan emisi", "netral karbon",
        "ketahanan iklim", "penghitungan karbon", "transisi hijau", "aksi iklim", "perjanjian Paris"
    ],
    "SDG14" => [
        // Bahasa Inggris
        "life below water", "marine pollution", "ocean acidification", "coastal ecosystem", "marine resources",
        "sustainable fishing", "overfishing", "marine conservation", "marine protected areas", "marine biodiversity",
        "ocean health", "marine litter", "marine habitat", "coral reef", "marine species", "ocean governance",
        "blue economy", "coastal management", "marine science", "fishing practices", "fishing communities",
        "aquatic ecosystem", "seafood", "maritime", "underwater life", "ocean sustainability", "sea level rise",
        "marine environment", "ocean policy", "fisheries management", "ocean temperature", "marine ecology",
        "marine sanctuaries",
        // Bahasa Indonesia
        "lautan", "ekosistem laut", "perikanan berkelanjutan", "pencemaran laut", "keanekaragaman hayati laut",
        "pengasaman laut", "zona pesisir", "konservasi laut", "perlindungan laut", "terumbu karang",
        "biota laut", "plastik di laut", "pengelolaan laut", "sumber daya kelautan", "ekonomi biru",
        "penangkapan ikan berlebihan", "restorasi laut", "sampah laut", "marine protected area", "ekosistem pesisir"
    ],
    "SDG15" => [
        // Bahasa Inggris
        "life on land", "biodiversity", "deforestation", "ecosystem", "forest management", "land degradation",
        "desertification", "wildlife conservation", "protected species", "protected areas", "habitat conservation",
        "land use", "soil erosion", "soil health", "invasive species", "natural habitat", "afforestation",
        "reforestation", "sustainable forestry", "biodiversity loss", "endangered species", "terrestrial ecosystem",
        "mountain ecosystem", "land restoration", "conservation efforts", "poaching", "flora", "fauna",
        "wetlands", "grasslands", "biomass", "land rights", "seed diversity", "genetic diversity",
        // Bahasa Indonesia
        "keanekaragaman hayati", "konservasi hutan", "penggundulan hutan", "restorasi lahan", "kerusakan lahan",
        "penggurunan", "keanekaragaman genetik", "ekosistem darat", "pertanian berkelanjutan", "kehutanan",
        "pengelolaan hutan", "reboisasi", "deforestasi", "flora dan fauna", "spesies langka",
        "pelestarian alam", "konservasi satwa liar", "kawasan lindung", "tanah dan air", "ekologi"
    ],
    "SDG16" => [
        // Bahasa Inggris
        "peace", "justice", "strong institutions", "violence reduction", "governance", "rule of law",
        "accountability", "transparency", "corruption", "bribery", "institutional capacity", "decision-making",
        "fundamental freedoms", "legal identity", "human rights", "conflict resolution", "peacebuilding",
        "democracy", "inclusive society", "public access", "judicial system", "responsive institutions",
        "violence against children", "trafficking", "arms flow", "organized crime", "national security",
        "public policy", "law enforcement", "civil justice", "fair trial", "political participation",
        "international cooperation",
        // Bahasa Indonesia
        "perdamaian", "keadilan", "hak asasi manusia", "hukum", "anti korupsi", "keamanan publik",
        "kekerasan", "perlindungan hukum", "akses keadilan", "transparansi", "akuntabilitas",
        "pembangunan institusi", "lembaga pemerintahan", "konflik sosial", "mediasi", "hak warga negara",
        "partisipasi publik", "penegakan hukum", "reformasi hukum", "kerja sama hukum", "stabilitas sosial"
    ],
    "SDG17" => [
        // Bahasa Inggris
        "partnerships", "global cooperation", "international support", "sustainable development",
        "technology transfer", "capacity building", "international trade", "debt sustainability",
        "policy coherence", "multi-stakeholder partnerships", "data monitoring", "statistical capacity",
        "foreign aid", "development assistance", "development finance", "global governance",
        "international relations", "policy coordination", "international agreements", "global south",
        "south-south cooperation", "north-south cooperation", "triangular cooperation", "development goals",
        "international institutions", "global partnership", "resource mobilization", "international collaboration",
        "financial resources", "knowledge sharing", "digital cooperation", "economic partnership", "trade system",
        // Bahasa Indonesia
        "kemitraan", "kerja sama internasional", "pendanaan pembangunan", "kapasitas nasional",
        "perdagangan internasional", "transfer teknologi", "dukungan pembangunan", "kebijakan global",
        "kolaborasi multi-sektor", "aliansi global", "komitmen pembangunan", "koordinasi antar negara",
        "kemitraan publik-swasta", "statistik pembangunan", "sumber daya pembangunan", "bantuan luar negeri",
        "komunikasi global", "data pembangunan", "monitoring global", "pelaporan SDG"
    ]
];

// ==============================================
// V4: PENAMBAHAN KONFIGURASI ORIENTASI DAMPAK
// ==============================================

// Kata kunci yang menunjukkan orientasi dampak
$IMPACT_INDICATORS = [
    'solution_words' => [
        'solution', 'framework', 'model', 'approach', 'strategy', 'implementation', 'tool', 'method',
        'solusi', 'kerangka', 'model', 'pendekatan', 'strategi', 'implementasi', 'alat', 'metode'
    ],
    'policy_words' => [
        'policy', 'regulation', 'governance', 'planning', 'management', 'program', 'initiative',
        'kebijakan', 'regulasi', 'tata kelola', 'perencanaan', 'manajemen', 'program', 'inisiatif'
    ],
    'outcome_words' => [
        'impact', 'outcome', 'result', 'improvement', 'benefit', 'effect', 'change', 'reduction',
        'dampak', 'hasil', 'peningkatan', 'manfaat', 'efek', 'perubahan', 'pengurangan'
    ],
    'stakeholder_words' => [
        'community', 'stakeholder', 'participant', 'practitioner', 'policymaker', 'decision-maker',
        'komunitas', 'pemangku kepentingan', 'peserta', 'praktisi', 'pembuat kebijakan', 'pengambil keputusan'
    ],
    'evaluation_words' => [
        'evaluation', 'assessment', 'monitoring', 'measurement', 'indicator', 'verification', 'validation',
        'evaluasi', 'penilaian', 'pemantauan', 'pengukuran', 'indikator', 'verifikasi', 'validasi'
    ]
];

// Kata kerja tindakan transformatif
$TRANSFORMATIVE_VERBS = [
    'develop', 'implement', 'improve', 'enhance', 'establish', 'strengthen', 'transform', 'create', 
    'innovate', 'solve', 'reduce', 'increase', 'optimize', 'facilitate', 'enable',
    'mengembangkan', 'mengimplementasikan', 'meningkatkan', 'memperbaiki', 'membangun', 'memperkuat',
    'mentransformasi', 'menciptakan', 'berinovasi', 'menyelesaikan', 'mengurangi', 'mengoptimalkan'
];

// Jalur kontribusi SDG
$CONTRIBUTION_PATHWAYS = [
    'SDG1' => [
        'poverty_reduction' => ['poverty reduction', 'poverty alleviation', 'income increase'],
        'social_protection' => ['social protection', 'safety net', 'social security'],
        'basic_services' => ['basic services', 'essential services', 'access to services']
    ],
    'SDG2' => [
        'food_security' => ['food security', 'food availability', 'food access'],
        'nutrition' => ['nutrition', 'malnutrition reduction', 'balanced diet'],
        'sustainable_agriculture' => ['sustainable agriculture', 'agroecology', 'pertanian berkelanjutan']
    ],
    'SDG3' => [
        'health_coverage' => ['health coverage', 'universal healthcare', 'akses kesehatan'],
        'disease_prevention' => ['disease prevention', 'epidemic control', 'pencegahan penyakit'],
        'well_being' => ['well-being', 'mental health', 'kesejahteraan']
    ],
    'SDG4' => [
        'quality_education' => ['quality education', 'education access', 'pendidikan berkualitas'],
        'lifelong_learning' => ['lifelong learning', 'skills development', 'pembelajaran seumur hidup'],
        'education_equity' => ['education equity', 'inclusive education', 'kesetaraan pendidikan']
    ],
    'SDG5' => [
        'gender_equality' => ['gender equality', 'women empowerment', 'kesetaraan gender'],
        'violence_prevention' => ['violence prevention', 'gender-based violence', 'pencegahan kekerasan'],
        'leadership_opportunities' => ['leadership opportunities', 'women in leadership', 'kesempatan kepemimpinan']
    ],
    'SDG6' => [
        'water_access' => ['water access', 'clean water', 'safe water', 'akses air'],
        'water_management' => ['water management', 'water conservation', 'pengelolaan air'],
        'sanitation' => ['sanitation', 'hygiene', 'sanitasi', 'kebersihan']
    ],
    'SDG7' => [
       'clean_energy' => ['clean energy', 'renewable energy', 'energi bersih'],
       'energy_access' => ['energy access', 'energy poverty', 'akses energi'],
       'energy_efficiency' => ['energy efficiency', 'energy conservation', 'efisiensi energi']
   ],
   'SDG8' => [
       'economic_growth' => ['economic growth', 'decent work', 'pertumbuhan ekonomi'],
       'employment' => ['employment', 'job creation', 'kesempatan kerja'],
       'labor_rights' => ['labor rights', 'worker protection', 'hak pekerja']
   ],
   'SDG9' => [
       'infrastructure' => ['infrastructure', 'resilient infrastructure', 'infrastruktur'],
       'industrialization' => ['industrialization', 'inclusive industrialization', 'industrialisasi'],
       'innovation' => ['innovation', 'research and development', 'inovasi']
   ],
   'SDG10' => [
       'inequality_reduction' => ['inequality reduction', 'social inclusion', 'pengurangan kesenjangan'],
       'migration' => ['migration', 'safe migration', 'migrasi'],
       'financial_inclusion' => ['financial inclusion', 'access to finance', 'inklusi keuangan']
   ],
   'SDG11' => [
       'sustainable_cities' => ['sustainable cities', 'urban planning', 'kota berkelanjutan'],
       'housing' => ['housing', 'affordable housing', 'perumahan'],
       'public_spaces' => ['public spaces', 'green spaces', 'ruang publik']
   ],
   'SDG12' => [
       'sustainable_consumption' => ['sustainable consumption', 'responsible consumption', 'konsumsi berkelanjutan'],
       'waste_management' => ['waste management', 'recycling', 'pengelolaan sampah'],
       'circular_economy' => ['circular economy', 'resource efficiency', 'ekonomi sirkular']
   ],
   'SDG13' => [
       'mitigation' => ['climate mitigation', 'emission reduction', 'carbon reduction'],
       'adaptation' => ['climate adaptation', 'climate resilience', 'adaptasi iklim'],
       'awareness' => ['climate awareness', 'climate education', 'kesadaran iklim']
   ],
   'SDG14' => [
       'marine_conservation' => ['marine conservation', 'ocean health', 'konservasi laut'],
       'sustainable_fishing' => ['sustainable fishing', 'overfishing prevention', 'perikanan berkelanjutan'],
       'marine_pollution' => ['marine pollution', 'plastic pollution', 'polusi laut']
   ],
   'SDG15' => [
       'biodiversity' => ['biodiversity', 'species protection', 'keanekaragaman hayati'],
       'land_restoration' => ['land restoration', 'combat desertification', 'restorasi lahan'],
       'forest_management' => ['forest management', 'deforestation prevention', 'pengelolaan hutan']
   ],
   'SDG16' => [
       'peace' => ['peace', 'conflict resolution', 'perdamaian'],
       'justice' => ['justice', 'rule of law', 'keadilan'],
       'institutions' => ['institutions', 'accountability', 'lembaga']
   ],
   'SDG17' => [
       'partnerships' => ['partnerships', 'global cooperation', 'kemitraan'],
       'capacity_building' => ['capacity building', 'technology transfer', 'pengembangan kapasitas'],
       'trade' => ['trade', 'fair trade', 'perdagangan']
   ]
];

// ==============================================
// FUNGSI UTAMA - SAMA DENGAN ORIGINAL
// ==============================================
function main() {
    try {
        if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'GET') {
            throw new Exception('Method not allowed', 405);
        }

        $force_refresh = isset($_GET['refresh']) && $_GET['refresh'] === 'true';
        
        if (isset($_GET['orcid'])) {
            return handleOrcidRequest($_GET['orcid'], $force_refresh);
        } elseif (isset($_GET['doi'])) {
            return handleDoiRequest($_GET['doi'], $force_refresh);
        } else {
            throw new Exception('Parameter tidak valid', 400);
        }
    } catch (Exception $e) {
        http_response_code($e->getCode() ?: 400);
        return [
            'status' => 'error',
            'code' => $e->getCode() ?: 400,
            'message' => $e->getMessage(),
            'api_version' => 'v5.2.0-metadata-enhanced',
            'timestamp' => date('c')
        ];
    }
}

function handleOrcidRequest($orcid, $force_refresh = false) {
    $orcid = trim($orcid);
    if (!preg_match('/^0000-\d{4}-\d{4}-\d{3}[\dX]$/', $orcid)) {
        throw new Exception('Format ORCID tidak valid', 400);
    }

    $cache_file = getCacheFilename('orcid', $orcid);
    if (!$force_refresh && file_exists($cache_file)) {
        $cached_data = readFromCache($cache_file);
        if ($cached_data !== false) {
            return $cached_data;
        }
    }

    $person_data = fetchOrcidPersonData($orcid);
    $works_data = fetchOrcidData($orcid);
    $result = processOrcidData($orcid, $works_data, $person_data);
    
    saveToCache($cache_file, $result);
    return $result;
}

function handleDoiRequest($doi, $force_refresh = false) {
    $doi = trim($doi);
    if (empty($doi)) {
        throw new Exception('DOI tidak boleh kosong', 400);
    }

    $cache_file = getCacheFilename('article', $doi);
    if (!$force_refresh && file_exists($cache_file)) {
        $cached_data = readFromCache($cache_file);
        if ($cached_data !== false) {
            return $cached_data;
        }
    }

    $data = fetchDoiData($doi);
    $result = processDoiData($doi, $data);
    
    saveToCache($cache_file, $result);
    return $result;
}

// ==============================================
// FUNGSI PENGAMBILAN DATA
// ==============================================
function fetchOrcidData($orcid) {
    $url = "https://pub.orcid.org/v3.0/{$orcid}/works";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . "?pageSize=50");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); 
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new Exception('Gagal mengambil data ORCID: ' . $error, 500);
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Data ORCID tidak valid', 500);
    }

    return $data;
}

function fetchOrcidPersonData($orcid) {
    $url = "https://pub.orcid.org/v3.0/{$orcid}/person";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json'));
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($error || $http_code != 200) {
        return array();
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return array();
    }

    return $data;
}

function fetchDoiData($doi) {
    $url = "https://api.crossref.org/works/" . urlencode($doi);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'SDG-Classifier/1.0');
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new Exception('Gagal mengambil data Crossref: ' . $error, 500);
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Data Crossref tidak valid', 500);
    }

    return $data;
}

function fetchAbstractFromAlternativeSource($doi) {
    // Coba dari Semantic Scholar API
    $url = "https://api.semanticscholar.org/v1/paper/" . urlencode($doi);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if (!$response) {
        return "";
    }
    
    $data = json_decode($response, true);
    if (isset($data['abstract']) && !empty($data['abstract'])) {
        return $data['abstract'];
    }
    
    return "";
}

// ==============================================
// FUNGSI BARU: OPENALEX INTEGRATION
// ==============================================
function searchOpenAlexByTitleOrDoi($title, $doi = null) {
    $baseUrl = 'https://api.openalex.org/works';
    $params = array();
    
    if (!empty($doi)) {
        $params[] = "filter=doi:" . urlencode($doi);
    } else {
        $params[] = "search=" . urlencode($title);
    }
    
    $params[] = "select=id,doi,title,display_name,publication_year,publication_date,type,open_access,authorships,primary_location,language,cited_by_count,concepts,abstract_inverted_index";
    $params[] = "per-page=1";
    
    $url = $baseUrl . "?" . implode("&", $params);
    
    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERAGENT => 'SDG-Classifier/5.2.0',
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false
    ));
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($error || $httpCode !== 200) {
        return array();
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE || !isset($data['results'][0])) {
        return array();
    }
    
    $work = $data['results'][0];
    
    $result = array(
        'openalex_id' => $work['id'] ?? '',
        'abstract' => '',
        'journal' => '',
        'publisher' => '',
        'authors' => array(),
        'language' => $work['language'] ?? 'en',
        'type' => $work['type'] ?? 'article',
        'open_access' => array(
            'is_oa' => $work['open_access']['is_oa'] ?? false,
            'oa_date' => $work['open_access']['oa_date'] ?? null,
            'oa_url' => $work['open_access']['oa_url'] ?? null,
            'any_repository_has_fulltext' => $work['open_access']['any_repository_has_fulltext'] ?? false
        ),
        'keywords' => array(),
        'cited_by_count' => $work['cited_by_count'] ?? 0
    );
    
    // Rekonstruksi abstrak dari inverted index
    if (isset($work['abstract_inverted_index']) && is_array($work['abstract_inverted_index'])) {
        $words = array();
        foreach ($work['abstract_inverted_index'] as $word => $positions) {
            if (is_array($positions)) {
                foreach ($positions as $position) {
                    $words[$position] = $word;
                }
            }
        }
        ksort($words);
        $result['abstract'] = implode(' ', $words);
    }
    
    // Ekstrak informasi jurnal
    if (isset($work['primary_location']['source'])) {
        $source = $work['primary_location']['source'];
        $result['journal'] = $source['display_name'] ?? '';
        $result['publisher'] = $source['host_organization_name'] ?? '';
    }
    
    // Ekstrak authors
    if (isset($work['authorships']) && is_array($work['authorships'])) {
        foreach ($work['authorships'] as $authorship) {
            if (isset($authorship['author']['display_name'])) {
                $result['authors'][] = $authorship['author']['display_name'];
            }
        }
    }
    
    // Ekstrak keywords/concepts
    if (isset($work['concepts']) && is_array($work['concepts'])) {
        foreach ($work['concepts'] as $concept) {
            if (isset($concept['score']) && $concept['score'] > 0.3) {
                $result['keywords'][] = $concept['display_name'];
            }
        }
    }
    
    return $result;
}

// ==============================================
// FUNGSI PEMROSESAN DATA - ENHANCED METADATA, ORIGINAL ANALYSIS
// ==============================================
/**
 * PERBAIKAN FUNGSI processOrcidData() untuk SDG Classification API Enhanced
 * Masalah: Metadata DOI, authors, journal tidak ditampilkan dengan benar
 * Solusi: Perbaiki ekstraksi metadata dari Crossref data
 */

function processOrcidData($orcid, $works_data, $person_data) {
    global $SDG_KEYWORDS, $CONFIG;

    $name = extractOrcidName($person_data);
    $institutions = extractOrcidInstitutions($person_data);
    
    if (empty($name)) {
        $name = "Peneliti " . $orcid;
    }

    $processed_works = array();
    $researcher_sdg_summary = array();
    $contributor_profile = array();

    if (isset($works_data['group']) && is_array($works_data['group'])) {
        foreach ($works_data['group'] as $work) {
            $summary = isset($work['work-summary'][0]) ? $work['work-summary'][0] : null;
            if (!$summary) continue;
            
            $title = isset($summary['title']['title']['value']) ? $summary['title']['title']['value'] : '';
            $doi = extractDoi($summary);
            
            if (empty($title)) continue;
            
            // ==============================================
            // INISIALISASI METADATA - DIPERBAIKI
            // ==============================================
            $abstract = '';
            $journal = '';
            $publisher = '';
            $published_date = '';
            $authors = array();
            $language = 'en';
            $type = 'article';
            $open_access = array(
                'is_oa' => false,
                'oa_date' => null,
                'oa_url' => null,
                'any_repository_has_fulltext' => false
            );
            $keywords = array();
            $cited_by_count = 0;
            $openalex_id = '';
            $data_source = 'ORCID only';
            
            // ==============================================
            // AMBIL METADATA DARI CROSSREF - DIPERBAIKI
            // ==============================================
            if ($doi) {
                try {
                    $crossref_data = fetchDoiData($doi);
                    
                    if (isset($crossref_data['message'])) {
                        $message = $crossref_data['message'];
                        
                        // Ekstrak abstrak
                        if (isset($message['abstract'])) {
                            $abstract = strip_tags($message['abstract']);
                        }
                        
                        // Ekstrak jurnal - PERBAIKAN UTAMA
                        if (isset($message['container-title'][0])) {
                            $journal = $message['container-title'][0];
                        }
                        
                        // Ekstrak publisher
                        if (isset($message['publisher'])) {
                            $publisher = $message['publisher'];
                        }
                        
                        // Ekstrak tanggal publikasi
                        if (isset($message['published']['date-parts'][0])) {
                            $published_date = implode('-', $message['published']['date-parts'][0]);
                        }
                        
                        // Ekstrak authors - PERBAIKAN UTAMA
                        if (isset($message['author']) && is_array($message['author'])) {
                            $authors = array(); // Reset array authors
                            foreach ($message['author'] as $author) {
                                $authorName = '';
                                if (isset($author['given'])) {
                                    $authorName .= $author['given'] . ' ';
                                }
                                if (isset($author['family'])) {
                                    $authorName .= $author['family'];
                                }
                                if (!empty(trim($authorName))) {
                                    $authors[] = trim($authorName);
                                }
                            }
                        }
                        
                        // Update data source
                        $data_source = 'ORCID + Crossref';
                    }
                } catch (Exception $e) {
                    error_log("Error fetching Crossref data for DOI $doi: " . $e->getMessage());
                    // Continue tanpa metadata tambahan
                }
            }
            
            // ==============================================
            // CARI DI OPENALEX UNTUK METADATA TAMBAHAN
            // ==============================================
            try {
                $openalexData = searchOpenAlexByTitleOrDoi($title, $doi);
                
                if (!empty($openalexData)) {
                    // Hanya gunakan dari OpenAlex jika data masih kosong
                    if (empty($abstract) && !empty($openalexData['abstract'])) {
                        $abstract = $openalexData['abstract'];
                    }
                    
                    if (empty($journal) && !empty($openalexData['journal'])) {
                        $journal = $openalexData['journal'];
                    }
                    
                    if (empty($publisher) && !empty($openalexData['publisher'])) {
                        $publisher = $openalexData['publisher'];
                    }
                    
                    if (empty($authors) && !empty($openalexData['authors'])) {
                        $authors = $openalexData['authors'];
                    }
                    
                    // Update data tambahan dari OpenAlex
                    $language = $openalexData['language'];
                    $type = $openalexData['type'];
                    $open_access = $openalexData['open_access'];
                    $keywords = $openalexData['keywords'];
                    $cited_by_count = $openalexData['cited_by_count'];
                    $openalex_id = $openalexData['openalex_id'];
                    
                    // Update data source
                    if ($data_source === 'ORCID + Crossref') {
                        $data_source = 'ORCID + Crossref + OpenAlex';
                    } else {
                        $data_source = 'ORCID + OpenAlex';
                    }
                }
            } catch (Exception $e) {
                error_log("Error fetching OpenAlex data: " . $e->getMessage());
                // Continue tanpa metadata tambahan dari OpenAlex
            }
            
            // ==============================================
            // ANALISIS SDG - TETAP ORIGINAL
            // ==============================================
            $fullText = $title . ' ' . $abstract;
            $preprocessedText = preprocessText($fullText);
            
            $sdgAnalysis = [];
            
            foreach ($SDG_KEYWORDS as $sdg => $keywords_list) {
                $matched = false;
                
                foreach ($keywords_list as $keyword) {
                    if (stripos($preprocessedText, $keyword) !== false) {
                        $matched = true;
                        break;
                    }
                }
                
                if ($matched) {
                    $evaluationResult = evaluateSDGContribution($preprocessedText, $sdg);
                    
                    if ($evaluationResult['score'] > $CONFIG['MIN_SCORE_THRESHOLD']) {
                        $sdgAnalysis[$sdg] = $evaluationResult;
                    }
                }
            }
            
            // Filter SDG berdasarkan threshold
            $filteredSdgs = [];
            $sdgConfidence = [];
            $sdgContributorTypes = [];
            
            foreach ($sdgAnalysis as $sdg => $analysis) {
                if ($analysis['score'] < $CONFIG['CONFIDENCE_THRESHOLD']) {
                    continue;
                }
                
                $filteredSdgs[] = $sdg;
                $sdgConfidence[$sdg] = $analysis['score'];
                $sdgContributorTypes[$sdg] = $analysis['contributor_type']['type'];
            }
            
            arsort($sdgConfidence);
            
            if (count($filteredSdgs) > $CONFIG['MAX_SDGS_PER_WORK']) {
                $tempArray = array_slice($sdgConfidence, 0, $CONFIG['MAX_SDGS_PER_WORK'], true);
                $filteredSdgs = array_keys($tempArray);
                $sdgConfidence = $tempArray;
            }
            
            // ==============================================
            // STRUKTUR KARYA - DENGAN METADATA LENGKAP
            // ==============================================
            $workItem = [
                // ORIGINAL FIELDS - WAJIB ADA
                'title' => $title,
                'doi' => $doi,
                'abstract' => $abstract,
                'sdgs' => $filteredSdgs,
                'sdg_confidence' => $sdgConfidence,
                'contributor_types' => $sdgContributorTypes,
                'detailed_analysis' => $sdgAnalysis,
                
                // ENHANCED METADATA - DIPERBAIKI
                'authors' => $authors,           // PERBAIKAN: Sekarang akan terisi dari Crossref
                'journal' => $journal,           // PERBAIKAN: Sekarang akan terisi dari Crossref
                'publisher' => $publisher,
                'published_date' => $published_date,
                'language' => $language,
                'type' => $type,
                'open_access' => $open_access,
                'keywords' => $keywords,
                'cited_by_count' => $cited_by_count,
                'openalex_id' => $openalex_id,
                'data_source' => $data_source
            ];
            
            $processed_works[] = $workItem;
            
            // Update statistik agregat - TETAP ORIGINAL
            foreach ($sdgAnalysis as $sdg => $analysis) {
                if ($analysis['score'] >= $CONFIG['CONFIDENCE_THRESHOLD']) {
                    if (!isset($researcher_sdg_summary[$sdg])) {
                        $researcher_sdg_summary[$sdg] = [
                            'work_count' => 0,
                            'average_confidence' => 0,
                            'contributor_types' => [
                                'Active Contributor' => 0,
                                'Relevant Contributor' => 0,
                                'Discutor' => 0
                            ]
                        ];
                    }
                    
                    $researcher_sdg_summary[$sdg]['work_count']++;
                    $researcher_sdg_summary[$sdg]['average_confidence'] += $analysis['score'];
                    $researcher_sdg_summary[$sdg]['contributor_types'][$analysis['contributor_type']['type']]++;
                }
            }
        }
    }

    // Finalisasi rata-rata confidence
    foreach ($researcher_sdg_summary as $sdg => &$summary) {
        if ($summary['work_count'] > 0) {
            $summary['average_confidence'] = round($summary['average_confidence'] / $summary['work_count'], 3);
        }
    }

    if (!empty($researcher_sdg_summary)) {
        uasort($researcher_sdg_summary, function($a, $b) {
            return $b['work_count'] - $a['work_count'];
        });
    }
    
    // Buat profil kontributor SDG
    foreach ($researcher_sdg_summary as $sdg => $summary) {
        $activeCount = $summary['contributor_types']['Active Contributor'];
        $relevantCount = $summary['contributor_types']['Relevant Contributor'];
        $discussantCount = $summary['contributor_types']['Discutor'];
        $totalWorks = $summary['work_count'];
        
        $dominantType = 'Discutor';
        if ($activeCount / $totalWorks >= 0.3) {
            $dominantType = 'Active Contributor';
        } elseif (($activeCount + $relevantCount) / $totalWorks >= 0.5) {
            $dominantType = 'Relevant Contributor';
        }
        
        $contributor_profile[$sdg] = [
            'dominant_type' => $dominantType,
            'work_distribution' => [
                'active_contributor' => $activeCount,
                'relevant_contributor' => $relevantCount,
                'discussant' => $discussantCount
            ],
            'active_contributor_percentage' => round(($activeCount / $totalWorks) * 100, 1)
        ];
    }

    // STRUKTUR HASIL FINAL - KOMPATIBEL DENGAN INTERFACE
    return [
        'personal_info' => [
            'name' => $name,
            'institutions' => $institutions,
            'orcid' => $orcid,
            'data_source' => !empty($person_data) ? 'ORCID API' : 'Fallback data'
        ],
        'contributor_profile' => $contributor_profile,
        'researcher_sdg_summary' => $researcher_sdg_summary,
        'works' => $processed_works,
        'status' => 'success',
        'api_version' => 'v5.2.0-metadata-enhanced',
        'timestamp' => date('c')
    ];
}

/**
 * PERBAIKAN FUNGSI processDoiData() untuk SDG Classification API Enhanced
 * Masalah: Interface tidak menampilkan DOI, authors, journal untuk analisis artikel
 * Solusi: Menjaga struktur return yang sama dengan kode original + tambahan metadata
 */

function processDoiData($doi, $data) {
    global $SDG_KEYWORDS, $CONFIG;
    
    $title = isset($data['message']['title'][0]) ? $data['message']['title'][0] : '';
    
    // Ekstraksi abstrak
    $abstract = '';
    if (isset($data['message']['abstract'])) {
        $abstract = strip_tags($data['message']['abstract']);
    }
    // Coba alternatif lokasi abstrak
    else if (isset($data['message']['JournalAbs:abstract'])) {
        $abstract = strip_tags($data['message']['JournalAbs:abstract']);
    }
    
    // Jika abstrak masih tidak ditemukan, coba sumber alternatif
    if (empty($abstract)) {
        try {
            $abstract = fetchAbstractFromAlternativeSource($doi);
        } catch (Exception $e) {
            // Jika alternatif gagal, lanjutkan dengan abstrak kosong
        }
    }
    
    // ==============================================
    // EKSTRAKSI METADATA DASAR - SAMA DENGAN ORIGINAL
    // ==============================================
    $authors = [];
    if (isset($data['message']['author']) && is_array($data['message']['author'])) {
        foreach ($data['message']['author'] as $author) {
            $authorName = '';
            if (isset($author['given'])) {
                $authorName .= $author['given'] . ' ';
            }
            if (isset($author['family'])) {
                $authorName .= $author['family'];
            }
            if (!empty(trim($authorName))) {
                $authors[] = trim($authorName);
            }
        }
    }
    
    $journal = isset($data['message']['container-title'][0]) ? $data['message']['container-title'][0] : '';
    $published = isset($data['message']['published']['date-parts'][0]) ? 
                 implode('-', $data['message']['published']['date-parts'][0]) : '';
    
    // ==============================================
    // METADATA ENHANCEMENT - TAMBAHAN
    // ==============================================
    $publisher = isset($data['message']['publisher']) ? $data['message']['publisher'] : '';
    $language = isset($data['message']['language']) ? $data['message']['language'] : 'en';
    $type = isset($data['message']['type']) ? $data['message']['type'] : 'article';
    
    // Default enhanced metadata
    $open_access = array(
        'is_oa' => false,
        'oa_date' => null,
        'oa_url' => null,
        'any_repository_has_fulltext' => false
    );
    $keywords = array();
    $cited_by_count = 0;
    $openalex_id = '';
    $data_source = 'Crossref';
    
    // Cari di OpenAlex untuk metadata tambahan
    try {
        $openalexData = searchOpenAlexByTitleOrDoi($title, $doi);
        
        if (!empty($openalexData)) {
            // Hanya gunakan dari OpenAlex jika data masih kosong
            if (empty($abstract) && !empty($openalexData['abstract'])) {
                $abstract = $openalexData['abstract'];
            }
            
            $open_access = $openalexData['open_access'];
            $keywords = $openalexData['keywords'];
            $cited_by_count = $openalexData['cited_by_count'];
            $openalex_id = $openalexData['openalex_id'];
            $data_source = 'Crossref + OpenAlex';
        }
    } catch (Exception $e) {
        // Continue tanpa metadata tambahan dari OpenAlex
    }
    
    // ==============================================
    // ANALISIS SDG - TETAP ORIGINAL
    // ==============================================
    $fullText = $title . ' ' . $abstract;
    $preprocessedText = preprocessText($fullText);
    
    $sdgAnalysis = [];
    
    foreach ($SDG_KEYWORDS as $sdg => $keywords_list) {
        $matched = false;
        
        foreach ($keywords_list as $keyword) {
            if (stripos($preprocessedText, $keyword) !== false) {
                $matched = true;
                break;
            }
        }
        
        if ($matched) {
            $evaluationResult = evaluateSDGContribution($preprocessedText, $sdg);
            
            if ($evaluationResult['score'] > $CONFIG['MIN_SCORE_THRESHOLD']) {
                $sdgAnalysis[$sdg] = $evaluationResult;
            }
        }
    }
    
    // Filter SDG berdasarkan threshold
    $filteredSdgs = [];
    $sdgConfidence = [];
    $sdgContributorTypes = [];
    
    foreach ($sdgAnalysis as $sdg => $analysis) {
        if ($analysis['score'] < $CONFIG['CONFIDENCE_THRESHOLD']) {
            continue;
        }
        
        $filteredSdgs[] = $sdg;
        $sdgConfidence[$sdg] = $analysis['score'];
        $sdgContributorTypes[$sdg] = $analysis['contributor_type']['type'];
    }
    
    arsort($sdgConfidence);
    
    if (count($filteredSdgs) > $CONFIG['MAX_SDGS_PER_WORK']) {
        $tempArray = array_slice($sdgConfidence, 0, $CONFIG['MAX_SDGS_PER_WORK'], true);
        $filteredSdgs = array_keys($tempArray);
        $sdgConfidence = $tempArray;
    }
    
    // ==============================================
    // STRUKTUR RETURN - COMPATIBLE DENGAN INTERFACE ORIGINAL + ENHANCED
    // ==============================================
    return [
        // CORE FIELDS - SAMA DENGAN ORIGINAL (WAJIB UNTUK INTERFACE)
        'doi' => $doi,
        'title' => $title,
        'abstract' => $abstract,
        'authors' => $authors,                    // ✅ FIELD UTAMA - HARUS ADA
        'journal' => $journal,                    // ✅ FIELD UTAMA - HARUS ADA  
        'published' => $published,                // ✅ FIELD UTAMA - HARUS ADA
        'sdgs' => $filteredSdgs,
        'sdg_confidence' => $sdgConfidence,
        'contributor_types' => $sdgContributorTypes,
        'detailed_analysis' => $sdgAnalysis,
        
        // ENHANCED METADATA - TAMBAHAN (TIDAK MENGGANGGU INTERFACE)
        'enhanced_metadata' => [
            'publisher' => $publisher,
            'published_date' => $published,       // Alias untuk kompatibilitas
            'language' => $language,
            'type' => $type,
            'open_access' => $open_access,
            'keywords' => $keywords,
            'cited_by_count' => $cited_by_count,
            'openalex_id' => $openalex_id,
            'data_source' => $data_source
        ],
        
        // SYSTEM INFO
        'status' => 'success',
        'api_version' => 'v5.2.0-metadata-enhanced',
        'timestamp' => date('c')
    ];
}

// ==============================================
// FUNGSI ANALISIS SDG - ORIGINAL (TIDAK DIUBAH)
// ==============================================

function evaluateSDGContribution($text, $sdg) {
    global $CONFIG, $MEMORY_CACHE;
    
    $cacheKey = md5($text . '_' . $sdg . '_contribution');
    if (isset($MEMORY_CACHE[$cacheKey])) {
        return $MEMORY_CACHE[$cacheKey];
    }
    
    // Analisis dasar - ORIGINAL
    $keywordScores = scoreSDGs($text);
    $keywordScore = isset($keywordScores[$sdg]) ? $keywordScores[$sdg] : 0;
    
    $similarityScores = calculateSDGSimilarity($text);
    $similarityScore = isset($similarityScores[$sdg]) ? $similarityScores[$sdg] : 0;
    
    $substantiveResult = analyzeSubstantiveContribution($text, $sdg);
    $substantiveScore = isset($substantiveResult['score']) ? $substantiveResult['score'] : 0;
    
    $causalResult = detectCausalRelationship($text, $sdg);
    $causalScore = isset($causalResult['score']) ? $causalResult['score'] : 0;
    
    // BOBOT ORIGINAL (TIDAK DIUBAH)
    $weights = array(
        'KEYWORD_WEIGHT' => $CONFIG['KEYWORD_WEIGHT'],      // 0.40
        'SIMILARITY_WEIGHT' => $CONFIG['SIMILARITY_WEIGHT'], // 0.35
        'SUBSTANTIVE_WEIGHT' => $CONFIG['SUBSTANTIVE_WEIGHT'], // 0.25
        'CAUSAL_WEIGHT' => $CONFIG['CAUSAL_WEIGHT']         // 0.10
    );
    
    // Adaptif untuk teks pendek
    if (strlen($text) < 100) {
        $weights['KEYWORD_WEIGHT'] = 0.50;
        $weights['SIMILARITY_WEIGHT'] = 0.30;
        $weights['SUBSTANTIVE_WEIGHT'] = 0.15;
        $weights['CAUSAL_WEIGHT'] = 0.05;
    }
    
    // Kombinasi skor - ORIGINAL
    $combinedScore = (
        ($keywordScore * $weights['KEYWORD_WEIGHT']) +
        ($similarityScore * $weights['SIMILARITY_WEIGHT']) +
        ($substantiveScore * $weights['SUBSTANTIVE_WEIGHT']) +
        ($causalScore * $weights['CAUSAL_WEIGHT'])
    );
    
    // Tentukan level kepercayaan - ORIGINAL
    $confidenceLevel = 'Low';
    if ($combinedScore > $CONFIG['HIGH_CONFIDENCE_THRESHOLD']) {
        $confidenceLevel = 'High';
    } elseif ($combinedScore > $CONFIG['CONFIDENCE_THRESHOLD']) {
        $confidenceLevel = 'Middle';
    }
    
    // Tentukan tipe kontributor - ORIGINAL LOGIC
    $contributorType = determineContributorType($combinedScore);
    
    // Kumpulkan bukti
    $evidence = array();
    $matchedKeywords = array();
    
    global $SDG_KEYWORDS;
    if (isset($SDG_KEYWORDS[$sdg]) && is_array($SDG_KEYWORDS[$sdg])) {
        foreach ($SDG_KEYWORDS[$sdg] as $keyword) {
            if (stripos($text, $keyword) !== false) {
                $context = extractKeywordContext($text, $keyword);
                if (!empty($context)) {
                    $matchedKeywords[] = array(
                        'keyword' => $keyword,
                        'context' => $context
                    );
                    
                    if (count($matchedKeywords) >= 3) break;
                }
            }
        }
    }
    
    if (!empty($matchedKeywords)) {
        $evidence['keyword_matches'] = $matchedKeywords;
    }
    
    if (isset($causalResult['evidence']) && !empty($causalResult['evidence'])) {
        $evidence['causal_relationship'] = $causalResult['evidence'];
    }
    
    // Hasil akhir - ORIGINAL STRUCTURE
    $evaluationResult = array(
        'score' => round($combinedScore, 3),
        'confidence_level' => $confidenceLevel,
        'contributor_type' => $contributorType,
        'components' => array(
            'keyword_score' => round($keywordScore, 3),
            'similarity_score' => round($similarityScore, 3),
            'substantive_score' => round($substantiveScore, 3),
            'causal_score' => round($causalScore, 3)
        ),
        'evidence' => $evidence,
        'weights_used' => $weights
    );
    
    $MEMORY_CACHE[$cacheKey] = $evaluationResult;
    return $evaluationResult;
}

function determineContributorType($combinedScore) {
    if ($combinedScore >= 0.50) {
        return [
            'type' => 'Active Contributor',
            'description' => 'Research with substantive contribution to SDG',
            'score' => round($combinedScore, 3)
        ];
    } elseif ($combinedScore >= 0.35) {
        return [
            'type' => 'Relevant Contributor',
            'description' => 'Research with clear relevance to SDGs',
            'score' => round($combinedScore, 3)
        ];
    } elseif ($combinedScore >= 0.25) {
        return [
            'type' => 'Discutor',
            'description' => 'Research discusses SDG-related themes',
            'score' => round($combinedScore, 3)
        ];
    } else {
        return [
            'type' => 'Not Relevant',
            'description' => 'Research does not show sufficient relevance to the SDGs',
            'score' => round($combinedScore, 3)
        ];
    }
}

function scoreSDGs($text) {
    global $SDG_KEYWORDS, $MEMORY_CACHE;
    
    $cacheKey = md5($text . '_score');
    if (isset($MEMORY_CACHE[$cacheKey])) {
        return $MEMORY_CACHE[$cacheKey];
    }
    
    $text = strtolower($text);
    $scores = array();
    
    $wordFreq = array_count_values(str_word_count($text, 1));
    
    foreach ($SDG_KEYWORDS as $sdg => $keywords) {
        $count = 0;
        foreach ($keywords as $keyword) {
            if (strpos($keyword, ' ') !== false) {
                $count += substr_count($text, strtolower($keyword));
            } else if (isset($wordFreq[strtolower($keyword)])) {
                $count += $wordFreq[strtolower($keyword)];
            }
        }
        
        if ($count > 0) {
            $scores[$sdg] = $count;
        }
    }
    
    $total = array_sum($scores);
    
    if ($total > 0) {
        foreach ($scores as $sdg => $value) {
            $scores[$sdg] = round($value / $total, 3);
        }
    }
    
    arsort($scores);
    $MEMORY_CACHE[$cacheKey] = $scores;
    return $scores;
}

function calculateSDGSimilarity($text) {
    global $SDG_KEYWORDS, $MEMORY_CACHE;
    
    $cacheKey = md5($text . '_similarity');
    if (isset($MEMORY_CACHE[$cacheKey])) {
        return $MEMORY_CACHE[$cacheKey];
    }
    
    $text = strtolower($text);
    $similarity_scores = array();
    
    static $sdgVectors = array();
    $text_vector = createTextVector($text);
    
    foreach ($SDG_KEYWORDS as $sdg => $keywords) {
        if (!isset($sdgVectors[$sdg])) {           
            $sdg_text = implode(' ', $keywords);
            $sdgVectors[$sdg] = createTextVector($sdg_text);
        }
        
        $similarity = calculateCosineSimilarity($text_vector, $sdgVectors[$sdg]);
        
        if ($similarity > 0) {
            $similarity_scores[$sdg] = $similarity;
        }
    }
    
    arsort($similarity_scores);
    $MEMORY_CACHE[$cacheKey] = $similarity_scores;
    return $similarity_scores;
}

function createTextVector($text) {
    global $MEMORY_CACHE;
    
    $cacheKey = md5($text . '_vector');
    if (isset($MEMORY_CACHE[$cacheKey])) {
        return $MEMORY_CACHE[$cacheKey];
    }
    
    $words = preg_split('/\s+/', $text);
    $vector = array();
    
    foreach ($words as $word) {
        $word = trim($word);
        if (strlen($word) > 2) {
            if (!isset($vector[$word])) {
                $vector[$word] = 0;
            }
            $vector[$word]++;
        }
    }
    
    $MEMORY_CACHE[$cacheKey] = $vector;
    return $vector;
}

function calculateCosineSimilarity($vector1, $vector2) {
    if (count($vector1) > count($vector2)) {
        $temp = $vector1;
        $vector1 = $vector2;
        $vector2 = $temp;
    }
    
    $dotProduct = 0;
    $magnitude1 = 0;
    $magnitude2 = 0;
    
    foreach ($vector1 as $dim => $v1) {
        $v2 = isset($vector2[$dim]) ? $vector2[$dim] : 0;
        $dotProduct += $v1 * $v2;
        $magnitude1 += $v1 * $v1;
    }
    
    foreach ($vector2 as $v2) {
        $magnitude2 += $v2 * $v2;
    }
    
    $magnitude1 = sqrt($magnitude1);
    $magnitude2 = sqrt($magnitude2);
    
    if ($magnitude1 == 0 || $magnitude2 == 0) {
        return 0;
    }
    
    return round($dotProduct / ($magnitude1 * $magnitude2), 3);
}

function analyzeSubstantiveContribution($text, $sdg) {
    global $MEMORY_CACHE;
    
    $cacheKey = md5($text . '_' . $sdg . '_substantive');
    if (isset($MEMORY_CACHE[$cacheKey])) {
        return $MEMORY_CACHE[$cacheKey];
    }
    
    $SUBSTANTIVE_INDICATORS = array(
        'solution_words' => array(
            'solution', 'strategy', 'approach', 'intervention', 'policy', 'program',
            'solusi', 'strategi', 'pendekatan', 'intervensi', 'kebijakan', 'program'
        ),
        'impact_words' => array(
            'impact', 'effect', 'outcome', 'result', 'evaluation', 'assessment',
            'dampak', 'efek', 'hasil', 'evaluasi', 'penilaian'
        ),
        'methodology_words' => array(
            'survey', 'interview', 'analysis', 'study', 'research', 'method',
            'survei', 'wawancara', 'analisis', 'studi', 'penelitian', 'metode'
        )
    );
    
    $scores = array();
    
    foreach ($SUBSTANTIVE_INDICATORS as $category => $indicators) {
        $categoryScore = 0;
        foreach ($indicators as $indicator) {
            if (stripos($text, $indicator) !== false) {
                $categoryScore++;
                
                // Berikan bonus untuk indikator yang muncul dalam frasa bermakna
                $phrases = extractPhrases($text);
                
                // Pastikan $phrases adalah array
                if (is_array($phrases)) {
                    foreach ($phrases as $phrase) {
                        if (stripos($phrase, $indicator) !== false) {
                            $categoryScore += 0.5;
                            break;
                        }
                    }
                }
            }
        }
        
        $divisor = count($indicators) * 0.5;
        $scores[$category] = min(1, $divisor > 0 ? $categoryScore / $divisor : 0);
    }
    
    $avgScore = !empty($scores) ? array_sum($scores) / count($scores) : 0;
    
    $result = array(
        'score' => $avgScore,
        'components' => $scores
    );
    
    $MEMORY_CACHE[$cacheKey] = $result;
    return $result;
}

function detectCausalRelationship($text, $sdg) {
    global $SDG_KEYWORDS, $MEMORY_CACHE;
    
    $cacheKey = md5($text . '_' . $sdg . '_causal');
    if (isset($MEMORY_CACHE[$cacheKey])) {
        return $MEMORY_CACHE[$cacheKey];
    }
    
    $CAUSAL_PATTERNS = array(
        'contributes to', 'supports', 'advances', 'helps achieve', 'improves',
        'untuk', 'agar', 'supaya', 'mendukung', 'membantu',
        'for', 'to', 'can', 'will', 'could', 'toward', 
        'reduce', 'increase', 'improve', 'prevent', 'ensure'
    );
    
    $relevantKeywords = array();
    if (isset($SDG_KEYWORDS[$sdg]) && is_array($SDG_KEYWORDS[$sdg])) {
        $relevantKeywords = array_slice($SDG_KEYWORDS[$sdg], 0, 10);
    }
    
    $score = 0;
    $evidences = array();
    
    foreach ($CAUSAL_PATTERNS as $pattern) {
        foreach ($relevantKeywords as $keyword) {
            $forwards = stripos($text, $pattern . ' ' . $keyword);
            $backwards = stripos($text, $keyword . ' ' . $pattern);
            
            if ($forwards !== false) {
                $score += 0.3;
                $context = extractKeywordContext($text, $pattern . ' ' . $keyword, 150);
                if (!empty($context)) {
                    $evidences[] = array(
                        'type' => 'direct_causality',
                        'pattern' => $pattern . ' ' . $keyword,
                        'context' => $context
                    );
                }
            }
            
            if ($backwards !== false) {
                $score += 0.3;
                $context = extractKeywordContext($text, $keyword . ' ' . $pattern, 150);
                if (!empty($context)) {
                    $evidences[] = array(
                        'type' => 'direct_causality',
                        'pattern' => $keyword . ' ' . $pattern,
                        'context' => $context
                    );
                }
            }
        }
    }
    
    $normalizedScore = min(1, $score);
    
    if (strlen($text) < 100 && $normalizedScore < 0.1) {
        $normalizedScore = max($normalizedScore, 0.1);
    }
    
    $result = array(
        'score' => $normalizedScore,
        'evidence' => array_slice($evidences, 0, 3)
    );
    
    $MEMORY_CACHE[$cacheKey] = $result;
    return $result;
}

// ==============================================
// FUNGSI UTILITAS - ORIGINAL (TIDAK DIUBAH)
// ==============================================

function preprocessText($text) {
    global $MEMORY_CACHE;
    
    $cacheKey = md5($text . '_preprocessed');
    if (isset($MEMORY_CACHE[$cacheKey])) {
        return $MEMORY_CACHE[$cacheKey];
    }
    
    $text = strtolower($text);
    $text = strip_tags($text);
    $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text);
    $text = preg_replace('/\s+/', ' ', $text);
    $text = trim($text);
    
    $MEMORY_CACHE[$cacheKey] = $text;
    return $text;
}

function extractPhrases($text) {
    // Pengecekan parameter
    if (empty($text) || !is_string($text)) {
        return array(); // Return array kosong jika input tidak valid
    }
    
    global $MEMORY_CACHE;
    
    // Cek cache memori
    $cacheKey = md5($text . '_phrases');
    if (isset($MEMORY_CACHE[$cacheKey])) {
        return $MEMORY_CACHE[$cacheKey];
    }
    
    // Pola sederhana untuk mendeteksi frasa: dua atau lebih kata yang bermakna
    $patterns = array(
        '/\b[a-z]{3,}\s+[a-z]{3,}(\s+[a-z]{3,})?\b/i', // 2-3 kata berurutan
    );
    
    $phrases = array();
    foreach ($patterns as $pattern) {
        preg_match_all($pattern, $text, $matches);
        if (!empty($matches[0])) {
            $phrases = array_merge($phrases, $matches[0]);
        }
    }
    
    // Filter frasa yang mengandung stopword sebagai kata pertama atau terakhir
    $stopwords = array('the', 'and', 'of', 'to', 'a', 'in', 'for', 'on', 'with', 'at', 'by', 'as');
    $filteredPhrases = array();
    
    foreach ($phrases as $phrase) {
        $words = explode(' ', strtolower($phrase));
        // Pastikan array $words tidak kosong
        if (empty($words)) continue;
        
        $firstWord = $words[0];
        $lastWord = end($words);
        
        if (!in_array($firstWord, $stopwords) && !in_array($lastWord, $stopwords)) {
            $filteredPhrases[] = $phrase;
        }
    }
    
    $result = array_unique($filteredPhrases);
    
    // Simpan ke cache memori
    $MEMORY_CACHE[$cacheKey] = $result;
    
    return $result;
}

function getSdgMainTerm($sdg) {
    $mainTerms = [
        'SDG1' => 'poverty',
        'SDG2' => 'hunger',
        'SDG3' => 'health',
        'SDG4' => 'education',
        'SDG5' => 'gender',
        'SDG6' => 'water',
        'SDG7' => 'energy',
        'SDG8' => 'work',
        'SDG9' => 'industry',
        'SDG10' => 'inequality',
        'SDG11' => 'cities',
        'SDG12' => 'consumption',
        'SDG13' => 'climate',
        'SDG14' => 'ocean',
        'SDG15' => 'land',
        'SDG16' => 'peace',
        'SDG17' => 'partnership'
    ];
    
    return isset($mainTerms[$sdg]) ? $mainTerms[$sdg] : '';
}

function hasSDGConcept($text, $sdg) {
    $conceptMap = [
        'SDG1' => ['extreme poverty', 'social protection', 'economic inclusion',
            'kemiskinan ekstrim', 'perlindungan sosial', 'inklusi ekonomi'],
        'SDG2' => ['food security', 'sustainable agriculture', 'nutrition improvement', 
            'ketahanan pangan', 'pertanian berkelanjutan', 'perbaikan gizi'],
        'SDG3' => ['maternal health', 'child mortality', 'communicable diseases', 
            'kesehatan ibu', 'kematian anak', 'penyakit menular'],
        'SDG4' => ['quality education', 'lifelong learning', 'educational infrastructure', 
            'pendidikan berkualitas', 'pembelajaran seumur hidup', 'infrastruktur pendidikan'],
        'SDG5' => ['gender equality', 'women empowerment', 'gender-based violence', 
            'kesetaraan gender', 'pemberdayaan perempuan', 'kekerasan berbasis gender'],
        'SDG6' => ['water management', 'water conservation', 'sanitation facilities', 
            'pengelolaan air', 'konservasi air', 'fasilitas sanitasi'],
        'SDG7' => ['renewable energy', 'energy efficiency', 'clean cooking',
            'energi terbarukan', 'efisiensi energi', 'memasak bersih'],
        'SDG8' => ['economic growth', 'decent work', 'youth employment',
            'pertumbuhan ekonomi', 'pekerjaan layak', 'lapangan kerja pemuda'],
        'SDG9' => ['industrial innovation', 'sustainable infrastructure', 'scientific research', 
            'inovasi industri', 'infrastruktur berkelanjutan', 'penelitian ilmiah'],
        'SDG10' => ['reduced inequalities', 'social inclusion', 'migration policies', 
            'pengurangan ketimpangan', 'inklusi sosial', 'kebijakan migrasi'],
        'SDG11' => ['sustainable cities', 'urban planning', 'public transport',
            'kota berkelanjutan', 'tata kota', 'transportasi umum'],
        'SDG12' => ['responsible consumption', 'waste reduction', 'circular economy', 
            'konsumsi bertanggung jawab', 'pengurangan limbah', 'ekonomi sirkular'],
        'SDG13' => ['climate action', 'carbon reduction', 'climate resilience',
            'aksi iklim', 'pengurangan karbon', 'ketahanan iklim'],
        'SDG14' => ['marine pollution', 'ocean acidification', 'sustainable fishing',
            'polusi laut', 'asidifikasi laut', 'perikanan berkelanjutan'],
        'SDG15' => ['biodiversity', 'forest conservation', 'land degradation',
            'keanekaragaman hayati', 'konservasi hutan', 'degradasi lahan'],
        'SDG16' => ['peacebuilding', 'access to justice', 'corruption reduction', 
            'pembangunan perdamaian', 'akses keadilan', 'pengurangan korupsi'],
        'SDG17' => ['global partnership', 'technology transfer', 'capacity building',
            'kemitraan global', 'transfer teknologi', 'pengembangan kapasitas']
    ];
    
    if (!isset($conceptMap[$sdg])) return false;
    
    foreach ($conceptMap[$sdg] as $concept) {
        if (stripos($text, $concept) !== false) {
            return true;
        }
    }
    
    return false;
}

function classifySDGs($text) {
    global $SDG_KEYWORDS, $MEMORY_CACHE;
    
    // Cek cache memori
    $cacheKey = md5($text . '_classify');
    if (isset($MEMORY_CACHE[$cacheKey])) {
        return $MEMORY_CACHE[$cacheKey];
    }
    
    $text = strtolower($text);
    $matched = array();
    
    // Ekstrak semua kata dari teks
    $words = array_unique(str_word_count($text, 1));
    
    foreach ($SDG_KEYWORDS as $sdg => $keywords) {
        foreach ($keywords as $keyword) {
            // Untuk kata kunci kata tunggal, gunakan array_intersect untuk performa lebih baik
            if (strpos($keyword, ' ') === false) {
                if (in_array(strtolower($keyword), $words)) {
                    $matched[] = $sdg;
                    break;
                }
            } 
            // Untuk frasa, tetap gunakan strpos
            else if (strpos($text, strtolower($keyword)) !== false) {
                $matched[] = $sdg;
                break;
            }
        }
    }
    
    $result = array_values(array_unique($matched));
    
    // Simpan ke cache memori
    $MEMORY_CACHE[$cacheKey] = $result;
    
    return $result;
}

function extractKeywordContext($text, $keyword, $contextLength = 100) {
    $position = stripos($text, $keyword);
    
    if ($position === false) {
        return '';
    }
    
    $start = max(0, $position - $contextLength/2);
    $length = strlen($keyword) + $contextLength;
    
    if ($start + $length > strlen($text)) {
        $length = strlen($text) - $start;
    }
    
    $context = substr($text, $start, $length);
    
    if ($start > 0) {
        $context = '...' . $context;
    }
    
    if ($start + $length < strlen($text)) {
        $context = $context . '...';
    }
    
    $context = preg_replace('/(' . preg_quote($keyword, '/') . ')/i', '<strong>$1</strong>', $context);
    
    return $context;
}

function extractDoi($summary) {
    if (!isset($summary['external-ids']['external-id']) || !is_array($summary['external-ids']['external-id'])) {
        return null;
    }

    foreach ($summary['external-ids']['external-id'] as $id) {
        if (isset($id['external-id-type']) && 
            strtolower($id['external-id-type']) === 'doi' &&
            isset($id['external-id-value']) && 
            !empty($id['external-id-value'])) {
            return $id['external-id-value'];
        }
    }

    return null;
}

function extractOrcidName($person_data) {
    if (empty($person_data) || !is_array($person_data)) {
        return "Unknown Researcher";
    }
    
    $name = '';
    
    if (isset($person_data['name']['credit-name']['value'])) {
        $name = $person_data['name']['credit-name']['value'];
    } else if (isset($person_data['name'])) {
        if (isset($person_data['name']['given-names']['value'])) {
            $name .= $person_data['name']['given-names']['value'] . ' ';
        }
        
        if (isset($person_data['name']['family-name']['value'])) {
            $name .= $person_data['name']['family-name']['value'];
        }
    }
    
    return !empty(trim($name)) ? trim($name) : "Unknown Researcher";
}

function extractOrcidInstitutions($person_data) {
    if (empty($person_data) || !is_array($person_data)) {
        return array();
    }
    
    $institutions = array();
    
    if (isset($person_data['employments']['employment-summary']) && 
        is_array($person_data['employments']['employment-summary'])) {
        
        foreach ($person_data['employments']['employment-summary'] as $employment) {
            if (isset($employment['organization']['name'])) {
                $institution = trim($employment['organization']['name']);
                if (!empty($institution) && strlen($institution) > 2) {
                    $institutions[] = $institution;
                }
            }
        }
    }
    
    return array_unique($institutions);
}

// ==============================================
// FUNGSI CACHE - ORIGINAL (TIDAK DIUBAH)
// ==============================================

function saveToCache($filename, $data) {
    global $CACHE_DIR;
    
    if (!is_dir($CACHE_DIR)) {
        mkdir($CACHE_DIR, 0755, true);
    }
    
    $json_data = json_encode($data);
    $compressed_data = gzencode($json_data, 9);
    
    file_put_contents($filename, $compressed_data);
}

function readFromCache($filename) {
    global $CONFIG;
    
    if (!file_exists($filename)) {
        return false;
    }
    
    if ((time() - filemtime($filename)) > $CONFIG['CACHE_TTL']) {
        return false;
    }
    
    $compressed_data = file_get_contents($filename);
    if ($compressed_data === false) {
        return false;
    }
    
    $json_data = gzdecode($compressed_data);
    if ($json_data === false) {
        return false;
    }
    
    $data = json_decode($json_data, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return false;
    }
    
    return $data;
}

function getCacheFilename($type, $id) {
    global $CACHE_DIR;
    
    $unique_code = substr(md5($id . '_v5'), 0, 8);
    
    if ($type === 'orcid') {
        return $CACHE_DIR . '/orcid_' . $unique_code . '_' . $id . '.json.gz';
    } else if ($type === 'article') {
        $safe_doi = str_replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], '_', $id);
        return $CACHE_DIR . '/article_' . $safe_doi . '_' . $unique_code . '.json.gz';
    }
    
    return false;
}

// ==============================================
// EKSEKUSI API
// ==============================================

try {
    $result = main();
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'code' => 500,
        'message' => 'Terjadi kesalahan internal: ' . $e->getMessage(),
        'timestamp' => date('c'),
        'api_version' => 'v5.2.0-metadata-enhanced'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>