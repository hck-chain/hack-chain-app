import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F]">
      <div className="text-center px-4">
        {/* Título con Exo */}
        <h1 className="text-6xl md:text-8xl font-exo text-white mb-6">404</h1>

        {/* Texto de cuerpo con Lato */}
        <p className="text-lg md:text-2xl font-lato text-gray-300 mb-6">
          Oops! La página que buscas no existe.
        </p>

        {/* Botón principal alineado al brand */}
        <a
          href="/"
          className="inline-block px-6 py-3 bg-[#1E40AF] text-white font-lato rounded-lg shadow-lg hover:bg-[#2563EB] transition-colors duration-300"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
