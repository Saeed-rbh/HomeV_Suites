const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.route('/')
  .get(transactionController.getTransactions)
  .post(transactionController.processTransaction);

router.route('/invoices')
  .get(transactionController.getInvoices)
  .post(transactionController.generateInvoice);

module.exports = router;
