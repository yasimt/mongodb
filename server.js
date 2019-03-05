global.__basedir = __dirname;
const express = require("express");
let logger = require(__basedir + "/config/winston");
let morgan = require("morgan");

const bodyParser = require("body-parser");
const db = require(__basedir + "/config/db");

const app = express();

var router = express.Router();

morgan.token("date", function() {
  return new Date().toString();
});
app.use(morgan("combined"));
//app.use(morgan("combined", {stream: winston.stream}));
// Body parser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

require("./routes/index.js")(router, app);

db.initConn((err, db) => {
  if (err) {
    console.log("Problem in connecting Mongo DB Server.");
    process.exit();
  } else {
    console.log("Successfully connected to the Mongo DB Server.");
  }
});

process
  .on("unhandledRejection", (reason, p) => {
    //console.log(reason, "Unhandled Rejection at Promise", p);
    logger.error("unhandledRejection", reason);
  })
  .on("uncaughtException", err => {
    //console.error(err, "Uncaught Exception thrown");
    logger.error("Uncaught Exception thrown !!!", err);
    //process.exit(1);
  });

const port = process.env.PORT || 8888;
//app.listen(port, () => console.log(`Server running on port ${port}`));

var serverObj = app.listen(port);
serverObj.timeout = 9000;
console.log(`Server running on port ${port}`);
