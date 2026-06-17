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
    html: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <style type="text/css">
    @media only screen and (min-width: 620px) {
      .u-row { width: 600px !important; }
      .u-row .u-col { vertical-align: top; }
      .u-row .u-col-100 { width: 600px !important; }
    }
    @media only screen and (max-width: 620px) {
      .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
      .u-row { width: 100% !important; }
      .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
      .u-row .u-col > div { margin: 0 auto; }
    }
    body{margin:0;padding:0}table,td,tr{border-collapse:collapse;vertical-align:top}.ie-container table,.mso-container table{table-layout:fixed}*{line-height:inherit}a[x-apple-data-detectors=true]{color:inherit!important;text-decoration:none!important}
    table, td { color: #000000; }
  </style>
  <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Cabin:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->
</head>
<body class="clean-body u_body" style="margin:0;padding:0;-webkit-text-size-adjust:100%;background-color:#f9f9f9;color:#000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table role="presentation" id="u_body" style="border-collapse:collapse;table-layout:fixed;border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;vertical-align:top;min-width:320px;Margin:0 auto;background-color:#f9f9f9;width:100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align:top">
    <td style="word-break:break-word;border-collapse:collapse !important;vertical-align:top">

    <div class="u-row-container" style="padding:0px;background-color:transparent;">
      <div class="u-row" style="margin:0 auto;min-width:320px;max-width:600px;overflow-wrap:break-word;word-wrap:break-word;word-break:break-word;background-color:transparent;">
        <div style="border-collapse:collapse;display:table;width:100%;height:100%;background-color:transparent;">
          <div class="u-col u-col-100" style="max-width:320px;min-width:600px;display:table-cell;vertical-align:top;">
            <div style="height:100%;width:100% !important;">
            <div style="box-sizing:border-box;height:100%;padding:0px;border-top:0px solid transparent;border-left:0px solid transparent;border-right:0px solid transparent;border-bottom:0px solid transparent;">
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                <div style="font-size:14px;color:#afb0c7;line-height:170%;text-align:center;word-wrap:break-word;">
                  <p style="font-size:14px;line-height:170%;margin:0px;">View Email in Browser</p>
                </div>
              </td></tr></tbody>
            </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="u-row-container" style="padding:0px;background-color:transparent;">
      <div class="u-row" style="margin:0 auto;min-width:320px;max-width:600px;overflow-wrap:break-word;word-wrap:break-word;word-break:break-word;background-color:#ffffff;">
        <div style="border-collapse:collapse;display:table;width:100%;height:100%;background-color:transparent;">
          <div class="u-col u-col-100" style="max-width:320px;min-width:600px;display:table-cell;vertical-align:top;">
            <div style="height:100%;width:100% !important;">
            <div style="box-sizing:border-box;height:100%;padding:0px;border-top:0px solid transparent;border-left:0px solid transparent;border-right:0px solid transparent;border-bottom:0px solid transparent;">
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="padding-right:0px;padding-left:0px;" align="center">
                    <img align="center" border="0" src="https://www.hackchain.app/images/image-1.webp" alt="HackChain" title="HackChain" style="outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;clear:both;display:inline-block !important;border:none;height:auto;float:none;width:32%;max-width:179.2px;" width="179.2" height="88"/>
                  </td></tr>
                </table>
              </td></tr></tbody>
            </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="u-row-container" style="padding:0px;background-color:transparent;">
      <div class="u-row" style="margin:0 auto;min-width:320px;max-width:600px;overflow-wrap:break-word;word-wrap:break-word;word-break:break-word;background-color:#680099;">
        <div style="border-collapse:collapse;display:table;width:100%;height:100%;background-color:transparent;">
          <div class="u-col u-col-100" style="max-width:320px;min-width:600px;display:table-cell;vertical-align:top;">
            <div style="height:100%;width:100% !important;">
            <div style="box-sizing:border-box;height:100%;padding:0px;border-top:0px solid transparent;border-left:0px solid transparent;border-right:0px solid transparent;border-bottom:0px solid transparent;">
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="padding-right:0px;padding-left:0px;" align="center">
                    <img align="center" border="0" src="https://www.hackchain.app/images/image-2.png" alt="HackChain" title="HackChain" style="outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;clear:both;display:inline-block !important;border:none;height:auto;float:none;width:26%;max-width:150.8px;" width="150.8" height="42"/>
                  </td></tr>
                </table>
              </td></tr></tbody>
            </table>
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                <div style="font-size:14px;color:#e5eaf5;line-height:140%;text-align:center;word-wrap:break-word;">
                  <p style="font-size:14px;line-height:140%;margin:0px;"><strong>T H A N K S &nbsp; F O R &nbsp; S I G N I N G &nbsp; U P !</strong></p>
                </div>
              </td></tr></tbody>
            </table>
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 31px;font-family:'Cabin',sans-serif;" align="left">
                <div style="font-size:14px;color:#e5eaf5;line-height:140%;text-align:center;word-wrap:break-word;">
                  <p style="font-size:14px;line-height:140%;margin:0px;"><span style="font-size:28px;line-height:39.2px;"><strong>Verify Your E-mail Address</strong></span></p>
                </div>
              </td></tr></tbody>
            </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="u-row-container" style="padding:0px;background-color:transparent;">
      <div class="u-row" style="margin:0 auto;min-width:320px;max-width:600px;overflow-wrap:break-word;word-wrap:break-word;word-break:break-word;background-color:#ffffff;">
        <div style="border-collapse:collapse;display:table;width:100%;height:100%;background-color:transparent;">
          <div class="u-col u-col-100" style="max-width:320px;min-width:600px;display:table-cell;vertical-align:top;">
            <div style="height:100%;width:100% !important;">
            <div style="box-sizing:border-box;height:100%;padding:0px;border-top:0px solid transparent;border-left:0px solid transparent;border-right:0px solid transparent;border-bottom:0px solid transparent;">
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
                <div style="font-size:14px;line-height:160%;text-align:center;word-wrap:break-word;">
                  <p style="font-size:14px;line-height:160%;margin:0px;"><span style="font-size:22px;line-height:35.2px;">Hi${name ? `, ${name}` : ''},</span></p>
                  <p style="font-size:14px;line-height:160%;margin:0px;"><span style="font-size:22px;line-height:35.2px;">To complete your HackChain registration, we need to verify that this email address belongs to you. The confirmation link is valid for 24 hours.</span></p>
                </div>
              </td></tr></tbody>
            </table>
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                <!--[if mso]><style>.v-button {background: transparent !important;}</style><![endif]-->
                <div align="center">
                  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verifyUrl}" style="height:46px;v-text-anchor:middle;width:235px;" arcsize="8.5%" stroke="f" fillcolor="#00ebff"><w:anchorlock/><center style="color:#FFFFFF;"><![endif]-->
                  <a href="${verifyUrl}" target="_blank" class="v-button" style="box-sizing:border-box;display:inline-block;text-decoration:none;text-size-adjust:none;text-align:center;color:#FFFFFF;background:#00ebff;border-radius:4px;width:auto;max-width:100%;word-break:break-word;overflow-wrap:break-word;font-size:14px;line-height:inherit;"><span style="display:block;padding:14px 44px 13px;line-height:120%;"><span style="font-size:16px;line-height:19.2px;"><strong>VERIFY YOUR EMAIL</strong></span></span></a>
                  <!--[if mso]></center></v:roundrect><![endif]-->
                </div>
              </td></tr></tbody>
            </table>
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
                <div style="font-size:14px;line-height:160%;text-align:center;word-wrap:break-word;">
                  <p style="line-height:160%;font-size:14px;margin:0px;"><span style="font-size:18px;line-height:28.8px;">Thanks,</span></p>
                  <p style="line-height:160%;font-size:14px;margin:0px;"><span style="font-size:18px;line-height:28.8px;">HackChain Team</span></p>
                </div>
              </td></tr></tbody>
            </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="u-row-container" style="padding:0px;background-color:transparent;">
      <div class="u-row" style="margin:0 auto;min-width:320px;max-width:600px;overflow-wrap:break-word;word-wrap:break-word;word-break:break-word;background-color:#e5eaf5;">
        <div style="border-collapse:collapse;display:table;width:100%;height:100%;background-color:transparent;">
          <div class="u-col u-col-100" style="max-width:320px;min-width:600px;display:table-cell;vertical-align:top;">
            <div style="height:100%;width:100% !important;">
            <div style="box-sizing:border-box;height:100%;padding:0px;border-top:0px solid transparent;border-left:0px solid transparent;border-right:0px solid transparent;border-bottom:0px solid transparent;">
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
                <div style="font-size:14px;color:#000000;line-height:160%;text-align:center;word-wrap:break-word;">
                  <p style="font-size:14px;line-height:160%;margin:0px;"><span style="font-size:20px;line-height:32px;"><strong>Get in touch</strong></span></p>
                  <p style="line-height:160%;margin:0px;">This email was sent to ${to}</p>
                  <p style="line-height:160%;margin:0px;">If you don't find this email, check your junk mail or spam folder.</p>
                  <p style="line-height:160%;margin:0px;">If you haven't registered with HackChain, simply ignore this email.</p>
                </div>
              </td></tr></tbody>
            </table>
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 33px;font-family:'Cabin',sans-serif;" align="left">
                <div align="center" style="direction:ltr;" aria-label="social">
                  <div style="display:table;max-width:130px;">
                    <table role="presentation" aria-label="LinkedIn" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="width:32px !important;height:32px !important;display:inline-block;border-collapse:collapse;table-layout:fixed;border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;vertical-align:top;margin-right:17px">
                      <tbody><tr style="vertical-align:top"><td valign="middle" style="word-break:break-word;border-collapse:collapse !important;vertical-align:top">
                        <a href="https://www.linkedin.com/company/hack-chain/posts/?feedView=all" title="LinkedIn" target="_blank"><img src="https://www.hackchain.app/images/image-3.png" alt="LinkedIn" title="LinkedIn" width="32" style="outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;clear:both;display:block !important;border:none;height:auto;float:none;max-width:32px !important"></a>
                      </td></tr></tbody>
                    </table>
                    <table role="presentation" aria-label="Instagram" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="width:32px !important;height:32px !important;display:inline-block;border-collapse:collapse;table-layout:fixed;border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;vertical-align:top;margin-right:17px">
                      <tbody><tr style="vertical-align:top"><td valign="middle" style="word-break:break-word;border-collapse:collapse !important;vertical-align:top">
                        <a href="https://www.instagram.com/hack_chain" title="Instagram" target="_blank"><img src="https://www.hackchain.app/images/image-4.png" alt="Instagram" title="Instagram" width="32" style="outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;clear:both;display:block !important;border:none;height:auto;float:none;max-width:32px !important"></a>
                      </td></tr></tbody>
                    </table>
                    <table role="presentation" aria-label="Email" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="width:32px !important;height:32px !important;display:inline-block;border-collapse:collapse;table-layout:fixed;border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;vertical-align:top;margin-right:0px">
                      <tbody><tr style="vertical-align:top"><td valign="middle" style="word-break:break-word;border-collapse:collapse !important;vertical-align:top">
                        <a href="mailto:contacto@hackchain.app" title="Email" target="_blank"><img src="https://www.hackchain.app/images/image-5.png" alt="Email" title="Email" width="32" style="outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;clear:both;display:block !important;border:none;height:auto;float:none;max-width:32px !important"></a>
                      </td></tr></tbody>
                    </table>
                  </div>
                </div>
              </td></tr></tbody>
            </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="u-row-container" style="padding:0px;background-color:transparent;">
      <div class="u-row" style="margin:0 auto;min-width:320px;max-width:600px;overflow-wrap:break-word;word-wrap:break-word;word-break:break-word;background-color:#680099;">
        <div style="border-collapse:collapse;display:table;width:100%;height:100%;background-color:transparent;">
          <div class="u-col u-col-100" style="max-width:320px;min-width:600px;display:table-cell;vertical-align:top;">
            <div style="height:100%;width:100% !important;">
            <div style="box-sizing:border-box;height:100%;padding:0px;border-top:0px solid transparent;border-left:0px solid transparent;border-right:0px solid transparent;border-bottom:0px solid transparent;">
            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
              <tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                <div style="font-size:14px;color:#fafafa;line-height:180%;text-align:center;word-wrap:break-word;">
                  <p style="font-size:14px;line-height:180%;margin:0px;"><span style="font-size:16px;line-height:28.8px;">Copyrights &copy; HackChain All Rights Reserved</span></p>
                </div>
              </td></tr></tbody>
            </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>

    </td>
  </tr>
  </tbody>
  </table>
  <!--[if mso]></div><![endif]-->
  <!--[if IE]></div><![endif]-->
