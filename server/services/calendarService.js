const prisma = require('../db');

const getCalendarNodes = async (propertyId) => {
  return await prisma.calendarNode.findMany({
    where: { propertyId },
    include: {
      timeBlocks: true
    }
  });
};

const createTimeBlock = async (calendarNodeId, data) => {
  return await prisma.timeBlock.create({
    data: {
      ...data,
      calendarNodeId
    }
  });
};

const updateTimeBlockStatus = async (blockId, status) => {
  return await prisma.timeBlock.update({
    where: { id: blockId },
    data: { status }
  });
};

module.exports = {
  getCalendarNodes,
  createTimeBlock,
  updateTimeBlockStatus
};
