// src/utils/sdgDataAdapter.js

// Kamus Lengkap Referensi Warna & Nama SDGs Standar PBB
export const SDG_DICTIONARY = {
  "SDG1": { id: "1", name: "No Poverty", color: "#E5243B" },
  "SDG2": { id: "2", name: "Zero Hunger", color: "#DDA63A" },
  "SDG3": { id: "3", name: "Good Health and Well-being", color: "#4C9F38" },
  "SDG4": { id: "4", name: "Quality Education", color: "#C5192D" },
  "SDG5": { id: "5", name: "Gender Equality", color: "#FF3A21" },
  "SDG6": { id: "6", name: "Clean Water and Sanitation", color: "#26BDE2" },
  "SDG7": { id: "7", name: "Affordable and Clean Energy", color: "#FCC30B" },
  "SDG8": { id: "8", name: "Decent Work and Economic Growth", color: "#A21942" },
  "SDG9": { id: "9", name: "Industry, Innovation and Infrastructure", color: "#FD6925" },
  "SDG10": { id: "10", name: "Reduced Inequalities", color: "#DD1367" },
  "SDG11": { id: "11", name: "Sustainable Cities and Communities", color: "#FD9D24" },
  "SDG12": { id: "12", name: "Responsible Consumption and Production", color: "#BF8B2E" },
  "SDG13": { id: "13", name: "Climate Action", color: "#3F7E44" },
  "SDG14": { id: "14", name: "Life Below Water", color: "#0A97D9" },
  "SDG15": { id: "15", name: "Life on Land", color: "#56C02B" },
  "SDG16": { id: "16", name: "Peace, Justice and Strong Institutions", color: "#00689D" },
  "SDG17": { id: "17", name: "Partnerships for the Goals", color: "#19486A" }
};

/**
 * Menerjemahkan array 'works' mentah dari API menjadi format Donut Chart (Recharts)
 * Mengambil Top 5 SDGs, sisanya digabung ke dalam "Lainnya"
 */
export const transformToChartData = (worksArray) => {
  if (!worksArray || worksArray.length === 0) return [];

  const sdgCounts = {};
  let totalSdgTags = 0;

  // 1. Ekstrak dan hitung kemunculan setiap SDG
  worksArray.forEach(work => {
    if (work.sdgs && Array.isArray(work.sdgs)) {
      work.sdgs.forEach(sdgCode => {
        sdgCounts[sdgCode] = (sdgCounts[sdgCode] || 0) + 1;
        totalSdgTags++;
      });
    }
  });

  if (totalSdgTags === 0) return [];

  // 2. Ubah object menjadi array dan urutkan dari yang terbesar (descending)
  const sortedSdgs = Object.entries(sdgCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, count }));

  // 3. Pisahkan Top 5 dan sisanya
  const top5 = sortedSdgs.slice(0, 5);
  const others = sortedSdgs.slice(5);

  const chartData = [];

  // 4. Format Top 5 sesuai struktur Recharts
  top5.forEach(item => {
    const sdgInfo = SDG_DICTIONARY[item.code] || { id: item.code, name: "Unknown SDG", color: "#CBD5E1" };
    const percentage = ((item.count / totalSdgTags) * 100).toFixed(1);
    
    chartData.push({
      id: sdgInfo.id,
      name: sdgInfo.name,
      value: item.count,
      percent: `${percentage}%`,
      color: sdgInfo.color
    });
  });

  // 5. Jika ada sisa (Lainnya), gabungkan menjadi satu irisan
  if (others.length > 0) {
    const othersTotalCount = others.reduce((sum, item) => sum + item.count, 0);
    const othersPercentage = ((othersTotalCount / totalSdgTags) * 100).toFixed(1);
    
    chartData.push({
      id: '', // Kosong agar tidak ada teks di dalam kotak warna
      name: 'Lainnya',
      value: othersTotalCount,
      percent: `${othersPercentage}%`,
      color: '#8B5CF6' // Warna ungu netral untuk "Lainnya"
    });
  }

  return chartData;
};

/**
 * Menghasilkan data ringkasan untuk StatCards
 */
export const generateSummaryStats = (worksArray, totalWorksFromInit) => {
  let classifiedArticles = 0;
  const uniqueSdgsFound = new Set();

  worksArray.forEach(work => {
    if (work.sdgs && work.sdgs.length > 0) {
      classifiedArticles++;
      work.sdgs.forEach(sdg => uniqueSdgsFound.add(sdg));
    }
  });

  return {
    totalArticles: totalWorksFromInit,
    classifiedArticles: classifiedArticles,
    uniqueSdgsRepresented: uniqueSdgsFound.size
  };
};

/**
 * Wrapper khusus untuk hasil pencarian DOI tunggal
 * Berdasarkan struktur JSON article_10...
 */
export const transformDoiData = (apiResult) => {
  if (!apiResult || apiResult.status !== 'success') return null;

  const sdgsList = apiResult.sdgs || [];
  const detailedAnalysis = apiResult.detailed_analysis || {};
  
  // Format data SDGs untuk ditampilkan di UI (misal: badge)
  const formattedSdgs = sdgsList.map(code => {
    const info = SDG_DICTIONARY[code] || { name: 'Unknown SDG', color: '#cbd5e1' };
    const details = detailedAnalysis[code] || {};
    
    return {
      code: code,
      name: info.name,
      color: info.color,
      score: details.score || 0,
      confidence: details.confidence_level || 'Unknown',
      pathway: details.impact_orientation?.dominant_pathway || '-'
    };
  });

  return {
    doi: apiResult.doi,
    title: apiResult.title,
    abstract: apiResult.abstract,
    authors: apiResult.authors || [], // Array of string
    journal: apiResult.journal,
    year: apiResult.year,
    publishedDate: apiResult.published_date,
    sdgs: formattedSdgs
  };
};