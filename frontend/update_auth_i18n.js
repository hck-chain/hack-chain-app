const fs = require('fs');

function updateFile(file, newStrings) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const updated = { ...data, ...newStrings };
  fs.writeFileSync(file, JSON.stringify(updated, null, 2));
}

const enNew = {
  "login": {
    "backHome": "Back to Home",
    "welcome": "Welcome Back to ",
    "description": "Access your dashboard and manage your blockchain-verified certificates, track your achievements, and connect with the community.",
    "secure": {
      "title": "Secure Access",
      "desc": "Your account is protected with industry-standard encryption"
    },
    "verified": {
      "title": "Blockchain Verified",
      "desc": "All your certificates are immutably stored on the blockchain"
    },
    "newTo": "New to Hack Chain?",
    "createAccount": "Create an Account",
    "signIn": "Sign In",
    "enterCredentials": "Enter your credentials to access your account"
  },
  "registerLanding": {
    "title1": "Join the Future of",
    "title2": "Professional Certification",
    "description": "Choose your role and start your journey with blockchain-verified certificates in any professional field or skill area.",
    "student": {
      "title": "Student",
      "desc": "Learn any skill and earn blockchain-verified certificates",
      "p1": "Earn NFT certificates",
      "p2": "Build verifiable skill portfolio",
      "p3": "Connect with recruiters",
      "btn": "Join as Student"
    },
     "educator": {
      "title": "Educator",
      "desc": "Issue verified certificates and build your teaching reputation",
      "p1": "Issue NFT certificates",
      "p2": "Track student progress",
      "p3": "Verified educator status",
      "btn": "Join as Educator"
    },
     "recruiter": {
      "title": "Recruiter",
      "desc": "Find and verify top talent across all industries with confidence",
      "p1": "Search verified talent",
      "p2": "Verify skill certificates",
      "p3": "Advanced filtering tools",
      "btn": "Join as Recruiter"
    },
    "alreadyHave": "Already have an account?",
    "signInInstead": "Sign In Instead"
  }
};

const esNew = {
  "login": {
    "backHome": "Volver al Inicio",
    "welcome": "Bienvenido de nuevo a ",
    "description": "Accede a tu panel de control y gestiona tus certificados verificados por blockchain, sigue tus logros y conecta con la comunidad.",
    "secure": {
      "title": "Acceso Seguro",
      "desc": "Tu cuenta está protegida con encriptación estándar de la industria"
    },
    "verified": {
      "title": "Verificado por Blockchain",
      "desc": "Todos tus certificados se almacenan de forma inmutable en la blockchain"
    },
    "newTo": "¿Nuevo en Hack Chain?",
    "createAccount": "Crear una Cuenta",
    "signIn": "Iniciar Sesión",
    "enterCredentials": "Ingresa tus credenciales para acceder a tu cuenta"
  },
  "registerLanding": {
    "title1": "Únete al Futuro de la",
    "title2": "Certificación Profesional",
    "description": "Elige tu rol y comienza tu viaje con certificados verificados por blockchain en cualquier campo profesional o área de habilidades.",
    "student": {
      "title": "Estudiante",
      "desc": "Aprende cualquier habilidad y obtén certificados verificados por blockchain",
      "p1": "Gana certificados NFT",
      "p2": "Construye un portafolio verificable",
      "p3": "Conecta con reclutadores",
      "btn": "Únete como Estudiante"
    },
     "educator": {
      "title": "Educador",
      "desc": "Emite certificados verificados y construye tu reputación docente",
      "p1": "Emite certificados NFT",
      "p2": "Sigue el progreso de los estudiantes",
      "p3": "Estado de educador verificado",
      "btn": "Únete como Educador"
    },
     "recruiter": {
      "title": "Reclutador",
      "desc": "Encuentra y verifica los mejores talentos en todas las industrias con confianza",
      "p1": "Búsqueda de talento verificado",
      "p2": "Verifica certificados de habilidades",
      "p3": "Herramientas de filtrado avanzadas",
      "btn": "Únete como Reclutador"
    },
    "alreadyHave": "¿Ya tienes una cuenta?",
    "signInInstead": "Iniciar Sesión en su lugar"
  }
};

updateFile('./src/locales/en/translation.json', enNew);
updateFile('./src/locales/es/translation.json', esNew);
console.log('Auth translations updated.');
