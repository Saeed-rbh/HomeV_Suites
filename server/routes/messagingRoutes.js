const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');

router.route('/unread-count')
  .get(messagingController.getUnreadChatCount);

router.route('/threads')
  .get(messagingController.getThreads);

router.route('/threads/:threadId/messages')
  .get(messagingController.getThreadMessages)
  .post(messagingController.sendMessage);

router.route('/threads/:threadId/read')
  .put(messagingController.markThreadAsRead);

// Convenience: get/post messages by reservation ID (auto-resolves thread)
router.route('/reservation/:reservationId/messages')
  .get(messagingController.getMessagesByReservation)
  .post(messagingController.sendMessageToReservation);

module.exports = router;
