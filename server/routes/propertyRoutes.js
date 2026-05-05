const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
// const { protect, authorize } = require('../middleware/auth'); // Uncomment after auth middleware is added

router.post('/sync', propertyController.syncProperties);

router.route('/')
  .get(propertyController.getProperties)
  // .post(protect, authorize('SUPER_ADMIN'), propertyController.createProperty);
  .post(propertyController.createProperty);

router.route('/:id')
  .get(propertyController.getPropertyById)
  // .put(protect, authorize('SUPER_ADMIN', 'PROPERTY_MANAGER'), propertyController.updateProperty)
  .put(propertyController.updateProperty)
  // .delete(protect, authorize('SUPER_ADMIN'), propertyController.deleteProperty);
  .delete(propertyController.deleteProperty);

module.exports = router;
