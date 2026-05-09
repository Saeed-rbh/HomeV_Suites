const axios = require('axios');
const prisma = require('../db');

const getToken = () => process.env.TELEGRAM_BOT_TOKEN;
const getGroupId = () => process.env.TELEGRAM_GROUP_ID;
const apiUrl = () => `https://api.telegram.org/bot${getToken()}`;

async function createTopic(title) {
    if (!getToken() || !getGroupId()) return null;
    
    try {
        const response = await axios.post(`${apiUrl()}/createForumTopic`, {
            chat_id: getGroupId(),
            name: title.slice(0, 128) // Telegram topic limits
        });
        
        if (response.data.ok) {
            return response.data.result.message_thread_id;
        }
    } catch (e) {
        console.error('[TelegramService] Failed to create topic:', e.response?.data || e.message);
    }
    return null;
}

async function closeTopic(topicId) {
    if (!getToken() || !getGroupId() || !topicId) return false;
    try {
        const response = await axios.post(`${apiUrl()}/closeForumTopic`, {
            chat_id: getGroupId(),
            message_thread_id: topicId
        });
        return response.data.ok;
    } catch (e) {
        console.error('[TelegramService] Failed to close topic:', e.response?.data || e.message);
        return false;
    }
}

async function deleteTopic(topicId) {
    if (!getToken() || !getGroupId() || !topicId) return false;
    try {
        const response = await axios.post(`${apiUrl()}/deleteForumTopic`, {
            chat_id: getGroupId(),
            message_thread_id: topicId
        });
        return response.data.ok;
    } catch (e) {
        console.error('[TelegramService] Failed to delete topic:', e.response?.data || e.message);
        return false;
    }
}

async function sendTextMessage(topicId, text) {
    if (!getToken() || !getGroupId()) return null;

    try {
        const response = await axios.post(`${apiUrl()}/sendMessage`, {
            chat_id: getGroupId(),
            message_thread_id: topicId,
            text: text
        });
        return response.data.ok;
    } catch (e) {
        // If topic was deleted or user kicked, handle silently
        console.error('[TelegramService] Failed to send message:', e.response?.data || e.message);
        return false;
    }
}

async function sendThreadMessageToTelegram(thread, message) {
    if (!getToken() || !getGroupId()) return;

    let topicId = thread.telegramTopicId;
    
    const senderName = message.senderRole === 'GUEST' 
        ? `${thread.guest?.firstName || ''} ${thread.guest?.lastName || ''}`.trim() || 'Guest'
        : 'HomEV Admin';

    // If there is no topic for this thread yet, create one
    if (!topicId) {
        console.log(`[TelegramService] Creating new topic for Thread ${thread.id}`);
        
        const propertyTitle = thread.property?.nickname || thread.property?.title || 'HomEV';
        const topicTitle = `${senderName} - ${propertyTitle}`;
        
        topicId = await createTopic(topicTitle);
        
        if (topicId) {
            // Update the thread in DB
            await prisma.messageThread.update({
                where: { id: thread.id },
                data: { telegramTopicId: topicId }
            });
            // Also assign it locally for immediate use
            thread.telegramTopicId = topicId;
            
            // Send context as the first message
            let contextMsg = `📝 **New Conversation Started**\n`;
            contextMsg += `Guest: ${senderName}\n`;
            contextMsg += `Property: ${propertyTitle}\n`;
            if (thread.reservation) {
                const start = new Date(thread.reservation.startDate).toLocaleDateString();
                const end = new Date(thread.reservation.endDate).toLocaleDateString();
                contextMsg += `Booked: ${start} - ${end}\n`;
            }
            contextMsg += `\n_Reply directly in this topic to send a message to the guest's dashboard._`;
            await sendTextMessage(topicId, contextMsg);
        } else {
            console.error('[TelegramService] Could not resolve Topic ID. Cannot send message to Telegram.');
            return;
        }
    }

    // Now send the actual message
    const displayMsg = `[${senderName}]:\n${message.content}`;
    await sendTextMessage(topicId, displayMsg);
}

