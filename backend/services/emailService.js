const { Resend } = require('resend');
const { buildGoogleCalendarUrl, buildICSBuffer } = require('./calendarService');

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
function renderEducatorEmail({ title, headline, subheadline, icon, body, ctaUrl, ctaLabel, accentColor, recipientEmail }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5fb;padding:40px 16px;font-family:'Cabin',Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">

          <!-- ACCENT BAR (6px) -->
          <tr>
            <td style="background-color:${accentColor};height:6px;line-height:6px;font-size:0;">&nbsp;</td>
          </tr>

          <!-- LOGO -->
          <tr>
            <td align="center" style="padding:34px;background:#ffffff;">
              <img src="https://www.hackchain.app/images/image-1.webp" alt="HackChain" width="170" style="display:block;border:none;" />
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td align="center" style="padding:50px 45px 44px;background:#FAF9FC;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 26px;">
                <tr>
                  <td align="center" valign="middle" width="104" height="104" style="width:104px;height:104px;border-radius:50%;background-color:#F0E1FF;">
                    <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td align="center" valign="middle" width="64" height="64" style="width:64px;height:64px;border-radius:50%;background-color:${accentColor};font-size:28px;font-weight:bold;color:#ffffff;line-height:64px;">${icon}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;font-size:30px;line-height:37px;color:#222222;font-weight:600;letter-spacing:-0.3px;">${headline}</h1>
              ${subheadline ? `<p style="margin:16px 0 0;font-size:16px;line-height:27px;color:#4B4B55;">${subheadline}</p>` : ""}
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 48px;background:#FAF9FC;">
              <div style="height:1px;background:#E9E5F0;"></div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:44px 48px 50px;font-size:16px;line-height:29px;color:#4B4B55;">
              ${body}
              ${ctaUrl ? `
              <p style="text-align:center;margin:36px 0 0;">
                <a href="${ctaUrl}" style="display:inline-block;background-color:${accentColor};padding:16px 46px;border-radius:999px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;text-decoration:none;box-shadow:0 10px 22px rgba(104,0,153,0.28);">${ctaLabel}</a>
              </p>` : ""}
            </td>
          </tr>

          <!-- FALLBACK -->
          ${ctaUrl ? `
          <tr>
            <td style="padding:36px 48px;background:#F7EEFC;border-top:1px solid #EDDFF5;">
              <p style="margin:0;text-align:center;font-size:15px;font-weight:700;color:#333333;">¿El botón no funciona?</p>
              <p style="margin:10px 0 0;text-align:center;font-size:13px;line-height:22px;color:#777777;">Copia y pega este enlace en tu navegador:</p>
              <p style="margin:14px 0 0;text-align:center;word-break:break-all;">
                <a href="${ctaUrl}" style="color:${accentColor};font-size:13px;text-decoration:none;">${ctaUrl}</a>
              </p>
              <div style="height:1px;background:#E4D0F0;margin:26px auto 0;width:80px;"></div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">
                <tr>
                  <td align="center" style="background:#ffffff;border:1px solid #ededed;border-radius:10px;padding:16px 20px;">
                    ${recipientEmail ? `<p style="margin:0;text-align:center;font-size:12px;color:#888888;">Enviado a <strong style="color:#333333;">${recipientEmail}</strong></p>` : ""}
                    <p style="margin:${recipientEmail ? "10px" : "0"} 0 0;text-align:center;font-size:11.5px;line-height:17px;color:#aaaaaa;">Si no encuentras este correo, revisa tu carpeta de spam o correo no deseado.</p>
                    <p style="margin:4px 0 0;text-align:center;font-size:11.5px;line-height:17px;color:#aaaaaa;">Si no solicitaste esta acción, simplemente puedes ignorar este mensaje.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ""}

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:38px 20px;background:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 10px;">
                    <a href="https://www.linkedin.com/company/hack-chain/posts/?feedView=all">
                      <img src="https://www.hackchain.app/images/image-3.png" width="34" style="display:block;border:none;" />
                    </a>
                  </td>
                  <td style="padding:0 10px;">
                    <a href="https://www.instagram.com/hack_chain">
                      <img src="https://www.hackchain.app/images/image-4.png" width="34" style="display:block;border:none;" />
                    </a>
                  </td>
                  <td style="padding:0 10px;">
                    <a href="mailto:contacto@hackchain.app">
                      <img src="https://www.hackchain.app/images/image-5.png" width="34" style="display:block;border:none;" />
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 8px;font-size:16px;font-weight:bold;color:#333;">HackChain</p>
              <p style="margin:0;font-size:13px;color:#777;">Building trusted academic credentials on Blockchain.</p>
              <p style="margin:22px 0 0;font-size:12px;color:#B0B0B0;">Copyrights &copy; HackChain All Rights Reserved</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
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
      subheadline: "Ya puedes comenzar a emitir certificados digitales desde tu Dashboard.",
      icon: "✓",
      accentColor: "#680099",
      recipientEmail: to,
      body: `<p style="margin:0 0 22px;font-size:19px;font-weight:600;letter-spacing:0.2px;color:#222222;">${greeting}</p>
             <p style="margin:0 0 20px;">Tenemos excelentes noticias: tu solicitud para convertirte en educador de HackChain fue <strong style="color:#222222;">aprobada</strong>.</p>
             <p style="margin:0;">A partir de ahora puedes acceder a tu Dashboard y comenzar a emitir certificados verificables en blockchain para tus estudiantes.</p>`,
      ctaUrl: `${FRONTEND_URL}/educator/dashboard`,
      ctaLabel: "Ir al dashboard",
    }),
  });
}

async function notifyEducatorRejected({ to, name, reason }) {
  console.log(`[emailService] Enviando rechazo de educador a: ${to}`);

  const greeting = name ? `Hola, ${name}.` : "Hola.";
  const safeReason = String(reason || "").trim() || "No se especificó un motivo.";

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Tu solicitud de educador en HackChain fue revisada",
    text: `${greeting} Tu solicitud para convertirte en educador en HackChain fue revisada y en esta ocasión no pudo ser aprobada. 
    Motivo: ${safeReason}
    Si considerás que se trata de un error o necesitás más información, podés comunicarte con nosotros en contacto@hackchain.app. — Equipo HackChain`,


   html: renderEducatorEmail({
      title: "Solicitud de educador rechazada",
      headline: "Solicitud no aprobada",
      subheadline: "Por el momento no pudimos aprobar tu solicitud como educador.",
      icon: "✕",
      accentColor: "#C84B4B",
      recipientEmail: to,

      body: `
        <p style="margin:0 0 22px;font-size:19px;font-weight:600;color:#222222;">
          ${greeting}
        </p>
        <p style="margin:0 0 18px;">
          Gracias por tu interés en formar parte de HackChain como educador.
          Después de revisar tu solicitud, en esta ocasión no fue posible aprobarla.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="margin:28px 0;background:#FFF5F5;border:1px solid #F3CACA;border-radius:10px;">
          <tr>
            <td style="padding:18px 22px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#B42318;text-transform:uppercase;letter-spacing:1px;">
                Motivo
              </p>

              <p style="margin:0;font-size:15px;line-height:25px;color:#555555;">
                ${safeReason}
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0;">
          Si considerás que se trata de un error o necesitás información adicional,
          podés escribirnos a
          <a href="mailto:contacto@hackchain.app"
             style="color:#680099;font-weight:600;text-decoration:none;">
            contacto@hackchain.app
          </a>.
        </p>
      `,
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
    headline: "Has sido invitado a HackChain",
    subheadline: "Un educador quiere emitir un certificado verificable a tu nombre.",
    icon: "🎓",
    accentColor: "#680099",
    recipientEmail: to,
    body: htmlBody,
    ctaUrl: registerUrl,
    ctaLabel: "Crear mi cuenta",
}),
  });
}


async function notifyEducatorClaimed({ to, educatorName, studentWallet, studentName}) {
  console.log(`[emailService] Notificando claim a educador: ${to}`);

  const greeting = educatorName ? `Hola, ${educatorName}.` : "Hola.";

  const who = studentName
    ? `${studentName} (${shortenWallet(studentWallet)})`
    : shortenWallet(studentWallet);

  const dashboardUrl = `${FRONTEND_URL}/educator-dashboard`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "El talento que invitaste se registró en HackChain",
    text:`${greeting} El talento que invitaste ya completó su registro en HackChain. Talento:${who}
    Ahora ya puedes volver a intentar la emisión del certificado desde tu Dashboard.
    Dashboard: ${dashboardUrl}
    — Equipo HackChain`,

    html: renderEducatorEmail({
      title: "Invitación aceptada",
      headline: "¡Tu invitación fue aceptada!",
      subheadline:"El talento ya completó su registro y está listo para recibir su certificado.",
      icon: "🎉",
      accentColor: "#680099",
      recipientEmail: to,
      body: `
        <p style="margin:0 0 22px;font-size:19px;font-weight:600;color:#222222;">
          ${greeting}
        </p>

        <p style="margin:0 0 20px;">
          El talento que invitaste ya creó correctamente su cuenta en HackChain.
        </p>

        <div style="margin:28px 0; padding:18px 22px; background:#F7EEFC; border-left:4px solid #680099; border-radius:10px;">
          <p style="margin:0 0 8px;font-size:13px;color:#777;">
            Talento registrado
          </p>
          <p style="margin:0;font-size:17px;font-weight:600;color:#222;">
            ${who}
          </p>
        </div>

        <p style="margin:0;">
          Ahora puedes volver a intentar la emisión del certificado desde tu Dashboard.
        </p>
      `,
      ctaUrl: dashboardUrl,
      ctaLabel: "Ir al Dashboard",
    }),
  });
}


async function notifyAdminNewEducator({ to, name, email, wallet, organization}) {
  if (!to || (Array.isArray(to) && to.length === 0)) return;

  const adminUrl = `${FRONTEND_URL}/admin`;
  const displayName = [name, organization].filter(Boolean).join(" / ") || wallet;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Nueva solicitud de educador: ${displayName}`,
    text: `Nueva solicitud de educador pendiente de aprobación.\n\nNombre: ${name || '—'}\nOrganización: ${organization || '—'}\nEmail: ${email || '—'}\nWallet: ${wallet}\n\nRevisa en el panel de admin: ${adminUrl} — Equipo HackChain`,

    html: renderEducatorEmail({
      title: "Nueva solicitud de educador",
      headline: "Nueva solicitud recibida",
      subheadline: "Un nuevo educador está esperando la aprobación de un administrador.",
      icon: "👤",
      accentColor: "#680099",
      recipientEmail: Array.isArray(to) ? to.join(", ") : to,
      body: `
        <p style="margin:0 0 22px;font-size:19px;font-weight:600;color:#222222;">
          Se recibió una nueva solicitud de registro.
        </p>

        <p style="margin:0 0 24px;">
          Revisa la información del solicitante y aprueba o rechaza la solicitud desde el panel de administración.
        </p>

        <div style=" margin:28px 0; background:#F7EEFC; border-left:4px solid #680099; border-radius:10px; padding:20px 24px ">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:26px;">
            <tr>
              <td style="color:#777777;width:130px;">Nombre</td>
              <td style="font-weight:600;color:#222222;"> ${name || "—"} </td>
            </tr>
            <tr>
              <td style="color:#777777;">Organización</td>
              <td>${organization || "—"}</td>
            </tr>
            <tr>
              <td style="color:#777777;">Correo</td>
              <td>${email || "—"}</td>
            </tr>
            <tr>
              <td style="color:#777777;">Wallet</td>
              <td style="font-family:monospace;font-size:13px;">
                ${wallet}
              </td>
            </tr>
          </table>
        </div>
      `,
      ctaUrl: adminUrl,
      ctaLabel: "Ir al Panel de Admin",
    }),
  });
}

