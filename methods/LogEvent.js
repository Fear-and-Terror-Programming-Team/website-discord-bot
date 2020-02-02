const EventLog = require('../models/EventLog');

const LogEvent = (target, caller, callerName, action, details) => {
  EventLog.create({
    target,
    caller,
    callerName,
    action,
    details,
  })
    .catch(err => {
      console.error(err);
    });
};

module.exports = LogEvent;
