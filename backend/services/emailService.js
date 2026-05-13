const { Resend } = require('resend');

if (!process.env.RESEND_FROM) {
  throw new Error("RESEND_FROM environment variable is required");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.hackchain.app';

async function sendVerificationEmail({ to, name, token }) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  console.log(`[emailService] Enviando verificacion a: ${to}`);

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verificá tu cuenta en HackChain',
    text: `Hola${name ? `, ${name}` : ''},\n\nVerificá tu cuenta en HackChain haciendo clic en el siguiente enlace:\n\n${verifyUrl}\n\nEste enlace es válido por 24 horas.\n\nSi este correo fue a spam, movelo a tu bandeja de entrada para recibir futuros mensajes correctamente.\n\nSi no creaste una cuenta en HackChain, ignorá este mensaje.`,
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
</head>
<body style="margin:0;padding:0;background-color:#111118;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111118;padding:40px 16px 56px;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;">

          <!-- Logo -->
          <tr>
            <td style="padding:0 0 28px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border:1px solid #3d3a4d;border-radius:7px;padding:7px 14px;">
                    <span style="font-size:12px;font-weight:700;color:#f0effe;letter-spacing:1.8px;">HACKCHAIN</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#1a1923;border-radius:12px;border:1px solid #2e2c3a;border-top:2px solid #8b6ee0;padding:40px 36px 32px;">

              <p style="margin:0 0 10px;font-size:11px;font-weight:600;color:#8b6ee0;letter-spacing:2px;text-transform:uppercase;">
                Verificación de cuenta
              </p>

              <h1 style="margin:0 0 22px;font-size:21px;font-weight:600;color:#f0effe;letter-spacing:-0.4px;line-height:1.35;">
                Confirmá tu dirección de email
              </h1>

              <p style="margin:0 0 30px;font-size:15px;color:#a09db8;line-height:1.7;">
                Hola${name ? ` <span style="color:#f0effe;font-weight:500;">${name}</span>` : ''},<br><br>
                Para completar tu registro en HackChain necesitamos confirmar que este email te pertenece. El enlace expira en <span style="color:#d1ceee;">24 horas</span>.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background-color:#f0effe;border-radius:8px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;padding:13px 30px;color:#111118;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.1px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                      Verificar email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider + fallback link -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #2e2c3a;padding-top:24px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#6b6880;line-height:1.6;">
                      Si el botón no funciona, copiá este enlace en tu navegador:
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;">
                      <a href="${verifyUrl}" style="color:#8b6ee0;text-decoration:none;">${verifyUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 0 0;">
              <p style="margin:0 0 4px;font-size:12px;color:#6b6880;line-height:1.6;">
                Enviado a <span style="color:#a09db8;">${to}</span>
              </p>
              <p style="margin:0 0 4px;font-size:12px;color:#6b6880;line-height:1.6;">
                Si no encontrás este correo, revisá la carpeta de spam.
              </p>
              <p style="margin:0;font-size:12px;color:#6b6880;line-height:1.6;">
                Si no creaste una cuenta en HackChain, ignorá este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
  });
}

module.exports = { sendVerificationEmail };
