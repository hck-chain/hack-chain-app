const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev';
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
<body style="margin:0;padding:0;background-color:#f6f8fa;font-family:Google Sans,Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f8fa;padding:32px 0 48px;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#ffffff;border-radius:50%;width:48px;height:48px;text-align:center;vertical-align:middle;border:1px solid #e2e8f0;">
                    <span style="font-size:20px;font-weight:700;color:#1a1a2e;line-height:48px;display:block;">H</span>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:15px;font-weight:600;color:#1f2937;letter-spacing:-0.1px;">HackChain</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;padding:40px 40px 32px;">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;letter-spacing:-0.3px;line-height:1.3;">
                Verificá tu dirección de email
              </h1>

              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.5;">
                Para <strong style="color:#374151;">hackchain.app</strong>
              </p>

              <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
                Hola${name ? ` <strong>${name}</strong>` : ''},
              </p>

              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
                Recibimos una solicitud para verificar esta dirección de email como parte del registro en HackChain. Hacé clic en el botón de abajo para confirmar tu cuenta.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#1a73e8;border-radius:4px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;padding:11px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.2px;font-family:Google Sans,Roboto,Arial,sans-serif;">
                      Verificar email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Validity -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                      Este enlace expira en <strong style="color:#374151;">24 horas</strong>. Si no lo usas antes, vas a necesitar solicitar uno nuevo.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Spam notice -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#fffbeb;border-radius:6px;border:1px solid #fde68a;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                      Si no ves este correo en tu bandeja de entrada, revisá la carpeta de <strong>spam o correo no deseado</strong> y marcalo como "No es spam".
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #f0f0f0;padding-top:24px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;line-height:1.5;">
                      Si el botón no funciona, copiá este enlace en tu navegador:
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;">
                      <a href="${verifyUrl}" style="color:#1a73e8;text-decoration:none;">${verifyUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;line-height:1.5;">
                Este mensaje fue enviado a <strong style="color:#6b7280;">${to}</strong>
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Si no creaste una cuenta en HackChain, podés ignorar este mensaje.
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
