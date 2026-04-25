'use server';

import twilio from 'twilio';
import { sendEmail } from './email';

export async function sendSms(
  to: string,
  body: string,
  mediaUrl?: string[]
): Promise<{success: boolean; error?: string}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || !messagingServiceSid) {
    console.warn("SMS sending is skipped because one or more Twilio environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID) are not set.");
    return {success: true, error: 'Twilio service is not configured.'};
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body: body,
      messagingServiceSid: messagingServiceSid,
      to: to,
      mediaUrl: mediaUrl,
    });
    return {success: true};
  } catch (error: any) {
    console.error('Failed to send SMS:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {success: false, error: `Twilio error: ${errorMessage}`};
  }
}

export async function sendNewIncidentNotification(
    incidentId: string,
    location: string,
    summary: string,
    contactInfo: {
        smsNumbers?: string[] | null;
        email?: string | null;
    },
    reporterName?: string | null,
    reporterPhone?: string | null,
    mediaUrls?: string[] | null
) {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseURL) {
        console.error('CRITICAL: NEXT_PUBLIC_BASE_URL environment variable is not set. Cannot send notifications.');
        return;
    }
    const incidentUrl = `${baseURL}/incidents/${incidentId}`;
    const locationUrl = `https://www.google.com/maps?q=${location}`;

    let reporterInfo = 'Reporter: Anonymous';
    if (reporterName && reporterPhone) {
        reporterInfo = `Reporter: ${reporterName} - ${reporterPhone}`;
    } else if (reporterName) {
        reporterInfo = `Reporter: ${reporterName}`;
    } else if (reporterPhone) {
        reporterInfo = `Reporter: ${reporterPhone}`;
    }

    const mediaLinksText = mediaUrls && mediaUrls.length > 0
        ? `Media Links:\n${mediaUrls.join('\n')}`
        : '';

    const textBody = `
New Marine Response Incident Reported:
ID: ${incidentId}
Location: ${locationUrl}
Summary: ${summary}
${reporterInfo}
Link: ${incidentUrl}
${mediaLinksText}
    `.trim();

    // Send SMS
    const smsNumbers = contactInfo.smsNumbers;
    if (smsNumbers && smsNumbers.length > 0) {
        for (const number of smsNumbers) {
            try {
                await sendSms(number, textBody);
                console.log(`Successfully sent new incident SMS to ${number}`);
            } catch (error) {
                console.error(`Failed to send new incident SMS to ${number}:`, error);
            }
        }
    } else {
        console.log(`No SMS numbers provided for incident ${incidentId}. Skipping SMS.`);
    }

    // Send Email
    const emailAddress = contactInfo.email;
    if (emailAddress) {
        try {
            const emailSubject = `New Marine Response Incident: ${incidentId}`;
            const mediaLinksHtml = mediaUrls && mediaUrls.length > 0
                ? `<p><strong>Media Links:</strong></p><ul>${mediaUrls.map(url => `<li><a href="${url}">${url}</a></li>`).join('')}</ul>`
                : '';
            
            const emailHtml = `
                <h3>New Marine Response Incident Reported</h3>
                <p><strong>ID:</strong> ${incidentId}</p>
                <p><strong>Location:</strong> <a href="${locationUrl}">${location}</a></p>
                <p><strong>Summary:</strong> ${summary}</p>
                <p><strong>${reporterInfo}</strong></p>
                <p><strong>Link:</strong> <a href="${incidentUrl}">${incidentUrl}</a></p>
                ${mediaLinksHtml}
            `.trim();

            await sendEmail({
                to: emailAddress,
                from: {
                    email: 'noreply@mccullyapp.com',
                    name: 'Marine Response System'
                },
                subject: emailSubject,
                html: emailHtml,
            });
            console.log(`Successfully sent new incident email to ${emailAddress}`);
        } catch (error) {
            console.error(`Failed to send new incident email to ${emailAddress}:`, error);
        }
    } else {
        console.log(`No email address provided for incident ${incidentId}. Skipping email.`);
    }
}


export async function sendDeceasedStatusNotification(
    incidentId: string,
    location: string,
    animalType: string | null | undefined,
    contactInfo: {
        smsNumbers?: string[] | null;
        email?: string | null;
    }
) {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseURL) {
        console.error('CRITICAL: NEXT_PUBLIC_BASE_URL environment variable is not set. Cannot send notifications.');
        return;
    }
    const incidentUrl = `${baseURL}/incidents/${incidentId}`;
    const locationUrl = `https://www.google.com/maps?q=${location}`;

    const subject = `URGENT UPDATE: Animal Deceased for Incident ${incidentId}`;
    const animalIdentifier = animalType ? `(${animalType})` : '';

    const textBody = `
URGENT STATUS UPDATE:
An animal previously reported in incident #${incidentId} ${animalIdentifier} has been confirmed DECEASED.
Location: ${locationUrl}
Please review the incident details immediately: ${incidentUrl}
    `.trim();

    // Send SMS
    if (contactInfo.smsNumbers && contactInfo.smsNumbers.length > 0) {
        for (const number of contactInfo.smsNumbers) {
            await sendSms(number, textBody).catch(e => console.error(`Failed to send deceased update SMS to ${number}:`, e));
        }
    }

    // Send Email
    if (contactInfo.email) {
        const emailHtml = `
            <h3>${subject}</h3>
            <p>An animal previously reported in incident <strong>#${incidentId}</strong> ${animalIdentifier} has been confirmed <strong>DECEASED</strong>.</p>
            <p><strong>Location:</strong> <a href="${locationUrl}">${location}</a></p>
            <p>Please review the incident details immediately:</p>
            <p><a href="${incidentUrl}">${incidentUrl}</a></p>
        `.trim();

        await sendEmail({
            to: contactInfo.email,
            from: { email: 'noreply@mccullyapp.com', name: 'Marine Response System Urgent' },
            subject: subject,
            html: emailHtml,
        }).catch(e => console.error(`Failed to send deceased update email to ${contactInfo.email}:`, e));
    }
}

export async function sendIncidentStatusUpdateSms({
  phone,
  incidentId,
  newStatus,
}: {
  phone: string;
  incidentId: string;
  newStatus: string;
}): Promise<{success: boolean; error?: string}> {
  const body = `Marine Response Update: The status of your report #${incidentId.substring(0, 7)}... has been updated to: ${newStatus}.`;
  
  try {
    const result = await sendSms(phone, body);
    if (result.success) {
      console.log(`Successfully sent status update SMS to ${phone}`);
    }
    return result;
  } catch (error) {
    console.error(`Failed to send status update SMS to ${phone}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {success: false, error: errorMessage};
  }
}