async function notifyAdminEducatorReapply({ to, name, email, wallet, organization }) {
  if (!to || (Array.isArray(to) && to.length === 0)) return;

  const adminUrl = `${FRONTEND_URL}/admin`;
  const displayName = [name, organization].filter(Boolean).join(" / ") || wallet;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Re-solicitud de educador: ${displayName}`,
    text:`Un educador rechazado volvió a solicitar aprobación.\n\nNombre: ${name || '—'}\nOrganización: ${organization || '—'}\nEmail: ${email || '—'}\nWallet: ${wallet}\n\nRevisa en el panel de admin: ${adminUrl} — Equipo HackChain`,
    html: renderEducatorEmail({
      title: "Re-solicitud de educador",
      headline: "Nueva revisión requerida",
      subheadline: "Un educador previamente rechazado volvió a enviar su solicitud.",
      icon: "🔄",
      accentColor: "#8B5CF6",
      recipientEmail: Array.isArray(to) ? to.join(", ") : to,
      body: `
        <p style="margin:0 0 22px;font-size:19px;font-weight:600;color:#222222;">
          Se recibió una nueva solicitud de revisión.
        </p>

        <p style="margin:0 0 24px;">
          El siguiente educador fue rechazado anteriormente y volvió a enviar su solicitud.
          Revisa nuevamente su información antes de aprobarla o rechazarla.
        </p>

        <div style=" margin:28px 0; background:#F6F2FF; border-left:4px solid #8B5CF6; border-radius:10px; padding:20px 24px">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:26px;">
            <tr>
              <td style="color:#777;width:130px;">Nombre</td>
              <td style="font-weight:600;color:#222;">${name || "—"}</td>
            </tr>
            <tr>
              <td style="color:#777;">Organización</td>
              <td>${organization || "—"}</td>
            </tr>
            <tr>
              <td style="color:#777;">Correo</td>
              <td>${email || "—"}</td>
            </tr>
            <tr>
              <td style="color:#777;">Wallet</td>
              <td style="font-family:monospace;font-size:13px;">${wallet}</td>
            </tr>
          </table>
        </div>
      `,
      ctaUrl: adminUrl,
      ctaLabel: "Revisar solicitud",
    }),
  });
}

async function notifyEducatorClassRequest({ to, educatorName, studentName, requestedDate, startTime, durationMinutes, className}) {
  console.log(`[emailService] Notificando solicitud de clase a educador: ${to}`);

  const eEducatorName = esc(educatorName);
  const eStudentName = esc(studentName);
  const eClassName = esc(className);
  const eDate = esc(requestedDate);
  const eTime = esc(startTime);
  const eDuration = esc(durationMinutes);
  const greeting = eEducatorName ? `Hola, ${eEducatorName}.` : "Hola.";
  const dashboardUrl = `${FRONTEND_URL}/educator/dashboard`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Nueva solicitud de clase de ${studentName}`,
    text: `${greeting}\n\n${studentName} solicitó una clase privada contigo.\n\nFecha: ${requestedDate}\nHora: ${startTime}\nDuración: ${durationMinutes} min${className ? `\nClase: ${className}` : ""}\n\nRevisa y confirma desde tu dashboard: ${dashboardUrl}\n\n— Equipo HackChain`,

    html: renderEducatorEmail({
      title: "Nueva solicitud de clase",
      headline: "Nueva solicitud de clase",
      subheadline: "Un estudiante quiere agendar una clase privada contigo.",
      icon: "🎓",
      accentColor: "#680099",
      recipientEmail: to,
      body: `
        <p style="margin:0 0 22px;font-size:19px;font-weight:600;color:#222;">${greeting}</p>
        <p style="margin:0 0 24px;">
          <strong>${eStudentName}</strong> solicitó una nueva clase privada.
          Revisa los detalles antes de aceptar o rechazar la solicitud.
        </p>
        <div style=" margin:28px 0; background:#F7EEFC; border-left:4px solid #680099; border-radius:10px; padding:20px 24px">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:28px;">
            ${eClassName ? `
            <tr>
              <td style="color:#777;width:130px;">Clase</td>
              <td style="font-weight:600;color:#222;">${eClassName}</td>
            </tr>`
              : ""
            }
            <tr>
              <td style="color:#777;">Fecha</td>
              <td>${eDate}</td>
            </tr>
            <tr>
              <td style="color:#777;">Hora</td>
              <td>${eTime}</td>
            </tr>
            <tr>
              <td style="color:#777;">Duración</td>
              <td>${eDuration} minutos</td>
            </tr>
          </table>
        </div>
        <p style="margin:0;">
          Ingresa a tu Dashboard para aceptar o rechazar la solicitud.
        </p>
      `,
      ctaUrl: dashboardUrl,
      ctaLabel: "Ver solicitud",
    }),
  });
}

