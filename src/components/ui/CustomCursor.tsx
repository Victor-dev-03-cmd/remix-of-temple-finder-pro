import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // மவுஸ் நகர்வை மென்மையாக்க Spring அனிமேஷன்
  const springConfig = { damping: 25, stiffness: 150 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX - 16); // 16 என்பது வட்டத்தின் பாதி அளவு
      cursorY.set(e.clientY - 16);
    };

    window.addEventListener("mousemove", mouseMove);
    return () => window.removeEventListener("mousemove", mouseMove);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] blur-[15px] opacity-60"
      style={{
        x: cursorX,
        y: cursorY,
        backgroundColor: 'hsl(var(--primary))', // உங்கள் Settings-ல் உள்ள Accent Color
        mixBlendMode: 'screen', // பின்னணியோடு அழகாக கலக்க
      }}
    />
  );
};

export default CustomCursor;