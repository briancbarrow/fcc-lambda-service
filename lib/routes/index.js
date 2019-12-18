const express = require("express");
const router = express.Router();
const attendees = require("./notes/attendee.controller");
router.use("/attendees", attendees);

module.exports = router;