const pricingService = require('../services/pricingService');

const getRatePlans = async (req, res) => {
  try {
    const { propertyId } = req.query;
    if (!propertyId) return res.status(400).json({ success: false, error: 'propertyId is required as query param' });
    const plans = await pricingService.getRatePlans(propertyId);
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createRatePlan = async (req, res) => {
  try {
    const plan = await pricingService.createRatePlan(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getRatePlans,
  createRatePlan
};
