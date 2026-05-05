const guestService = require('../services/guestService');
const prisma = require('../db');

const getMyReservations = async (req, res) => {
  try {
    const guestId = req.user.id;
    const reservations = await prisma.reservation.findMany({
      where: { guestId },
      include: {
        property: {
          include: {
            shortTermPolicy: true,
            longTermPolicy: true
          }
        },
        guest: true
      },
      orderBy: { startDate: 'desc' }
    });
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createGuest = async (req, res) => {
  try {
    const guest = await guestService.createGuest(req.body);
    res.status(201).json({ success: true, data: guest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getGuests = async (req, res) => {
  try {
    const guests = await guestService.getGuests(req.query);
    res.status(200).json({ success: true, data: guests });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getGuestById = async (req, res) => {
  try {
    const guest = await guestService.getGuestById(req.params.id);
    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }
    res.status(200).json({ success: true, data: guest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateGuest = async (req, res) => {
  try {
    const guest = await guestService.updateGuest(req.params.id, req.body);
    res.status(200).json({ success: true, data: guest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const deleteGuest = async (req, res) => {
  try {
    await guestService.deleteGuest(req.params.id);
    res.status(200).json({ success: true, message: 'Guest deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        guest: true,
        property: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};


module.exports = {
  getMyReservations,
  getAllReservations,
  createGuest,
  getGuests,
  getGuestById,
  updateGuest,
  deleteGuest
};
