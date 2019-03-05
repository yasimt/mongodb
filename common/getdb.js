const _ = require("lodash");
const conf_var = require(__basedir + "/config/keys");
const {MAINCITIES} = require(__basedir + "/common/constants");

module.exports = function dbInfo(module, data_city) {
  let dbName = "";
  data_city = data_city.toLowerCase();
  if (_.includes(MAINCITIES, data_city)) {
    dbName = conf_var["mongodb"][module][data_city];
  } else {
    dbName = conf_var["mongodb"][module]["remote"];
  }
  return dbName;
};
