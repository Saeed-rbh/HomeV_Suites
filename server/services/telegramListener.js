const axios = require('axios');
const prisma = require('../db');

const getToken = () => process.env.TELEGRAM_BOT_TOKEN;
const getGroupId = () => process.env.TELEGRAM_GROUP_ID;
const apiUrl = () => `https://api.telegram.org/bot${getToken()}`;

// Store the offset to only poll new messages
let lastUpdateId = 0;

async function pollTelegram() {
    if (!getToken() || !getGroupId()) return;

    try {
        const response = await axios.get(`${apiUrl()}/getUpdates`, {
            params: {
                offset: lastUpdateId + 1,
                timeout: 30 // Long polling
            }
        });

        if (response.data.ok) {
            const updates = response.data.result;
            for (const update of updates) {
                lastUpdateId = update.update_id;
                
                // Process message
                if (update.message && update.message.text && update.message.chat) {
                    const msg = update.message;
                    
                    // Verify the message came from the correct group (so random DMs don't break things)
                    if (String(msg.chat.id) !== String(getGroupId())) continue;

                    const topicId = msg.message_thread_id;
                    if (!topicId) continue; // Message was in "General", not a specific topic

                    // Skip bot's own messages
                    if (msg.from.is_bot) continue;

                    // Match the topic ID back to the Database Thread
                    const thread = await prisma.messageThread.findUnique({
                        where: { telegramTopicId: parseInt(topicId) },
                        include: { guest: true, property: true }
                    });

                    if (thread) {
                        console.log(`[TelegramListener] Admin replied in Topic ${topicId} mapped to Thread ${thread.id}`);
                        
                        // Look for an existing message from ADMIN with the exact same content in recent MS
                        // to prevent duplicates if someone rapidly clicks
                        
                        // Save to DB
                        const savedMessage = await prisma.message.create({
                            data: {
                                threadId: thread.id,
                                senderRole: 'ADMIN',
                                content: msg.text,
                                isReadByAdmin: true 
                            }
                        });

                        // Optionally, trigger an email back to the Guest!
                        const mailService = require('./mailService');
                        await mailService.sendThreadEmail(thread, savedMessage, thread.guest.email);
                        
                        // Push real-time update to web UI if Guest is online
                        if (global.ioInstance) {
                            global.ioInstance.to(thread.id).emit('receive_message', savedMessage);
                        }
                    }
                }
            }
        }
    } catch (e) {
        if (e.response?.status === 401 || e.response?.status === 404) {
            console.error('[TelegramListener] Unauthorized. Invalid bot token!');
        } else if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
            // Ignore standard long-poll timeouts
        } else {
            console.error('[TelegramListener] Polling Error:', e.message);
        }
    } finally {
        // Schedule next poll automatically
        setTimeout(pollTelegram, 500);
    }
}

function startTelegramListener(io) {
    if (io) {
        global.ioInstance = io;
    }
    if (!getToken()) {
        console.log('[TelegramListener] Skipped start. No TELEGRAM_BOT_TOKEN.');
        return;
    }
    console.log('[TelegramListener] Starting Telegram long polling...');
    pollTelegram();
}

module.exports = { startTelegramListener };