function getTalentClassStatusVariant(status, cancellationReason) {
  const reason = esc(cancellationReason);

  return {
    confirmed: {
      subject: "¡Tu solicitud de clase fue confirmada!",
      title: "Clase confirmada",
      headline: "¡Clase confirmada!",
      subheadline: "Todo está listo. Tu clase fue aceptada por el educador.",
      icon: "📅",
      accentColor: "#059669",
      ctaLabel: "Ver mis clases",
      body: `
        <p style="margin:0 0 20px;">
          Tu solicitud fue <strong>confirmada</strong>.
        </p>

        <p style="margin:0;">
          Guarda el evento en tu calendario para no olvidar la fecha y horario de la sesión.
        </p>
      `,
    },

    canceled: {
      subject: "Tu solicitud de clase fue cancelada",
      title: "Clase cancelada",
      headline: "Solicitud cancelada",
      subheadline: "Esta clase ya no podrá realizarse.",
      icon: "❌",
      accentColor: "#991B1B",
      ctaLabel: "Solicitar otra clase",
      body: `
        <p style="margin:0 0 20px;">
          Tu solicitud fue <strong>cancelada</strong> por el educador.
        </p>

        ${ reason ? ` <div style=" background:#FEF2F2; border-left:4px solid #DC2626; border-radius:8px; padding:16px; margin:20px 0 ">
          <strong>Motivo</strong><br><br>
            ${reason}
          </div>` : ""
        }
        <p style="margin:0;">
          Puedes solicitar una nueva clase cuando quieras.
        </p>
      `,
    },

    completed: {
      subject: "¡Tu clase fue completada!",
      title: "Clase completada",
      headline: "¡Clase completada!",
      subheadline: "Esperamos que hayas disfrutado la sesión.",
      icon: "🎓",
      accentColor: "#680099",
      ctaLabel: "Ver historial",
      body: `
        <p style="margin:0 0 20px;">
          Tu clase fue <strong>completada</strong>.
        </p>

        <p style="margin:0;">
          Gracias por utilizar HackChain para seguir aprendiendo.
        </p>
      `,
    },

    expired: {
      subject: "Tu solicitud de clase venció sin respuesta",
      title: "Solicitud vencida",
      headline: "Solicitud vencida",
      subheadline: "No fue posible confirmar la clase.",
      icon: "⏰",
      accentColor: "#F59E0B",
      ctaLabel: "Solicitar nuevamente",
      body: `
        <p style="margin:0 0 20px;">
          El educador no respondió antes de la fecha acordada.
        </p>

        <p style="margin:0;">
          La solicitud fue cancelada automáticamente. Puedes volver a intentarlo cuando desees.
        </p>
      `,
    },
  }[status];
}

