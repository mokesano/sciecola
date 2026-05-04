import React from 'react';

const ResearchExplorer = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
      
      {/* --- Baris Atas: Judul dan Kolom Pencarian --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
        <div className="lg:w-1/3">
          <h2 className="text-xl font-bold text-gray-900">Jelajahi Riset di Wizdam</h2>
          <p className="text-sm text-gray-500 mt-1">Temukan artikel, peneliti, jurnal, atau topik berdasarkan SDGs</p>
        </div>
        
        <div className="w-full lg:w-2/3 flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            {/* Perbaikan: Mengubah warna focus ring menjadi indigo/ungu */}
            <input 
              type="text" 
              className="block w-full pl-11 pr-3 py-3.5 border border-gray-200 rounded-l-xl focus:ring-indigo-600 focus:border-indigo-600 text-sm bg-gray-50 outline-none transition-colors" 
              placeholder="Cari judul artikel, penulis, jurnal, kata kunci..." 
            />
          </div>
          {/* Perbaikan: Mengubah background tombol menjadi warna ungu khas Wizdam */}
          <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 py-3.5 rounded-r-xl font-medium text-sm flex items-center gap-2 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            Cari
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 mb-6"></div>

      {/* --- Baris Bawah: Filter Dropdown & Link Pencarian Lanjutan --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {[
            "Semua SDGs",
            "Semua Tahun",
            "Semua Jurnal",
            "Semua Negara"
          ].map((item, index) => (
            <select key={index} className="bg-white border border-gray-200 text-gray-600 py-2.5 px-4 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600 outline-none cursor-pointer appearance-none pr-9 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_1rem_center]">
              <option>{item}</option>
            </select>
          ))}
        </div>
        
        {/* Perbaikan: Mengubah teks pencarian lanjutan menjadi warna ungu Wizdam */}
        <button className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-medium flex items-center gap-2 shrink-0 transition-colors mt-2 lg:mt-0">
          Pencarian lanjutan
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        </button>
      </div>

    </div>
  );
};

export default ResearchExplorer;