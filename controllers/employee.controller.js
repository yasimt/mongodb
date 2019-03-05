const {isEmpty, trimObj} = require(__basedir + "/utility/helper");
const asyncMiddleware = require(__basedir + "/utility/async");
const dbConn = require(__basedir + "/config/db");

exports.getEmployeeData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);

  // Action Specific Validations
  if (isEmpty(req.body.empcode)) {
    return res.status(400).json({error: 1, msg: "empcode is blank."});
  }

  // Assigning Params

  const empcode = req.body.empcode;

  let cond_obj = {};
  cond_obj["empcode"] = empcode;

  let fld_obj = {_id: 0};

  const dbName = "db_jda";
  const table = "col_sso_employee_details";

  let resp_obj = {};
  try {
    const db = dbConn.getConn().db(dbName);
    let result = await db
      .collection(table)
      .find(cond_obj)
      .project(fld_obj)
      .toArray();
    if (Object.keys(result).length > 0) {
      result = JSON.parse(JSON.stringify(result));
      let resdata = result[0];
      let data_arr = [];
      data_arr.push(resdata);
      resp_obj["errorcode"] = 0;

      resp_obj["allCount"] = 1;
      resp_obj["totalCount"] = 1;
      resp_obj["login_detail"] = "";
      resp_obj["data"] = data_arr;
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["errorcode"] = 1;
      resp_obj["reportStatus"] = "No Data Found";
      return res.status(200).json(resp_obj);
    }
  } catch (err) {
    return res.status(500).json({error: 1, msg: err.stack});
  }
});
