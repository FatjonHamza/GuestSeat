import { Resend } from "resend";

export async function sendClientCredentialsEmail(payload: {
  to: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accessStart: string;
  accessEnd: string;
}): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";

  if (!resendApiKey) {
    console.warn(
      "RESEND_API_KEY is not configured. Replace re_xxxxxxxxx with your real API key and set it in your environment.",
    );
    return false;
  }

  const resend = new Resend(resendApiKey);

  const { error } = await resend.emails.send({
    from: resendFrom,
    to: payload.to,
    subject: "Aksesi juaj ne GuestSeat",
    html: `<p>Congrats on sending your <strong>first email</strong>!</p>
<p>Përshëndetje ${payload.firstName} ${payload.lastName},</p>
<p>Aksesi juaj në GuestSeat u krijua me sukses.</p>
<p>Email: ${payload.email}<br/>
Fjalëkalimi: ${payload.password}<br/>
Fillimi i aksesit: ${payload.accessStart}<br/>
Mbarimi i aksesit: ${payload.accessEnd}</p>
<p>Ju lutem ndryshoni fjalëkalimin pas hyrjes së parë.</p>`,
  });

  if (error) {
    console.error("Resend email send failed:", error);
    return false;
  }

  return true;
}
