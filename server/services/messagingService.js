const prisma = require('../db');

const getThreads = async (filters = {}) => {
  return await prisma.messageThread.findMany({
    where: filters,
    include: {
      guest: { 
        select: { 
          id: true, firstName: true, lastName: true
        } 
      },
      property: { select: { id: true, title: true } },
      reservation: { select: { id: true, startDate: true, endDate: true, status: true } },
      messages: { orderBy: { createdAt: 'asc' } }
    }
  }).then(threads => threads.map(t => ({
    ...t,
    unreadCount: t.messages.filter(m => m.senderRole === 'GUEST' && !m.isReadByAdmin).length
  })));
};

const getThreadMessages = async (threadId) => {
  return await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' }
  });
};

const sendMessage = async (threadId, senderRole, content) => {
  return await prisma.message.create({
    data: {
      threadId,
      senderRole,
      content,
      isReadByAdmin: senderRole === 'ADMIN' || senderRole === 'HOST'
    }
  });
};

const markAsReadByAdmin = async (threadId) => {
  const unreadMessages = await prisma.message.findMany({
    where: { threadId, isReadByAdmin: false },
    select: { id: true }
  });
  
  await Promise.all(unreadMessages.map(m => 
    prisma.message.update({ where: { id: m.id }, data: { isReadByAdmin: true } })
  ));
  
  return { count: unreadMessages.length };
};

const getTotalUnreadThreads = async () => {
  const threads = await prisma.messageThread.findMany({
    include: {
      messages: {
        where: { senderRole: 'GUEST', isReadByAdmin: false },
        take: 1
      }
    }
  });
  return threads.filter(t => t.messages.length > 0).length;
};

module.exports = {
  getThreads,
  getThreadMessages,
  sendMessage,
  markAsReadByAdmin,
  getTotalUnreadThreads
};
