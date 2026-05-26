<?php
declare(strict_types=1);

/**
 * @file api/sdgs/SdgClassificationApi.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief API untuk klasifikasi dan analisis SDG.
 * 
 * Sistem klasifikasi SDG dengan orientasi dampak yang lebih kuat
 * Dilengkapi dengan Fallback Metadata: Crossref -> OpenCitations
 *
 * Endpoint Baru (Anti-Timeout / Sequential):
 * - ?orcid=xxx&action=init         → Info peneliti + daftar karya (tanpa SDG)
 * - ?orcid=xxx&action=batch&offset=0&limit=3 → Analisis SDG per batch
 * - ?orcid=xxx&action=summary      → Agregasi semua batch → ringkasan peneliti
 *
 * Endpoint Lama (tetap didukung):
 * - ?orcid=xxx         → Full analisis (legacy, bisa timeout jika karya banyak)
 * - ?doi=xxx           → Analisis satu artikel
 *
 * @author Rochmady and Sciecola Team
 * @version 1.2.0 (Event-Driven Cache & Standalone Execution)
 * @license MIT
 */

class SdgClassificationApi
{
    private const int BATCH_SIZE = 5;

    private const array CONFIG = [
        'MIN_SCORE_THRESHOLD'            => 0.20,
        'CONFIDENCE_THRESHOLD'           => 0.30,
        'HIGH_CONFIDENCE_THRESHOLD'      => 0.60,
        'MAX_SDGS_PER_WORK'              => 7,
        'KEYWORD_WEIGHT'                 => 0.30,
        'SIMILARITY_WEIGHT'              => 0.30,
        'SUBSTANTIVE_WEIGHT'             => 0.20,
        'CAUSAL_WEIGHT'                  => 0.20,
        'ACTIVE_CONTRIBUTOR_THRESHOLD'   => 0.50,
        'RELEVANT_CONTRIBUTOR_THRESHOLD' => 0.35,
        'DISCUSSANT_THRESHOLD'           => 0.25,
    ];

    private string $cacheDir;
    private array $memoryCache = [];

    private array $sdgKeywords = [
        "SDG1"  => ["poverty","inequality","social protection","economic disparity","vulnerable population","basic services","financial inclusion","social security","welfare","homelessness","slum","basic income","extreme poverty","social safety net","underprivileged","income inequality","marginalized communities","poverty eradication","poverty reduction","socioeconomic","disadvantaged","low-income","resource allocation","poverty line","inclusive growth","pro-poor","rural poverty","urban poverty","wealth distribution","social mobility","income distribution","microfinance","kemiskinan","ketimpangan","perlindungan sosial","kesenjangan ekonomi","populasi rentan","layanan dasar","inklusi keuangan","jaminan sosial","kesejahteraan","tunawisma","permukiman kumuh","pendapatan dasar","kemiskinan ekstrem","jaring pengaman sosial","masyarakat kurang mampu","pengentasan kemiskinan","pengurangan kemiskinan","pertumbuhan inklusif","pendapatan rendah","ketimpangan pendapatan","akses layanan dasar","mobilitas sosial","distribusi kekayaan","pembangunan pro-rakyat","pemberdayaan masyarakat miskin","pembiayaan mikro","komunitas terpinggirkan"],
        "SDG2"  => ["hunger","food security","agriculture","nutrition","sustainable farming","food system","malnutrition","crop","livestock","irrigation","food production","agricultural productivity","food access","food shortage","farming","food waste","food supply","food safety","rural development","food sovereignty","sustainable agriculture","agro-ecology","food price","food inflation","agricultural research","fisheries","aquaculture","agricultural innovation","food distribution","hunger eradication","famine","agricultural policy","kelaparan","ketahanan pangan","pertanian","nutrisi","pertanian berkelanjutan","sistem pangan","malnutrisi","tanaman","ternak","irigasi","produksi pangan","akses pangan","kekurangan pangan","limbah pangan","keamanan pangan","pengembangan pedesaan","kedaulatan pangan","harga pangan","perikanan","akuakultur","inovasi pertanian","distribusi pangan","penghapusan kelaparan","krisis pangan","kebijakan pertanian"],
        "SDG3"  => ["health","disease","vaccine","mental health","infectious disease","public health","child mortality","maternal health","hospital","clinical","HIV","malaria","tuberculosis","noncommunicable","sanitation","wellbeing","pandemic","epidemic","medical treatment","healthcare","doctor","nurse","surgery","injury","medication","immunization","nutrition","hospitalization","health policy","life expectancy","patient care","healthcare access","preventive medicine","medical research","wellness","kesehatan","penyakit","vaksin","kesehatan mental","penyakit menular","kesehatan masyarakat","kematian anak","kesehatan ibu","rumah sakit","klinis","imunisasi","pengobatan","perawatan","obat-obatan","dokter","perawat","sanitasi","gizi","akses layanan kesehatan","pengobatan preventif","harapan hidup","penelitian medis","pandemi","epidemi"],
        "SDG4"  => ["education","learning","school","teaching","literacy","higher education","academic","curriculum","classroom","student","educational policy","distance learning","e-learning","teacher training","vocational training","lifelong learning","primary education","secondary education","university","educational resources","scholarship","educational access","education quality","schooling","science education","pedagogy","educational inequality","educational technology","inclusive education","special education","early childhood education","STEM","pendidikan","pembelajaran","sekolah","pengajaran","literasi","pendidikan tinggi","akademik","kurikulum","ruang kelas","siswa","murid","pelajar","mahasiswa","kebijakan pendidikan","pembelajaran jarak jauh","pelatihan guru","pelatihan vokasi","belajar sepanjang hayat","pendidikan dasar","pendidikan menengah","akses pendidikan","kualitas pendidikan","kesetaraan pendidikan","teknologi pendidikan","pendidikan inklusif","pendidikan khusus","pendidikan anak usia dini"],
        "SDG5"  => ["gender equality","women empowerment","gender discrimination","gender-based violence","gender parity","equal rights","gender gap","female participation","gender mainstreaming","feminism","sexual harassment","gender stereotypes","gender bias","women's rights","women in leadership","women's health","gender perspective","gender analysis","gender inclusive","gender sensitive","maternal","women's education","women entrepreneurship","gender equity","women workforce","women representation","gender pay gap","sexual violence","women's economic empowerment","gender diversity","gender identity","women in stem","kesetaraan gender","pemberdayaan perempuan","diskriminasi gender","kekerasan berbasis gender","paritas gender","hak perempuan","kesetaraan hak","partisipasi perempuan","kepemimpinan perempuan","kesehatan perempuan","pendidikan perempuan","pengusaha perempuan","kesenjangan upah","kekerasan seksual","keragaman gender","perspektif gender","analisis gender","inklusif gender","sensitivitas gender","identitas gender"],
        "SDG6"  => ["clean water","sanitation","water quality","wastewater","water access","water shortage","water resource","water management","water pollution","drinking water","water supply","water scarcity","water utility","water treatment","water reuse","water conservation","handwashing","hygiene","water system","water infrastructure","water security","contaminated water","groundwater","watershed","water stress","water efficiency","water harvesting","water filtration","sustainable water","water monitoring","hydrological","water governance","water cycle","air bersih","sanitasi","kualitas air","air limbah","akses air","kelangkaan air","sumber daya air","pengelolaan air","pencemaran air","air minum","pasokan air","pengolahan air","konservasi air","cuci tangan","kebersihan","infrastruktur air","keamanan air","air tanah","tangkapan air","daur ulang air","efisiensi air"],
        "SDG7"  => ["renewable energy","clean energy","energy access","energy efficiency","sustainable energy","solar energy","wind energy","hydropower","geothermal","biomass energy","biofuel","energy storage","energy infrastructure","energy grid","energy security","electricity access","power generation","green energy","energy poverty","energy conservation","energy policy","energy transition","fossil fuel","carbon emission","energy consumption","energy production","alternative energy","fuel efficiency","energy innovation","energy resources","energy system","energy technology","net zero","energi terbarukan","energi bersih","akses energi","efisiensi energi","energi berkelanjutan","energi surya","energi angin","tenaga air","panas bumi","energi biomassa","biofuel","infrastruktur energi","jaringan listrik","keamanan energi","pembangkit listrik","kemiskinan energi","konservasi energi","transisi energi","energi alternatif"],
        "SDG8"  => ["economic growth","employment","decent work","job creation","labor market","productivity","entrepreneurship","sustainable tourism","financial services","labor rights","workforce","business development","small enterprises","medium enterprises","job security","labor policy","economic development","economic diversification","economic productivity","formal employment","informal employment","unemployment","underemployment","labor standards","economic opportunity","job training","job skills","economic resilience","economic inclusion","income growth","livelihood","worker protection","full employment","pertumbuhan ekonomi","lapangan kerja","pekerjaan layak","penciptaan lapangan kerja","pasar tenaga kerja","produktivitas","kewirausahaan","pariwisata berkelanjutan","layanan keuangan","hak tenaga kerja","pengembangan bisnis","usaha kecil","usaha menengah","keamanan kerja","pengangguran","setengah pengangguran","peluang ekonomi","pelatihan kerja","ketahanan ekonomi","inklusivitas ekonomi","pendapatan berkelanjutan"],
        "SDG9"  => ["infrastructure","innovation","industrialization","technology","research development","manufacturing","industrial diversification","technological capabilities","industrial policy","sustainable infrastructure","resilient infrastructure","industrial growth","industrial productivity","scientific research","information technology","communication technology","technological innovation","digital divide","digital access","digital inclusion","internet access","broadband","rural infrastructure","transportation infrastructure","clean technology","technology transfer","R&D investment","small-scale industry","medium-scale industry","engineering","technical capacity","digital infrastructure","industrial development","infrastruktur","inovasi","industrialisasi","teknologi","penelitian dan pengembangan","manufaktur","diversifikasi industri","kapasitas teknologi","kebijakan industri","infrastruktur berkelanjutan","infrastruktur tangguh","pertumbuhan industri","produktivitas industri","riset ilmiah","teknologi informasi","teknologi komunikasi","inovasi teknologi","akses digital","inklusivitas digital","akses internet"],
        "SDG10" => ["reduced inequalities","migration","income inequality","social inclusion","equality","equal opportunity","social protection","fiscal policy","discriminatory policies","social inequality","economic inequality","wage gap","social disparity","economic disparity","social exclusion","marginalized","social mobility","wealth distribution","income distribution","migrant rights","minority rights","racial equality","gender equality","social equity","economic empowerment","inclusive society","wage discrimination","social status","socioeconomic status","disadvantaged groups","affirmative action","economic opportunity","inequality reduction","ketimpangan berkurang","migrasi","ketimpangan pendapatan","inklusi sosial","kesetaraan","kesetaraan kesempatan","perlindungan sosial","kebijakan fiskal","kebijakan diskriminatif","kesenjangan sosial","pengucilan sosial","disparitas ekonomi","kelompok terpinggirkan","distribusi pendapatan","mobilitas sosial","hak minoritas","hak migran","kesetaraan ras","kebijakan afirmatif","pemberdayaan ekonomi","masyarakat inklusif"],
        "SDG11" => ["sustainable cities","urban planning","housing","transport","waste management","air quality","public spaces","urban development","slum upgrading","resilient buildings","disaster risk reduction","cultural heritage","city planning","urban infrastructure","sustainable transport","green spaces","urban resilience","urbanization","metropolitan planning","smart cities","inclusive cities","urban sustainability","urban policies","urban environment","urban health","urban biodiversity","urban sprawl","urban slums","urban governance","urban mobility","urban safety","urban agriculture","green building","kota berkelanjutan","permukiman layak","perencanaan kota","transportasi umum","perumahan terjangkau","urbanisasi","pemukiman kumuh","pembangunan perkotaan","infrastruktur kota","ruang publik","tata ruang kota","kepadatan penduduk","pembangunan wilayah","mobilitas perkotaan","resiliensi kota","pengurangan risiko bencana","kota pintar","akses transportasi","pengelolaan kota","lingkungan urban"],
        "SDG12" => ["responsible consumption","waste management","sustainable consumption","sustainable production","resource efficiency","natural resources","material footprint","ecological footprint","recycling","reuse","lifecycle management","sustainable procurement","eco-labeling","sustainable practices","corporate sustainability","circular economy","sustainable lifestyle","waste reduction","food waste","sustainable supply chain","industrial ecology","green products","chemical management","electronic waste","plastic waste","biodegradable","environmental impact","consumption patterns","waste disposal","sustainable materials","resource management","zero waste","waste-to-energy","konsumsi berkelanjutan","produksi berkelanjutan","limbah","daur ulang","efisiensi sumber daya","polusi","jejak karbon","rantai pasok","ekonomi sirkular","bahan kimia berbahaya","manajemen limbah","sampah makanan","energi efisien","penggunaan sumber daya","produk ramah lingkungan","pengurangan limbah","kesadaran konsumen","keberlanjutan industri","label ramah lingkungan","produksi hijau"],
        "SDG13" => ["climate change","global warming","greenhouse gas","carbon emission","carbon footprint","climate action","climate policy","climate mitigation","climate adaptation","emission reduction","climate resilience","carbon neutral","carbon sequestration","climate finance","climate technology","climate science","climate impact","extreme weather","climate vulnerability","carbon pricing","low carbon","carbon dioxide","methane emission","fossil fuel","renewable energy","climate justice","climate agreement","climate risk","climate education","climate model","decarbonization","climate emergency","climate crisis","perubahan iklim","pemanasan global","adaptasi iklim","mitigasi iklim","gas rumah kaca","emisi karbon","energi bersih","risiko iklim","bencana iklim","strategi iklim","kebijakan iklim","kerentanan iklim","cuaca ekstrem","pengurangan emisi","netral karbon","ketahanan iklim","penghitungan karbon","transisi hijau","aksi iklim","perjanjian Paris"],
        "SDG14" => ["life below water","marine pollution","ocean acidification","coastal ecosystem","marine resources","sustainable fishing","overfishing","marine conservation","marine protected areas","marine biodiversity","ocean health","marine litter","marine habitat","coral reef","marine species","ocean governance","blue economy","coastal management","marine science","fishing practices","fishing communities","aquatic ecosystem","seafood","maritime","underwater life","ocean sustainability","sea level rise","marine environment","ocean policy","fisheries management","ocean temperature","marine ecology","marine sanctuaries","lautan","ekosistem laut","perikanan berkelanjutan","pencemaran laut","keanekaragaman hayati laut","pengasaman laut","zona pesisir","konservasi laut","perlindungan laut","terumbu karang","biota laut","plastik di laut","pengelolaan laut","sumber daya kelautan","ekonomi biru","penangkapan ikan berlebihan","restorasi laut","sampah laut","marine protected area","ekosistem pesisir"],
        "SDG15" => ["life on land","biodiversity","deforestation","ecosystem","forest management","land degradation","desertification","wildlife conservation","protected species","protected areas","habitat conservation","land use","soil erosion","soil health","invasive species","natural habitat","afforestation","reforestation","sustainable forestry","biodiversity loss","endangered species","terrestrial ecosystem","mountain ecosystem","land restoration","conservation efforts","poaching","flora","fauna","wetlands","grasslands","biomass","land rights","seed diversity","genetic diversity","keanekaragaman hayati","konservasi hutan","penggundulan hutan","restorasi lahan","kerusakan lahan","penggurunan","keanekaragaman genetik","ekosistem darat","pertanian berkelanjutan","kehutanan","pengelolaan hutan","reboisasi","deforestasi","flora dan fauna","spesies langka","pelestarian alam","konservasi satwa liar","kawasan lindung","tanah dan air","ekologi"],
        "SDG16" => ["peace","justice","strong institutions","violence reduction","governance","rule of law","accountability","transparency","corruption","bribery","institutional capacity","decision-making","fundamental freedoms","legal identity","human rights","conflict resolution","peacebuilding","democracy","inclusive society","public access","judicial system","responsive institutions","violence against children","trafficking","arms flow","organized crime","national security","public policy","law enforcement","civil justice","fair trial","political participation","international cooperation","perdamaian","keadilan","hak asasi manusia","hukum","anti korupsi","keamanan publik","kekerasan","perlindungan hukum","akses keadilan","transparansi","akuntabilitas","pembangunan institusi","lembaga pemerintahan","konflik sosial","mediasi","hak warga negara","partisipasi publik","penegakan hukum","reformasi hukum","kerja sama hukum","stabilitas sosial"],
        "SDG17" => ["partnerships","global cooperation","international support","sustainable development","technology transfer","capacity building","international trade","debt sustainability","policy coherence","multi-stakeholder partnerships","data monitoring","statistical capacity","foreign aid","development assistance","development finance","global governance","international relations","policy coordination","international agreements","global south","south-south cooperation","north-south cooperation","triangular cooperation","development goals","international institutions","global partnership","resource mobilization","international collaboration","financial resources","knowledge sharing","digital cooperation","economic partnership","trade system","kemitraan","kerja sama internasional","pendanaan pembangunan","kapasitas nasional","perdagangan internasional","transfer teknologi","dukungan pembangunan","kebijakan global","kolaborasi multi-sektor","aliansi global","komitmen pembangunan","koordinasi antar negara","kemitraan publik-swasta","statistik pembangunan","sumber daya pembangunan","bantuan luar negeri","komunikasi global","data pembangunan","monitoring global","pelaporan SDG"],
    ];

