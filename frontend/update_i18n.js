const fs = require('fs');

function updateFile(file, newStrings) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const updated = { ...data, ...newStrings };
  fs.writeFileSync(file, JSON.stringify(updated, null, 2));
}

const enNew = {
  "features": {
    "title1": "Why Choose ",
    "title2": "Hack Chain?",
    "subTitle": "The future of certification is here. Built on blockchain, verified by experts, and recognized globally.",
    "items": {
      "nft": {
        "title": "NFT Certificates",
        "description": "Blockchain-verified credentials that can't be forged or faked. Own your achievements forever."
      },
      "recruiter": {
        "title": "Recruiter Verification",
        "description": "Instant credential verification for employers. No more fake certificates or lengthy background checks."
      },
      "dao": {
        "title": "DAO Governance",
        "description": "Community-driven platform decisions. Vote on new certifications, standards, and platform improvements."
      },
      "security": {
        "title": "Security First",
        "description": "Built with blockchain security for all professionals. Maximum protection for your credentials."
      },
      "instant": {
        "title": "Instant Verification",
        "description": "Real-time credential verification powered by smart contracts. No waiting, no paperwork."
      },
      "global": {
        "title": "Global Recognition",
        "description": "Certificates recognized worldwide by all companies."
      }
    }
  },
  "cta": {
    "title1": "Start building your ",
    "title2": "identity",
    "title3": " today",
    "description": "Join thousands of professionals adopting blockchain-verified credentials to build trusted, verifiable, and global digital identities.",
    "stats": {
      "free": { "title": "Free", "subtitle": "Registration" },
      "247": { "title": "24/7", "subtitle": "Verification" },
      "instant": { "title": "Instant", "subtitle": "NFT Issuance" },
      "global": { "title": "Global", "subtitle": "Recognition" }
    }
  },
  "footer": {
    "copyright": "© 2025 HackChain. Non-Fungible Talent."
  }
};

const esNew = {
  "features": {
    "title1": "¿Por qué elegir ",
    "title2": "HackChain?",
    "subTitle": "El futuro de la certificación ya está aquí. Construido en blockchain, verificado por expertos y reconocido a nivel mundial.",
    "items": {
      "nft": {
        "title": "Certificados NFT",
        "description": "Credenciales verificadas por blockchain que no pueden ser falsificadas ni manipuladas. Sé dueño de tus logros para siempre."
      },
      "recruiter": {
        "title": "Verificación de Reclutadores",
        "description": "Verificación instantánea de credenciales para empleadores. No más certificados falsos ni largas verificaciones de antecedentes."
      },
      "dao": {
        "title": "Gobernanza DAO",
        "description": "Decisiones de la plataforma impulsadas por la comunidad. Vota sobre nuevas certificaciones, estándares y mejoras de la plataforma."
      },
      "security": {
        "title": "Seguridad Primero",
        "description": "Construido con la seguridad de blockchain para todos los profesionales. Máxima protección para tus credenciales."
      },
      "instant": {
        "title": "Verificación Instantánea",
        "description": "Verificación de credenciales en tiempo real impulsada por contratos inteligentes. Sin esperas, sin papeleo."
      },
      "global": {
        "title": "Reconocimiento Global",
        "description": "Certificados reconocidos a nivel mundial por todas las empresas."
      }
    }
  },
  "cta": {
    "title1": "Comienza a construir tu ",
    "title2": "identidad",
    "title3": " hoy",
    "description": "Únete a miles de profesionales que adoptan credenciales verificadas por blockchain para construir identidades digitales globales, confiables y verificables.",
    "stats": {
      "free": { "title": "Gratis", "subtitle": "Registro" },
      "247": { "title": "24/7", "subtitle": "Verificación" },
      "instant": { "title": "Instantáneo", "subtitle": "Emisión de NFT" },
      "global": { "title": "Global", "subtitle": "Reconocimiento" }
    }
  },
  "footer": {
    "copyright": "© 2025 HackChain. Talento No Fungible."
  }
};

updateFile('./src/locales/en/translation.json', enNew);
updateFile('./src/locales/es/translation.json', esNew);
console.log('Translations updated.');
