'use server';

import nodemailer from 'nodemailer';

// Configuration for the SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false, // `true` for port 465, `false` for all other ports (like 587)
  auth: {
    user: "apikey", // This is the literal username for SendGrid API keys
    pass: process.env.SENDGRID_API_KEY, // The API key from your environment variable
  },
});

// A quick check to see if the transporter is configured, primarily for logging.
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY environment variable not set. Email sending will be disabled.');
}

interface EmailOptions {
  to: string;
  from: {
    email: string;
    name: string;
  };
  subject: string;
  html: string;
}

/**
 * Sends an email using Nodemailer with SendGrid's SMTP relay.
 * @param options - The email options.
 * @returns A promise that resolves when the email is sent.
 */
export async function sendEmail(options: EmailOptions) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Cannot send email: SENDGRID_API_KEY is not configured.');
    return;
  }

  try {
    // Nodemailer expects the 'from' field to be a single string.
    const fromAddress = `"${options.from.name}" <${options.from.email}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`Email sent to ${options.to}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    // Re-throw the error so the calling function knows about the failure.
    throw new Error('Failed to send email via SMTP.');
  }
}