    private array $impactIndicators = [
        'solution_words'    => ['solution','framework','model','approach','strategy','implementation','tool','method','solusi','kerangka','model','pendekatan','strategi','implementasi','alat','metode'],
        'policy_words'      => ['policy','regulation','governance','planning','management','program','initiative','kebijakan','regulasi','tata kelola','perencanaan','manajemen','program','inisiatif'],
        'outcome_words'     => ['impact','outcome','result','improvement','benefit','effect','change','reduction','dampak','hasil','peningkatan','manfaat','efek','perubahan','pengurangan'],
        'stakeholder_words' => ['community','stakeholder','participant','practitioner','policymaker','decision-maker','komunitas','pemangku kepentingan','peserta','praktisi','pembuat kebijakan','pengambil keputusan'],
        'evaluation_words'  => ['evaluation','assessment','monitoring','measurement','indicator','verification','validation','evaluasi','penilaian','pemantauan','pengukuran','indikator','verifikasi','validasi'],
    ];

    private array $transformativeVerbs = ['develop','implement','improve','enhance','establish','strengthen','transform','create','innovate','solve','reduce','increase','optimize','facilitate','enable','mengembangkan','mengimplementasikan','meningkatkan','memperbaiki','membangun','memperkuat','mentransformasi','menciptakan','berinovasi','menyelesaikan','mengurangi','mengoptimalkan'];

    private array $contributionPathways = [
        'SDG1'  => ['poverty_reduction'=>['poverty reduction','poverty alleviation','income increase'],'social_protection'=>['social protection','safety net','social security'],'basic_services'=>['basic services','essential services','access to services']],
        'SDG2'  => ['food_security'=>['food security','food availability','food access'],'nutrition'=>['nutrition','malnutrition reduction','balanced diet'],'sustainable_agriculture'=>['sustainable agriculture','agroecology','pertanian berkelanjutan']],
        'SDG3'  => ['health_coverage'=>['health coverage','universal healthcare','akses kesehatan'],'disease_prevention'=>['disease prevention','epidemic control','pencegahan penyakit'],'well_being'=>['well-being','mental health','kesejahteraan']],
        'SDG4'  => ['quality_education'=>['quality education','education access','pendidikan berkualitas'],'lifelong_learning'=>['lifelong learning','skills development','pembelajaran seumur hidup'],'education_equity'=>['education equity','inclusive education','kesetaraan pendidikan']],
        'SDG5'  => ['gender_equality'=>['gender equality','women empowerment','kesetaraan gender'],'violence_prevention'=>['violence prevention','gender-based violence','pencegahan kekerasan'],'leadership_opportunities'=>['leadership opportunities','women in leadership','kesempatan kepemimpinan']],
        'SDG6'  => ['water_access'=>['water access','clean water','safe water','akses air'],'water_management'=>['water management','water conservation','pengelolaan air'],'sanitation'=>['sanitation','hygiene','sanitasi','kebersihan']],
        'SDG7'  => ['clean_energy'=>['clean energy','renewable energy','energi bersih'],'energy_access'=>['energy access','energy poverty','akses energi'],'energy_efficiency'=>['energy efficiency','energy conservation','efisiensi energi']],
        'SDG8'  => ['economic_growth'=>['economic growth','decent work','pertumbuhan ekonomi'],'employment'=>['employment','job creation','kesempatan kerja'],'labor_rights'=>['labor rights','worker protection','hak pekerja']],
        'SDG9'  => ['infrastructure'=>['infrastructure','resilient infrastructure','infrastruktur'],'industrialization'=>['industrialization','inclusive industrialization','industrialisasi'],'innovation'=>['innovation','research and development','inovasi']],
        'SDG10' => ['inequality_reduction'=>['inequality reduction','social inclusion','pengurangan kesenjangan'],'migration'=>['migration','safe migration','migrasi'],'financial_inclusion'=>['financial inclusion','access to finance','inklusi keuangan']],
        'SDG11' => ['sustainable_cities'=>['sustainable cities','urban planning','kota berkelanjutan'],'housing'=>['housing','affordable housing','perumahan'],'public_spaces'=>['public spaces','green spaces','ruang publik']],
        'SDG12' => ['sustainable_consumption'=>['sustainable consumption','responsible consumption','konsumsi berkelanjutan'],'waste_management'=>['waste management','recycling','pengelolaan sampah'],'circular_economy'=>['circular economy','resource efficiency','ekonomi sirkular']],
        'SDG13' => ['mitigation'=>['climate mitigation','emission reduction','carbon reduction'],'adaptation'=>['climate adaptation','climate resilience','adaptasi iklim'],'awareness'=>['climate awareness','climate education','kesadaran iklim']],
        'SDG14' => ['marine_conservation'=>['marine conservation','ocean health','konservasi laut'],'sustainable_fishing'=>['sustainable fishing','overfishing prevention','perikanan berkelanjutan'],'marine_pollution'=>['marine pollution','plastic pollution','polusi laut']],
        'SDG15' => ['biodiversity'=>['biodiversity','species protection','keanekaragaman hayati'],'land_restoration'=>['land restoration','combat desertification','restorasi lahan'],'forest_management'=>['forest management','deforestation prevention','pengelolaan hutan']],
        'SDG16' => ['peace'=>['peace','conflict resolution','perdamaian'],'justice'=>['justice','rule of law','keadilan'],'institutions'=>['institutions','accountability','lembaga']],
        'SDG17' => ['partnerships'=>['partnerships','global cooperation','kemitraan'],'capacity_building'=>['capacity building','technology transfer','pengembangan kapasitas'],'trade'=>['trade','fair trade','perdagangan']],
    ];

