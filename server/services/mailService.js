const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: parseInt(process.env.SMTP_PORT || '465') === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
    });
};

/**
 * Sends a 6-digit OTP login code via email.
 * Falls back to console logging when SMTP is not configured.
 *
 * @param {string} email    - Recipient email address
 * @param {string} otpCode  - The plain-text OTP code (not the hash)
 */
const sendOtpEmail = async (email, otpCode) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`\n==========================================`);
        console.log(`📧 SIMULATED EMAIL TO: ${email}`);
        console.log(`🔒 SECURITY CODE: ${otpCode}`);
        console.log(`==========================================\n`);
        return;
    }

    const transporter = createTransporter();

    const emailText = `Your HomEV login code is: ${otpCode}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, you can safely ignore this email.\n\n© ${new Date().getFullYear()} HomEV Suites – support@homevsuites.com`;

    const emailHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Your HomEV Login Code</title></head>
<body style="margin:0;padding:0;background-color:#f3f5f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f5f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background-color:#0c1929;padding:32px 40px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:2px;">HOMEV SUITES</h1></td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#64748b;font-size:14px;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:1px;">Secure Login</p>
          <h2 style="color:#0c1929;font-size:24px;margin:0 0 24px 0;">Your verification code</h2>
          <p style="color:#475569;font-size:15px;margin:0 0 28px 0;">Use the code below to sign in. It expires in <strong>15 minutes</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background-color:#f8fafc;border:2px dashed #e2e8f0;border-radius:12px;padding:28px;">
            <span style="font-size:42px;font-weight:700;letter-spacing:12px;color:#0c1929;font-family:monospace;">${otpCode}</span>
          </td></tr></table>
          <p style="color:#94a3b8;font-size:13px;margin:28px 0 0 0;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="background-color:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} HomEV Suites &nbsp;|&nbsp; <a href="mailto:support@homevsuites.com" style="color:#64748b;text-decoration:none;">support@homevsuites.com</a></p>
          <p style="color:#cbd5e1;font-size:11px;margin:6px 0 0 0;">This is an automated message. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    await transporter.sendMail({
        from: `"HomEV Suites" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${otpCode} is your HomEV login code`,
        text: emailText,
        html: emailHtml
    });
};

/**
 * Sends a message notification email with thread tracking reference.
 *
 * @param {Object} thread  - MessageThread (must include guest, property)
 * @param {Object} message - Message just created (must have senderRole, content)
 * @param {string} toEmail - Recipient email address
 */
const sendThreadEmail = async (thread, message, toEmail) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[MailService] Mock sending email to ${toEmail} for Thread ${thread.id}`);
        return;
    }

    try {
        const transporter = createTransporter();
        
        const senderName = message.senderRole === 'GUEST' 
            ? `${thread.guest?.firstName || ''} ${thread.guest?.lastName || ''}`.trim() || 'Guest'
            : 'HomEV Admin';
            
        const fromAddress = `"${senderName} (HomEV)" <${process.env.SMTP_USER}>`;
        const propertyTitle = thread.property?.title || 'HomEV';
        const subject = `Re: Message from ${senderName} regarding ${propertyTitle} [Ref:${thread.id}]`;

        let reservationInfoHtml = '';
        let reservationInfoText = '';
        
        if (message.senderRole === 'GUEST' && thread.reservation) {
            const startDate = new Date(thread.reservation.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const endDate = new Date(thread.reservation.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            reservationInfoHtml = `
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 14px; color: #475569;">
                        <strong style="color:#0f172a;">Guest:</strong> ${senderName}<br/>
                        <strong style="color:#0f172a;">Property:</strong> ${propertyTitle}<br/>
                        <strong style="color:#0f172a;">Booked:</strong> ${startDate} to ${endDate}
                    </div>
            `;
            reservationInfoText = `Guest: ${senderName}\nProperty: ${propertyTitle}\nBooked: ${startDate} to ${endDate}\n\n`;
        }

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; background-color: #f3f5f8; padding: 20px;">
                <div style="background-color: white; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <h2 style="color: #0c1929; margin-top: 0;">New Message from ${senderName}</h2>
                    ${reservationInfoHtml}
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #000; margin: 20px 0;">
                        <p style="white-space: pre-wrap; margin: 0; color: #1e293b;">${message.content}</p>
                    </div>
                    <p style="color: #64748b; font-size: 13px;">
                        <em>Reply directly to this email to continue the conversation. Your reply will automatically be synced to the dashboard.</em>
                    </p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center;">
                        Powered by HomEV Suites Messaging<br/>
                        Thread Reference: ${thread.id}
                    </p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: fromAddress,
            to: toEmail,
            replyTo: process.env.SMTP_USER,
            subject: subject,
            text: reservationInfoText + message.content + '\n\nReply to this email to respond.',
            html: emailHtml
        });
        
        console.log(`[MailService] Sent thread email to ${toEmail} for Thread ${thread.id}`);
    } catch (error) {
        console.error('[MailService] Error sending email:', error.message);
    }
};

module.exports = { sendOtpEmail, sendThreadEmail };
