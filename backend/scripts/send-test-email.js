const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const {
  notifyAdminNewEducator,
} = require("../services/emailService");

(async () => {
  try {
    await notifyAdminNewEducator({
    to: "luis.soto@cua.uam.mx",
    recipientName: "Ana López",
    email:"ana.lopez@example.com",
    wallet: "0x1234567890abcdef",
    organization: "Mi Organización",
    });

    console.log("Correo enviado correctamente");
  } catch (err) {
    console.error(err);
  }
})();