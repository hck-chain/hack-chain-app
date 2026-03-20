const fs = require('fs');

function updateFile(file, newStrings) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const updated = { ...data, ...newStrings };
  fs.writeFileSync(file, JSON.stringify(updated, null, 2));
}

const enNew = {
  "loginForm": {
    "connectMetaMask": "Connect with MetaMask",
    "noAccount": "Don't have an account?",
    "createOne": "Create one now"
  }
};

const esNew = {
  "loginForm": {
    "connectMetaMask": "Conectar con MetaMask",
    "noAccount": "¿No tienes una cuenta?",
    "createOne": "Crea una ahora"
  }
};

updateFile('./src/locales/en/translation.json', enNew);
updateFile('./src/locales/es/translation.json', esNew);
console.log('Login form translations updated.');
