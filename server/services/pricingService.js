const prisma = require('../db');

const getRatePlans = async (propertyId) => {
  return await prisma.ratePlan.findMany({
    where: { propertyId }
  });
};

const createRatePlan = async (data) => {
  return await prisma.ratePlan.create({ data });
};

module.exports = {
  getRatePlans,
  createRatePlan
};
