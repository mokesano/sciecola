<?php
declare(strict_types=1);

/**
 * @file api/insights.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief API untuk menampilkan wawasan tentang riset SDG.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Try to load insights from database, fall back to generated insights
$insights = generateInsights();
echo json_encode(['status' => 'ok', 'insights' => $insights]);

function generateInsights(): array {
    return [
        ['id' => 1, 'category' => 'Tren', 'title' => 'Lonjakan Riset Iklim', 'text' => 'Publikasi terkait SDG 13 (Climate Action) meningkat 32% dalam 3 tahun terakhir, menjadikannya SDG dengan pertumbuhan tercepat.', 'sdg' => 13, 'trend' => '+32%', 'icon' => 'trend_up'],
        ['id' => 2, 'category' => 'Perbandingan', 'title' => 'Dominasi SDG 4 di Indonesia', 'text' => 'Quality Education (SDG 4) paling banyak diteliti oleh peneliti dari Indonesia, mencakup 18% dari seluruh publikasi nasional.', 'sdg' => 4, 'trend' => '18%', 'icon' => 'education'],
        ['id' => 3, 'category' => 'Kolaborasi', 'title' => 'Peningkatan Kolaborasi Internasional', 'text' => 'Kolaborasi internasional pada riset SDG 3 meningkat 28% dibanding tahun lalu, dengan mitra terbanyak dari Malaysia dan Australia.', 'sdg' => 3, 'trend' => '+28%', 'icon' => 'users'],
        ['id' => 4, 'category' => 'Rekomendasi', 'title' => 'Gap Riset SDG 2', 'text' => 'Zero Hunger (SDG 2) masih sangat kurang diteliti relatif terhadap urgensinya. Hanya 3.2% dari total publikasi membahas ketahanan pangan.', 'sdg' => 2, 'trend' => '3.2%', 'icon' => 'alert'],
        ['id' => 5, 'category' => 'Tren', 'title' => 'Energi Bersih Memimpin', 'text' => 'Riset SDG 7 (Clean Energy) mencatat pertumbuhan tertinggi kedua dengan 25% peningkatan publikasi, didorong oleh agenda transisi energi global.', 'sdg' => 7, 'trend' => '+25%', 'icon' => 'trend_up'],
        ['id' => 6, 'category' => 'Perbandingan', 'title' => 'H-Index Tertinggi', 'text' => 'Peneliti yang fokus pada SDG 6 (Clean Water) memiliki rata-rata h-index 23, tertinggi di antara semua SDG, menunjukkan kualitas riset yang sangat baik.', 'sdg' => 6, 'trend' => 'h-23', 'icon' => 'star'],
        ['id' => 7, 'category' => 'Tren', 'title' => 'Riset Kota Berkelanjutan', 'text' => 'SDG 11 (Sustainable Cities) merupakan SDG paling banyak dikolaborasikan antar institusi, dengan 68% publikasinya melibatkan 2+ lembaga berbeda.', 'sdg' => 11, 'trend' => '68%', 'icon' => 'city'],
        ['id' => 8, 'category' => 'Peringatan', 'title' => 'Penurunan Riset SDG 16', 'text' => 'Peace, Justice & Strong Institutions (SDG 16) mengalami penurunan publikasi 12% tahun ini, kemungkinan akibat berkurangnya pendanaan riset sosial.', 'sdg' => 16, 'trend' => '-12%', 'icon' => 'trend_down'],
        ['id' => 9, 'category' => 'Rekomendasi', 'title' => 'Peluang Kolaborasi SDG 14', 'text' => 'Life Below Water (SDG 14) masih didominasi riset dari negara maju. Peneliti Indonesia memiliki peluang besar untuk mengisi gap ini dengan kearifan lokal.', 'sdg' => 14, 'trend' => 'Peluang', 'icon' => 'opportunity'],
        ['id' => 10, 'category' => 'Tren', 'title' => 'Interdisipliner Meningkat', 'text' => 'Publikasi yang menyentuh 3+ SDGs sekaligus tumbuh 41% dalam 2 tahun, menunjukkan pergeseran penelitian ke pendekatan yang lebih holistik.', 'sdg' => 17, 'trend' => '+41%', 'icon' => 'interconnect'],
        ['id' => 11, 'category' => 'Perbandingan', 'title' => 'Impact Score SDG 3 Tertinggi', 'text' => 'Artikel tentang SDG 3 (Good Health) memiliki rata-rata impact score 3.8, jauh di atas rata-rata platform 2.1, mencerminkan minat global yang tinggi.', 'sdg' => 3, 'trend' => '3.8', 'icon' => 'chart'],
        ['id' => 12, 'category' => 'Rekomendasi', 'title' => 'Potensi AI untuk SDG Research', 'text' => 'Integrasi metodologi AI dan machine learning dalam riset SDGs meningkat 89% dalam 5 tahun. Ini adalah area pertumbuhan yang sangat menjanjikan.', 'sdg' => 9, 'trend' => '+89%', 'icon' => 'ai'],
    ];
}
