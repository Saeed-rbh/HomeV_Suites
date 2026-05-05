const accountingService = require('../services/accountingService');

const getJournalEntries = async (req, res) => {
  try {
    const entries = await accountingService.getJournalEntries(req.query);
    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createJournalEntry = async (req, res) => {
  try {
    const entry = await accountingService.createJournalEntry(req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getOwnerStatements = async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) return res.status(400).json({ success: false, error: 'ownerId is required' });
    const statements = await accountingService.getOwnerStatements(ownerId);
    res.status(200).json({ success: true, data: statements });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createOwnerStatement = async (req, res) => {
  try {
    const statement = await accountingService.createOwnerStatement(req.body);
    res.status(201).json({ success: true, data: statement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getJournalEntries,
  createJournalEntry,
  getOwnerStatements,
  createOwnerStatement
};
