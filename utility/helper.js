var _ = require("lodash");
const isEmpty = value =>
  value === undefined ||
  value === null ||
  (typeof value === "object" && Object.keys(value).length === 0) ||
  (typeof value === "string" && value.trim().length === 0);

module.exports.isEmpty = isEmpty;

module.exports.trimObj = function trimObj(obj) {
  if (!Array.isArray(obj) && typeof obj != "object") return obj;
  return Object.keys(obj).reduce(function(acc, key) {
    acc[key.trim()] =
      typeof obj[key] == "string" ? obj[key].trim() : trimObj(obj[key]);
    return acc;
  }, Array.isArray(obj) ? [] : {});
};

module.exports.removeNonUTF = function removeNonUTF(data) {
  if (typeof data == "object") {
    let newdata = {};
    for (let key in data) {
      let val = data[key];
      if (!isEmpty(val)) {
        if (String(val).match(/[^\x00-\x7F]+/)) {
          let newval = _.trim(val.replace(/[^\x00-\x7F]+/, " "));
          newdata[key] = newval;
        } else {
          newdata[key] = val;
        }
      } else {
        newdata[key] = val;
      }
    }
    return newdata;
  }
  return data;
};

exports.isJSON = function addSlashes(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};
