const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const helmet = require("helmet");
app.use(helmet());

require("./db");
const routes = require("./routes");
app.use("/api", routes);
module.exports = app;

app.get('/api/info', (req, res) => {
  try {
    mongoHandler({ application: 'sample-app', version: '1.0' })
  res.send({ application: 'sample-app', version: '1.0' });
  }
  catch(e) {
    console.log('THIS IS MY LOG', e)
    res.status(e.status).send(e)
  }
});
app.post('/api/v1/getback', (req, res) => {
  res.send({ ...req.body });
});
// app.listen(3000, () => console.log(`Listening on: 3000`));
module.exports.handler = serverless(app);