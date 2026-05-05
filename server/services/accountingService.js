const prisma = require('../db');

const createJournalEntry = async (data) => {
  return await prisma.journalEntry.create({ data });
};

const getJournalEntries = async (filters = {}) => {
  return await prisma.journalEntry.findMany({ where: filters });
};

const createOwnerStatement = async (data) => {
  return await prisma.ownerStatement.create({ data });
};

const getOwnerStatements = async (ownerId) => {
  return await prisma.ownerStatement.findMany({ where: { ownerId } });
};

module.exports = {
  createJournalEntry,
  getJournalEntries,
  createOwnerStatement,
  getOwnerStatements
};
