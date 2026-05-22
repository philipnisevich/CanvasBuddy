const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

function confirmationEmailHtml(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;background:#F0F4F8;color:#2D3B45;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;margin:0 auto;">
    <tr>
      <td style="background:#fff;border:3px solid #2D3B45;border-radius:16px;padding:28px 24px;box-shadow:4px 4px 0 #2D3B45;">
        <h1 style="margin:0 0 12px;font-size:22px;color:#2D3B45;">Confirm your CanvasBuddy account</h1>
        <p style="margin:0 0 20px;line-height:1.5;font-size:15px;">Thanks for signing up. Click the button below to verify your email, then sign in and add your Canvas token in Settings.</p>
        <p style="margin:0 0 20px;text-align:center;">
          <a href="${confirmationUrl}" style="display:inline-block;padding:12px 24px;background:#2D7DD2;color:#fff;text-decoration:none;font-weight:600;border-radius:12px;border:2px solid #2D3B45;">Confirm email</a>
        </p>
        <p style="margin:0;font-size:13px;color:#5c6b7a;line-height:1.5;">If the button does not work, copy and paste this link into your browser:<br><a href="${confirmationUrl}" style="color:#2D7DD2;word-break:break-all;">${confirmationUrl}</a></p>
        <p style="margin:20px 0 0;font-size:12px;color:#8a9aa8;">If you did not create a CanvasBuddy account, you can ignore this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function confirmationEmailText(confirmationUrl: string): string {
  return `Confirm your CanvasBuddy account

Thanks for signing up. Open this link to verify your email, then sign in and add your Canvas token in Settings:

${confirmationUrl}

If you did not create a CanvasBuddy account, you can ignore this email.`;
}

export async function sendSignupConfirmationEmail(params: {
  to: string;
  confirmationUrl: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY!.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL!.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "CanvasBuddy";

  const res = await fetch(BREVO_SEND_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: params.to }],
      subject: "Confirm your CanvasBuddy account",
      htmlContent: confirmationEmailHtml(params.confirmationUrl),
      textContent: confirmationEmailText(params.confirmationUrl),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      detail ? `Brevo send failed (${res.status}): ${detail}` : `Brevo send failed (${res.status})`
    );
  }
}