async function notifyTalentClassRequestUpdate({ to, studentName, educatorName, className, requestedDate, startTime, durationMinutes, requestId, status, cancellationReason }) {
  console.log(`[emailService] Notificando actualización de clase al talento: ${to} — status=${status}`);

  const eStudentName       = esc(studentName);
  const eEducatorName      = esc(educatorName);
  const eClassName         = esc(className);
  const eDate              = esc(requestedDate);
  const eTime              = esc(startTime);
  const eCancellationReason = esc(cancellationReason);

  const greeting = eStudentName ? `Hola, ${eStudentName}.` : "Hola.";
  const dashboardUrl = `${FRONTEND_URL}/dashboard/talent/classes`;
  const eventTitle = className
    ? `Clase: ${className}`
    : educatorName
    ? `Clase con ${educatorName}`
    : "Clase — HackChain";

  const variant = getTalentClassStatusVariant( status, cancellationReason);
  
  const classLine = eClassName
    ? `<tr><td style="padding:6px 0;color:#888;">Clase</td><td style="padding:6px 0;font-weight:700;">${eClassName}</td></tr>`
    : "";
  const educatorLine = eEducatorName
    ? `<tr><td style="padding:6px 0;color:#888;">Educador</td><td style="padding:6px 0;">${eEducatorName}</td></tr>`
    : "";

  // Calendar links — only included when the class was confirmed
  let calendarHtml = "";
  let icsAttachment = null;

  if (status === "confirmed" && requestedDate && startTime && durationMinutes) {
    const mins = parseInt(durationMinutes, 10) || 60;
    const desc = [
      educatorName ? `Educador: ${educatorName}` : null,
      className ? `Clase: ${className}` : null,
      "Sesión privada reservada a través de HackChain.",
    ].filter(Boolean).join("\n");

    const googleUrl = buildGoogleCalendarUrl({ title: eventTitle, requestedDate, startTime, durationMinutes: mins, description: desc });
    const icsBuffer = buildICSBuffer({ uid: `hackchain-class-${requestId}@hackchain.app`, title: eventTitle, requestedDate, startTime, durationMinutes: mins, description: desc });

    icsAttachment = {
      filename: "clase-hackchain.ics",
      content: icsBuffer,
      contentType: "text/calendar; charset=utf-8; method=PUBLISH",
    };

    calendarHtml = `
      <p style="margin:24px 0 8px;text-align:center;">
        <a href="${googleUrl}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;background-color:#059669;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:700;font-size:14px;">
          📅 Agregar a Google Calendar
        </a>
      </p>
      <p style="text-align:center;margin:0;font-size:12px;color:#888;">
        El archivo .ics para Apple Calendar y Outlook está adjunto a este correo.
      </p>`;
  }

  const payload = {
    from: FROM,
    to,
    subject: variant.subject,
    text: `${greeting}\n\n${variant.body.replace(/<[^>]+>/g, "")}\n\n${className ? `Clase: ${className}\n` : ""}${educatorName ? `Educador: ${educatorName}\n` : ""}Fecha: ${requestedDate}\nHora: ${startTime}\n\nVer mis clases: ${dashboardUrl}\n\n— Equipo HackChain`,
    html: renderEducatorEmail({
      title: variant.subject,
      headline: variant.headline,
      subheadline: variant.subheadline,
      icon: variant.icon,
      recipientEmail: to,
      accentColor: variant.accentColor,
      body: `
      <p style="margin:0 0 22px; font-size:19px; font-weight:600; color:#222">${greeting}</p>
        ${variant.body}
      <div style="margin:28px 0; background:#F7EEFC; border-left:4px solid ${variant.accentColor}; border-radius:10px; padding:20px 24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:28px;">
            ${classLine} ${educatorLine}
            <tr>
                <td style="color:#777;width:120px;">
                    Fecha
                </td>
                <td>${eDate}</td>
            </tr>
            <tr>
                <td style="color:#777;">
                    Hora
                </td>
                <td>${eTime}</td>
            </tr> 
            ${durationMinutes ? `
                <tr>
                    <td style="color:#777;">
                        Duración
                    </td>
                    <td>${durationMinutes} minutos</td>
                </tr>
                ` : ""
            }
        </table>
      </div>
      ${calendarHtml}
    `,
      ctaUrl: dashboardUrl,
      ctaLabel: "Ver mis clases",
    }),
  };

  if (icsAttachment) {
    payload.attachments = [icsAttachment];
  }

  await resend.emails.send(payload);
}

