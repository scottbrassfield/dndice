import request from 'request';

export function getRoll(req, res) {
  if (
    req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === 'roll20_please'
  ) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
}

export function postRoll(req, res) {
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log('Webhook received unknown event: ', event);
        }
      });
    });
    res.sendStatus(200);
  }
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log(
    'Received message for user %d and page %d at %d with message:',
    senderID,
    recipientID,
    timeOfMessage
  );
  console.log(JSON.stringify(message));

  var messageText = message.text;

  if (messageText) {
    var parsedMessage = messageText.split(' ');
    var roll = checkRoll(parsedMessage);
    if (roll) {
      var dice = roll.diceCount;

      var size = roll.dieSize;

      var modifier = roll.modifiers;

      var results = [];
      while (dice > 0) {
        results.push(Math.floor(Math.random() * size + 1) + modifier);
        dice--;
      }
      var total = results.reduce(function(total, res) {
        return total + res;
      }, 0);
      if (results.length > 1) {
        var resultsMessage = results.reduce(function(str, res) {
          return str + ' + ' + res.toString();
        });
      }
      var totalMessage = resultsMessage
        ? 'Total roll: ' + total + ' (' + resultsMessage + ')'
        : 'Total roll: ' + total;
      sendTextMessage(senderID, totalMessage);
    } else {
      sendTextMessage(senderID, 'Unrecognized Command');
    }
  }
}

// roll should match the following format: '/r 1d20 + 3'
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
  };
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
  request(
    {
      uri: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {
        access_token:
          'EAABqvBwnlxIBANFEz3HcEKUYkHUH5oueXeGiLTZBbLPtVgDc0LRKQjgzaBWZAQnKZAruze4AvMI9ZAkpmlkzhjZCWOJRW4h06hbga9PeqTOqjvmlSN5Jqx5kVXwXuwZCzRDI9QZBZCBMaToEhLdnJ23USazwZC71GKt0ZB6PrZA9othTwZDZD'
      },
      method: 'POST',
      json: messageData
    },
    function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var recipientId = body.recipient_id;
        var messageId = body.message_id;

        console.log(
          'Successfully sent generic message with id %s to recipient %s',
          messageId,
          recipientId
        );
      } else {
        console.error('Unable to send message.');
        console.error(response);
        console.error(error);
      }
    }
  );
}
