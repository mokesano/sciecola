import React, { useRef, useCallback } from 'react';

/**
 * Kartu dengan sorot cahaya yang mengikuti kursor.
 *
 * Posisi kursor ditulis langsung ke custom property pada node DOM lewat ref,
 * bukan lewat state React. Menyimpannya di state akan memicu render ulang pada
 * setiap gerakan mouse — puluhan kali per detik, untuk sesuatu yang tidak
 * mengubah struktur apa pun. Cara ini menyerahkan animasinya ke compositor.
 */
export const SpotlightCard = ({
  as: Tag = 'div',
  className = '',
  glow = 'rgba(129,140,248,0.22)',   // indigo-400
  radius = 300,
  children,
  ...rest
}) => {
  const ref = useRef(null);

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMove}
      className={`group relative overflow-hidden ${className}`}
      {...rest}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
        style={{
          background: `radial-gradient(${radius}px circle at var(--mx, 50%) var(--my, 50%), ${glow}, transparent 70%)`,
        }}
      />
      <span className="relative block">{children}</span>
    </Tag>
  );
};

/**
 * Lapisan latar per seksi: satu berkas SVG yang menggambarkan isi seksinya,
 * dipudarkan di tepi supaya tidak memotong tajam ke seksi berikutnya.
 */
export const SectionArt = ({ src, opacity = 0.5, position = 'center', fade = true }) => (
  <span
    aria-hidden
    className="pointer-events-none absolute inset-0"
    style={{
      backgroundImage: `url('${src}')`,
      backgroundSize: 'cover',
      backgroundPosition: position,
      backgroundRepeat: 'no-repeat',
      opacity,
      ...(fade ? {
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, #000 35%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, #000 35%, transparent 100%)',
      } : {}),
    }}
  />
);

export default SpotlightCard;
