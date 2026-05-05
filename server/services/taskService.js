const prisma = require('../db');

const getTasks = async (filters = {}) => {
  return await prisma.operationalTask.findMany({
    where: filters,
    include: {
      assignee: { select: { id: true, email: true } },
      property: { select: { id: true, title: true } }
    }
  });
};

const createTask = async (data) => {
  return await prisma.operationalTask.create({
    data
  });
};

const updateTaskStatus = async (id, status) => {
  return await prisma.operationalTask.update({
    where: { id },
    data: { status }
  });
};

const generateSmartLockCode = async (propertyId, reservationId, code, expiresAt) => {
  return await prisma.smartLockCode.create({
    data: { propertyId, reservationId, code, expiresAt: new Date(expiresAt) }
  });
};

module.exports = {
  getTasks,
  createTask,
  updateTaskStatus,
  generateSmartLockCode
};
