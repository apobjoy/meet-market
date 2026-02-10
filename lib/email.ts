import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResultsEmail(params: { to: string; subject: string; html: string }) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
