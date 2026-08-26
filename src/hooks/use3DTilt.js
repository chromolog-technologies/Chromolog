import { useEffect, useRef } from 'react';

export default function use3DTilt(maxTilt = 15) {
  const elementRef = useRef(null);

  useEffect(() => {
    const card = elementRef.current;
    if (!card) return;

    card.style.transformStyle = 'preserve-3d';
    card.style.transition = 'transform 0.12s ease, box-shadow 0.12s ease';

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      const rotY = ((x / w) - 0.5) * maxTilt;
      const rotX = (0.5 - (y / h)) * maxTilt;

      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03, 1.03, 1.03)`;
    };

    const handleMouseLeave = () => {
      card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt]);

  return elementRef;
}