</body>
</html>`,
  });
}

// ---------------------------------------------------------------------------
// Educator approval notifications (DS Section 2.5)
// ---------------------------------------------------------------------------

// Lightweight HTML template shared by both approve/reject emails. Keeps the
// branded look without copying the 200-line verification template above.
function renderEducatorEmail({ title, headline, body, ctaUrl, ctaLabel, accentColor }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f9f9;font-family:'Cabin',Arial,sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background-color:${accentColor};padding:24px;text-align:center;color:#ffffff;">
          <h1 style="margin:0;font-size:22px;line-height:1.3;">${headline}</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;font-size:16px;line-height:1.6;">
          ${body}
          ${ctaUrl ? `<p style="text-align:center;margin:32px 0 8px;">
            <a href="${ctaUrl}" style="display:inline-block;background-color:${accentColor};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:700;">${ctaLabel}</a>
          </p>` : ""}
        </td></tr>
        <tr><td style="background-color:#f1f1f5;padding:16px;text-align:center;font-size:12px;color:#888;">
          &copy; HackChain
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function notifyEducatorApproved({ to, name }) {
  console.log(`[emailService] Enviando aprobacion de educador a: ${to}`);
  const greeting = name ? `Hola, ${name}.` : "Hola.";

  await resend.emails.send({
    from: FROM,
    to,
    subject: "¡Tu cuenta de educador en HackChain fue aprobada!",
    text: `${greeting}\n\nTu cuenta de educador en HackChain fue aprobada. Ya puedes emitir certificados desde tu dashboard.\n\nDashboard: ${FRONTEND_URL}/educator-dashboard\n\n— Equipo HackChain`,
    html: renderEducatorEmail({
      title: "Cuenta de educador aprobada",
      headline: "¡Cuenta aprobada!",
      accentColor: "#680099",
      body: `<p style="margin:0 0 12px;">${greeting}</p>
             <p style="margin:0 0 12px;">Tu cuenta de educador en HackChain fue <strong>aprobada</strong>. Ya puedes emitir certificados desde tu dashboard.</p>`,
      ctaUrl: `${FRONTEND_URL}/educator-dashboard`,
      ctaLabel: "Ir al dashboard",
    }),
  });
}

async function notifyEducatorRejected({ to, name, reason }) {
  console.log(`[emailService] Enviando rechazo de educador a: ${to}`);
  const greeting = name ? `Hola, ${name}.` : "Hola.";
  const safeReason = String(reason || "").trim() || "No se especificó motivo.";

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Tu solicitud de educador en HackChain fue rechazada",
    text: `${greeting}\n\nTu solicitud para ser educador en HackChain fue rechazada.\n\nMotivo: ${safeReason}\n\nSi creés que esto es un error, escribinos a contacto@hackchain.app.\n\n— Equipo HackChain`,
    html: renderEducatorEmail({
      title: "Solicitud de educador rechazada",
      headline: "Solicitud rechazada",
      accentColor: "#a13c3c",
      body: `<p style="margin:0 0 12px;">${greeting}</p>
             <p style="margin:0 0 12px;">Tu solicitud para ser educador en HackChain fue <strong>rechazada</strong>.</p>
             <p style="margin:0 0 12px;"><strong>Motivo:</strong> ${safeReason}</p>
             <p style="margin:0 0 12px;">Si creés que esto es un error, escribinos a <a href="mailto:contacto@hackchain.app" style="color:#680099;">contacto@hackchain.app</a>.</p>`,
      ctaUrl: null,
      ctaLabel: null,
    }),
  });
}

// ---------------------------------------------------------------------------
// Talent invitation notifications (DS Section 5)
// ---------------------------------------------------------------------------

function shortenWallet(wallet) {
  if (!wallet || typeof wallet !== "string") return wallet;
  return wallet.length > 10 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet;
}

async function sendInvite({ to, walletAddress, educatorName, message }) {
  console.log(`[emailService] Enviando invitación de talento a: ${to}`);
  const inviter = educatorName || "Un educador";
  const registerUrl = `${FRONTEND_URL}/register?wallet=${encodeURIComponent(walletAddress || "")}`;
  const safeMessage = typeof message === "string" && message.trim() ? message.trim() : null;
  const shortWallet = shortenWallet(walletAddress);

  const textParts = [
    `Hola.`,
    "",
    `${inviter} te invitó a HackChain para emitirte un certificado verificado.`,
    `Tu billetera (${shortWallet}) ya está identificada en la invitación.`,
  ];
  if (safeMessage) {
    textParts.push("", `Mensaje del educador:`, `"${safeMessage}"`);
  }
  textParts.push(
    "",
    `Registrate y conectá esa misma billetera acá: ${registerUrl}`,
    "",
    `— Equipo HackChain`,
  );

  const htmlBody = `
    <p style="margin:0 0 12px;">Hola.</p>
    <p style="margin:0 0 12px;"><strong>${inviter}</strong> te invitó a HackChain para emitirte un certificado verificado.</p>
    <p style="margin:0 0 12px;">Tu billetera <code style="background:#f1f1f5;padding:2px 6px;border-radius:4px;">${shortWallet || "—"}</code> ya está identificada en la invitación.</p>
    ${safeMessage ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #680099;background:#f9f4ff;color:#333;">${safeMessage}</blockquote>` : ""}
    <p style="margin:0 0 12px;">Registrate y conectá esa misma billetera para reclamar tu certificado.</p>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviter} te invitó a HackChain`,
    text: textParts.join("\n"),
    html: renderEducatorEmail({
      title: "Invitación a HackChain",
      headline: "Te invitaron a HackChain",
      accentColor: "#680099",
      body: htmlBody,
      ctaUrl: registerUrl,
      ctaLabel: "Registrate ahora",
    }),
  });
}

async function notifyEducatorClaimed({ to, educatorName, studentWallet, studentName }) {
  console.log(`[emailService] Notificando claim a educador: ${to}`);
  const greeting = educatorName ? `Hola, ${educatorName}.` : "Hola.";
  const who = studentName ? `${studentName} (${shortenWallet(studentWallet)})` : shortenWallet(studentWallet);
  const dashboardUrl = `${FRONTEND_URL}/educator-dashboard`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "El talento que invitaste se registró en HackChain",
    text: `${greeting}\n\nEl talento que invitaste a HackChain ya se registró (${who}).\nYa puedes reintentar la emisión del certificado desde tu dashboard.\n\nDashboard: ${dashboardUrl}\n\n— Equipo HackChain`,
    html: renderEducatorEmail({
      title: "Tu invitación fue reclamada",
      headline: "Tu invitación fue reclamada",
      accentColor: "#680099",
      body: `<p style="margin:0 0 12px;">${greeting}</p>
             <p style="margin:0 0 12px;">El talento que invitaste a HackChain (<strong>${who}</strong>) ya se registró.</p>
             <p style="margin:0 0 12px;">Ya puedes reintentar la emisión del certificado desde tu dashboard.</p>`,
      ctaUrl: dashboardUrl,
      ctaLabel: "Ir al dashboard",
    }),
  });
}

async function notifyAdminNewEducator({ to, name, email, wallet, organization }) {
  if (!to || (Array.isArray(to) && to.length === 0)) return;

  const adminUrl = `${FRONTEND_URL}/admin`;
  const displayName = [name, organization].filter(Boolean).join(' / ') || wallet;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Nueva solicitud de educador: ${displayName}`,
    text: `Nueva solicitud de educador pendiente de aprobación.\n\nNombre: ${name || '—'}\nOrganización: ${organization || '—'}\nEmail: ${email || '—'}\nWallet: ${wallet}\n\nRevisa en el panel de admin: ${adminUrl}`,
    html: renderEducatorEmail({
      title: 'Nueva solicitud de educador',
      headline: 'Nueva solicitud de educador',
      accentColor: '#680099',
      body: `<p style="margin:0 0 12px;">Hay una nueva solicitud de educador pendiente de revisión.</p>
             <table style="width:100%;border-collapse:collapse;font-size:14px;">
               <tr><td style="padding:6px 0;color:#888;">Nombre</td><td style="padding:6px 0;font-weight:700;">${name || '—'}</td></tr>
               <tr><td style="padding:6px 0;color:#888;">Organización</td><td style="padding:6px 0;">${organization || '—'}</td></tr>
               <tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;">${email || '—'}</td></tr>
               <tr><td style="padding:6px 0;color:#888;">Wallet</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${wallet}</td></tr>
             </table>`,
      ctaUrl: adminUrl,
      ctaLabel: 'Ir al panel de admin',
    }),
  });
}

