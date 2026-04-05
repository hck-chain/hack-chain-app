import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import { useTranslation } from 'react-i18next';

const CookiePolicy = () => {
  const { i18n } = useTranslation();
  const isEs = i18n.language.startsWith('es');

  return (
    <LegalLayout title={isEs ? "Política de Cookies - Hackchain" : "Cookie Policy - Hackchain"} lastUpdated={isEs ? "15 Abril 2026" : "April 15, 2026"}>
      {isEs ? (
        <>
      <p>
        Hackchain utiliza cookies y tecnologías similares para mejorar la experiencia del usuario, analizar el uso de la plataforma y garantizar su correcto funcionamiento.
      </p>

      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son archivos que se almacenan en el dispositivo del usuario al acceder a la plataforma. Estos archivos nos permiten recordar tus preferencias y ofrecerte una experiencia de navegación más fluida y personalizada.
      </p>

      <h2>2. Tipos de cookies utilizadas</h2>
      <ul>
        <li>
          <strong>Cookies necesarias:</strong> Permiten el funcionamiento básico del sitio. Sin estas cookies, la plataforma no puede funcionar adecuadamente.
        </li>
        <li>
          <strong>Cookies analíticas:</strong> Permiten analizar el comportamiento del usuario dentro de la plataforma para mejorar nuestros servicios y la usabilidad del sistema.
        </li>
        <li>
          <strong>Cookies de personalización:</strong> Permiten recordar las preferencias del usuario, como el idioma o la configuración de UI.
        </li>
        <li>
          <strong>Cookies de terceros:</strong> Pueden ser utilizadas por servicios externos integrados en la plataforma (por ejemplo, proveedores de analíticas o wallets interactivos).
        </li>
      </ul>

      <h2>3. Consentimiento</h2>
      <p>
        El uso de cookies no esenciales requiere el consentimiento previo, libre e informado del usuario. Hackchain no instalará cookies analíticas ni de terceros sin tu explícito y expreso consentimiento, el cual podrás gestionar desde nuestro banner de configuración.
      </p>

      <h2>4. Gestión de cookies</h2>
      <p>
        El usuario puede configurar, bloquear o eliminar las cookies en cualquier momento desde las preferencias de su navegador o a través del panel de configuración de privacidad integrado en nuestra plataforma.
      </p>

      <h2>5. Base legal</h2>
      <p>Esta política se rige estrictamente por los marcos regulatorios aplicables:</p>
      <ul>
        <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México).</li>
        <li>Reglamento General de Protección de Datos (GDPR) de la Unión Europea.</li>
        <li>Directiva sobre Privacidad y las Comunicaciones Electrónicas (ePrivacy Directive).</li>
      </ul>
      </>
      ) : (
      <>
      <p>
        Hackchain uses cookies and similar technologies to improve user experience, analyze platform usage, and ensure its proper functioning.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are files stored on the user's device when accessing the platform. These files allow us to remember your preferences and provide you with a smoother, more personalized browsing experience.
      </p>

      <h2>2. Types of cookies used</h2>
      <ul>
        <li>
          <strong>Necessary cookies:</strong> Allow basic functioning of the site. Without these cookies, the platform cannot function properly.
        </li>
        <li>
          <strong>Analytical cookies:</strong> Allow us to analyze user behavior within the platform to improve our services and system usability.
        </li>
        <li>
          <strong>Personalization cookies:</strong> Allow remembering user preferences, such as language or UI settings.
        </li>
        <li>
          <strong>Third-party cookies:</strong> May be used by external services integrated into the platform (e.g., analytics providers or interactive wallets).
        </li>
      </ul>

      <h2>3. Consent</h2>
      <p>
        The use of non-essential cookies requires the prior, free, and informed consent of the user. Hackchain will not install analytical or third-party cookies without your explicit and express consent, which you can manage from our configuration banner.
      </p>

      <h2>4. Cookie management</h2>
      <p>
        The user can configure, block, or delete cookies at any time from their browser preferences or through the privacy settings panel integrated into our platform.
      </p>

      <h2>5. Legal basis</h2>
      <p>This policy is strictly governed by applicable regulatory frameworks:</p>
      <ul>
        <li>Federal Law on the Protection of Personal Data Held by Private Parties (Mexico).</li>
        <li>General Data Protection Regulation (GDPR) of the European Union.</li>
        <li>Directive on Privacy and Electronic Communications (ePrivacy Directive).</li>
      </ul>
      </>
      )}
    </LegalLayout>
  );
};

export default CookiePolicy;