async function notifyEducatorClassConfirmed({ to, educatorName, studentName, className, requestedDate, startTime, durationMinutes, requestId }) {
  console.log(`[emailService] Enviando calendario al educador: ${to}`);

  const greeting = educatorName ? `Hola, ${educatorName}.` : "Hola.";
  const dashboardUrl = `${FRONTEND_URL}/educator/dashboard`;
  const eventTitle = className
    ? `Clase: ${className}`
    : studentName
    ? `Clase con ${studentName}`
    : "Clase — HackChain";

  const mins = parseInt(durationMinutes, 10) || 60;
  const desc = [
    studentName ? `Estudiante: ${studentName}` : null,
    className ? `Clase: ${className}` : null,
    "Sesión privada — HackChain.",
  ].filter(Boolean).join("\n");

  const googleUrl = buildGoogleCalendarUrl({ title: eventTitle, requestedDate, startTime, durationMinutes: mins, description: desc });
  const icsBuffer = buildICSBuffer({ uid: `hackchain-class-educator-${requestId}@hackchain.app`, title: eventTitle, requestedDate, startTime, durationMinutes: mins, description: desc });

  const classLine = className
    ? `<tr><td style="padding:6px 0;color:#888;">Clase</td><td style="padding:6px 0;font-weight:700;">${esc(className)}</td></tr>`
    : "";
  const studentLine = studentName
    ? `<tr><td style="padding:6px 0;color:#888;">Estudiante</td><td style="padding:6px 0;">${esc(studentName)}</td></tr>`
    : "";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Clase confirmada${className ? ` — ${className}` : ""}${studentName ? ` con ${studentName}` : ""}`,
    text: `${greeting}\n\nConfirmaste una clase${studentName ? ` con ${studentName}` : ""}. Guarda el evento en tu calendario.\n\n${className ? `Clase: ${className}\n` : ""}${studentName ? `Estudiante: ${studentName}\n` : ""}Fecha: ${requestedDate}\nHora: ${startTime}\nDuración: ${mins} min\n\nDashboard: ${dashboardUrl}\n\n— Equipo HackChain`,
    html: renderEducatorEmail({
  title: "Clase confirmada",
  headline: "Clase confirmada",
  subheadline:
    "La sesión ya quedó agendada. Guarda el evento en tu calendario para no olvidarlo.",
  icon: "📅",
  accentColor: "#059669",
  recipientEmail: to,

  body: `
    <p style="margin:0 0 22px;font-size:19px;font-weight:600;color:#222;">${greeting}</p>
    <p style="margin:0 0 20px;">
      Confirmaste correctamente tu clase privada${
        studentName
          ? ` con <strong>${esc(studentName)}</strong>`
          : ""
      }.
    </p>
    <p style="margin:0 0 24px;">
      Guarda este evento en tu calendario para recibir recordatorios antes del inicio de la sesión.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${classLine}
      ${studentLine}
      <tr>
        <td style="padding:6px 0;color:#888;">Fecha</td>
        <td style="padding:6px 0;font-weight:700;">${esc(requestedDate)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#888;">Hora</td>
        <td style="padding:6px 0;">${esc(startTime)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#888;">Duración</td>
        <td style="padding:6px 0;">${mins} min</td>
      </tr>
    </table>

    <div style="margin:28px 0;padding:20px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;text-align:center;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#166534;">
        📅 Agrega esta clase a tu calendario
      </p>

      <a href="${googleUrl}"
         style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:600;font-size:14px;">
        Abrir Google Calendar
      </a>

      <p style="margin:14px 0 0;font-size:12px;color:#666;">
        También encontrarás un archivo <strong>.ics</strong> adjunto compatible con Apple Calendar y Outlook.
      </p>
    </div>
  `,

  ctaUrl: dashboardUrl,
  ctaLabel: "Ir al dashboard",
}),
    attachments: [{
      filename: "clase-hackchain.ics",
      content: icsBuffer,
      contentType: "text/calendar; charset=utf-8; method=PUBLISH",
    }],
  });
}

async function notifyEducatorClassCancelled({ to, educatorName, studentName, className, requestedDate, startTime, durationMinutes, cancellationReason }) {
  console.log(`[emailService] Notificando cancelación de clase a educador: ${to}`);
  const greeting = educatorName ? `Hola, ${educatorName}.` : "Hola.";
  const dashboardUrl = `${FRONTEND_URL}/educator/dashboard`;

  const classLine = className
    ? `<tr><td style="padding:6px 0;color:#888;">Clase</td><td style="padding:6px 0;font-weight:700;">${esc(className)}</td></tr>`
    : "";

  const reasonLine = cancellationReason
    ? `<tr><td style="padding:6px 0;color:#888;vertical-align:top;">Motivo</td><td style="padding:6px 0;font-style:italic;">"${esc(cancellationReason)}"</td></tr>`
    : "";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${studentName} canceló su solicitud de clase`,
    text: `${greeting}\n\n${studentName} canceló su solicitud de clase privada contigo.\n\nFecha: ${requestedDate}\nHora: ${startTime}\nDuración: ${durationMinutes} min${className ? `\nClase: ${className}` : ""}${cancellationReason ? `\nMotivo: "${cancellationReason}"` : ""}\n\nRevisa tus solicitudes en tu dashboard: ${dashboardUrl}\n\n— Equipo HackChain`,
    html: renderEducatorEmail({
      title: "Solicitud de clase cancelada",
      headline: "Solicitud cancelada",
      subheadline: "La solicitud fue cancelada por el estudiante y ya no requiere ninguna acción.",
      icon: "🗓️",
      accentColor: "#64748B",
      recipientEmail: to,
      body: `
      <p style="margin:0 0 22px;font-size:19px;font-weight:600;letter-spacing:0.2px;color:#222222;">
        ${greeting}
      </p>

      <p style="margin:0 0 20px;">
        <strong>${esc(studentName) || "El estudiante"}</strong> canceló su solicitud de clase privada.
      </p>

      <p style="margin:0 0 24px;">
        La clase ya no se encuentra programada y no es necesario realizar ninguna acción adicional.
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${classLine}
        <tr>
          <td style="padding:6px 0;color:#888;">Fecha</td>
          <td style="padding:6px 0;font-weight:700;">${esc(requestedDate)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#888;">Hora</td>
          <td style="padding:6px 0;">${esc(startTime)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#888;">Duración</td>
          <td style="padding:6px 0;">${durationMinutes} min</td>
        </tr>
        ${reasonLine}
      </table>

      <div style="margin:28px 0;padding:18px 20px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;">
        <p style="margin:0;font-size:14px;line-height:24px;color:#475569;text-align:center;">
          Puedes revisar el estado actualizado de todas tus solicitudes desde tu Dashboard.
        </p>
      </div>
    `,
      ctaUrl: dashboardUrl,
      ctaLabel: "Ver solicitudes",
    }),
  });
}

