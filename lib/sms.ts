import twilio from "twilio";

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_FROM_NUMBER;

const client = sid && token ? twilio(sid, token) : null;

export async function sendSms(to: string, body: string) {
  if (!client) throw new Error("Twilio is not configured.");
  if (!from) throw new Error("TWILIO_FROM_NUMBER missing.");
  return client.messages.create({ from, to, body });
}
