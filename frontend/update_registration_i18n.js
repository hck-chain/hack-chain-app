const fs = require('fs');

function updateFile(file, newStrings) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const updated = { ...data, ...newStrings };
  fs.writeFileSync(file, JSON.stringify(updated, null, 2));
}

const enNew = {
  "registerUser": {
    "back": "Back to Register",
    "title1": "Join the Future of",
    "title2": " Professional Certification",
    "desc": "Create your student account and start earning blockchain-verified certificates that prove your expertise in any professional field.",
    "expTitle": "Student Experience",
    "expDesc": "Join thousands of students earning blockchain-verified certificates across all professional fields and skills.",
    "p1": "Complete professional courses in any field",
    "p2": "Earn NFT certificates that prove your skills",
    "p3": "Build a verifiable professional portfolio",
    "p4": "Connect directly with top recruiters",
    "already": "Already have an account?",
    "signIn": "Sign In Instead",
    "formTitle": "Create Student Account",
    "formDesc": "Enter your information to get started with Hack Chain"
  },
  "registerEducator": {
    "back": "Back to Register",
    "title1": "Empower the Next",
    "title2": "Generation of Professionals",
    "desc": "Join as an educator and issue blockchain-verified certificates that prove student achievements in any field - from technology and business to arts and sciences.",
    "expTitle": "Educator Experience",
    "expDesc": "Issue tamper-proof blockchain certificates and build trust with industry partners through verifiable credentials.",
    "p1": "Issue blockchain-secured certificates",
    "p2": "Track student progress and achievements",
    "p3": "Build institutional trust with recruiters",
    "p4": "White-label customization available",
    "b1Title": "Issue Certificates",
    "b1Desc": "Blockchain-verified credentials",
    "b2Title": "Manage Students",
    "b2Desc": "Centralized dashboard",
    "already": "Already have an educator account?",
    "signIn": "Sign In Instead",
    "formTitle": "Create Educator Account",
    "formDesc": "Register your institution to start issuing verified certificates"
  },
  "registerRecruiter": {
    "back": "Back to Register",
    "title1": "Find and Verify",
    "title2": "Top Professional Talent",
    "desc": "Join as a recruiter and access the world's largest platform for verified professionals across all industries with blockchain-authenticated skills.",
    "expTitle": "Recruiter Experience",
    "expDesc": "Connect with certified professionals across all industries and verify their skills with confidence.",
    "p1": "Access verified talent pool",
    "p2": "Verify blockchain certificates instantly",
    "p3": "Advanced search and filtering tools",
    "p4": "Direct contact with top candidates",
    "b1Title": "Smart Search",
    "b1Desc": "Find ideal candidates in seconds",
    "b2Title": "Verified Skills",
    "b2Desc": "Blockchain-authenticated",
    "already": "Already have a recruiter account?",
    "signIn": "Sign In Instead",
    "formTitle": "Create Recruiter Account",
    "formDesc": "Enter your information to start finding top talent"
  }
};

const esNew = {
  "registerUser": {
    "back": "Volver a Registro",
    "title1": "Únete al Futuro de la",
    "title2": " Certificación Profesional",
    "desc": "Crea tu cuenta de estudiante y comienza a ganar certificados verificados por blockchain que demuestran tu experiencia en cualquier campo.",
    "expTitle": "Experiencia de Estudiante",
    "expDesc": "Únete a miles de estudiantes que obtienen certificados en todos los campos profesionales.",
    "p1": "Completa cursos en cualquier campo",
    "p2": "Obtén certificados NFT de tus habilidades",
    "p3": "Construye un portafolio profesional verificable",
    "p4": "Conecta directamente con reclutadores top",
    "already": "¿Ya tienes una cuenta?",
    "signIn": "Iniciar Sesión",
    "formTitle": "Crear Cuenta de Estudiante",
    "formDesc": "Ingresa tu información para comenzar"
  },
  "registerEducator": {
    "back": "Volver a Registro",
    "title1": "Empodera a la Próxima",
    "title2": "Generación de Profesionales",
    "desc": "Únete como educador y emite certificados verificados para probar los logros de los estudiantes en cualquier campo.",
    "expTitle": "Experiencia de Educador",
    "expDesc": "Emite certificados inmutables y construye confianza a través de credenciales verificables.",
    "p1": "Emite certificados asegurados por blockchain",
    "p2": "Sigue el progreso de los estudiantes",
    "p3": "Construye confianza institucional",
    "p4": "Personalización white-label disponible",
    "b1Title": "Emitir Certificados",
    "b1Desc": "Credenciales por blockchain",
    "b2Title": "Gestionar Estudiantes",
    "b2Desc": "Panel centralizado",
    "already": "¿Ya tienes una cuenta de educador?",
    "signIn": "Iniciar Sesión",
    "formTitle": "Crear Cuenta de Educador",
    "formDesc": "Registra tu institución para emitir certificados"
  },
  "registerRecruiter": {
    "back": "Volver a Registro",
    "title1": "Encuentra y Verifica",
    "title2": "Top Talento Profesional",
    "desc": "Únete como reclutador y accede a la mayor plataforma de profesionales verificados.",
    "expTitle": "Experiencia de Reclutador",
    "expDesc": "Conecta con profesionales certificados y verifica sus habilidades con confianza.",
    "p1": "Accede a talento verificado",
    "p2": "Verifica certificados al instante",
    "p3": "Búsqueda y filtros avanzados",
    "p4": "Contacto directo con candidatos",
    "b1Title": "Búsqueda Inteligente",
    "b1Desc": "Candidatos en segundos",
    "b2Title": "Habilidades Verificadas",
    "b2Desc": "Autenticadas por blockchain",
    "already": "¿Ya tienes una cuenta de reclutador?",
    "signIn": "Iniciar Sesión",
    "formTitle": "Crear Cuenta de Reclutador",
    "formDesc": "Ingresa tu información para buscar talento"
  }
};

updateFile('./src/locales/en/translation.json', enNew);
updateFile('./src/locales/es/translation.json', esNew);
console.log('Registration translations updated.');