async function notifyAdminEducatorReapply({ to, name, email, wallet, organization }) {
  if (!to || (Array.isArray(to) && to.length === 0)) return;

  const adminUrl = `${FRONTEND_URL}/admin`;
  const displayName = [name, organization].filter(Boolean).join(' / ') || wallet;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Re-solicitud de educador: ${displayName}`,
    text: `Un educador rechazado volvió a solicitar aprobación.\n\nNombre: ${name || '—'}\nOrganización: ${organization || '—'}\nEmail: ${email || '—'}\nWallet: ${wallet}\n\nRevisa en el panel de admin: ${adminUrl}`,
    html: renderEducatorEmail({
      title: 'Re-solicitud de educador',
      headline: 'Re-solicitud de educador',
      accentColor: '#8b5cf6',
      body: `<p style="margin:0 0 12px;">Un educador que fue rechazado volvió a solicitar aprobación.</p>
             <table style="width:100%;border-collapse:collapse;font-size:14px;">
               <tr><td style="padding:6px 0;color:#888;">Nombre</td><td style="padding:6px 0;font-weight:700;">${name || '—'}</td></tr>
               <tr><td style="padding:6px 0;color:#888;">Organización</td><td style="padding:6px 0;">${organization || '—'}</td></tr>
               <tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;">${email || '—'}</td></tr>
               <tr><td style="padding:6px 0;color:#888;">Wallet</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${wallet}</td></tr>
             </table>`,
      ctaUrl: adminUrl,
      ctaLabel: 'Ir al panel de admin',
    }),
  });
}

async function notifyEducatorClassRequest({ to, educatorName, studentName, requestedDate, startTime, durationMinutes, className }) {
  console.log(`[emailService] Notificando solicitud de clase a educador: ${to}`);
  const greeting = educatorName ? `Hola, ${educatorName}.` : "Hola.";
  const dashboardUrl = `${FRONTEND_URL}/educator/dashboard`;

  const classLine = className
    ? `<tr><td style="padding:6px 0;color:#888;">Clase</td><td style="padding:6px 0;font-weight:700;">${className}</td></tr>`
    : "";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Nueva solicitud de clase de ${studentName}`,
    text: `${greeting}\n\n${studentName} solicitó una clase privada contigo.\n\nFecha: ${requestedDate}\nHora: ${startTime}\nDuración: ${durationMinutes} min${className ? `\nClase: ${className}` : ""}\n\nRevisa y confirma desde tu dashboard: ${dashboardUrl}\n\n— Equipo HackChain`,
    html: renderEducatorEmail({
      title: "Nueva solicitud de clase",
      headline: "Nueva solicitud de clase privada",
      accentColor: "#680099",
      body: `<p style="margin:0 0 12px;">${greeting}</p>
             <p style="margin:0 0 16px;"><strong>${studentName}</strong> solicitó una clase privada contigo.</p>
             <table style="width:100%;border-collapse:collapse;font-size:14px;">
               ${classLine}
               <tr><td style="padding:6px 0;color:#888;">Fecha</td><td style="padding:6px 0;font-weight:700;">${requestedDate}</td></tr>
               <tr><td style="padding:6px 0;color:#888;">Hora</td><td style="padding:6px 0;">${startTime}</td></tr>
               <tr><td style="padding:6px 0;color:#888;">Duración</td><td style="padding:6px 0;">${durationMinutes} min</td></tr>
             </table>
             <p style="margin:16px 0 0;">Ingresa a tu dashboard para confirmar o rechazar la solicitud.</p>`,
      ctaUrl: dashboardUrl,
      ctaLabel: "Ver solicitud",
    }),
  });
}

module.exports = {
  sendVerificationEmail,
  notifyEducatorApproved,
  notifyEducatorRejected,
  notifyAdminNewEducator,
  notifyAdminEducatorReapply,
  sendInvite,
  notifyEducatorClaimed,
  notifyEducatorClassRequest,
};
