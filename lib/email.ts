import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} a las ${hours}:${mins}`;
}

interface SendCouponEmailParams {
  to: string;
  userName: string;
  code: string;
  description: string;
  expiresAt: string; // ISO string
  validHours: number;
}

export async function sendCouponEmail({
  to,
  userName,
  code,
  description,
  expiresAt,
  validHours,
}: SendCouponEmailParams): Promise<void> {
  const expiryFormatted = formatDate(expiresAt);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu premio de Sukha Trivia</title>
</head>
<body style="margin:0;padding:0;background:#f5f4fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#434344 0%,#5a4a6b 45%,#9993C0 100%);padding:36px 32px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;color:rgba(255,255,255,0.6);text-transform:uppercase;">Una experiencia de</p>
              <p style="margin:0 0 20px;font-size:28px;font-weight:700;color:white;letter-spacing:0.02em;">SUKHA TRIVIA</p>
              <p style="margin:0 0 6px;font-size:32px;line-height:1;">🎁</p>
              <h1 style="margin:12px 0 10px;font-size:22px;font-weight:700;color:white;line-height:1.25;">
                ¡Felicitaciones, ${userName}!
              </h1>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.82);line-height:1.55;">
                Ganaste un premio por tu conocimiento de yoga.<br/>
                ${description}
              </p>
            </td>
          </tr>

          <!-- Code section -->
          <tr>
            <td style="background:white;padding:28px 32px 8px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;">Tu código de descuento</p>

              <!-- Code box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(153,147,192,0.07);border:2px dashed #9993C0;border-radius:14px;padding:18px 24px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#434344;letter-spacing:0.05em;">${code}</p>
                  </td>
                </tr>
              </table>

              <!-- Validity -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="padding:12px 16px;background:#f9f8ff;border-radius:10px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#9993C0;">
                      Válido por ${validHours} horas
                    </p>
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      Vence el ${expiryFormatted}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:white;padding:20px 32px 28px;text-align:center;">
              <a
                href="https://www.sukhaonline.com.ar"
                style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#9993C0,#7b74a8);color:white;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;letter-spacing:0.01em;"
              >
                Ir a la tienda →
              </a>
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Ingresá el código al hacer tu compra en sukhaonline.com.ar.<br/>
                Uso único · No acumulable con otras promociones.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f4fa;padding:18px 32px;text-align:center;border-top:1px solid #ede9f8;">
              <p style="margin:0 0 6px;font-size:12px;color:#9993C0;">
                ¿Querés seguir jugando?
                <a href="https://trivia.sukhaonline.com.ar" style="color:#9993C0;font-weight:600;text-decoration:underline;">trivia.sukhaonline.com.ar</a>
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                Una experiencia de <strong style="color:#9993C0;">SUKHA</strong> · sukhaonline.com.ar
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: "Sukha Trivia <trivia@sukhaonline.com.ar>",
    to,
    replyTo: "info@sukhaonline.com",
    subject: `🎁 Tu código de descuento: ${code}`,
    html,
  });
}
