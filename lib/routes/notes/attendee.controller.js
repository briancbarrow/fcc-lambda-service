const express = require("express");
const moment = require("moment-timezone");
var HttpStatus = require('http-status-codes');

const attendeeController = express.Router();
const Attendee = require("./attendee");

attendeeController.post("/", async (req, res, next) => {
  const { name, email } = req.body;
  const date = moment().tz("America/Denver").format();
  const dateFormatted = moment().tz("America/Denver").subtract(1, "days").format("MM-DD-YYYY");
  const foundAttendee = await Attendee.findOne(({ email }));
  
  if(foundAttendee) {
    if(foundAttendee.attendance.length > 0 && foundAttendee.attendance[foundAttendee.attendance.length - 1].dateFormatted === dateFormatted) {
      return res.json({date: dateFormatted, message: "Attendee already checked in", status: "no-dup-check-in"});
    } else {
      const attendee = await Attendee.update(
        { _id: foundAttendee._id },
        {
          $push:
          {
            attendance:
              { date: date, dateFormatted: dateFormatted }
          }
        });
      return res.status(HttpStatus.ACCEPTED).send({ message: "User found, and checked in", attendee });
    }
  } else {
    const attendee = await Attendee.create({ name, email, attendance: { date, dateFormatted } });
    attendee.save((err, attendee) => {
      if(err) {
        console.log("ERROR", err);
        return res.status(HttpStatus.METHOD_FAILURE).send({ message: "Error saving attendee info", error: err });
      } else {
        console.log("ATTENDEE", attendee)
        return res.status(HttpStatus.CREATED).send({ message: "Attendee created and saved", attendee });
      }
    });
  }
});

attendeeController.put('/', async (req, res, next) => {
  const { dateToBeRemoved, email } = req.body;
  const foundAttendee = await Attendee.findOne(({ email }));
  
  if(foundAttendee) {
      const attendee = await Attendee.update(
        { _id: foundAttendee._id },
        {
          $pull:
          {
            attendance:
              { dateFormatted: dateToBeRemoved }
          }
        });
      return res.status(HttpStatus.ACCEPTED).send({ message: "If the User had a check in record with that date, it was deleted", attendee });
  } else {
      return res.status(HttpStatus.NOT_MODIFIED).send({ message: "Attendee record not found" });
  }
});


attendeeController.get('/', async (req, res, next) => {
  const attendees = await Attendee.find()
  res.status(HttpStatus.OK).send(attendees)
})

attendeeController.delete('/:email', async (req, res, next) => {
  try {
    const foundAttendee = await Attendee.findOneAndDelete(({ email: req.params.email }));
    // console.log("EMAIL", foundAttendee._id)
    // Attendee.deleteOne({ "_id": `ObjectId("${foundAttendee._id}")` })
    res.status(HttpStatus.OK).send(foundAttendee)
  } catch (e) {
    res.status(HttpStatus.METHOD_FAILURE).send({ message: "Couldn't find the user to delete" })
  }
    
})

module.exports = attendeeController