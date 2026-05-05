const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');

router.route('/journals')
  .get(accountingController.getJournalEntries)
  .post(accountingController.createJournalEntry);

router.route('/statements')
  .get(accountingController.getOwnerStatements)
  .post(accountingController.createOwnerStatement);

module.exports = router;