async function announceNewBooking(reservation, property, guest, thread) {
    if (!getToken() || !getGroupId()) return;

    const guestName = `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Guest';
    const propLabel = property.nickname || property.title || 'HomEV';
    const start = new Date(reservation.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(reservation.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const uplistingLink = reservation.uplistingBookingId
        ? `🔗 Uplisting: https://app.uplisting.io/calendar/bookings/${reservation.uplistingBookingId}/details?from=${new Date().toISOString().split('T')[0]}`
        : '';
    const contactLines = [
        guest.email ? `📧 ${guest.email}` : '',
        guest.phone ? `📞 ${guest.phone}` : ''
    ].filter(Boolean);

    // 1. Post to the General (main) topic
    const generalMsg = [
        `🎉 New Booking Received!`,
        `Guest: ${guestName}`,
        ...contactLines,
        `Property: ${propLabel}`,
        `Dates: ${start} → ${end}`,
        `Price: $${reservation.totalPrice || 0}`,
        uplistingLink
    ].filter(Boolean).join('\n');

    try {
        await axios.post(`${apiUrl()}/sendMessage`, {
            chat_id: getGroupId(),
            text: generalMsg
        });
    } catch (e) {
        console.error('[TelegramService] Failed to post general booking alert:', e.response?.data || e.message);
    }

    // 2. Create a dedicated topic for this booking
    const topicTitle = `${guestName} - ${propLabel}`;
    const topicId = await createTopic(topicTitle);

    if (topicId) {
        await prisma.messageThread.update({
            where: { id: thread.id },
            data: { telegramTopicId: topicId }
        });

        const contextMsg = [
            `📝 Conversation Channel Prepared`,
            `Guest: ${guestName}`,
            ...contactLines,
            `Property: ${propLabel}`,
            `Booked: ${start} → ${end}`,
            uplistingLink,
            ``,
            `_When the guest sends a message it will appear here. You can also reply proactively._`
        ].filter(l => l !== undefined).join('\n');

        await sendTextMessage(topicId, contextMsg);
    }
}

async function announceReservationStatusChange(reservation, property, guest, newStatus) {
    if (!getToken() || !getGroupId()) return;

    const guestName = guest ? `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Guest' : 'Unknown Guest';
    const propLabel = property ? (property.nickname || property.title || 'Unknown Property') : 'Unknown Property';
    const isCancelled = ['CANCELLED', 'INACTIVE'].includes(newStatus.toUpperCase());
    const emoji = isCancelled ? '❌' : '⚠️';

    const contactLines = [
        guest?.email ? `📧 ${guest.email}` : '',
        guest?.phone ? `📞 ${guest.phone}` : ''
    ].filter(Boolean);

    const uplistingLink = reservation.uplistingBookingId
        ? `🔗 Uplisting: https://app.uplisting.io/calendar/bookings/${reservation.uplistingBookingId}/details?from=${new Date().toISOString().split('T')[0]}`
        : '';

    const lines = [
        `${emoji} Reservation ${newStatus.toUpperCase()}`,
        `Guest: ${guestName}`,
        ...contactLines,
        `Property: ${propLabel}`,
        uplistingLink,
        isCancelled && uplistingLink ? `👆 Please cancel this booking in Uplisting manually.` : ''
    ].filter(Boolean);

    try {
        await axios.post(`${apiUrl()}/sendMessage`, {
            chat_id: getGroupId(),
            text: lines.join('\n')
        });
    } catch (e) {
        console.error('[TelegramService] Failed to post status change alert:', e.response?.data || e.message);
    }
}

module.exports = {
    sendThreadMessageToTelegram,
    closeTopic,
    deleteTopic,
    announceNewBooking,
    announceReservationStatusChange
};
