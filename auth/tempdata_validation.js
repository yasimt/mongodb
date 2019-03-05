const {isEmpty} = require(__basedir + "/utility/helper");
const {VALID_MODULES} = require(__basedir + "/common/constants");
const _ = require("lodash");

module.exports = function validateTempInput(data) {
  let errors = "";

  data.parentid = !isEmpty(data.parentid) ? data.parentid.toString() : "";
  data.data_city = !isEmpty(data.data_city) ? data.data_city.toString() : "";
  data.module = !isEmpty(data.module) ? data.module.toString() : "";
  data.noparentid = !isEmpty(data.noparentid) ? data.noparentid : 0;

  var idx = 0;
  let tmp_arr = [];
  if (isEmpty(data.parentid) && data.noparentid != 1) {
    tmp_arr.push("Parentid is blank");
  }
  if (isEmpty(data.data_city)) {
    tmp_arr.push("Data City is blank");
  }

  if (isEmpty(data.module)) {
    tmp_arr.push("Module is blank");
  } else {
    data.module = data.module.toLowerCase();
    if (!_.includes(VALID_MODULES, data.module)) {
      tmp_arr.push("Invalid Module");
    }
  }

  if (tmp_arr.length > 0) {
    errors = tmp_arr.join(", ");
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
