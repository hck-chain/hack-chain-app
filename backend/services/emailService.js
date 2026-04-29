const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function sendVerificationEmail({ to, name, token }) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verificá tu cuenta en HackChain',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;padding:0;background-color:#07070f;font-family:'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#07070f;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background-color:#0d0d1a;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb);padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                        HackChain
                      </h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">
                        Plataforma de Certificación Blockchain
                      </p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 32px;">
                      <h2 style="margin:0 0 16px;color:#e2e8f0;font-size:20px;font-weight:600;">
                        Hola${name ? `, ${name}` : ''},
                      </h2>
                      <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                        Gracias por registrarte como educador en HackChain. Para activar tu cuenta y empezar a emitir certificados, necesitás verificar tu dirección de email.
                      </p>
                      <p style="margin:0 0 32px;color:#94a3b8;font-size:15px;line-height:1.6;">
                        Este enlace es válido por <strong style="color:#c4b5fd;">24 horas</strong>.
                      </p>
                      <!-- CTA -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td style="border-radius:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);">
                            <a href="${verifyUrl}"
                               style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                              Verificar mi cuenta
                            </a>
                          </td>
                        </tr>
                      </table>
                      <!-- Fallback link -->
                      <p style="margin:32px 0 0;color:#64748b;font-size:12px;text-align:center;line-height:1.6;">
                        Si el botón no funciona, copiá este enlace en tu navegador:<br/>
                        <a href="${verifyUrl}" style="color:#818cf8;word-break:break-all;">${verifyUrl}</a>
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:24px 32px;border-top:1px solid rgba(99,102,241,0.15);text-align:center;">
                      <p style="margin:0;color:#475569;font-size:12px;">
                        Si no creaste una cuenta en HackChain, ignorá este email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

module.exports = { sendVerificationEmail };
