const messagingService = require('../services/messagingService');
const mailService = require('../services/mailService');
const telegramService = require('../services/telegramService');
const prisma = require('../db');
const { handleError } = require('../utils/errorHandler');

const getThreads = async (req, res) => {
  try {
    const threads = await messagingService.getThreads(req.query);
    res.status(200).json({ success: true, data: threads });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getThreadMessages = async (req, res) => {
  try {
    const messages = await messagingService.getThreadMessages(req.params.threadId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { senderRole, content } = req.body;
    const message = await messagingService.sendMessage(req.params.threadId, senderRole, content);
    res.status(201).json({ success: true, data: message });

    // Look up full thread for email sending
    const thread = await prisma.messageThread.findUnique({
      where: { id: req.params.threadId },
      include: { guest: true, property: true, reservation: true }
    });
    
    if (thread && thread.guest) {
      if (senderRole === 'GUEST') {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) await mailService.sendThreadEmail(thread, message, adminEmail);
        
        // Also queue to Telegram
        telegramService.sendThreadMessageToTelegram(thread, message).catch(e => console.error(e));
      } else {
        await mailService.sendThreadEmail(thread, message, thread.guest.email);
      }
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Resolve thread from reservoir reservation ID
const getMessagesByReservation = async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.reservationId },
      include: { guest: true }
    });
    if (!reservation) return res.status(404).json({ success: false, error: 'Reservation not found' });

    let thread = await prisma.messageThread.findUnique({
      where: { reservationId: req.params.reservationId }
    });
    if (!thread) {
      thread = await prisma.messageThread.create({
        data: { 
          guestId: reservation.guestId, 
          propertyId: reservation.propertyId,
          reservationId: reservation.id
        }
      });
    }

    const messages = await messagingService.getThreadMessages(thread.id);
    res.status(200).json({ success: true, data: messages, threadId: thread.id });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const sendMessageToReservation = async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.reservationId }
    });
    if (!reservation) return res.status(404).json({ success: false, error: 'Reservation not found' });

    let thread = await prisma.messageThread.findUnique({
      where: { reservationId: req.params.reservationId }
    });
    if (!thread) {
      thread = await prisma.messageThread.create({
        data: { 
          guestId: reservation.guestId, 
          propertyId: reservation.propertyId,
          reservationId: reservation.id
        }
      });
    }

    const { senderRole, content } = req.body;
    const role = senderRole || 'GUEST';
    const message = await messagingService.sendMessage(thread.id, role, content);
    res.status(201).json({ success: true, data: message });

    // Look up full thread context for email
    const fullThread = await prisma.messageThread.findUnique({
      where: { id: thread.id },
      include: { guest: true, property: true, reservation: true }
    });

    if (fullThread && fullThread.guest) {
      if (role === 'GUEST') {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) await mailService.sendThreadEmail(fullThread, message, adminEmail);
        
        // Also queue to Telegram
        telegramService.sendThreadMessageToTelegram(fullThread, message).catch(e => console.error(e));
      } else {
        await mailService.sendThreadEmail(fullThread, message, fullThread.guest.email);
      }
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const markThreadAsRead = async (req, res) => {
  try {
    const { threadId } = req.params;
    await messagingService.markAsReadByAdmin(threadId);
    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getUnreadChatCount = async (req, res) => {
  try {
    const count = await messagingService.getTotalUnreadThreads();
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getThreads,
  getThreadMessages,
  sendMessage,
  getMessagesByReservation,
  sendMessageToReservation,
  markThreadAsRead,
  getUnreadChatCount
};