// Shared 24h reminder — role: 'student' | 'educator'
async function notifyClassReminder({ to, recipientName, counterpartName, role, className, requestedDate, startTime, durationMinutes }) {
  console.log(`[emailService] Recordatorio 24h → ${to} (${role})`);

  const greeting = recipientName ? `Hola, ${esc(recipientName)}.` : "Hola.";
  const mins = parseInt(durationMinutes, 10) || 60;
  const isEducator = role === 'educator';

  const eventTitle = className
    ? `Clase: ${esc(className)}`
    : counterpartName
    ? `Clase con ${esc(counterpartName)}`
    : "Clase — HackChain";

  const desc = [
    counterpartName ? `${isEducator ? 'Estudiante' : 'Educador'}: ${counterpartName}` : null,
    className ? `Clase: ${className}` : null,
    "Sesión privada — HackChain.",
  ].filter(Boolean).join("\n");

  const googleUrl = buildGoogleCalendarUrl({ title: eventTitle, requestedDate, startTime, durationMinutes: mins, description: desc });
  const ctaUrl = isEducator ? `${FRONTEND_URL}/educator/dashboard` : `${FRONTEND_URL}/dashboard/talent/classes`;
  const ctaLabel = isEducator ? "Ver mis clases" : "Ver mis clases";

  const counterpartLine = counterpartName
    ? `<tr><td style="padding:6px 0;color:#888;">${isEducator ? 'Estudiante' : 'Educador'}</td><td style="padding:6px 0;">${esc(counterpartName)}</td></tr>`
    : "";
  const classLine = className
    ? `<tr><td style="padding:6px 0;color:#888;">Clase</td><td style="padding:6px 0;font-weight:700;">${esc(className)}</td></tr>`
    : "";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Recordatorio: tu clase es mañana${className ? ` — ${className}` : ""}`,
    text: `${greeting}\n\nTe recordamos que mañana tienes una clase privada agendada en HackChain.\n\n${className ? `Clase: ${className}\n` : ""}${counterpartName ? `${isEducator ? 'Estudiante' : 'Educador'}: ${counterpartName}\n` : ""}Fecha: ${requestedDate}\nHora: ${startTime}\nDuración: ${mins} min\n\n${ctaUrl}\n\n— Equipo HackChain`,
    html: renderEducatorEmail({
      title: "Recordatorio de clase",
      headline: "Tu clase es mañana",
      subheadline: "Todo está listo. Aquí tienes la información de tu próxima sesión.",
      icon: "⏰",
      accentColor: "#7C3AED",
      recipientEmail: to,
      body: `
        <p style="margin:0 0 22px;font-size:19px;font-weight:600;letter-spacing:0.2px;color:#222222;">
          ${greeting}
        </p>

        <p style="margin:0 0 20px;">
          Este es un recordatorio de que <strong>mañana tienes una clase privada programada</strong> en HackChain.
        </p>

        <div style="margin:28px 0;background:#F7EEFC;border-left:4px solid #7C3AED;border-radius:10px;padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:28px;">
                ${classLine}
                ${counterpartLine}
              <tr>
                <td style="color:#777;width:120px;">
                  Fecha
                </td>
                <td style="font-weight:600;">
                  ${esc(requestedDate)}
                  </td>
              </tr>

              <tr>
                <td style="color:#777;">
                  Hora
                </td>
                <td>
                  ${esc(startTime)}
                </td>
              </tr>

              <tr>
                <td style="color:#777;">
                  Duración
                </td>
                <td>
                  ${mins} minutos
                </td>
              </tr>
            </table>
          </div>


        <div style="margin:28px 0;padding:20px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;text-align:center;">
          <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#166534;">
            📅 Añade esta sesión a tu calendario para no olvidarla.
          </p>

          <a href="${googleUrl}"
            style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:600;font-size:14px;">
            Abrir Google Calendar
          </a>

          <p style="margin:14px 0 0;font-size:12px;color:#666;">
            También encontrarás un archivo <strong>.ics</strong> adjunto compatible con Apple Calendar y Outlook.
          </p>
        </div>
      `,
      ctaUrl,
      ctaLabel,
    }),
  });
}

async function notifyTalentCertificateIssued({ to, studentName, educatorName, certificateTitle, dashboardUrl }) {
  console.log(`[emailService] Notificando certificado emitido → ${to}`);

  const greeting = studentName ? `Hola, ${esc(studentName)}.` : "Hola.";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Recibiste un nuevo certificado${certificateTitle ? `: ${certificateTitle}` : ""}`,
    text: `${greeting}\n\n${educatorName ? `${educatorName} ` : ""}emitió un certificado a tu nombre en HackChain.\n\n${certificateTitle ? `Certificado: ${certificateTitle}\n` : ""}Puedes verlo en tu perfil: ${dashboardUrl}\n\n— Equipo HackChain`,
    html: renderEducatorEmail({
      title: "Nuevo certificado recibido",
      headline: "Recibiste un certificado",
      subheadline: "Tu logro ya forma parte de tu historial verificable en Blockchain.",
      icon: "🏆",
      accentColor: "#680099",
      body: `
        <p style="margin:0 0 22px;font-size:19px;font-weight:600;letter-spacing:0.2px;color:#222222;">
          ${greeting}
        </p>

        <p style="margin:0 0 20px;">
          ${educatorName
              ? `<strong>${esc(educatorName)}</strong>`
              : "Un educador"
          } emitió un nuevo certificado a tu nombre.
        </p>

        <p style="margin:0 0 20px;">
          Tu certificado ya se encuentra disponible en HackChain y puede verificarse públicamente mediante tecnología Blockchain.
        </p>

        <div style="margin:28px 0; background:#F7EEFC; border-left:4px solid #680099; border-radius:10px; padding:20px 24px">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:28px;">
            ${ certificateTitle
                ? `
            <tr>
              <td style="color:#777;width:130px;">
                Certificado
              </td>
              <td style="font-weight:600;">
                ${esc(certificateTitle)}
              </td>
            </tr>`
                : ""
            }
            ${educatorName
                ? `
            <tr>
              <td style="color:#777;">
                Emitido por
              </td>
              <td>
                ${esc(educatorName)}
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="color:#777;">
                Estado
              </td>
              <td style="color:#059669;font-weight:700;">
                ✓ Verificado
              </td>
            </tr>
          </table>
        </div>

        <div style="margin:28px 0; padding:18px 20px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px">
          <p style="margin:0; text-align:center; font-size:14px; line-height:24px; color:#475569">
            Comparte tu certificado en redes profesionales o inclúyelo en tu portafolio para que cualquier persona pueda verificar su autenticidad.
          </p>
        </div>
      `,
      ctaUrl: dashboardUrl,
      ctaLabel: "Ver mi certificado",
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
  notifyTalentClassRequestUpdate,
  notifyEducatorClassConfirmed,
  notifyEducatorClassCancelled,
  notifyClassReminder,
  notifyTalentCertificateIssued,
};
