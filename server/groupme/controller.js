import request from 'request';

export function handleMessage(req, res) {
  console.log('REQ', req.body);
  try {
    request({
      json: true,
      uri: 'https://api.groupme.com/v3/bots/post',
      method: 'POST',
      body: {
        bot_id: '421f560070b571777172560d51',
        text: 'Nice message'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(400);
  }
}
