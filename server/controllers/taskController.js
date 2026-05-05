const taskService = require('../services/taskService');

const getTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTasks(req.query);
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const task = await taskService.updateTaskStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const generateLockCode = async (req, res) => {
  try {
    const { propertyId, reservationId, code, expiresAt } = req.body;
    const lock = await taskService.generateSmartLockCode(propertyId, reservationId, code, expiresAt);
    res.status(201).json({ success: true, data: lock });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTaskStatus,
  generateLockCode
};
