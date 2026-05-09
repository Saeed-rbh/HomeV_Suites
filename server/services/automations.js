const cron = require('node-cron');
const prisma = require('../db');

module.exports = (io) => {
    console.log('[AUTOMATIONS] Node-Cron Services initialized globally.');

    // 1. Channel Manager Automations (Airbnb/VRBO <-> Reservations)
    // Fires every 15 minutes. Real sync is driven by Uplisting webhooks (booking_created / booking_updated).
    // TODO: Add active reconciliation logic here if webhook delivery gaps are detected.
    /*
    cron.schedule('*/15 * * * *', () => {
        console.log('[CRON] Channel sync heartbeat — real booking events handled via webhooks.');
    });
    */

    // 2. Smart Pricing Module
    // Run daily at midnight. TODO: Implement occupancy-based pricing rule evaluation.
    /*
    cron.schedule('0 0 * * *', () => {
        console.log('[CRON] Daily smart pricing evaluation tick — not yet implemented.');
    });
    */
};

// 3. Guest CRM Automation Triggers
// Native external event listener designed to be invoked directly across workflows rather than cron
module.exports.triggerAutoReply = async (io, threadId, guestName, reservationId) => {
    console.log(`[TRIGGER] Dispatching Custom Auto-Reply Welcome Message for Thread ${threadId}`);

    // Look up the actual smart lock code for this reservation from the database.
    // Never use hardcoded codes — always pull the real one tied to the guest's stay.
    let lockCodeText = 'Please check your booking confirmation email for your door code.';
    try {
        if (reservationId) {
            const lockCode = await prisma.smartLockCode.findFirst({
                where: {
                    reservationId,
                    expiresAt: { gt: new Date() } // only use non-expired codes
                },
                orderBy: { createdAt: 'desc' }
            });
            if (lockCode) {
                lockCodeText = `Your Smart Lock door code is: **${lockCode.code}**`;
            } else {
                console.warn(`[TRIGGER] ⚠ No active SmartLockCode found for reservation ${reservationId}`);
            }
        }
    } catch (err) {
        console.error('[TRIGGER] Failed to fetch SmartLockCode:', err.message);
    }

    const autoReplyPacket = {
        threadId,
        sender: 'Host (Automated)',
        text: `Hi ${guestName}! I just saw your status shift to 'Checked In'. Welcome to the HomEV Listing! ${lockCodeText} Let us know if you need anything!`,
        time: 'Just now'
    };

    io.to(threadId).emit('receive_message', autoReplyPacket);
};

