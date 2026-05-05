const transactionService = require('../services/transactionService');

const getTransactions = async (req, res) => {
  try {
    const transactions = await transactionService.getTransactions(req.query);
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const processTransaction = async (req, res) => {
  try {
    const transaction = await transactionService.createTransaction(req.body);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await transactionService.getInvoices(req.query);
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const invoice = await transactionService.createInvoice(req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getTransactions,
  processTransaction,
  getInvoices,
  generateInvoice
};
