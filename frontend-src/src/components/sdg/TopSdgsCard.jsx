import React, { useRef, useState, useEffect } from 'react';

const TopSdgsCard = () => {
  const sdgsData = [
    {
      id: 3,
      name: 'Good Health & Well-being',
      count: '4,623',
      trend: '18.7%',
      color: 'bg-[#4C9F38]',
      iconSrc: '/assets/sdgs/icons/sdg-3.svg' 
    },
    {
      id: 4,
      name: 'Quality Education',
      count: '3,812',
      trend: '15.4%',
      color: 'bg-[#C5192D]',
      iconSrc: '/assets/sdgs/icons/sdg-4.svg'
    },
    {
      id: 13,
      name: 'Climate Action',
      count: '3,263',
      trend: '13.2%',
      color: 'bg-[#3F7E44]',
      iconSrc: '/assets/sdgs/icons/sdg-13.svg'
    },
    {
      id: 9,
      name: 'Industry, Innovation & Infrastructure',
      count: '2,865',
      trend: '11.6%',
      color: 'bg-[#FD6925]',
      iconSrc: '/assets/sdgs/icons/sdg-9.svg'
    },
    {
      id: 11,
      name: 'Sustainable Cities & Communities',
      count: '2,421',
      trend: '9.8%',
      color: 'bg-[#FD9D24]',
      iconSrc: '/assets/sdgs/icons/sdg-11.svg'
    },
    {
      id: 17,
      name: 'Partnerships for the Goals',
      count: '1,957',
      trend: '7.2%',
      color: 'bg-[#19486A]',
      iconSrc: '/assets/sdgs/icons/sdg-17.svg'
    }
  ];

  const scrollContainerRef = useRef(null);
  
  // State untuk mengontrol visibilitas tombol
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(true);

  // Fungsi untuk mengecek posisi scroll
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      // Jika scrollLeft lebih besar dari 0, berarti bukan di ujung paling kiri
      setShowPrev(scrollLeft > 0);
      
      // Jika posisi scroll + lebar layar container sudah mendekati total lebar konten
      // (dikurangi 1px untuk toleransi pembulatan desimal browser)
      setShowNext(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  // Cek posisi awal saat komponen pertama kali di-render (jika item sedikit, tombol next otomatis hilang)
  useEffect(() => {
    handleScroll();
    // Tambahkan event listener untuk resize layar agar tombol tetap akurat
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  // Fungsi navigasi yang disatukan
  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      // 230px (lebar card) + 16px (gap) = 246px
      const scrollAmount = direction === 'left' ? -246 : 246;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mt-8 mb-8 relative">
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">
          SDGs Paling Banyak Dikontribsikan
        </h2>
        <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors pb-0.5">
          Lihat semua
        </a>
      </div>

      {/* Container Cards */}
      <div className="relative">
        
        {/* Tombol Panah Kiri (Muncul jika showPrev true) */}
        {showPrev && (
          <button 
            onClick={() => scroll('left')}
            type="button"
            aria-label="Scroll previous"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-white hover:bg-gray-50 rounded-full w-9 h-9 shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-gray-100 z-10 transition-all flex items-center justify-center cursor-pointer"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Div scrollable dengan event onScroll */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {sdgsData.map((sdg) => (
            <div 
              key={sdg.id} 
              className="flex bg-white rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden shrink-0 snap-start w-[230px]"
            >
              <div className={`w-[60px] shrink-0 flex flex-col items-center justify-center py-4 ${sdg.color} text-white`}>
                <span className="text-2xl font-bold leading-none">{sdg.id}</span>
                <div className="w-5 h-[1.5px] bg-white/50 my-2.5 rounded-full"></div>
                <img 
                  src={sdg.iconSrc} 
                  alt={`Ikon SDG ${sdg.id}`} 
                  className="w-14 h-14 object-contain"
                />
              </div>

              <div className="p-3.5 flex flex-col justify-between flex-1">
                <h3 className="text-[13px] font-bold text-gray-800 leading-snug line-clamp-2">
                  {sdg.name}
                </h3>
                
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-gray-900 leading-none">{sdg.count}</span>
                    <span className="text-[11px] font-medium text-gray-500">artikel</span>
                  </div>
                  
                  <div className="text-[11px] font-bold text-[#2E9F40] mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {sdg.trend}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tombol Panah Kanan (Muncul jika showNext true) */}
        {showNext && (
          <button 
            onClick={() => scroll('right')}
            type="button"
            aria-label="Scroll next"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-white hover:bg-gray-50 rounded-full w-9 h-9 shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-gray-100 z-10 transition-all flex items-center justify-center cursor-pointer"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

    </div>
  );
};

export default TopSdgsCard;