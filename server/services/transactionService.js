const prisma = require('../db');

const createTransaction = async (data) => {
  return await prisma.transaction.create({ data });
};

const getTransactions = async (filters = {}) => {
  return await prisma.transaction.findMany({ where: filters });
};

const createInvoice = async (data) => {
  return await prisma.invoice.create({ data });
};

const getInvoices = async (filters = {}) => {
  return await prisma.invoice.findMany({ where: filters });
};

module.exports = {
  createTransaction,
  getTransactions,
  createInvoice,
  getInvoices
};
