const { MailListener } = require('mail-listener5');
const prisma = require('../db');

// ── GoDaddy-compliant IMAP Listener ─────────────────────────────────────────
// Policies enforced:
//   • Single connection attempt on startup (no rapid retries)
//   • Exponential backoff starting at 60s, capped at 30 min
//   • Circuit breaker: stops retrying after MAX_AUTH_FAILURES consecutive auth errors
//   • Graceful reconnect only for non-auth disconnections (e.g. network blip)

const MAX_AUTH_FAILURES = 3;          // Stop completely after 3 auth failures
const INITIAL_BACKOFF_MS = 60_000;    // 60 seconds
const MAX_BACKOFF_MS = 30 * 60_000;   // 30 minutes

let authFailures = 0;
let currentBackoff = INITIAL_BACKOFF_MS;
let reconnectTimer = null;
let mailListenerInstance = null;
let isConnected = false;

function createListener() {
    return new MailListener({
        username: process.env.SMTP_USER,
        password: process.env.SMTP_PASS,
        host: 'imap.secureserver.net',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 15000,    // 15s connection timeout
        authTimeout: 15000,    // 15s auth timeout (generous for GoDaddy)
        debug: null,
        mailbox: "INBOX",
        searchFilter: ["UNSEEN"],
        markSeen: true,
        fetchUnreadOnStart: true,
        attachments: false,
        attachmentOptions: { directory: "attachments/" }
    });
}

function scheduleReconnect(reason) {
    if (reconnectTimer) return; // Already scheduled

    if (authFailures >= MAX_AUTH_FAILURES) {
        console.error(`[IMAP] ⛔ Circuit breaker tripped after ${MAX_AUTH_FAILURES} auth failures. IMAP listener disabled.`);
        console.error('[IMAP] To re-enable: restart the server after verifying your SMTP_PASS in .env');
        return;
    }

    console.log(`[IMAP] Will retry in ${Math.round(currentBackoff / 1000)}s (reason: ${reason})`);
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        attemptConnection();
    }, currentBackoff);

    // Exponential backoff: double each time, cap at MAX
    currentBackoff = Math.min(currentBackoff * 2, MAX_BACKOFF_MS);
}

function attemptConnection() {
    if (isConnected) return;

    console.log('[IMAP] Attempting connection to imap.secureserver.net:993...');

    // Destroy previous listener if it exists
    if (mailListenerInstance) {
        try { mailListenerInstance.stop(); } catch (e) { /* ignore */ }
    }

    mailListenerInstance = createListener();

    // ── SUCCESS ──────────────────────────────────────────────────────────────
    mailListenerInstance.on("server:connected", () => {
        isConnected = true;
        authFailures = 0;                  // Reset on successful connection
        currentBackoff = INITIAL_BACKOFF_MS; // Reset backoff
        console.log("[IMAP] ✅ Connected to GoDaddy inbox successfully!");
    });

    // ── DISCONNECTION ────────────────────────────────────────────────────────
    mailListenerInstance.on("server:disconnected", () => {
        isConnected = false;
        console.log("[IMAP] Disconnected from server.");
        // Only reconnect if we had previously been connected (network blip, not auth)
        // Auth failures are handled in the error handler below
    });

    // ── ERRORS ───────────────────────────────────────────────────────────────
    mailListenerInstance.on("error", (err) => {
        isConnected = false;
        const msg = (err.message || '').toLowerCase();

        if (msg.includes('auth') || msg.includes('login') || msg.includes('credentials')) {
            authFailures++;
            console.error(`[IMAP] ❌ Authentication failed (attempt ${authFailures}/${MAX_AUTH_FAILURES}): ${err.message}`);
            scheduleReconnect('auth-failure');
        } else if (msg.includes('timeout') || msg.includes('econnreset') || msg.includes('econnrefused')) {
            console.warn(`[IMAP] ⚠️ Network error: ${err.message}`);
            scheduleReconnect('network-error');
        } else {
            console.error(`[IMAP] Unexpected error: ${err.message}`);
            scheduleReconnect('unknown-error');
        }
    });

    // ── INCOMING MAIL ────────────────────────────────────────────────────────
    mailListenerInstance.on("mail", async (mail) => {
        try {
            const subject = mail.subject || '';
            const fromEmail = mail.from?.value?.[0]?.address;
            const textContent = mail.text || '';

            console.log(`[IMAP] Parsed new email from ${fromEmail}: "${subject}"`);

            // Extract Reference ID
            const threadMatch = subject.match(/\[Ref:([^\]]+)\]/);
            if (!threadMatch) {
                console.log('[IMAP] Ignoring email, no Thread Reference found in subject.');
                return;
            }

            const threadId = threadMatch[1].trim();

            // Look up thread
            const thread = await prisma.messageThread.findUnique({
                where: { id: threadId },
                include: { guest: true, property: true }
            });

            if (!thread) {
                console.log(`[IMAP] Thread ${threadId} not found in database.`);
                return;
            }

            // Clean email text (strip quoting/signatures)
            let cleanMessage = textContent.split('On ')[0]
                                          .split('wrote:')[0]
                                          .split('>')[0]
                                          .split('From:')[0]
                                          .trim();
            if (!cleanMessage) {
                cleanMessage = textContent.trim();
            }

            const systemEmail = process.env.SMTP_USER.toLowerCase();
            const senderEmail = fromEmail.toLowerCase();
            const guestEmail = thread.guest.email.toLowerCase();

            let role = 'GUEST';
            let sendTo = null;

            if (senderEmail === systemEmail) {
                role = 'ADMIN';
                sendTo = guestEmail;
            } else if (senderEmail === guestEmail) {
                role = 'GUEST';
                sendTo = null;
            } else {
                console.warn(`[IMAP] Unknown sender ${senderEmail} for Thread ${threadId}. Processing as GUEST.`);
            }

            // Save to DB
            const savedMessage = await prisma.message.create({
                data: {
                    threadId,
                    content: cleanMessage,
                    senderRole: role,
                    isReadByAdmin: role === 'ADMIN'
                }
            });

            // Push to WebSocket if guest is online
            if (global.ioInstance) {
                global.ioInstance.to(threadId).emit('receive_message', savedMessage);
            }

            // Forward to Telegram
            if (role === 'GUEST') {
                try {
                    const telegramService = require('./telegramService');
                    await telegramService.sendThreadMessageToTelegram(thread, savedMessage);
                } catch (e) { console.error('[IMAP] Telegram forward failed:', e.message); }
            }

            // Forward email to guest if admin replied
            if (sendTo && role === 'ADMIN') {
                const mailService = require('./mailService');
                await mailService.sendThreadEmail(thread, { content: cleanMessage, senderRole: role }, sendTo);
                console.log(`[IMAP] Forwarded Admin reply to Guest ${sendTo}`);
            }

        } catch (error) {
            console.error('[IMAP] Error processing incoming mail:', error);
        }
    });

    // Start - single attempt, no internal retry
    try {
        mailListenerInstance.start();
    } catch (e) {
        console.warn('[IMAP] Startup exception:', e.message);
        scheduleReconnect('startup-exception');
    }
}

const startIMAPListener = () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[IMAP] Skipped: No SMTP credentials in .env');
        return;
    }

    console.log('[IMAP] Initializing GoDaddy-compliant IMAP listener...');
    console.log('[IMAP] Policy: max 3 auth retries, 60s initial backoff, 30min max backoff');

    // Single initial attempt after a short delay to let the server fully start
    setTimeout(() => attemptConnection(), 3000);
};

module.exports = { startIMAPListener };
