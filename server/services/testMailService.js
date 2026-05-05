require('dotenv').config();
const prisma = require('../db');
const mailService = require('./mailService');

async function testMail() {
    try {
        const thread = await prisma.messageThread.findFirst({
            include: { guest: true, property: true, reservation: true }
        });

        if (!thread) {
            console.log("No threads found in DB.");
            return;
        }

        console.log("Testing with Thread:", thread.id);
        
        const testMessage = {
            senderRole: 'GUEST',
            content: 'This is a test message to debug the email sending.'
        };

        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        console.log("Sending to:", adminEmail);
        
        await mailService.sendThreadEmail(thread, testMessage, adminEmail);
        console.log("Test finished.");
    } catch (e) {
        console.error("Test failed with error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testMail();
