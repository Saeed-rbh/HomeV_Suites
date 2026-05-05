const prisma = require('../db');

const createGuest = async (data) => {
  return await prisma.guestProfile.create({
    data
  });
};

const getGuests = async (filters = {}) => {
  return await prisma.guestProfile.findMany({
    where: filters,
    include: {
      _count: {
        select: { reservations: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getGuestById = async (id) => {
  return await prisma.guestProfile.findUnique({
    where: { id },
    include: {
      reservations: {
        include: {
          property: true,
          transactions: true,
          invoices: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });
};

const updateGuest = async (id, data) => {
  return await prisma.guestProfile.update({
    where: { id },
    data
  });
};

const deleteGuest = async (id) => {
  return await prisma.guestProfile.delete({
    where: { id }
  });
};

module.exports = {
  createGuest,
  getGuests,
  getGuestById,
  updateGuest,
  deleteGuest
};
