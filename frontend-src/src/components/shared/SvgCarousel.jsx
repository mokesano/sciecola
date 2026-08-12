import React, { useEffect, useState, useCallback } from 'react';

/**
 * Korsel gambar SVG untuk sisi kanan hero.
 *
 * Tiap slide dipasang sebagai CSS mask, bukan sebagai <img>. Berkas SVG-nya
 * dibuat dengan tint indigo untuk halaman gelap; sebagai mask, warnanya
 * ditentukan di sini, jadi artwork yang sama bisa tampil di atas bidang
 * oranye tanpa perlu menyimpan salinan berwarna lain.
 *
 * Slide berganti sendiri, tetapi berhenti saat pointer berada di atasnya dan
 * saat pengguna meminta gerak minimal — pergantian otomatis yang tidak bisa
 * dihentikan menyulitkan siapa pun yang membaca keterangannya.
 */
const SvgCarousel = ({
  slides = [],
  color = '#FFFFFF',
  interval = 5000,
  className = '',
  labelledBy,
}) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = slides.length;
  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const id = setInterval(() => setIndex(i => (i + 1) % count), interval);
    return () => clearInterval(id);
  }, [count, paused, interval]);

  if (!count) return null;

  return (
    <div
      className={`relative ${className}`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      aria-labelledby={labelledBy}
      aria-roledescription="carousel"
    >
      <div className="relative h-full w-full">
        {slides.map((slide, i) => (
          <span
            key={slide.src}
            aria-hidden={i !== index}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{
              opacity: i === index ? 1 : 0,
              backgroundColor: color,
              WebkitMaskImage: `url('${slide.src}')`,
              maskImage: `url('${slide.src}')`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
            }}
          />
        ))}
      </div>

      {/* Keterangan slide aktif — artwork tanpa keterangan tidak memberi tahu
          apa pun tentang aplikasinya. */}
      {slides[index]?.caption && (
        <p className="mt-6 text-center text-[15px] font-medium text-white/85">
          {slides[index].caption}
        </p>
      )}

      {count > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2.5">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => go(i)}
              aria-label={slide.caption ?? `Slide ${i + 1}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SvgCarousel;