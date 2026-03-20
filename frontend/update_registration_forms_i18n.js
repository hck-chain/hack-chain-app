const fs = require('fs');

function updateFile(file, newStrings) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const updated = { ...data, ...newStrings };
  fs.writeFileSync(file, JSON.stringify(updated, null, 2));
}

const enNew = {
  "registrationForm": {
    "success": "Account created successfully!",
    "registerAnother": "Register Another User",
    "nameLabel": "Name",
    "namePlaceholder": "Enter your name",
    "lastNameLabel": "Last Name",
    "lastNamePlaceholder": "Enter your last name",
    "emailLabel": "Email",
    "emailPlaceholder": "Enter your email address",
    "creating": "Creating Account...",
    "create": "Create Account"
  },
  "educatorForm": {
    "success": "Institution registered successfully!",
    "registerAnother": "Register Another Institution",
    "nameLabel": "Institution Name",
    "namePlaceholder": "Enter institution name",
    "websiteLabel": "Website",
    "websitePlaceholder": "https://www.example.edu",
    "emailLabel": "Official Email",
    "emailPlaceholder": "admin@institution.edu",
    "creating": "Registering Institution...",
    "create": "Register Institution"
  },
  "recruiterForm": {
    "success": "Company registered successfully!",
    "registerAnother": "Register Another Company",
    "nameLabel": "Company Name",
    "namePlaceholder": "Enter company name",
    "industryLabel": "Industry",
    "industryPlaceholder": "e.g. Technology, Finance, Healthcare",
    "emailLabel": "Work Email",
    "emailPlaceholder": "name@company.com",
    "creating": "Registering Company...",
    "create": "Register Company"
  }
};

const esNew = {
    "registrationForm": {
    "success": "¡Cuenta creada exitosamente!",
    "registerAnother": "Registrar Otro Usuario",
    "nameLabel": "Nombre",
    "namePlaceholder": "Ingresa tu nombre",
    "lastNameLabel": "Apellido",
    "lastNamePlaceholder": "Ingresa tu apellido",
    "emailLabel": "Correo Electrónico",
    "emailPlaceholder": "Ingresa tu correo electrónico",
    "creating": "Creando Cuenta...",
    "create": "Crear Cuenta"
  },
  "educatorForm": {
    "success": "¡Institución registrada exitosamente!",
    "registerAnother": "Registrar Otra Institución",
    "nameLabel": "Nombre de la Institución",
    "namePlaceholder": "Ingresa el nombre de la institución",
    "websiteLabel": "Sitio Web",
    "websitePlaceholder": "https://www.ejemplo.edu",
    "emailLabel": "Correo Oficial",
    "emailPlaceholder": "admin@institucion.edu",
    "creating": "Registrando Institución...",
    "create": "Registrar Institución"
  },
  "recruiterForm": {
    "success": "¡Empresa registrada exitosamente!",
    "registerAnother": "Registrar Otra Empresa",
    "nameLabel": "Nombre de la Empresa",
    "namePlaceholder": "Ingresa el nombre de la empresa",
    "industryLabel": "Industria",
    "industryPlaceholder": "ej. Tecnología, Finanzas, Salud",
    "emailLabel": "Correo del Trabajo",
    "emailPlaceholder": "nombre@empresa.com",
    "creating": "Registrando Empresa...",
    "create": "Registrar Empresa"
  }
};

updateFile('./src/locales/en/translation.json', enNew);
updateFile('./src/locales/es/translation.json', esNew);
console.log('Registration forms translations updated.');
