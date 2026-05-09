import { Resend } from 'resend';

// Vercel will inject this environment variable securely
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { html, subject } = req.body;

    const data = await resend.emails.send({
      from: 'Paws & Tails App <onboarding@resend.dev>', // Must use this until you verify a custom domain
      to: 'parwinabassi@gmail.com', // Replace with your exact Resend account email!
      subject: subject,
      html: html,
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}