const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;

const conf_var = require(__basedir + "/config/keys");

let _db;

const initConn = callback => {
  if (_db) {
    console.log("Database is already initialized!");
    return callback(null, _db);
  }

  MongoClient.connect(
    conf_var.mongoURI,
    {useNewUrlParser: true}
  )
    .then(client => {
      _db = client;
      callback(null, _db);
    })
    .catch(err => {
      callback(err, null);
    });
};

const getConn = () => {
  if (!_db) {
    throw Error("Database not initialzed");
  }
  return _db;
};

module.exports = {
  initConn,
  getConn
};
