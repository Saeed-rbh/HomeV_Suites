const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.route('/')
  .get(taskController.getTasks)
  .post(taskController.createTask);

router.route('/:id/status')
  .patch(taskController.updateTaskStatus);

router.route('/lock-codes')
  .post(taskController.generateLockCode);

module.exports = router;
