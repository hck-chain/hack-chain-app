import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BlockchainDisclaimer = () => {
  const { i18n } = useTranslation();
  const isEs = i18n.language.startsWith('es');

  return (
    <LegalLayout title={isEs ? "Aviso sobre Blockchain" : "Blockchain Disclaimer"} lastUpdated={isEs ? "15 Abril 2026" : "April 15, 2026"}>
      {isEs ? (
        <>
      <div className="flex flex-col items-center justify-center p-8 bg-purple-900/10 border border-purple-500/20 rounded-2xl mb-12">
        <ShieldCheck className="w-16 h-16 text-purple-400 mb-4" />
        <p className="text-center text-xl font-title text-white">
          Arquitectura Descentralizada Web3
        </p>
      </div>

      <p className="text-lg leading-relaxed">
        Hackchain utiliza la revolucionaria tecnología <strong>Blockchain</strong> (cadena de bloques) y contratos inteligentes para el proceso principal de emitir certificaciones digitales verificables y tokenizadas.
      </p>
      
      <p>
        Antes de interactuar con contratos inteligentes o firmar cualquier transacción con su Wallet, el usuario debe leer detenidamente y <strong>aceptar sin restricciones</strong> que la arquitectura descentralizada opera bajo leyes físicas de software ajenas a nosotros:
      </p>

      <ul className="space-y-4 my-8 list-none pl-0">
        <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <strong className="text-white block mb-1">Registro Inmutable</strong>
            <span className="text-sm text-gray-300">Toda la información registrada dentro del hash del contrato es estrictamente inmutable a través del tiempo.</span>
          </div>
        </li>
        <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <strong className="text-white block mb-1">Censura y Borrado Imposible</strong>
            <span className="text-sm text-gray-300">La información acuñada no puede ser censurada, retractada o eliminada ni por usted ni por Hackchain.</span>
          </div>
        </li>
        <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <AlertTriangle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <strong className="text-white block mb-1">Naturaleza de Red Pública</strong>
            <span className="text-sm text-gray-300">Los registros de transacciones y direcciones de wallet pueden ser visibles y escrutados públicamente en exploradores de blockchain.</span>
          </div>
        </li>
        <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <AlertTriangle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1" />
          <div>
            <strong className="text-white block mb-1">Descentralización Real</strong>
            <span className="text-sm text-gray-300">La infraestructura core no está alojada bajo un sistema tradicional y la metadata Blockchain escapa al control y administración exclusiva de Hackchain.</span>
          </div>
        </li>
      </ul>

      <div className="border-l-4 border-purple-500 pl-6 mt-12 py-2">
        <h3 className="text-white font-title mb-2 mt-0">Declaración Final</h3>
        <p className="text-sm text-gray-400 m-0">
          Hackchain no garantiza, ni posee las herramientas para forzar, la modificación, actualización remota o eliminación de tokens de datos propagados en redes descentralizadas. El uso de wallets, custodia de frases semilla (Seed phrases) y la administración de activos digitales es responsabilidad total, legal y exclusiva del usuario final.
        </p>
      </div>
      </>
      ) : (
      <>
      <div className="flex flex-col items-center justify-center p-8 bg-purple-900/10 border border-purple-500/20 rounded-2xl mb-12">
        <ShieldCheck className="w-16 h-16 text-purple-400 mb-4" />
        <p className="text-center text-xl font-title text-white">
          Decentralized Web3 Architecture
        </p>
      </div>

      <p className="text-lg leading-relaxed">
        Hackchain uses revolutionary <strong>Blockchain</strong> technology and smart contracts for the core process of issuing verifiable and tokenized digital certifications.
      </p>
      
      <p>
        Before interacting with smart contracts or signing any transaction with your Wallet, the user must carefully read and <strong>unrestrictedly accept</strong> that the decentralized architecture operates under physical software laws beyond our control:
      </p>

      <ul className="space-y-4 my-8 list-none pl-0">
        <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <strong className="text-white block mb-1">Immutable Record</strong>
            <span className="text-sm text-gray-300">All information recorded within the contract hash is strictly immutable over time.</span>
          </div>
        </li>
        <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <strong className="text-white block mb-1">Censorship & Deletion Impossible</strong>
            <span className="text-sm text-gray-300">Minted information cannot be censored, retracted, or deleted by you or Hackchain.</span>
          </div>
        </li>
        <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <AlertTriangle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <strong className="text-white block mb-1">Public Network Nature</strong>
            <span className="text-sm text-gray-300">Transaction records and wallet addresses may be visible and publicly scrutinized on blockchain explorers.</span>
          </div>
        </li>
        <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <AlertTriangle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1" />
          <div>
            <strong className="text-white block mb-1">True Decentralization</strong>
            <span className="text-sm text-gray-300">The core infrastructure is not hosted on a traditional system, and Blockchain metadata is beyond Hackchain's exclusive administration and control.</span>
          </div>
        </li>
      </ul>

      <div className="border-l-4 border-purple-500 pl-6 mt-12 py-2">
        <h3 className="text-white font-title mb-2 mt-0">Final Declaration</h3>
        <p className="text-sm text-gray-400 m-0">
          Hackchain does not guarantee, nor possesses the tools to force, the modification, remote updating, or deletion of data tokens propagated in decentralized networks. The use of wallets, custody of seed phrases, and management of digital assets is the total, legal, and exclusive responsibility of the end user.
        </p>
      </div>
      </>
      )}
    </LegalLayout>
  );
};

export default BlockchainDisclaimer;
