'use strict';

const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request');

const PORT = process.env.PORT || 3000;

var app = express();
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('Hey There!');
})

app.get('/roll', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'roll20_please') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/roll', function (req, res) {
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          console.log(event)
          console.log(event.message);
          receivedMessage(event)
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
      senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var messageId = message.mid;

    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {
      var parsedMessage = messageText.split(' ');
      console.log(parsedMessage);
      if (parsedMessage[0] = '/r') {
        var dice = parsedMessage[1].split('d');
        console.log(dice);
        var modifier = parseInt(parsedMessage[3]);
        console.log(modifier);
        var numDice = parseInt(dice[0]);
        console.log(numDice)
        var dieSize = parseInt(dice[1]);
        console.log(dieSize);
        var results = [];
        while(numDice > 0) {
          results.push(Math.floor(Math.random() * dieSize + 1) + modifier);
          numDice--;
        }
        console.log(results);
        var total = results.reduce(function(total, res) {
          return total + res;
        }, 0)
        var totalMessage = 'Total roll: ' + total;
        sendTextMessage(senderID, totalMessage)
      }
    } else if (messageAttachments) {
      sendTextMessage(senderID, "Message with attachment received");
    }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAABqvBwnlxIBABhCLVfyZB3JdLADdhxmZCUezR4iBoFMloK0TzF6XZAZCL4xTM9Y12YqmhgGBRZCmBWLMcSUsqkGF2YVKMwsQ5ZAv5aAvUwZBmR0IjZBnRzODt4K9uxhRiMZBQj0wklP27HQ14ZAortLFENx8R4BgFygy4zVLU0tWCNQZDZD' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}


app.listen(PORT, function() {
  console.log('Node app is running on port', PORT);
});

module.exports = app;
