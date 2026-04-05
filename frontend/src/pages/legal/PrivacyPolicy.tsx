import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const isEs = i18n.language.startsWith('es');

  return (
    <LegalLayout title={isEs ? "Política de Privacidad - Hackchain" : "Privacy Policy - Hackchain"} lastUpdated={isEs ? "15 Abril 2026" : "April 15, 2026"}>
      {isEs ? (
        <>
      <p>
        Hackchain es una plataforma tecnológica revolucionaria que utiliza blockchain para la emisión de certificados digitales y la validación de habilidades reales. Valoramos y protegemos tu privacidad.
      </p>

      <h2>1. Datos recopilados</h2>
      <p>Para proporcionar nuestros servicios, recolectamos la siguiente información:</p>
      <ul>
        <li>Nombre completo o alias.</li>
        <li>Correo electrónico.</li>
        <li>Información general de la cuenta y perfil profesional.</li>
        <li>Dirección de Wallet criptográfica pública (ej. MetaMask).</li>
        <li>Identificadores en la Blockchain (Hash de transacciones, NFT IDs de certificados).</li>
        <li>Datos de navegación y patrones de uso dentro de la plataforma.</li>
      </ul>

      <h2>2. Finalidades del tratamiento</h2>
      <p>Los datos recolectados se utilizan exclusivamente para:</p>
      <ul>
        <li>Gestión y registro seguro de usuarios.</li>
        <li>Emisión y acuñación de certificados NFT verificables.</li>
        <li>Validación transparente de credenciales ante reclutadores e instituciones.</li>
        <li>Mantenimiento de la seguridad inquebrantable de la plataforma.</li>
        <li>Análisis de comportamiento para la mejora continua del ecosistema.</li>
      </ul>

      <h2>3. Base legal</h2>
      <p>Nuestro procesamiento de datos se fundamenta en:</p>
      <ul>
        <li><strong>Consentimiento:</strong> Otorgado explícitamente por el usuario al registrarse.</li>
        <li><strong>Ejecución de contrato:</strong> Necesario para brindar los servicios solicitados.</li>
        <li><strong>Interés legítimo:</strong> Para proteger la plataforma y mejorar el servicio de forma segura.</li>
      </ul>

      <h2>4. Derechos ARCO del usuario</h2>
      <p>Como usuario, estás respaldado por los derechos fundamentales de protección de datos. Tienes derecho a solicitar:</p>
      <ul>
        <li><strong>Acceso:</strong> Conocer qué datos personales tenemos tuyos.</li>
        <li><strong>Rectificación:</strong> Solicitar la corrección de tus datos personales en nuestras bases locales.</li>
        <li><strong>Cancelación:</strong> Solicitar la eliminación de tus datos de nuestros servidores locales.</li>
        <li><strong>Oposición:</strong> Oponerte al uso de tus datos para fines analíticos o de marketing comercial.</li>
      </ul>

      <h2>5. Particularidades de la tecnología Blockchain</h2>
      <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl my-6">
        <p className="m-0 font-bold text-white mb-2">Advertencia Crítica de Arquitectura Descentralizada:</p>
        <p className="m-0">
          Debido a la naturaleza criptográfica y distribuida, el usuario reconoce explícitamente que:
        </p>
        <ul className="mt-2 text-sm text-gray-300">
          <li>Los datos registrados directamente en contratos inteligentes (Smart Contracts) pueden ser <strong>inmutables</strong>.</li>
          <li>Certa información criptográfica <strong>no puede eliminarse completamente</strong> una vez acuñada.</li>
          <li>Las transacciones en redes públicas Blockchain <strong>pueden y serán visibles públicamente</strong> en exploradores de bloques.</li>
        </ul>
      </div>

      <h2>6. Transferencias internacionales</h2>
      <p>
        De acuerdo con la naturaleza global de los servicios alojados en la nube y la tecnología descentralizada, los datos pueden ser enrutados o procesados fuera del país de origen del usuario bajo estrictos controles regulatorios.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Hackchain implementa medidas técnicas, físicas y organizativas de último nivel para salvaguardar la confidencialidad, integridad y disponibilidad del ecosistema y de tus datos en servidores locales e infraestructuras nube.
      </p>
      </>
      ) : (
      <>
      <p>
        Hackchain is a revolutionary technological platform that uses blockchain for the issuance of digital certificates and validation of real skills. We value and protect your privacy.
      </p>

      <h2>1. Data Collected</h2>
      <p>To provide our services, we collect the following information:</p>
      <ul>
        <li>Full name or alias.</li>
        <li>Email address.</li>
        <li>General account and professional profile information.</li>
        <li>Public cryptographic Wallet address (e.g. MetaMask).</li>
        <li>Blockchain identifiers (Transaction hash, NFT IDs of certificates).</li>
        <li>Browsing data and usage patterns within the platform.</li>
      </ul>

      <h2>2. Purposes of Processing</h2>
      <p>The collected data is used exclusively for:</p>
      <ul>
        <li>User registration and secure management.</li>
        <li>Issuance and minting of verifiable NFT certificates.</li>
        <li>Transparent validation of credentials for recruiters and institutions.</li>
        <li>Maintenance of unwavering platform security.</li>
        <li>Behavioral analysis for continuous ecosystem improvement.</li>
      </ul>

      <h2>3. Legal Basis</h2>
      <p>Our data processing is based on:</p>
      <ul>
        <li><strong>Consent:</strong> Explicitly granted by the user upon registration.</li>
        <li><strong>Execution of a contract:</strong> Necessary to provide requested services.</li>
        <li><strong>Legitimate interest:</strong> To protect the platform and safely improve the service.</li>
      </ul>

      <h2>4. User Rights</h2>
      <p>As a user, you are backed by fundamental data protection rights. You have the right to request:</p>
      <ul>
        <li><strong>Access:</strong> Know what personal data we have about you.</li>
        <li><strong>Rectification:</strong> Request the correction of your personal data in our local databases.</li>
        <li><strong>Cancellation:</strong> Request the deletion of your data from our local servers.</li>
        <li><strong>Opposition:</strong> Oppose the use of your data for analytical or commercial marketing purposes.</li>
      </ul>

      <h2>5. Blockchain Technology Particularities</h2>
      <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl my-6">
        <p className="m-0 font-bold text-white mb-2">Critical Decentralized Architecture Warning:</p>
        <p className="m-0">
          Due to the cryptographic and distributed nature, the user explicitly acknowledges that:
        </p>
        <ul className="mt-2 text-sm text-gray-300">
          <li>Data recorded directly into Smart Contracts can be <strong>immutable</strong>.</li>
          <li>Certain cryptographic information <strong>cannot be completely deleted</strong> once minted.</li>
          <li>Transactions on public Blockchain networks <strong>can and will be publicly visible</strong> on block explorers.</li>
        </ul>
      </div>

      <h2>6. International Transfers</h2>
      <p>
        According to the global nature of cloud-hosted services and decentralized technology, data may be routed or processed outside the user's home country under strict regulatory controls.
      </p>

      <h2>7. Security</h2>
      <p>
        Hackchain implements state-of-the-art technical, physical, and organizational measures to safeguard the confidentiality, integrity, and availability of the ecosystem and your data on local servers and cloud infrastructures.
      </p>
      </>
      )}
    </LegalLayout>
  );
};

export default PrivacyPolicy;