    private array $causalPatterns = ['contributes to','supports','advances','helps achieve','improves','untuk','agar','supaya','mendukung','membantu'];

    public function __construct()
    {
        error_reporting(E_ALL & ~E_NOTICE);
        $this->cacheDir = __DIR__ . '/cache';
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }

    /**
     * FUNGSI UTAMA – ROUTER
     */
    public function run(): array
    {
        try {
            if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
                throw new Exception('Method not allowed', 405);
            }

            if (empty($_GET)) {
                http_response_code(200);
                return ['status' => 'up', 'message' => 'Endpoint is operational', 'version' => 'v1.2.0'];
            }

            $forceRefresh = ($_GET['refresh'] ?? 'false') === 'true';

            // --- ORCID ---
            if (!empty($_GET['orcid'])) {
                $orcid = trim($_GET['orcid']);
                if (preg_match('/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i', $orcid, $m)) {
                    $orcid = $m[1];
                }
                if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/', $orcid)) {
                    throw new Exception('Format ORCID tidak valid. Gunakan format: XXXX-XXXX-XXXX-XXXX', 400);
                }

                $action = $_GET['action'] ?? 'full';

                return match ($action) {
                    'init'    => $this->handleOrcidInitRequest($orcid, $forceRefresh),
                    'batch'   => $this->handleOrcidBatchRequest($orcid, max(0, (int)($_GET['offset'] ?? 0)), min(10, max(1, (int)($_GET['limit'] ?? self::BATCH_SIZE))), $forceRefresh),
                    'summary' => $this->handleOrcidSummaryRequest($orcid),
                    default   => $this->handleOrcidRequest($orcid, $forceRefresh),
                };
            }

            // --- DOI ---
            if (!empty($_GET['doi'])) {
                return $this->handleDoiRequest($_GET['doi'], $forceRefresh);
            }

