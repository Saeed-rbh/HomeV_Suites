const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');

router.post('/sync', propertyController.syncProperties);

router.route('/')
  .get(propertyController.getProperties)
  .post(protect, authorize('SUPER_ADMIN'), propertyController.createProperty);

router.route('/:id')
  .get(propertyController.getPropertyById)
  .put(protect, authorize('SUPER_ADMIN', 'PROPERTY_MANAGER'), propertyController.updateProperty)
  .delete(protect, authorize('SUPER_ADMIN'), propertyController.deleteProperty);

module.exports = router;
