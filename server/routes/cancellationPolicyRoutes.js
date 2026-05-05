const express = require('express');
const router = express.Router();
const controller = require('../controllers/cancellationPolicyController');

router.get('/', controller.getAllPolicies);
router.get('/:id', controller.getPolicyById);
router.post('/', controller.createPolicy);
router.put('/:id', controller.updatePolicy);
router.delete('/:id', controller.deletePolicy);
router.post('/process/:reservationId', controller.processCancellation);
router.post('/:id/apply-all', controller.applyPolicyToAllListings);

module.exports = router;