            throw new Exception('Parameter tidak valid. Gunakan ?orcid= atau ?doi=', 400);

        } catch (Exception $e) {
            http_response_code($e->getCode() ?: 400);
            return [
                'status'      => 'error',
                'code'        => $e->getCode() ?: 400,
                'message'     => $e->getMessage(),
                'usage'       => [
                    'Init Peneliti' => '?orcid=0000-0002-5152-9727&action=init',
                    'Batch SDG'     => '?orcid=0000-0002-5152-9727&action=batch&offset=0&limit=3',
                    'Ringkasan'     => '?orcid=0000-0002-5152-9727&action=summary',
                    'Full (legacy)' => '?orcid=0000-0002-5152-9727',
                    'Artikel'       => '?doi=10.1234/example',
                    'Refresh Cache' => 'tambahkan &refresh=true',
                ],
                'timestamp'   => date('c'),
                'api_version' => 'v1.2.0',
            ];
        }
    }

    // =================================================================
    // HANDLERS
    // =================================================================

    private function handleOrcidInitRequest(string $orcid, bool $forceRefresh): array
    {
        $cacheFile = $this->getCacheFilename('orcid_init', $orcid);

        if (!$forceRefresh && file_exists($cacheFile)) {
            $cached = $this->readFromCache($cacheFile);
            if (is_array($cached)) {
                $cached['from_cache'] = true;
                return $cached;
            }
        }

        $personData     = $this->fetchOrcidPersonData($orcid);
        $employmentData = $this->fetchOrcidEmployments($orcid);
        $educationData  = $this->fetchOrcidEducations($orcid);
        $worksData      = $this->fetchOrcidData($orcid);

        $name             = $this->extractOrcidName($personData);
        $institutions     = $this->extractOrcidInstitutionsEnhanced($personData, $employmentData);
        $bio              = $this->extractOrcidBio($personData);
        $emails           = $this->extractOrcidEmails($personData);
        $kwTags           = $this->extractOrcidKeywords($personData);
        $externalIds      = $this->extractOrcidExternalIds($personData);
        $researcherUrls   = $this->extractOrcidResearcherUrls($personData);
        $allAffiliations  = $this->extractAllAffiliations($employmentData);
        $educationHistory = $this->extractEducationHistory($educationData);

        $worksStubs = [];
        if (isset($worksData['group']) && is_array($worksData['group'])) {
            foreach ($worksData['group'] as $work) {
                $summary = $work['work-summary'][0] ?? null;
                if (!$summary) continue;

                $title = $summary['title']['title']['value'] ?? '';
                if (empty($title)) continue;

                $worksStubs[] = [
                    'index'    => count($worksStubs),
                    'title'    => $title,
                    'doi'      => $this->extractDoi($summary),
                    'put_code' => isset($summary['put-code']) ? (string)$summary['put-code'] : null,
                ];
            }
        }

        $result = [
            'status'        => 'success',
            'action'        => 'init',
            'api_version'   => 'v1.2.0',
            'personal_info' => [
                'name'              => $name ?: 'Peneliti ' . $orcid,
                'institutions'      => $institutions,
                'orcid'             => $orcid,
                'bio'               => $bio,
                'emails'            => $emails,
                'keywords'          => $kwTags,
                'external_ids'      => $externalIds,
                'researcher_urls'   => $researcherUrls,
                'affiliations'      => $allAffiliations,
                'education_history' => $educationHistory,
                'data_source'       => !empty($personData) ? 'ORCID API' : 'Fallback',
            ],
            'total_works' => count($worksStubs),
            'works_stubs' => $worksStubs,
            'from_cache'  => false,
            'timestamp'   => date('c'),
        ];

        $this->saveToCache($cacheFile, $result);
        return $result;
    }

    private function handleOrcidBatchRequest(string $orcid, int $offset, int $limit, bool $forceRefresh): array
    {
        $initCacheFile = $this->getCacheFilename('orcid_init', $orcid);
        $initData = $this->readFromCache($initCacheFile);

        if (!is_array($initData)) {
            $initData = $this->handleOrcidInitRequest($orcid, $forceRefresh);
        }

        $worksStubs = $initData['works_stubs'] ?? [];
        $totalWorks = count($worksStubs);
        $batchStubs = array_slice($worksStubs, $offset, $limit);

        if (empty($batchStubs)) {
            return [
                'status' => 'success', 'action' => 'batch', 'api_version' => 'v1.2.0',
                'orcid' => $orcid, 'offset' => $offset, 'limit' => $limit,
                'processed' => 0, 'total_works' => $totalWorks, 'works' => [],
                'is_done' => true, 'next_offset' => $offset, 'timestamp' => date('c'),
            ];
        }

        $batchCacheId   = $orcid . '_' . $offset . '_' . $limit;
        $batchCacheFile = $this->getCacheFilename('orcid_batch', $batchCacheId);

        if (!$forceRefresh && file_exists($batchCacheFile)) {
            $cached = $this->readFromCache($batchCacheFile);
            if (is_array($cached)) {
                $cached['from_cache'] = true;
                return $cached;
            }
        }

        $processedWorks = [];

        foreach ($batchStubs as $stub) {
            $title    = $stub['title'];
            $doi      = $stub['doi'] ?? null;
            $putCode  = $stub['put_code'] ?? null;

            $contributors  = [];
            $journalTitle  = '';
            $volume        = '';
            $issue         = '';
            $pages         = '';
            $pubYear       = null;
            $keywords      = [];
            $workType      = '';
            $workUrl       = '';

            if ($putCode) {
                try {
                    $detail        = $this->fetchOrcidWorkDetail($orcid, $putCode);
                    $contributors  = $detail['contributors']  ?? [];
                    $journalTitle  = $detail['journal_title'] ?? '';
                    $pubYear       = $detail['pub_year']      ?? null;
                    $keywords      = $detail['keywords']      ?? [];
                    $workType      = $detail['work_type']     ?? '';
                    $workUrl       = $detail['url']           ?? '';
                } catch (Exception $e) {
                    error_log("Batch: gagal fetch put-code $putCode: " . $e->getMessage());
                }
            }

            $abstract = '';
            $metadataSource = 'ORCID';
            
            // Integrasi Metadata Smart Fallback (Crossref -> OpenCitations)
            if ($doi) {
                try {
                    $metadata = $this->fetchArticleMetadata($doi);
                    $metadataSource = $metadata['source'];

                    if (empty($abstract) && !empty($metadata['abstract'])) {
                        $abstract = $metadata['abstract'];
                    }

                    if (empty($contributors) && !empty($metadata['authors'])) {
                        foreach ($metadata['authors'] as $a) {
                            $contributors[] = ['name' => $a['name'], 'orcid' => null];
                        }
                    }

                    if (empty($journalTitle)) $journalTitle = $metadata['journal'];
                    if (empty($pubYear))      $pubYear      = $metadata['year'];
                    if (empty($title) && !empty($metadata['title'])) $title = $metadata['title'];

                } catch (Exception $e) {
                    error_log("Batch: gagal ambil metadata gabungan $doi: " . $e->getMessage());
                }
            }

            if (empty($abstract) && $doi) {
                try { $abstract = $this->fetchAbstractMultiSource($doi); } catch (Exception $e) {}
            }

            $fullText         = $title . ' ' . $abstract;
            $preprocessedText = $this->preprocessText($fullText);

            $sdgAnalysis = [];
            foreach ($this->sdgKeywords as $sdg => $sdg_keywords) {
                $matched = false;
                foreach ($sdg_keywords as $keyword) {
                    if (stripos($preprocessedText, $keyword) !== false) {
                        $matched = true;
                        break;
                    }
                }
                if ($matched) {
                    $eval = $this->evaluateSDGContribution($preprocessedText, $sdg);
                    if ($eval['score'] > self::CONFIG['MIN_SCORE_THRESHOLD']) {
                        $sdgAnalysis[$sdg] = $eval;
                    }
                }
            }

            $filteredSdgs     = [];
            $sdgConfidence    = [];
            $contributorTypes = [];
            $pathways         = [];

            foreach ($sdgAnalysis as $sdg => $analysis) {
                if ($analysis['score'] < self::CONFIG['CONFIDENCE_THRESHOLD']) continue;
                $filteredSdgs[]          = $sdg;
                $sdgConfidence[$sdg]     = $analysis['score'];
                $contributorTypes[$sdg]  = $analysis['contributor_type']['type'];
                if (!empty($analysis['impact_orientation']['dominant_pathway'])) {
                    $pathways[$sdg] = $analysis['impact_orientation']['dominant_pathway'];
                }
            }

            arsort($sdgConfidence);
            if (count($filteredSdgs) > self::CONFIG['MAX_SDGS_PER_WORK']) {
                $sdgConfidence    = array_slice($sdgConfidence, 0, self::CONFIG['MAX_SDGS_PER_WORK'], true);
                $filteredSdgs     = array_keys($sdgConfidence);
                $contributorTypes = array_intersect_key($contributorTypes, $sdgConfidence);
                $pathways         = array_intersect_key($pathways, $sdgConfidence);
            }

            $processedWorks[] = [
                'title'                 => $title,
                'doi'                   => $doi,
                'put_code'              => $putCode,
                'abstract'              => $abstract,
                'contributors'          => $contributors,
                'journal'               => $journalTitle,
                'volume'                => $volume,
                'issue'                 => $issue,
                'pages'                 => $pages,
                'year'                  => $pubYear,
                'keywords'              => $keywords,
                'work_type'             => $workType,
                'url'                   => $workUrl,
                'metadata_source'       => $metadataSource,
                'sdgs'                  => $filteredSdgs,
                'sdg_confidence'        => $sdgConfidence,
                'contributor_types'     => $contributorTypes,
                'contribution_pathways' => $pathways,
                'detailed_analysis'     => $sdgAnalysis,
            ];
        }

        $nextOffset = $offset + $limit;
        $isDone     = ($nextOffset >= $totalWorks);

        $result = [
            'status'      => 'success',
            'action'      => 'batch',
            'api_version' => 'v1.2.0',
            'orcid'       => $orcid,
            'offset'      => $offset,
            'limit'       => $limit,
            'processed'   => count($processedWorks),
            'total_works' => $totalWorks,
            'works'       => $processedWorks,
            'is_done'     => $isDone,
            'next_offset' => $nextOffset,
            'from_cache'  => false,
            'timestamp'   => date('c'),
        ];

        $this->saveToCache($batchCacheFile, $result);
        return $result;
    }

    private function handleOrcidSummaryRequest(string $orcid): array
    {
        $initCacheFile = $this->getCacheFilename('orcid_init', $orcid);
        $initData      = $this->readFromCache($initCacheFile);

        if (!is_array($initData)) {
            throw new Exception('Init data tidak ditemukan. Jalankan action=init terlebih dahulu.', 400);
        }

        $totalWorks           = $initData['total_works'] ?? 0;
        $researcherSdgSummary = [];
        $totalAnalyzed        = 0;

        for ($offset = 0; $offset < $totalWorks; $offset += self::BATCH_SIZE) {
            $batchCacheId   = $orcid . '_' . $offset . '_' . self::BATCH_SIZE;
            $batchCacheFile = $this->getCacheFilename('orcid_batch', $batchCacheId);

            if (!file_exists($batchCacheFile)) continue;
            $batchData = $this->readFromCache($batchCacheFile);
            if (!is_array($batchData)) continue;

            foreach ($batchData['works'] as $work) {
                $totalAnalyzed++;

                foreach ($work['detailed_analysis'] as $sdg => $analysis) {
                    if ($analysis['score'] < self::CONFIG['CONFIDENCE_THRESHOLD']) continue;

                    if (!isset($researcherSdgSummary[$sdg])) {
                        $researcherSdgSummary[$sdg] = [
                            'work_count'            => 0,
                            'average_confidence'    => 0,
                            'high_confidence_works' => 0,
                            'contributor_types'     => ['Active Contributor' => 0, 'Relevant Contributor' => 0, 'Discutor' => 0, 'Not Relevant' => 0],
                            'dominant_pathways'     => [],
                            'example_works'         => [],
                        ];
                    }

                    $researcherSdgSummary[$sdg]['work_count']++;
                    $researcherSdgSummary[$sdg]['average_confidence'] += $analysis['score'];

                    $ct = $analysis['contributor_type']['type'];
                    if (isset($researcherSdgSummary[$sdg]['contributor_types'][$ct])) {
                        $researcherSdgSummary[$sdg]['contributor_types'][$ct]++;
                    }

                    if (!empty($analysis['impact_orientation']['dominant_pathway'])) {
                        $pw = $analysis['impact_orientation']['dominant_pathway'];
                        $researcherSdgSummary[$sdg]['dominant_pathways'][$pw] = ($researcherSdgSummary[$sdg]['dominant_pathways'][$pw] ?? 0) + 1;
                    }

                    if ($analysis['score'] >= self::CONFIG['HIGH_CONFIDENCE_THRESHOLD']) {
                        $researcherSdgSummary[$sdg]['high_confidence_works']++;
                    }

                    if (count($researcherSdgSummary[$sdg]['example_works']) < 3) {
                        $researcherSdgSummary[$sdg]['example_works'][] = [
                            'title'            => $work['title'],
                            'doi'              => $work['doi'],
                            'confidence'       => $analysis['score'],
                            'contributor_type' => $ct,
                        ];
                    }
                }
            }
        }

        foreach ($researcherSdgSummary as $sdg => $summary) {
            if ($summary['work_count'] > 0) {
                $researcherSdgSummary[$sdg]['average_confidence'] = round($summary['average_confidence'] / $summary['work_count'], 3);
            }
            if (!empty($summary['dominant_pathways'])) {
                arsort($researcherSdgSummary[$sdg]['dominant_pathways']);
            }
        }

        uasort($researcherSdgSummary, fn($a, $b) => $b['work_count'] <=> $a['work_count']);

        $contributorProfile = [];
        foreach ($researcherSdgSummary as $sdg => $summary) {
            $active   = $summary['contributor_types']['Active Contributor'];
            $relevant = $summary['contributor_types']['Relevant Contributor'];
            $total    = $summary['work_count'];

            $dominantType = 'Discutor';
            if ($total > 0) {
                if (($active / $total) >= 0.3) {
                    $dominantType = 'Active Contributor';
                } elseif (($active + $relevant) / $total >= 0.5) {
                    $dominantType = 'Relevant Contributor';
                }
            }

            $contributorProfile[$sdg] = [
                'dominant_type'     => $dominantType,
                'work_distribution' => [
                    'active_contributor'   => $active,
                    'relevant_contributor' => $relevant,
                    'discussant'           => $summary['contributor_types']['Discutor'],
                ],
                'active_contributor_percentage' => $total > 0 ? round(($active / $total) * 100, 1) : 0,
                'contribution_strength'         => $this->determineContributionStrength($summary),
            ];
        }

        return [
            'status'                 => 'success',
            'action'                 => 'summary',
            'api_version'            => 'v1.2.0',
            'personal_info'          => $initData['personal_info'],
            'researcher_sdg_summary' => $researcherSdgSummary,
            'contributor_profile'    => $contributorProfile,
            'total_works_analyzed'   => $totalAnalyzed,
            'timestamp'              => date('c'),
        ];
    }

    private function handleOrcidRequest(string $orcid, bool $forceRefresh): array
    {
        $cacheFile = $this->getCacheFilename('orcid', $orcid);
        if (!$forceRefresh && file_exists($cacheFile)) {
            $cached = $this->readFromCache($cacheFile);
            if (is_array($cached)) {
                if (empty($cached['personal_info'])) {
                    $cached['personal_info'] = ['name' => 'Peneliti ' . $orcid, 'institutions' => [], 'orcid' => $orcid];
                }
                $cached['cache_info'] = ['from_cache' => true, 'cache_date' => date('c', filemtime($cacheFile))];
                return $cached;
            }
        }

        $personData = $this->fetchOrcidPersonData($orcid);
        $worksData  = $this->fetchOrcidData($orcid);
        $result     = $this->processOrcidData($orcid, $worksData, $personData);

        if (empty($result['personal_info']['name'])) {
            $result['personal_info'] = ['name' => 'Peneliti ' . $orcid, 'institutions' => [], 'orcid' => $orcid, 'data_source' => 'Fallback'];
        }

        $this->saveToCache($cacheFile, $result);
        $result['cache_info'] = ['from_cache' => false, 'cache_date' => date('c')];
        return $result;
    }

    private function handleDoiRequest(string $doi, bool $forceRefresh): array
    {
        $doi = trim($doi);
        if (empty($doi)) throw new Exception('DOI tidak boleh kosong', 400);

        $cleanDoi = preg_replace('/^https?:\/\/(dx\.)?doi\.org\//i', '', $doi);
        $cleanDoi = preg_replace('/^doi:/i', '', $cleanDoi);
        $cleanDoi = trim($cleanDoi);

        if (!preg_match('/^10\.\d{4,}\//', $cleanDoi)) {
            throw new Exception('Input bukan DOI valid. Input: ' . htmlspecialchars($doi, ENT_QUOTES), 400);
        }
        $doi = $cleanDoi;

        $cacheFile = $this->getCacheFilename('article', $doi);
        if (!$forceRefresh && file_exists($cacheFile)) {
            $cached = $this->readFromCache($cacheFile);
            if (is_array($cached)) {
                $cached['cache_info'] = ['from_cache' => true, 'cache_date' => date('c', filemtime($cacheFile))];
                return $cached;
            }
        }

        $metadata = $this->fetchArticleMetadata($doi);
        $result   = $this->processDoiData($doi, $metadata);
        
        $this->saveToCache($cacheFile, $result);
        $result['cache_info'] = ['from_cache' => false, 'cache_date' => date('c')];
        return $result;
    }

    // =================================================================
    // FUNGSI PENGAMBILAN DATA (Fetchers)
    // =================================================================

    private function fetchArticleMetadata(string $doi): array
    {
        $metadata = [
            'title'          => '',
            'abstract'       => '',
            'authors'        => [],
            'journal'        => '',
            'year'           => null,
            'published_date' => '',
            'source'         => ''
        ];

        try {
            // Priority 1: Crossref
            $cr = $this->fetchDoiData($doi);
            $metadata['source']         = 'Crossref';
            $metadata['title']          = $cr['message']['title'][0] ?? '';
            $metadata['journal']        = $cr['message']['container-title'][0] ?? '';
            
            if (!empty($cr['message']['abstract'])) {
                $metadata['abstract'] = strip_tags($cr['message']['abstract']);
            }

            if (isset($cr['message']['author'])) {
                foreach ($cr['message']['author'] as $a) {
                    $n = trim(($a['given'] ?? '') . ' ' . ($a['family'] ?? ''));
                    if ($n) $metadata['authors'][] = ['name' => $n];
                }
            }

            $yearParts = $cr['message']['published']['date-parts'][0] ?? ($cr['message']['published-print']['date-parts'][0] ?? []);
            $metadata['published_date'] = !empty($yearParts) ? implode('-', $yearParts) : '';
            $metadata['year']           = !empty($yearParts[0]) ? (int)$yearParts[0] : null;

        } catch (Exception $e) {
            // Priority 2: Fallback ke OpenCitations jika Crossref Gagal
            try {
                $oc = $this->fetchOpenCitationsData($doi);
                if (empty($oc[0])) {
                    throw new Exception("Data OpenCitations kosong.");
                }

                $metadata['source']         = 'OpenCitations';
                $metadata['title']          = $oc[0]['title'] ?? '';
                $metadata['journal']        = $oc[0]['source_title'] ?? '';
                $metadata['year']           = !empty($oc[0]['year']) ? (int)$oc[0]['year'] : null;
                $metadata['published_date'] = $oc[0]['year'] ?? '';

                if (!empty($oc[0]['author'])) {
                    $authors = explode('; ', $oc[0]['author']);
                    foreach ($authors as $a) {
                        $parts = explode(', ', $a);
                        if (count($parts) === 2) {
                            $metadata['authors'][] = ['name' => trim($parts[1] . ' ' . $parts[0])];
                        } else {
                            $metadata['authors'][] = ['name' => trim($a)];
                        }
                    }
                }
            } catch (Exception $e2) {
                throw new Exception("Gagal mengambil metadata dari Crossref maupun OpenCitations untuk DOI: $doi");
            }
        }

        return $metadata;
    }

    private function fetchOpenCitationsData(string $doi): array
    {
        $url = "https://opencitations.net/api/v2/metadata/" . urlencode($doi);
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 12,
            CURLOPT_USERAGENT      => 'SciecolaBot/1.0 (mailto:sciecola@sangia.org)',
        ]);
        $response  = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errno     = curl_errno($ch);
        curl_close($ch);

        if ($errno || $httpCode !== 200) {
            throw new Exception("OpenCitations HTTP $httpCode");
        }

        $data = json_decode((string)$response, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            throw new Exception("Respons OpenCitations bukan JSON array valid.");
        }

        return $data;
    }

    private function fetchDoiData(string $doi): array
    {
        $url     = "https://api.crossref.org/works/" . urlencode($doi);
        $maxTry  = 2;
        $delay   = 1;
        $lastErr = '';

        for ($attempt = 0; $attempt < $maxTry; $attempt++) {
            if ($attempt > 0) sleep($delay * $attempt);

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HEADER         => true,
                CURLOPT_USERAGENT      => 'SciecolaBot/1.0 (mailto:sciecola@sangia.org)',
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_TIMEOUT        => 10,
            ]);
            $raw        = curl_exec($ch);
            $errno      = curl_errno($ch);
            $errStr     = curl_error($ch);
            $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
            $ctypeRaw   = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            curl_close($ch);

            if ($errno) { $lastErr = 'cURL error: ' . $errStr; continue; }
            if ($httpCode === 429) { $lastErr = 'Crossref rate limit (429)'; continue; }
            if ($httpCode === 404) throw new Exception('DOI tidak ditemukan di Crossref (404)', 404);
            if ($httpCode !== 200) throw new Exception("Crossref HTTP $httpCode untuk DOI: $doi", 500);

            if ($ctypeRaw && stripos((string)$ctypeRaw, 'json') === false) {
                throw new Exception('Crossref tidak mengembalikan JSON (Content-Type: ' . $ctypeRaw . ')', 500);
            }

            $body = substr((string)$raw, $headerSize);
            $firstChar = ltrim($body)[0] ?? '';
            if ($firstChar !== '{' && $firstChar !== '[') {
                throw new Exception('Crossref mengembalikan respons non-JSON.', 500);
            }

            $data = json_decode($body, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('JSON Crossref tidak valid: ' . json_last_error_msg(), 500);
            }
            return $data;
        }
        throw new Exception('Gagal mengambil data Crossref setelah ' . $maxTry . ' percobaan. ' . $lastErr, 500);
    }

    private function fetchOrcidData(string $orcid): array
    {
        $url = "https://pub.orcid.org/v3.0/{$orcid}/works?pageSize=50";
        $ch  = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 15,
        ]);
        $response = curl_exec($ch);
        $errno    = curl_errno($ch);
        $error    = curl_error($ch);
        curl_close($ch);
        
        if ($errno) throw new Exception('Gagal mengambil data ORCID: ' . $error, 500);
        $data = json_decode((string)$response, true);
        if (json_last_error() !== JSON_ERROR_NONE) throw new Exception('Data ORCID tidak valid', 500);
        return $data;
    }

    private function fetchOrcidPersonData(string $orcid): array
    {
        $url = "https://pub.orcid.org/v3.0/{$orcid}/person";
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 10,
        ]);
        $response  = curl_exec($ch);
        $errno     = curl_errno($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($errno || $httpCode != 200) return [];
        $data = json_decode((string)$response, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $data : [];
    }

    private function fetchOrcidEmployments(string $orcid): array
    {
        $url = "https://pub.orcid.org/v3.0/{$orcid}/employments";
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT        => 6,
        ]);
        $response  = curl_exec($ch);
        $errno     = curl_errno($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($errno || $httpCode != 200) return [];
        $data = json_decode((string)$response, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $data : [];
    }

    private function fetchOrcidEducations(string $orcid): array
    {
        $url = "https://pub.orcid.org/v3.0/{$orcid}/educations";
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT        => 6,
        ]);
        $response  = curl_exec($ch);
        $errno     = curl_errno($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($errno || $httpCode != 200) return [];
        $data = json_decode((string)$response, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $data : [];
    }

    private function fetchOrcidWorkDetail(string $orcid, string $putCode): array
    {
        $url = "https://pub.orcid.org/v3.0/{$orcid}/work/{$putCode}";
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 10,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errno    = curl_errno($ch);
        curl_close($ch);

        if ($errno || $httpCode !== 200) return [];
        $data = json_decode((string)$response, true);
        if (json_last_error() !== JSON_ERROR_NONE) return [];

        $contributors = [];
        if (isset($data['contributors']['contributor'])) {
            foreach ($data['contributors']['contributor'] as $c) {
                $name      = $c['credit-name']['value'] ?? null;
                $orcidPath = $c['contributor-orcid']['path'] ?? null;
                if ($name) $contributors[] = ['name' => $name, 'orcid' => $orcidPath];
            }
        }

        return [
            'contributors'  => $contributors,
            'journal_title' => $data['journal-title']['value'] ?? '',
            'pub_year'      => isset($data['publication-date']['year']['value']) ? (int)$data['publication-date']['year']['value'] : null,
            'keywords'      => array_map(fn($k) => $k['content'], $data['keywords']['keyword'] ?? []),
            'work_type'     => $data['type'] ?? '',
            'url'           => $data['url']['value'] ?? '',
        ];
    }

    private function fetchAbstractMultiSource(string $doi): string
    {
        if (empty($doi)) return '';
        $clean = preg_replace('/^https?:\/\/(dx\.)?doi\.org\//i', '', trim($doi));

        try {
            $url = "https://api.crossref.org/works/" . urlencode($clean);
            $ch  = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 5,
                CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_USERAGENT      => 'SciecolaBot/1.0 (mailto:sciecola@sangia.org)',
                CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            ]);
            $resp     = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($httpCode === 200 && $resp) {
                $d = json_decode((string)$resp, true);
                if (!empty($d['message']['abstract'])) return strip_tags($d['message']['abstract']);
            }
        } catch (Exception $e) {}

        try {
            $url = "https://api.openalex.org/works/doi:" . urlencode($clean);
            $ch  = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 5,
                CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_USERAGENT      => 'SciecolaBot/1.0 (mailto:sciecola@sangia.org)',
            ]);
            $resp     = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($httpCode === 200 && $resp) {
                $d = json_decode((string)$resp, true);
                if (!empty($d['abstract_inverted_index'])) {
                    $words = [];
                    foreach ($d['abstract_inverted_index'] as $word => $positions) {
                        foreach ($positions as $pos) $words[$pos] = $word;
                    }
                    ksort($words);
                    $abstract = implode(' ', $words);
                    if (!empty($abstract)) return $abstract;
                }
            }
        } catch (Exception $e) {}

        return '';
    }

    // =================================================================
    // EKSTRAKTOR DATA
    // =================================================================

    private function formatOrcidDateParts(?array $dateArray): ?string
    {
        if (empty($dateArray)) return null;
        $parts = [];
        if (!empty($dateArray['year']['value']))  $parts[] = $dateArray['year']['value'];
        if (!empty($dateArray['month']['value'])) $parts[] = str_pad($dateArray['month']['value'], 2, '0', STR_PAD_LEFT);
        if (!empty($dateArray['day']['value']))   $parts[] = str_pad($dateArray['day']['value'],   2, '0', STR_PAD_LEFT);
        return !empty($parts) ? implode('-', $parts) : null;
    }

    private function extractOrcidExternalIds(array $personData): array
    {
        $externalIds = [];
        if (!empty($personData['external-identifiers']['external-identifier'])) {
            foreach ($personData['external-identifiers']['external-identifier'] as $extId) {
                $externalIds[] = [
                    'type'  => $extId['external-id-type'] ?? null,
                    'value' => $extId['external-id-value'] ?? null,
                    'url'   => $extId['external-id-url']['value'] ?? null,
                ];
            }
        }
        return $externalIds;
    }

    private function extractOrcidResearcherUrls(array $personData): array
    {
        $urls = [];
        if (!empty($personData['researcher-urls']['researcher-url'])) {
            foreach ($personData['researcher-urls']['researcher-url'] as $u) {
                $urls[] = [
                    'name' => $u['url-name'] ?? null,
                    'url'  => $u['url']['value'] ?? null,
                ];
            }
        }
        return $urls;
    }

    private function extractAllAffiliations(array $employmentData): array
    {
        $affiliations = [];
        if (!empty($employmentData['affiliation-group'])) {
            foreach ($employmentData['affiliation-group'] as $group) {
                $summary = $group['summaries'][0]['employment-summary'] ?? null;
                if (!$summary) continue;
                $org = trim($summary['organization']['name'] ?? '');
                if (strlen($org) < 2) continue;
                
                $affiliations[] = [
                    'type'         => 'employment',
                    'organization' => $org,
                    'department'   => $summary['department-name'] ?? null,
                    'role'         => $summary['role-title'] ?? null,
                    'start_date'   => $this->formatOrcidDateParts($summary['start-date'] ?? null),
                    'end_date'     => $this->formatOrcidDateParts($summary['end-date'] ?? null),
                    'is_current'   => empty($summary['end-date']),
                    'address'      => [
                        'city'    => $summary['organization']['address']['city'] ?? null,
                        'region'  => $summary['organization']['address']['region'] ?? null,
                        'country' => $summary['organization']['address']['country'] ?? null,
                    ],
                ];
            }
        }
        return $affiliations;
    }

    private function extractEducationHistory(array $educationData): array
    {
        $educations = [];
        if (!empty($educationData['affiliation-group'])) {
            foreach ($educationData['affiliation-group'] as $group) {
                $summary = $group['summaries'][0]['education-summary'] ?? null;
                if (!$summary) continue;
                $org = trim($summary['organization']['name'] ?? '');
                if (strlen($org) < 2) continue;
                
                $educations[] = [
                    'organization' => $org,
                    'department'   => $summary['department-name'] ?? null,
                    'degree'       => $summary['role-title'] ?? null,
                    'start_date'   => $this->formatOrcidDateParts($summary['start-date'] ?? null),
                    'end_date'     => $this->formatOrcidDateParts($summary['end-date'] ?? null),
                    'address'      => [
                        'city'    => $summary['organization']['address']['city'] ?? null,
                        'region'  => $summary['organization']['address']['region'] ?? null,
                        'country' => $summary['organization']['address']['country'] ?? null,
                    ],
                ];
            }
        }
        return $educations;
    }

    private function extractOrcidBio(array $personData): ?string
    {
        return isset($personData['biography']['content']) ? trim($personData['biography']['content']) : null;
    }

    private function extractOrcidEmails(array $personData): array
    {
        $emails = [];
        if (!empty($personData['emails']['email'])) {
            foreach ($personData['emails']['email'] as $entry) {
                if (!empty($entry['email'])) $emails[] = $entry['email'];
            }
        }
        return $emails;
    }

    private function extractOrcidKeywords(array $personData): array
    {
        $keywords = [];
        if (!empty($personData['keywords']['keyword'])) {
            foreach ($personData['keywords']['keyword'] as $kw) {
                if (!empty($kw['content'])) $keywords[] = $kw['content'];
            }
        }
        return $keywords;
    }

    private function extractDoi(array $summary): ?string
    {
        if (!isset($summary['external-ids']['external-id'])) return null;
        foreach ($summary['external-ids']['external-id'] as $id) {
            if (isset($id['external-id-type']) && strtolower($id['external-id-type']) === 'doi' && !empty($id['external-id-value'])) {
                return $id['external-id-value'];
            }
        }
        return null;
    }

    private function extractOrcidName(array $personData): string
    {
        if (empty($personData)) return 'Unknown Researcher';
        if (isset($personData['name']['credit-name']['value'])) return $personData['name']['credit-name']['value'];
        $name = '';
        if (isset($personData['name']['given-names']['value'])) $name .= $personData['name']['given-names']['value'] . ' ';
        if (isset($personData['name']['family-name']['value'])) $name .= $personData['name']['family-name']['value'];
        return !empty(trim($name)) ? trim($name) : 'Unknown Researcher';
    }

    private function extractOrcidInstitutionsEnhanced(array $personData, array $employmentData): array
    {
        $institutions = [];
        if (!empty($employmentData['affiliation-group'])) {
            $current = [];
            $all     = [];
            foreach ($employmentData['affiliation-group'] as $group) {
                $summary = $group['summaries'][0]['employment-summary'] ?? null;
                if (!$summary) continue;
                $org = trim($summary['organization']['name'] ?? '');
                if (strlen($org) < 3) continue;
                $all[] = $org;
                if (empty($summary['end-date'])) $current[] = $org;
            }
            $institutions = !empty($current) ? $current : $all;
        }

        if (empty($institutions) && !empty($personData['employments']['employment-summary'])) {
            foreach ($personData['employments']['employment-summary'] as $emp) {
                if (isset($emp['organization']['name'])) {
                    $n = trim($emp['organization']['name']);
                    if (strlen($n) > 2) $institutions[] = $n;
                }
            }
        }

        return array_values(array_unique($institutions));
    }

    // =================================================================
    // PROSES DATA LEGACY & EVALUASI
    // =================================================================

    private function processOrcidData(string $orcid, array $worksData, array $personData): array
    {
        $name         = $this->extractOrcidName($personData);
        $institutions = $this->extractOrcidInstitutionsEnhanced($personData, []);

        $processedWorks       = [];
        $researcherSdgSummary = [];
        $contributorProfile   = [];

        if (isset($worksData['group']) && is_array($worksData['group'])) {
            foreach ($worksData['group'] as $work) {
                $summary = $work['work-summary'][0] ?? null;
                if (!$summary) continue;

                $title = $summary['title']['title']['value'] ?? '';
                $doi   = $this->extractDoi($summary);
                if (empty($title)) continue;

                $abstract = '';
                if ($doi) {
                    try {
                        $metadata = $this->fetchArticleMetadata($doi);
                        if (!empty($metadata['abstract'])) $abstract = $metadata['abstract'];
                        if (empty($title) && !empty($metadata['title'])) $title = $metadata['title'];
                    } catch (Exception $e) {}
                }

                if (empty($abstract) && $doi) {
                    try { $abstract = $this->fetchAbstractMultiSource($doi); } catch (Exception $e) {}
                }

                $fullText      = $title . ' ' . $abstract;
                $preprocessed  = $this->preprocessText($fullText);
                $sdgAnalysis   = [];

                foreach ($this->sdgKeywords as $sdg => $keywords) {
                    $matched = false;
                    foreach ($keywords as $kw) {
                        if (stripos($preprocessed, $kw) !== false) { $matched = true; break; }
                    }
                    if ($matched) {
                        $eval = $this->evaluateSDGContribution($preprocessed, $sdg);
                        if ($eval['score'] > self::CONFIG['MIN_SCORE_THRESHOLD']) $sdgAnalysis[$sdg] = $eval;
                    }
                }

                $filtered   = [];
                $confidence = [];
                $ctypes     = [];
                $pathways   = [];

                foreach ($sdgAnalysis as $sdg => $a) {
                    if ($a['score'] < self::CONFIG['CONFIDENCE_THRESHOLD']) continue;
                    $filtered[]       = $sdg;
                    $confidence[$sdg] = $a['score'];
                    $ctypes[$sdg]     = $a['contributor_type']['type'];
                    if (!empty($a['impact_orientation']['dominant_pathway'])) {
                        $pathways[$sdg] = $a['impact_orientation']['dominant_pathway'];
                    }
                }

                arsort($confidence);
                if (count($filtered) > self::CONFIG['MAX_SDGS_PER_WORK']) {
                    $confidence = array_slice($confidence, 0, self::CONFIG['MAX_SDGS_PER_WORK'], true);
                    $filtered   = array_keys($confidence);
                    $ctypes     = array_intersect_key($ctypes, $confidence);
                    $pathways   = array_intersect_key($pathways, $confidence);
                }

                $processedWorks[] = [
                    'title'                 => $title, 
                    'doi'                   => $doi, 
                    'abstract'              => $abstract,
                    'sdgs'                  => $filtered, 
                    'sdg_confidence'        => $confidence,
                    'contributor_types'     => $ctypes, 
                    'contribution_pathways' => $pathways,
                    'detailed_analysis'     => $sdgAnalysis,
                ];

                foreach ($sdgAnalysis as $sdg => $analysis) {
                    if ($analysis['score'] < self::CONFIG['CONFIDENCE_THRESHOLD']) continue;
                    
                    if (!isset($researcherSdgSummary[$sdg])) {
                        $researcherSdgSummary[$sdg] = [
                            'work_count' => 0, 'average_confidence' => 0, 'high_confidence_works' => 0,
                            'contributor_types' => ['Active Contributor' => 0, 'Relevant Contributor' => 0, 'Discutor' => 0, 'Not Relevant' => 0],
                            'dominant_pathways' => [], 'example_works' => []
                        ];
                    }
                    
                    $researcherSdgSummary[$sdg]['work_count']++;
                    $researcherSdgSummary[$sdg]['average_confidence'] += $analysis['score'];
                    
                    $ct = $analysis['contributor_type']['type'];
                    if (isset($researcherSdgSummary[$sdg]['contributor_types'][$ct])) {
                        $researcherSdgSummary[$sdg]['contributor_types'][$ct]++;
                    }
                    
                    if (!empty($analysis['impact_orientation']['dominant_pathway'])) {
                        $pw = $analysis['impact_orientation']['dominant_pathway'];
                        $researcherSdgSummary[$sdg]['dominant_pathways'][$pw] = ($researcherSdgSummary[$sdg]['dominant_pathways'][$pw] ?? 0) + 1;
                    }
                    
                    if ($analysis['score'] >= self::CONFIG['HIGH_CONFIDENCE_THRESHOLD']) {
                        $researcherSdgSummary[$sdg]['high_confidence_works']++;
                    }
                    
                    if (count($researcherSdgSummary[$sdg]['example_works']) < 3) {
                        $researcherSdgSummary[$sdg]['example_works'][] = [
                            'title' => $title, 'doi' => $doi, 'confidence' => $analysis['score'], 'contributor_type' => $ct
                        ];
                    }
                }
            }
        }

        foreach ($researcherSdgSummary as $sdg => $sum) {
            if ($sum['work_count'] > 0) {
                $researcherSdgSummary[$sdg]['average_confidence'] = round($sum['average_confidence'] / $sum['work_count'], 3);
            }
            if (!empty($sum['dominant_pathways'])) {
                arsort($researcherSdgSummary[$sdg]['dominant_pathways']);
            }
        }

        uasort($researcherSdgSummary, fn($a, $b) => $b['work_count'] <=> $a['work_count']);

        foreach ($researcherSdgSummary as $sdg => $sum) {
            $active   = $sum['contributor_types']['Active Contributor'];
            $relevant = $sum['contributor_types']['Relevant Contributor'];
            $total    = $sum['work_count'];
            
            $dominantType = 'Discutor';
            if ($total > 0) {
                if (($active / $total) >= 0.3) $dominantType = 'Active Contributor';
                elseif (($active + $relevant) / $total >= 0.5) $dominantType = 'Relevant Contributor';
            }
            
            $contributorProfile[$sdg] = [
                'dominant_type' => $dominantType,
                'work_distribution' => [
                    'active_contributor'   => $active,
                    'relevant_contributor' => $relevant,
                    'discussant'           => $sum['contributor_types']['Discutor']
                ],
                'active_contributor_percentage' => $total > 0 ? round(($active / $total) * 100, 1) : 0,
                'contribution_strength'         => $this->determineContributionStrength($sum),
            ];
        }

        return [
            'personal_info'          => ['name' => $name, 'institutions' => $institutions, 'orcid' => $orcid, 'data_source' => !empty($personData) ? 'ORCID API' : 'Fallback'],
            'contributor_profile'    => $contributorProfile,
            'researcher_sdg_summary' => $researcherSdgSummary,
            'works'                  => $processedWorks,
            'status'                 => 'success',
            'api_version'            => 'v1.2.0',
            'timestamp'              => date('c'),
        ];
    }

    private function processDoiData(string $doi, array $metadata): array
    {
        $title    = $metadata['title'] ?? '';
        $abstract = $metadata['abstract'] ?? '';
        
        if (empty($abstract)) {
            try { $abstract = $this->fetchAbstractMultiSource($doi); } catch (Exception $e) {}
        }

        $fullText     = $title . ' ' . $abstract;
        $preprocessed = $this->preprocessText($fullText);

        $authors = array_column($metadata['authors'] ?? [], 'name');

        $sdgAnalysis = [];
        foreach (array_keys($this->sdgKeywords) as $sdg) {
            $matched = false;
            foreach ($this->sdgKeywords[$sdg] as $kw) {
                if (stripos($preprocessed, $kw) !== false) { $matched = true; break; }
            }
            if ($matched) {
                $eval = $this->evaluateSDGContribution($preprocessed, $sdg);
                if ($eval['score'] > self::CONFIG['MIN_SCORE_THRESHOLD']) $sdgAnalysis[$sdg] = $eval;
            }
        }

        $filtered   = [];
        $confidence = [];
        $ctypes     = [];
        $pathways   = [];

        foreach ($sdgAnalysis as $sdg => $a) {
            if ($a['score'] < self::CONFIG['CONFIDENCE_THRESHOLD']) continue;
            $filtered[]       = $sdg;
            $confidence[$sdg] = $a['score'];
            $ctypes[$sdg]     = $a['contributor_type']['type'];
            if (!empty($a['impact_orientation']['dominant_pathway'])) {
                $pathways[$sdg] = $a['impact_orientation']['dominant_pathway'];
            }
        }

        arsort($confidence);
        if (count($filtered) > self::CONFIG['MAX_SDGS_PER_WORK']) {
            $confidence = array_slice($confidence, 0, self::CONFIG['MAX_SDGS_PER_WORK'], true);
            $filtered   = array_keys($confidence);
        }

        return [
            'doi'                   => $doi,
            'title'                 => $title,
            'abstract'              => $abstract,
            'authors'               => $authors,
            'journal'               => $metadata['journal'] ?? '',
            'published_date'        => $metadata['published_date'] ?? '',
            'year'                  => $metadata['year'] ?? null,
            'metadata_source'       => $metadata['source'] ?? 'Unknown',
            'sdgs'                  => $filtered,
            'sdg_confidence'        => $confidence,
            'contributor_types'     => $ctypes,
            'contribution_pathways' => $pathways,
            'detailed_analysis'     => $sdgAnalysis,
            'api_version'           => 'v1.2.0',
            'status'                => 'success',
            'timestamp'             => date('c'),
        ];
    }

    private function evaluateSDGContribution(string $text, string $sdg): array
    {
        $cacheKey = md5($text . '_' . $sdg . '_contribution_v4');
        if (isset($this->memoryCache[$cacheKey])) return $this->memoryCache[$cacheKey];

        $keywordScore      = $this->scoreSDGs($text)[$sdg] ?? 0;
        $similarityScore   = $this->calculateSDGSimilarity($text)[$sdg] ?? 0;
        $substantiveResult = $this->analyzeSubstantiveContribution($text, $sdg);
        $substantiveScore  = $substantiveResult['score'] ?? 0;
        $causalResult      = $this->detectCausalRelationship($text, $sdg);
        $causalScore       = $causalResult['score'] ?? 0;
        $impactResult      = $this->evaluateImpactOrientation($text, $sdg);
        $impactScore       = $impactResult['score'] ?? 0;

        $weights = [
            'KEYWORD_WEIGHT'     => self::CONFIG['KEYWORD_WEIGHT'], 
            'SIMILARITY_WEIGHT'  => self::CONFIG['SIMILARITY_WEIGHT'], 
            'SUBSTANTIVE_WEIGHT' => self::CONFIG['SUBSTANTIVE_WEIGHT'], 
            'CAUSAL_WEIGHT'      => self::CONFIG['CAUSAL_WEIGHT']
        ];
        
        if (strlen($text) < 100) { 
            $weights = ['KEYWORD_WEIGHT' => 0.40, 'SIMILARITY_WEIGHT' => 0.40, 'SUBSTANTIVE_WEIGHT' => 0.10, 'CAUSAL_WEIGHT' => 0.10]; 
        }

        $combinedScore = ($keywordScore * $weights['KEYWORD_WEIGHT']) + 
                         ($similarityScore * $weights['SIMILARITY_WEIGHT']) + 
                         ($substantiveScore * $weights['SUBSTANTIVE_WEIGHT']) + 
                         ($causalScore * $weights['CAUSAL_WEIGHT']);

        $confidenceLevel = 'Low';
        if ($combinedScore > self::CONFIG['HIGH_CONFIDENCE_THRESHOLD'])  $confidenceLevel = 'High';
        elseif ($combinedScore > self::CONFIG['CONFIDENCE_THRESHOLD'])   $confidenceLevel = 'Middle';

        $contributorType = $this->determineContributorType($combinedScore, $causalScore, $impactScore);

        $evidence = [];
        $matchedKeywords = [];
        foreach ($this->sdgKeywords[$sdg] as $keyword) {
            if (stripos($text, $keyword) !== false) {
                $ctx = $this->extractKeywordContext($text, $keyword);
                if (!empty($ctx)) { $matchedKeywords[] = ['keyword' => $keyword, 'context' => $ctx]; }
                if (count($matchedKeywords) >= 3) break;
            }
        }
        
        if (!empty($matchedKeywords)) $evidence['keyword_matches'] = $matchedKeywords;
        if (!empty($causalResult['evidence']))  $evidence['causal_relationship'] = $causalResult['evidence'];
        if (!empty($impactResult['evidence']))  $evidence['impact_orientation']  = $impactResult['evidence'];

        $result = [
            'score'              => round($combinedScore, 3),
            'confidence_level'   => $confidenceLevel,
            'contributor_type'   => $contributorType,
            'components'         => [
                'keyword_score'     => round($keywordScore,3),
                'similarity_score'  => round($similarityScore,3),
                'substantive_score' => round($substantiveScore,3),
                'causal_score'      => round($causalScore,3),
                'impact_score'      => round($impactScore,3)
            ],
            'impact_orientation' => [
                'score'            => $impactResult['score'],
                'level'            => $impactResult['level'],
                'dominant_pathway' => $impactResult['dominant_pathway'] ?? ''
            ],
            'evidence'           => $evidence,
            'weights_used'       => $weights,
        ];

        $this->memoryCache[$cacheKey] = $result;
        return $result;
    }

    private function evaluateImpactOrientation(string $text, string $sdg): array
    {
        $cacheKey = md5($text . '_' . $sdg . '_impact');
        if (isset($this->memoryCache[$cacheKey])) return $this->memoryCache[$cacheKey];

        $text = strtolower($text);
        $impactScores = [];
        $evidence     = [];

        foreach ($this->impactIndicators as $category => $indicators) {
            $score = 0;
            foreach ($indicators as $indicator) {
                if (stripos($text, $indicator) !== false) {
                    $score += 1;
                    foreach ($this->transformativeVerbs as $verb) {
                        if (stripos($text, $verb . ' ' . $indicator) !== false || stripos($text, $indicator . ' ' . $verb) !== false) {
                            $score += 0.5;
                            break;
                        }
                    }
                }
            }
            $impactScores[$category] = min(1, $score / (count($indicators) * 0.5));
        }

        $pathwayScores = [];
        if (isset($this->contributionPathways[$sdg])) {
            foreach ($this->contributionPathways[$sdg] as $pathway => $indicators) {
                $score = 0;
                foreach ($indicators as $indicator) {
                    if (stripos($text, $indicator) !== false) $score += 1;
                }
                $pathwayScores[$pathway] = min(1, $score / max(1, count($indicators)));
            }
        }

        $transformativePatterns = ['this research contributes to','we propose','we develop','this study aims to','the results show','the findings indicate','we found that','implications for','penelitian ini berkontribusi','kami mengusulkan','kami mengembangkan','studi ini bertujuan','hasil menunjukkan','temuan mengindikasikan'];
        $transformativeScore = 0;
        foreach ($transformativePatterns as $pattern) {
            if (stripos($text, $pattern) !== false) $transformativeScore += 0.2;
        }
        $transformativeScore = min(1, $transformativeScore);

        $totalImpactScore = 0;
        if (!empty($impactScores))  $totalImpactScore += (array_sum($impactScores) / max(1, count($impactScores))) * 0.5;
        if (!empty($pathwayScores)) $totalImpactScore += (array_sum($pathwayScores) / max(1, count($pathwayScores))) * 0.3;
        $totalImpactScore += $transformativeScore * 0.2;
        
        $finalImpactScore = $totalImpactScore / 1.0;
        $impactLevel = 'Low';
        if ($finalImpactScore > 0.6)      $impactLevel = 'High';
        elseif ($finalImpactScore > 0.3)  $impactLevel = 'Middle';

        $dominantPathway = '';
        $highest = 0;
        foreach ($pathwayScores as $pw => $sc) {
            if ($sc > $highest) { $highest = $sc; $dominantPathway = $pw; }
        }

        $result = [
            'score'            => round($finalImpactScore, 3), 
            'level'            => $impactLevel, 
            'components'       => ['impact_indicators' => $impactScores, 'contribution_pathways' => $pathwayScores, 'transformative_language' => $transformativeScore], 
            'dominant_pathway' => $dominantPathway, 
            'evidence'         => $evidence
        ];
        
        $this->memoryCache[$cacheKey] = $result;
        return $result;
    }

    private function detectCausalRelationship(string $text, string $sdg): array
    {
        $cacheKey = md5($text . '_' . $sdg . '_causal_v4');
        if (isset($this->memoryCache[$cacheKey])) return $this->memoryCache[$cacheKey];

        $expandedPatterns = array_merge($this->causalPatterns, ['for','to','can','will','could','toward','reduce','increase','improve','prevent','ensure','provide','allow','enable','help','support','untuk','guna','agar','supaya','dapat','akan','bisa','mengurangi','meningkatkan','memperbaiki','mencegah','memastikan','menyediakan','memungkinkan','membantu','mendukung']);

        $relevantKeywords = array_slice($this->sdgKeywords[$sdg] ?? [], 0, 10);
        $score     = 0;
        $evidences = [];

        foreach ($expandedPatterns as $pattern) {
            foreach ($relevantKeywords as $keyword) {
                if (stripos($text, $pattern . ' ' . $keyword) !== false) {
                    $score += 0.3;
                    $ctx = $this->extractKeywordContext($text, $pattern . ' ' . $keyword, 150);
                    if (!empty($ctx)) $evidences[] = ['type' => 'direct_causality', 'pattern' => $pattern . ' ' . $keyword, 'context' => $ctx];
                }
                if (stripos($text, $keyword . ' ' . $pattern) !== false) {
                    $score += 0.3;
                }
            }
        }

        foreach ($this->transformativeVerbs as $verb) {
            foreach ($relevantKeywords as $keyword) {
                $vp = stripos($text, $verb);
                $kp = stripos($text, $keyword);
                if ($vp !== false && $kp !== false && abs($vp - $kp) < 50) {
                    $score += 0.25;
                    break;
                }
            }
        }

        $normalized = min(1, $score);
        if (strlen($text) < 100 && $normalized < 0.1 && $this->hasSDGConcept($text, $sdg)) $normalized = max($normalized, 0.1);

        $result = ['score' => $normalized, 'evidence' => array_slice($evidences, 0, 3)];
        $this->memoryCache[$cacheKey] = $result;
        return $result;
    }

    private function analyzeSubstantiveContribution(string $text, string $sdg): array
    {
        $cacheKey = md5($text . '_' . $sdg . '_substantive');
        if (isset($this->memoryCache[$cacheKey])) return $this->memoryCache[$cacheKey];

        $substantiveIndicators = [
            'solution_words'    => ['solution','strategy','approach','intervention','policy','program','solusi','strategi','pendekatan','intervensi','kebijakan','program'],
            'impact_words'      => ['impact','effect','outcome','result','evaluation','assessment','dampak','efek','hasil','evaluasi','penilaian'],
            'methodology_words' => ['survey','interview','analysis','study','research','method','survei','wawancara','analisis','studi','penelitian','metode'],
        ];

        $scores = [];
        foreach ($substantiveIndicators as $category => $indicators) {
            $categoryScore = 0;
            foreach ($indicators as $indicator) {
                if (stripos($text, $indicator) !== false) $categoryScore++;
            }
            $divisor = count($indicators) * 0.5;
            $scores[$category] = min(1, $divisor > 0 ? $categoryScore / $divisor : 0);
        }

        $result = ['score' => !empty($scores) ? array_sum($scores) / count($scores) : 0, 'components' => $scores];
        $this->memoryCache[$cacheKey] = $result;
        return $result;
    }

    private function determineContributorType(float $combinedScore, float $causalScore, float $impactScore): array
    {
        $contributionScore = ($combinedScore * 0.5) + ($causalScore * 0.3) + ($impactScore * 0.2);
        
        if ($contributionScore >= self::CONFIG['ACTIVE_CONTRIBUTOR_THRESHOLD'] && $causalScore >= 0.3 && $impactScore >= 0.3) {
            return ['type' => 'Active Contributor', 'description' => 'Research with substantive contribution to SDG', 'score' => round($contributionScore, 3)];
        } elseif ($contributionScore >= self::CONFIG['RELEVANT_CONTRIBUTOR_THRESHOLD']) {
            return ['type' => 'Relevant Contributor', 'description' => 'Research with clear relevance to SDGs', 'score' => round($contributionScore, 3)];
        } elseif ($contributionScore >= self::CONFIG['DISCUSSANT_THRESHOLD']) {
            return ['type' => 'Discutor', 'description' => 'Research discusses SDG-related themes', 'score' => round($contributionScore, 3)];
        } else {
            return ['type' => 'Not Relevant', 'description' => 'Research does not show sufficient relevance', 'score' => round($contributionScore, 3)];
        }
    }

    private function determineContributionStrength(array $summary): string
    {
        $score = 0;
        if ($summary['work_count'] >= 10) $score += 3;
        elseif ($summary['work_count'] >= 5) $score += 2;
        elseif ($summary['work_count'] >= 3) $score += 1;
        
        $hcr = $summary['high_confidence_works'] / max(1, $summary['work_count']);
        if ($hcr >= 0.5) $score += 3; elseif ($hcr >= 0.3) $score += 2; elseif ($hcr >= 0.1) $score += 1;
        
        $ar = $summary['contributor_types']['Active Contributor'] / max(1, $summary['work_count']);
        if ($ar >= 0.5) $score += 4; elseif ($ar >= 0.3) $score += 3; elseif ($ar >= 0.2) $score += 2; elseif ($ar >= 0.1) $score += 1;
        
        if (!empty($summary['dominant_pathways'])) {
            $pv = array_values($summary['dominant_pathways']); rsort($pv);
            $dr = $pv[0] / $summary['work_count'];
            if ($dr >= 0.6) $score += 2; elseif ($dr >= 0.3) $score += 1;
        }
        
        if ($score >= 10) return 'Very Strong';
        if ($score >= 7)  return 'Strong';
        if ($score >= 4)  return 'Moderate';
        return 'Low';
    }

    private function scoreSDGs(string $text): array
    {
        $cacheKey = md5($text . '_score');
        if (isset($this->memoryCache[$cacheKey])) return $this->memoryCache[$cacheKey];

        $text     = strtolower($text);
        $scores   = [];
        $wordFreq = array_count_values(str_word_count($text, 1));

        foreach ($this->sdgKeywords as $sdg => $keywords) {
            $count = 0;
            foreach ($keywords as $keyword) {
                if (strpos($keyword, ' ') !== false) {
                    $count += substr_count($text, strtolower($keyword));
                } elseif (isset($wordFreq[strtolower($keyword)])) {
                    $count += $wordFreq[strtolower($keyword)];
                }
            }
            if ($count > 0) $scores[$sdg] = $count;
        }

        $total = array_sum($scores);
        if ($total > 0) {
            foreach ($scores as $sdg => $v) $scores[$sdg] = round($v / $total, 3);
        }
        arsort($scores);

        $this->memoryCache[$cacheKey] = $scores;
        return $scores;
    }

    private function calculateSDGSimilarity(string $text): array
    {
        $cacheKey = md5($text . '_similarity');
        if (isset($this->memoryCache[$cacheKey])) return $this->memoryCache[$cacheKey];

        $text   = strtolower($text);
        $scores = [];
        static $sdgVectors = [];
        $textVector = $this->createTextVector($text);

        foreach ($this->sdgKeywords as $sdg => $keywords) {
            if (!isset($sdgVectors[$sdg])) {
                $sdgVectors[$sdg] = $this->createTextVector(implode(' ', $keywords));
            }
            $sim = $this->calculateCosineSimilarity($textVector, $sdgVectors[$sdg]);
            if ($sim > 0) $scores[$sdg] = $sim;
        }

        arsort($scores);
        $this->memoryCache[$cacheKey] = $scores;
        return $scores;
    }

    private function createTextVector(string $text): array
    {
        $cacheKey = md5($text . '_vector');
        if (isset($this->memoryCache[$cacheKey])) return $this->memoryCache[$cacheKey];

        $words  = preg_split('/\s+/', $text);
        $vector = [];
        foreach ($words as $word) {
            $word = trim($word);
            if (strlen($word) > 2) $vector[$word] = ($vector[$word] ?? 0) + 1;
        }
        
        $this->memoryCache[$cacheKey] = $vector;
        return $vector;
    }

    private function calculateCosineSimilarity(array $vector1, array $vector2): float
    {
        if (count($vector1) > count($vector2)) { 
            $t = $vector1; $vector1 = $vector2; $vector2 = $t; 
        }
        $dot = $mag1 = $mag2 = 0.0;
        foreach ($vector1 as $dim => $v1) { 
            $v2 = $vector2[$dim] ?? 0; 
            $dot += $v1 * $v2; 
            $mag1 += $v1 * $v1; 
        }
        foreach ($vector2 as $v2) $mag2 += $v2 * $v2;
        
        $mag1 = sqrt($mag1); $mag2 = sqrt($mag2);
        if ($mag1 == 0.0 || $mag2 == 0.0) return 0.0;
        
        return round($dot / ($mag1 * $mag2), 3);
    }

    private function hasSDGConcept(string $text, string $sdg): bool
    {
        $conceptMap = [
            'SDG1'=>['extreme poverty','social protection','economic inclusion','kemiskinan ekstrim','perlindungan sosial','inklusi ekonomi'],
            'SDG2'=>['food security','sustainable agriculture','nutrition improvement','ketahanan pangan','pertanian berkelanjutan','perbaikan gizi'],
            'SDG3'=>['maternal health','child mortality','communicable diseases','kesehatan ibu','kematian anak','penyakit menular'],
            'SDG4'=>['quality education','lifelong learning','educational infrastructure','pendidikan berkualitas','pembelajaran seumur hidup','infrastruktur pendidikan'],
            'SDG5'=>['gender equality','women empowerment','gender-based violence','kesetaraan gender','pemberdayaan perempuan','kekerasan berbasis gender'],
            'SDG6'=>['water management','water conservation','sanitation facilities','pengelolaan air','konservasi air','fasilitas sanitasi'],
            'SDG7'=>['renewable energy','energy efficiency','clean cooking','energi terbarukan','efisiensi energi','memasak bersih'],
            'SDG8'=>['economic growth','decent work','youth employment','pertumbuhan ekonomi','pekerjaan layak','lapangan kerja pemuda'],
            'SDG9'=>['industrial innovation','sustainable infrastructure','scientific research','inovasi industri','infrastruktur berkelanjutan','penelitian ilmiah'],
            'SDG10'=>['reduced inequalities','social inclusion','migration policies','pengurangan ketimpangan','inklusi sosial','kebijakan migrasi'],
            'SDG11'=>['sustainable cities','urban planning','public transport','kota berkelanjutan','tata kota','transportasi umum'],
            'SDG12'=>['responsible consumption','waste reduction','circular economy','konsumsi bertanggung jawab','pengurangan limbah','ekonomi sirkular'],
            'SDG13'=>['climate action','carbon reduction','climate resilience','aksi iklim','pengurangan karbon','ketahanan iklim'],
            'SDG14'=>['marine pollution','ocean acidification','sustainable fishing','polusi laut','asidifikasi laut','perikanan berkelanjutan'],
            'SDG15'=>['biodiversity','forest conservation','land degradation','keanekaragaman hayati','konservasi hutan','degradasi lahan'],
            'SDG16'=>['peacebuilding','access to justice','corruption reduction','pembangunan perdamaian','akses keadilan','pengurangan korupsi'],
            'SDG17'=>['global partnership','technology transfer','capacity building','kemitraan global','transfer teknologi','pengembangan kapasitas']
        ];
        
        if (!isset($conceptMap[$sdg])) return false;
        foreach ($conceptMap[$sdg] as $concept) { 
            if (stripos($text, $concept) !== false) return true; 
        }
        return false;
    }

    private function preprocessText(string $text): string
    {
        $cacheKey = md5($text . '_preprocessed');
        if (isset($this->memoryCache[$cacheKey])) return $this->memoryCache[$cacheKey];

        $text = strtolower(strip_tags($text));
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text);
        $text = trim(preg_replace('/\s+/', ' ', (string)$text));

        $this->memoryCache[$cacheKey] = $text;
        return $text;
    }

    private function extractKeywordContext(string $text, string $keyword, int $contextLength = 100): string
    {
        $position = stripos($text, $keyword);
        if ($position === false) return '';
        
        $start   = max(0, $position - intval($contextLength / 2));
        $length  = strlen($keyword) + $contextLength;
        $context = substr($text, $start, $length);
        
        if ($start > 0) $context = '...' . $context;
        if ($start + $length < strlen($text)) $context .= '...';
        
        $context = preg_replace('/(' . preg_quote($keyword, '/') . ')/i', '<strong>$1</strong>', $context);
        return $context;
    }

    // =================================================================
    // FUNGSI CACHE SECARA EVENT-DRIVEN (TANPA TIME-EXPIRY)
    // =================================================================

    private function saveToCache(string $filename, array $data): void
    {
        file_put_contents($filename, gzencode(json_encode($data), 9));
    }

    private function readFromCache(string $filename): array|bool
    {
        if (!file_exists($filename)) return false;
        
        // Dihapus: Pengecekan TTL berbasis waktu. Cache kini bersifat event-driven.
        
        $compressed = file_get_contents($filename);
        if ($compressed === false) return false;
        
        $json = gzdecode($compressed);
        if ($json === false) return false;
        
        $data = json_decode($json, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $data : false;
    }

    private function getCacheFilename(string $type, string $id): string|bool
    {
        $uniqueCode = substr(md5($id . '_v52'), 0, 8);
        $safeId     = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $id);

        return match ($type) {
            'orcid_init'  => $this->cacheDir . '/orcid_init_' . $uniqueCode . '_' . preg_replace('/[^0-9\-X]/', '', $id) . '.json.gz',
            'orcid_batch' => $this->cacheDir . '/orcid_batch_' . $uniqueCode . '_' . $safeId . '.json.gz',
            'orcid'       => $this->cacheDir . '/orcid_' . $uniqueCode . '_' . $safeId . '.json.gz',
            'article'     => $this->cacheDir . '/article_' . $safeId . '_' . $uniqueCode . '.json.gz',
            default       => false,
        };
    }
}

// =================================================================
// EKSEKUSI ENDPOINT (STANDALONE)
// =================================================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

$api = new SdgClassificationApi();
echo json_encode($api->run(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);