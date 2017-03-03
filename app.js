'use strict';

const
  express = require('express'),
  bodyParser = require('body-parser'),
  path = require('path'),
  request = require('request');

const PORT = process.env.PORT || 3000;

var app = express();
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')))

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
    var roll = checkRoll(parsedMessage);
    if (roll) {
      var
        dice = roll.diceCount,
        size = roll.dieSize,
        modifier = roll.modifiers,
        results = [];
      while(dice > 0) {
        results.push(Math.floor(Math.random() * size + 1) + modifier);
        dice--;
      }
      var total = results.reduce(function(total, res) {
        return total + res;
      }, 0)
      if (results.length > 1) {
        var resultsMessage = results.reduce(function(str, res) {
          return str + ' + ' + res.toString();
        })
      }
      var totalMessage = resultsMessage ?
      'Total roll: ' + total + ' (' + resultsMessage + ')' :
      'Total roll: ' + total;
      sendTextMessage(senderID, totalMessage)
    } else {
      sendTextMessage(senderID, "Unrecognized Command");
    }
  }
}

//roll should match the following format: '/r 1d20 + 3'
function checkRoll(roll) {
  if (roll[0] !== '/r') {
    return false;
  }
  var dice = roll[1] ? roll[1].split('d') : null;
  if (!dice) {
    return false;
  }
  var diceCount = parseInt(dice[0]);
  var dieSize = parseInt(dice[1]);
  if (isNaN(diceCount) || isNaN(dieSize)) {
    return false;
  }
  var modifiers = checkModifiers(roll);
    return {
      diceCount,
      dieSize,
      modifiers
    }
}

function checkModifiers(roll) {
  var mods = roll.map(function(item, index, roll) {
    if (item === '+') {
      return parseInt(roll[index + 1]);
    }
    return 0;
  });
  if (mods.length) {
    return mods.reduce(function(sum, mod) {
      return sum + mod;
    }, 0);
  }
  return 0;
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
    qs: { access_token: 'EAABqvBwnlxIBAA46tKsuPB9DcOgS1zaZAHQ4xwn1Thnlbl5ycOh5vsyVxXBQHcjbZBIeXmL9fhZAZBHF3DVWRl8DoXYZC1Kxzjj3NahC7mS3sBXEwerU7uoFmQjeDufZBtskR3hJsZCWKb9tZBxqARZA7CYODcDEagzf6NGrvFqz5nwZDZD' },
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
