const calendarService = require('../services/calendarService');

const getCalendarNodes = async (req, res) => {
  try {
    const { propertyId } = req.query;
    if (!propertyId) return res.status(400).json({ success: false, error: 'propertyId is required to fetch calendar grid' });

    const nodes = await calendarService.getCalendarNodes(propertyId);
    res.status(200).json({ success: true, data: nodes });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createTimeBlock = async (req, res) => {
  try {
    const { calendarNodeId } = req.body;
    const block = await calendarService.createTimeBlock(calendarNodeId, req.body);
    res.status(201).json({ success: true, data: block });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateTimeBlockStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const block = await calendarService.updateTimeBlockStatus(req.params.id, status);
    res.status(200).json({ success: true, data: block });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getCalendarNodes,
  createTimeBlock,
  updateTimeBlockStatus
};
