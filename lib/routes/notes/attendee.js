const mongoose = require("mongoose");

const attendeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  attendance: [
    {
      date: {
        type: String,
        required: true,
      },
      dateFormatted: {
        type: String,
        required: true,
      },
    }
  ]
});

module.exports = mongoose.model('Attendee', attendeeSchema);