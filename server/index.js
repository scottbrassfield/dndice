'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

import facebookRoutes from './facebook/routes';
import groupmeRoutes from './groupme/routes';

const PORT = process.env.PORT || 3000;
const router = require('express-promise-router')();

var app = express()
  .use(bodyParser.json())
  .use(express.static(path.join(__dirname, 'public')))
  .use(router);

facebookRoutes(router);
groupmeRoutes(router);

app.listen(PORT, function() {
  console.log('Node app is running on port', PORT);
});

export default app;
