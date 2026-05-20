/**
 * SMS Notification Service
 * Sends secure OTP and updates to guests and users.
 */

/**
 * Sends a 6-digit OTP login code via SMS.
 * Falls back to console logging when Twilio credentials are not configured.
 *
 * @param {string} phone    - Recipient phone number (e.g. +15551234567)
 * @param {string} otpCode  - The plain-text OTP code
 */
const sendOtpSms = async (phone, otpCode) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || !token || !fromPhone) {
        console.log(`\n==========================================`);
        console.log(`📱 [SIMULATED SMS]`);
        console.log(`   TO: ${phone}`);
        console.log(`   MESSAGE: Your HomEV login code is: ${otpCode}. It expires in 15 minutes.`);
        console.log(`==========================================\n`);
        return;
    }

    try {
        // Dynamically require twilio to prevent crashes if the package is not installed yet
        const twilio = require('twilio');
        const client = twilio(sid, token);
        
        await client.messages.create({
            body: `Your HomEV login code is: ${otpCode}. It expires in 15 minutes.`,
            from: fromPhone,
            to: phone
        });
        console.log(`[smsService] Real Twilio SMS OTP successfully sent to ${phone}`);
    } catch (err) {
        console.error('[smsService] Error sending Twilio SMS:', err.message);
        throw new Error('Failed to send SMS code via Twilio: ' + err.message);
    }
};

module.exports = { sendOtpSms };
