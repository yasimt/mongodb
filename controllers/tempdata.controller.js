const {isEmpty, trimObj, removeNonUTF, isJSON} = require(__basedir +
  "/utility/helper");
const asyncMiddleware = require(__basedir + "/utility/async");
const {TEMPTABLES, DATE_OPERATORS} = require(__basedir + "/common/constants");
const validateTempInput = require(__basedir + "/auth/tempdata_validation");
const conf_var = require(__basedir + "/config/keys");
const dbConn = require(__basedir + "/config/db");
const DBINFO = require(__basedir + "/common/getdb");
const MongoClient = require("mongodb").MongoClient;
const moment = require("moment");
const _ = require("lodash");

exports.getData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateTempInput(req.body);

  // Check Common Validations
  if (!isValid) {
    return res.status(400).json({error: 1, msg: errors});
  }

  // Action Specific Validations
  if (isEmpty(req.body.table)) {
    return res.status(400).json({error: 1, msg: "table is blank."});
  } else {
    if (!_.includes(TEMPTABLES, req.body.table)) {
      return res.status(400).json({error: 1, msg: "invalid table name."});
    }
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;
  const table = req.body.table;

  let cond_obj = {};
  if (table === "tbl_business_temp_data") {
    cond_obj["contractid"] = parentid;
  } else {
    cond_obj["parentid"] = parentid;
  }
  let fld_obj = {_id: 0};
  let def_obj = {}; // default value - if not found return blank value

  if (!isEmpty(req.body.fields)) {
    let fields = req.body.fields.split(",");
    for (let prop in fields) {
      if (fields.hasOwnProperty(prop)) {
        let value = fields[prop];
        fld_obj[value] = 1;
        def_obj[value] = "";
      }
    }
  }
  let aliasdata = {};
  if (!isEmpty(req.body.aliaskey)) {
    aliasdata = JSON.parse(req.body.aliaskey);

    for (let prop in aliasdata) {
      if (aliasdata.hasOwnProperty(prop)) {
        fld_obj[prop] = 1;
      }
    }
  }
  let dbName = DBINFO(module, data_city);

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

      if (Object.keys(aliasdata).length > 0) {
        for (let prop in aliasdata) {
          let value = aliasdata[prop];
          if (resdata.hasOwnProperty(prop)) {
            resdata[value] = resdata[prop];
            delete resdata[prop];
          } else {
            def_obj[value] = "";
          }
        }
      }
      resdata = Object.assign(def_obj, resdata);
      resp_obj["error"] = 0;
      resp_obj["msg"] = "success";
      resp_obj["data"] = resdata;
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"] = 2;
      resp_obj["msg"] = "no data found";
      return res.status(200).json(resp_obj);
    }
  } catch (err) {
    let log_param = {};
    log_param["action"] = "getData";
    log_param["parentid"] = parentid;
    log_param["data_city"] = data_city;
    log_param["module"] = module;
    log_param["body"] = req.body;
    log_param["errmsg"] = err.message;
    insertLog(log_param);
    return res.status(500).json({error: 1, msg: err.stack});
  }
});

exports.getAllData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateTempInput(req.body);

  // Check Common Validations
  if (!isValid) {
    return res.status(400).json({error: 1, msg: errors});
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;

  let dbName = DBINFO(module, data_city);

  let resp_obj = {};
  try {
    const db = dbConn.getConn().db(dbName);
    let resdata = {};
    for (var i = 0; i < TEMPTABLES.length; i++) {
      let table = TEMPTABLES[i];

      let cond_obj = {};
      if (table === "tbl_business_temp_data") {
        cond_obj["contractid"] = parentid;
      } else {
        cond_obj["parentid"] = parentid;
      }

      let result = await db
        .collection(table)
        .find(cond_obj)
        .project({_id: 0})
        .toArray();

      if (Object.keys(result).length > 0) {
        let tempres = JSON.parse(JSON.stringify(result));
        resdata[table] = tempres[0];
      } else {
        resdata[table] = null;
      }
    }
    if (Object.keys(resdata).length > 0) {
      resp_obj["error"] = 0;
      resp_obj["msg"] = "success";
      resp_obj["data"] = resdata;
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"] = 2;
      resp_obj["msg"] = "no data found";
      return res.status(200).json(resp_obj);
    }
  } catch (err) {
    let log_param = {};
    log_param["action"] = "getAllData";
    log_param["parentid"] = parentid;
    log_param["data_city"] = data_city;
    log_param["module"] = module;
    log_param["body"] = req.body;
    log_param["errmsg"] = err.message;
    insertLog(log_param);
    return res.status(500).json({error: 1, msg: err.stack});
  }
});

exports.tableWiseData = asyncMiddleware(async function(req, res) {
  if (!isEmpty(req.body.debug)) {
    console.log(req.body);
  }
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateTempInput(req.body);

  // Check Common Validations
  if (!isValid) {
    return res.status(400).json({error: 1, msg: errors});
  }

  // Action Specific Validations
  if (isEmpty(req.body.table)) {
    return res.status(400).json({error: 1, msg: "table data required."});
  }

  if (!isJSON(req.body.table)) {
    return res
      .status(400)
      .json({errors: {code: 1, msg: "Please pass valid json in table data."}});
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;
  const tabledata = JSON.parse(req.body.table);

  let dbName = DBINFO(module, data_city);

  let resp_obj = {};

  try {
    const db = dbConn.getConn().db(dbName);
    let found = {};
    let notfound = {};
    let resdata = {};
    let datafound = 0;
    for (let tbl in tabledata) {
      let table = tbl;
      let fld_obj = {_id: 0};
      let def_obj = {}; // default value - if not found return blank value

      if (!isEmpty(tabledata[tbl])) {
        let fields = tabledata[tbl].split(",");
        for (let prop in fields) {
          if (fields.hasOwnProperty(prop)) {
            let value = fields[prop];
            fld_obj[value] = 1;
            def_obj[value] = "";
          }
        }
      }

      let cond_obj = {};
      if (table === "tbl_business_temp_data") {
        cond_obj["contractid"] = parentid;
      } else {
        cond_obj["parentid"] = parentid;
      }

      let result = await db
        .collection(table)
        .find(cond_obj)
        .project(fld_obj)
        .toArray();

      if (Object.keys(result).length > 0) {
        result = JSON.parse(JSON.stringify(result));
        let resdata = result[0];
        resdata = Object.assign(def_obj, resdata);
        found[table] = resdata;
        datafound = 1;
      } else {
        notfound[table] = tabledata[tbl];
      }
    }
    if (datafound === 1) {
      resp_obj["error"] = 0;
      resp_obj["msg"] = "success";
      resp_obj["data"] = found;
      resp_obj["notfound"] = notfound;
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"] = 2;
      resp_obj["msg"] = "no data found";
      return res.status(200).json(resp_obj);
    }
  } catch (err) {
    let log_param = {};
    log_param["action"] = "tableWiseData";
    log_param["parentid"] = parentid;
    log_param["data_city"] = data_city;
    log_param["module"] = module;
    log_param["body"] = req.body;
    log_param["errmsg"] = err.message;
    insertLog(log_param);
    return res.status(500).json({error: 1, msg: err.stack});
  }
});

exports.mergeTableData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateTempInput(req.body);

  // Check Common Validations
  if (!isValid) {
    return res.status(400).json({error: 1, msg: errors});
  }

  // Action Specific Validations
  if (isEmpty(req.body.table)) {
    return res.status(400).json({error: 1, msg: "table data required."});
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;
  const tabledata = JSON.parse(req.body.table);

  let dbName = DBINFO(module, data_city);

  let resp_obj = {};
  let final_data = {};

  try {
    const db = dbConn.getConn().db(dbName);
    let resdata = {};
    for (let tbl in tabledata) {
      let table = tbl;
      let fld_obj = {_id: 0};
      let def_obj = {}; // default value - if not found return blank value

      if (!isEmpty(tabledata[tbl])) {
        let fields = tabledata[tbl].split(",");
        for (let prop in fields) {
          if (fields.hasOwnProperty(prop)) {
            let value = fields[prop];
            fld_obj[value] = 1;
            def_obj[value] = "";
          }
        }
      }

      let cond_obj = {};
      if (table === "tbl_business_temp_data") {
        cond_obj["contractid"] = parentid;
      } else {
        cond_obj["parentid"] = parentid;
      }

      let result = await db
        .collection(table)
        .find(cond_obj)
        .project(fld_obj)
        .toArray();

      if (Object.keys(result).length > 0) {
        result = JSON.parse(JSON.stringify(result));
        let resdata = result[0];
        resdata = Object.assign(def_obj, resdata);
        final_data = Object.assign(final_data, resdata);
      }
    }
    if (Object.keys(final_data).length > 0) {
      resp_obj["error"] = 0;
      resp_obj["msg"] = "success";
      resp_obj["data"] = final_data;
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"] = 2;
      resp_obj["msg"] = "no data found";
      return res.status(200).json(resp_obj);
    }
  } catch (err) {
    let log_param = {};
    log_param["action"] = "mergeTableData";
    log_param["parentid"] = parentid;
    log_param["data_city"] = data_city;
    log_param["module"] = module;
    log_param["body"] = req.body;
    log_param["errmsg"] = err.message;
    insertLog(log_param);
    return res.status(500).json({error: 1, msg: err.stack});
  }
});

exports.sphinxWiseData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  req.body.noparentid = 1;
  const {errors, isValid} = validateTempInput(req.body);

  // Check Common Validations
  if (!isValid) {
    return res.status(400).json({error: 1, msg: errors});
  }

  // Action Specific Validations
  if (isEmpty(req.body.sphinx_id)) {
    return res.status(400).json({error: 1, msg: "sphinx_id required."});
  }
  if (isEmpty(req.body.table)) {
    return res.status(400).json({error: 1, msg: "table data required."});
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;
  const sphinx_id = req.body.sphinx_id.toString();
  const tabledata = JSON.parse(req.body.table);

  let dbName = DBINFO(module, data_city);

  let resp_obj = {};
  let final_data = {};
  try {
    const db = dbConn.getConn().db(dbName);

    let fields_gen = tabledata["tbl_companymaster_generalinfo_shadow"];
    let tbl_gen = "tbl_companymaster_generalinfo_shadow";

    let fld_gen = {_id: 0};
    let def_gen = {}; // default value - if not found return blank value

    if (!isEmpty(fields_gen)) {
      let genfld = fields_gen.split(",");
      for (let genprop in genfld) {
        if (genfld.hasOwnProperty(genprop)) {
          let genval = genfld[genprop];
          fld_gen[genval] = 1;
          def_gen[genval] = "";
        }
      }
    }

    let cond_gen = {};
    cond_gen["sphinx_id"] = sphinx_id;

    let resdatagen = {};
    let resultgen = await db
      .collection(tbl_gen)
      .find(cond_gen)
      .project(fld_gen)
      .toArray();

    if (Object.keys(resultgen).length > 0) {
      resultgen = JSON.parse(JSON.stringify(resultgen));
      let resdatagen = resultgen[0];
      resdatagen = Object.assign(def_gen, resdatagen);
      final_data = Object.assign(final_data, resdatagen);

      if (!isEmpty(resdatagen["parentid"])) {
        let fields_inter = tabledata["tbl_temp_intermediate"];
        let tbl_inter = "tbl_temp_intermediate";

        let fld_inter = {_id: 0};
        let def_inter = {}; // default value - if not found return blank value

        if (!isEmpty(fields_inter)) {
          let interfld = fields_inter.split(",");
          for (let interprop in interfld) {
            if (interfld.hasOwnProperty(interprop)) {
              let inter_val = interfld[interprop];
              fld_inter[inter_val] = 1;
              def_inter[inter_val] = "";
            }
          }
        }

        let cond_inter = {};
        cond_inter["parentid"] = resdatagen["parentid"];

        let resdatainter = {};
        let resultinter = await db
          .collection(tbl_inter)
          .find(cond_inter)
          .project(fld_inter)
          .toArray();

        if (Object.keys(resultinter).length > 0) {
          resultinter = JSON.parse(JSON.stringify(resultinter));
          let resdatainter = resultinter[0];
          resdatainter = Object.assign(def_inter, resdatainter);
          final_data = Object.assign(final_data, resdatainter);
          resp_obj["error"] = 0;
          resp_obj["msg"] = "success";
          resp_obj["data"] = final_data;
          return res.status(200).json(resp_obj);
        } else {
          // to return only gendata
          resp_obj["error"] = 0;
          resp_obj["msg"] = "success";
          resp_obj["data"] = final_data;
          return res.status(200).json(resp_obj);
        }
      } else {
        // to return only gendata
        resp_obj["error"] = 0;
        resp_obj["msg"] = "success";
        resp_obj["data"] = final_data;
        return res.status(200).json(resp_obj);
      }
    } else {
      resp_obj["error"] = 2;
      resp_obj["msg"] = "no data found";
      return res.status(200).json(resp_obj);
    }
  } catch (err) {
    let log_param = {};
    log_param["action"] = "sphinxWiseData";
    log_param["parentid"] = sphinx_id;
    log_param["data_city"] = data_city;
    log_param["module"] = module;
    log_param["body"] = req.body;
    log_param["errmsg"] = err.message;
    insertLog(log_param);
    return res.status(500).json({error: 1, msg: err.stack});
  }
});

exports.joinTables = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  req.body.noparentid = 1;
  const {errors, isValid} = validateTempInput(req.body);

  // Check Common Validations
  if (!isValid) {
    return res.status(400).json({error: 1, msg: errors});
  }

  // Action Specific Validations
  if (isEmpty(req.body.t1)) {
    return res
      .status(400)
      .json({error: 1, msg: "primary join table t1 missing."});
  }
  if (isEmpty(req.body.t2)) {
    return res
      .status(400)
      .json({error: 1, msg: "secondary join table t2 missing."});
  }

  if (isEmpty(req.body.t1_on)) {
    return res
      .status(400)
      .json({error: 1, msg: "primary join condition t1_on missing."});
  }

  if (isEmpty(req.body.t2_on)) {
    return res.status(400).json({
      error: 1,
      msg: "secondary join condition t2_on missing."
    });
  }
  let t1_mtch_obj = {},
    t2_mtch_obj = {};

  if (!isEmpty(req.body.t1_mtch)) {
    t1_mtch_obj = JSON.parse(req.body.t1_mtch);
  }

  if (!isEmpty(req.body.t2_mtch)) {
    t2_mtch_obj = JSON.parse(req.body.t2_mtch);
  }

  if (isEmpty(t1_mtch_obj) && isEmpty(t2_mtch_obj)) {
    return res.status(400).json({
      error: 1,
      msg: "match field missing."
    });
  }

  let fld_obj = {};
  let def_t1 = {}; // default value - if not found return blank value
  let def_t2 = {}; // default value - if not found return blank value

  if (!isEmpty(req.body.t1_fld)) {
    let fields_t1 = req.body.t1_fld.split(",");
    for (let prop_t1 in fields_t1) {
      if (fields_t1.hasOwnProperty(prop_t1)) {
        let value_t1 = fields_t1[prop_t1];
        fld_obj[value_t1] = 1;
        def_t1[value_t1] = "";
      }
    }
  }

  if (!isEmpty(req.body.t2_fld)) {
    let fields_t2 = req.body.t2_fld.split(",");
    for (let prop_t2 in fields_t2) {
      if (fields_t2.hasOwnProperty(prop_t2)) {
        let value_t2 = fields_t2[prop_t2];
        fld_obj["data." + value_t2] = 1;

        def_t2[value_t2] = "";
      }
    }
  }

  let t1_alias_obj = {};
  if (!isEmpty(req.body.t1_alias)) {
    t1_alias_obj = JSON.parse(req.body.t1_alias);
    for (let t1_alias_prop in t1_alias_obj) {
      fld_obj[t1_alias_prop] = 1;
    }
  }

  let t2_alias_obj = {};
  if (!isEmpty(req.body.t2_alias)) {
    t2_alias_obj = JSON.parse(req.body.t2_alias);
    for (let t2_alias_prop in t2_alias_obj) {
      fld_obj["data." + t2_alias_prop] = 1;
    }
  }

  if (!isEmpty(fld_obj)) {
    fld_obj["_id"] = 0;
  } else {
    return res.status(400).json({
      error: 1,
      msg: "select field required."
    });
  }

  // Assigning Params

  const data_city = req.body.data_city;
  const module = req.body.module;
  const table = req.body.t1;
  const from = req.body.t2;
  const localField = req.body.t1_on;
  const foreignField = req.body.t2_on;

  let dbName = DBINFO(module, data_city);

  let result = {};
  let resp_obj = {};
  try {
    const db = dbConn.getConn().db(dbName);

    if (!isEmpty(t1_mtch_obj) && !isEmpty(t2_mtch_obj)) {
      let temparr = Object.keys(t2_mtch_obj);
      let t2_key = temparr[0];
      let t2_val = t2_mtch_obj[t2_key];
      let t2_mtch_new = {};
      t2_mtch_new["data." + t2_key] = t2_val;

      result = await db
        .collection(table)
        .aggregate([
          {
            $match: t1_mtch_obj
          },
          {
            $lookup: {
              from: from,
              localField: localField,
              foreignField: foreignField,
              as: "data"
            }
          },
          {
            $match: t2_mtch_new
          },
          {
            $project: fld_obj
          }
        ])
        .toArray();
    } else if (!isEmpty(t1_mtch_obj)) {
      result = await db
        .collection(table)
        .aggregate([
          {
            $match: t1_mtch_obj
          },
          {
            $lookup: {
              from: from,
              localField: localField,
              foreignField: foreignField,
              as: "data"
            }
          },
          {
            $project: fld_obj
          }
        ])
        .toArray();
    } else if (!isEmpty(t2_mtch_obj)) {
      let temparr = Object.keys(t2_mtch_obj);
      let t2_key = temparr[0];
      let t2_val = t2_mtch_obj[t2_key];
      let t2_mtch_new = {};
      t2_mtch_new["data." + t2_key] = t2_val;
      result = await db
        .collection(table)
        .aggregate([
          {
            $lookup: {
              from: from,
              localField: localField,
              foreignField: foreignField,
              as: "data"
            }
          },
          {
            $match: t2_mtch_new
          },
          {
            $project: fld_obj
          }
        ])
        .toArray();
    } else {
      return res.status(400).json({
        error: 1,
        msg: "select field required."
      });
    }
    if (Object.keys(result).length > 0) {
      result = JSON.parse(JSON.stringify(result));
      let t1_res_obj = {};
      let t2_res_obj = {};
      let final_result = [];

      for (let prop in result[0]) {
        let val = result[0][prop];
        if (prop == "data") {
          for (let dkey in val[0]) {
            t2_res_obj[dkey] = val[0][dkey];
          }
        } else {
          t1_res_obj[prop] = val;
        }
      }

      if (Object.keys(t1_alias_obj).length > 0) {
        for (let t1_prop in t1_alias_obj) {
          let t1_val = t1_alias_obj[t1_prop];
          if (t1_res_obj.hasOwnProperty(t1_prop)) {
            t1_res_obj[t1_val] = t1_res_obj[t1_prop];
            delete t1_res_obj[t1_prop];
          } else {
            def_t1[t1_val] = "";
          }
        }
      }
      t1_res_obj = Object.assign(def_t1, t1_res_obj);

      if (Object.keys(t2_alias_obj).length > 0) {
        for (let t2_prop in t2_alias_obj) {
          let t2_val = t2_alias_obj[t2_prop];
          if (t2_res_obj.hasOwnProperty(t2_prop)) {
            t2_res_obj[t2_val] = t2_res_obj[t2_prop];
            delete t2_res_obj[t2_prop];
          } else {
            def_t2[t2_val] = "";
          }
        }
      }
      t2_res_obj = Object.assign(def_t2, t2_res_obj);
      final_result.push(Object.assign(t1_res_obj, t2_res_obj));
      resp_obj["error"] = 0;
      resp_obj["msg"] = "success";
      resp_obj["data"] = final_result;
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"] = 2;
      resp_obj["msg"] = "no data found";
      return res.status(200).json(resp_obj);
    }
  } catch (err) {
    let log_param = {};
    log_param["action"] = "joinTables";
    log_param["parentid"] = table;
    log_param["data_city"] = data_city;
    log_param["module"] = module;
    log_param["body"] = req.body;
    log_param["errmsg"] = err.message;
    insertLog(log_param);
    return res.status(500).json({error: 1, msg: err.stack});
  }
});

exports.insertData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateTempInput(req.body);

  // Check Common Validations
  if (!isValid) {
    return res.status(400).json({error: 1, msg: errors});
  }

  // Action Specific validations
  let table_data = {};
  if (isEmpty(req.body.table_data)) {
    return res.status(400).json({error: 1, msg: "table_data is required."});
  } else {
    table_data = JSON.parse(req.body.table_data);
  }
  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;

  let dbName = DBINFO(module, data_city);

  let resp_obj = {};
  let resdata = {};
  try {
    const db = dbConn.getConn().db(dbName);

    for (var i = 0; i < TEMPTABLES.length; i++) {
      let table = TEMPTABLES[i];

      if (!isEmpty(table_data[table])) {
        let tbl_obj = {};
        tbl_obj = table_data[table];
        let query = {};
        if (table === "tbl_business_temp_data") {
          query["contractid"] = parentid;
        } else {
          query["parentid"] = parentid;
        }

        if (
          !isEmpty(tbl_obj["insertdata"]) &&
          !isEmpty(tbl_obj["updatedata"])
        ) {
          let ins_fields = {};
          tbl_obj["insertdata"] = removeNonUTF(tbl_obj["insertdata"]);
          ins_fields = JSON.parse(JSON.stringify(tbl_obj["insertdata"]));

          let upt_fields = {};
          tbl_obj["updatedata"] = removeNonUTF(tbl_obj["updatedata"]);
          upt_fields = JSON.parse(JSON.stringify(tbl_obj["updatedata"]));

          let newvalues = {$set: upt_fields, $setOnInsert: ins_fields};
          var options = {upsert: true};

          let updateRes = await db
            .collection(table)
            .updateOne(query, newvalues, options);

          if (Object.keys(updateRes).length > 0) {
            let qryRes = {};

            qryRes.match = updateRes.result.n;
            qryRes.modify = updateRes.result.nModified;
            qryRes.insert = updateRes.result.ok;

            resdata[table] = qryRes;
          } else {
            resdata[table] = null;
          }
        } else if (!isEmpty(tbl_obj["updatedata"])) {
          let upt_fields = {};
          tbl_obj["updatedata"] = removeNonUTF(tbl_obj["updatedata"]);
          upt_fields = JSON.parse(JSON.stringify(tbl_obj["updatedata"]));

          let newvalues = {$set: upt_fields};
          var options = {upsert: true};

          let updateRes = await db
            .collection(table)
            .updateOne(query, newvalues, options);

          if (Object.keys(updateRes).length > 0) {
            let qryRes = {};

            qryRes.match = updateRes.result.n;
            qryRes.modify = updateRes.result.nModified;
            qryRes.insert = updateRes.result.ok;
            resdata[table] = qryRes;
          } else if (!isEmpty(tbl_obj["insertdata"])) {
            resdata[table] = null;
          }
        } else {
          return res.status(400).json({
            error: 1,
            msg: `invalid ${table} table data provided.`
          });
        }
      }
    }
    if (Object.keys(resdata).length > 0) {
      resp_obj["error"] = 0;
      resp_obj["msg"] = "success";
      resp_obj["info"] = resdata;
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"] = 1;
      resp_obj["msg"] = "problem in updating data";
      return res.status(500).json(resp_obj);
    }
  } catch (err) {
    let log_param = {};
    log_param["action"] = "insertData";
    log_param["parentid"] = parentid;
    log_param["data_city"] = data_city;
    log_param["module"] = module;
    log_param["body"] = req.body;
    log_param["errmsg"] = err.message;
    insertLog(log_param);
    return res.status(500).json({error: 1, msg: err.stack});
  }
});

exports.insertMultiSource = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateTempInput(req.body);

  // Check Common Validations
  if (!isValid) {
    return res.status(400).json({error: 1, msg: errors});
  }

  // Action Specific validations
  let table_data = {};
  if (isEmpty(req.body.table_data)) {
    return res.status(400).json({error: 1, msg: "table_data is required."});
  } else {
    table_data = JSON.parse(req.body.table_data);
  }
  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const modules_arr = ["tme", "me"];
  let resp_obj = {};
  let resdata = {};
  let done_flag = 0;
  modules_arr.forEach(async function(module) {
    let dbName = DBINFO(module, data_city);
    resdata[module] = {};
    try {
      const db = dbConn.getConn().db(dbName);

      for (var i = 0; i < TEMPTABLES.length; i++) {
        let table = TEMPTABLES[i];

        if (!isEmpty(table_data[table])) {
          let tbl_obj = {};
          tbl_obj = table_data[table];
          let query = {};
          if (table === "tbl_business_temp_data") {
            query["contractid"] = parentid;
          } else {
            query["parentid"] = parentid;
          }

          if (
            !isEmpty(tbl_obj["insertdata"]) &&
            !isEmpty(tbl_obj["updatedata"])
          ) {
            let ins_fields = {};
            tbl_obj["insertdata"] = removeNonUTF(tbl_obj["insertdata"]);
            ins_fields = JSON.parse(JSON.stringify(tbl_obj["insertdata"]));

            let upt_fields = {};
            tbl_obj["updatedata"] = removeNonUTF(tbl_obj["updatedata"]);
            upt_fields = JSON.parse(JSON.stringify(tbl_obj["updatedata"]));

            let newvalues = {$set: upt_fields, $setOnInsert: ins_fields};
            var options = {upsert: true};

            let updateRes = await db
              .collection(table)
              .updateOne(query, newvalues, options);

            if (Object.keys(updateRes).length > 0) {
              let qryRes = {};

              qryRes.match = updateRes.result.n;
              qryRes.modify = updateRes.result.nModified;
              qryRes.insert = updateRes.result.ok;

              resdata[module][table] = qryRes;
            } else {
              resdata[module][table] = null;
            }
          } else if (!isEmpty(tbl_obj["updatedata"])) {
            let upt_fields = {};
            tbl_obj["updatedata"] = removeNonUTF(tbl_obj["updatedata"]);
            upt_fields = JSON.parse(JSON.stringify(tbl_obj["updatedata"]));

            let newvalues = {$set: upt_fields};
            var options = {upsert: true};

            let updateRes = await db
              .collection(table)
              .updateOne(query, newvalues, options);

            if (Object.keys(updateRes).length > 0) {
              let qryRes = {};

              qryRes.match = updateRes.result.n;
              qryRes.modify = updateRes.result.nModified;
              qryRes.insert = updateRes.result.ok;
              resdata[module][table] = qryRes;
            } else if (!isEmpty(tbl_obj["insertdata"])) {
              resdata[module][table] = null;
            }
          } else {
            return res.status(400).json({
              error: 1,
              msg: `invalid ${table} table data provided.`
            });
          }
        }
      }
      done_flag++;
    } catch (err) {
      let log_param = {};
      log_param["action"] = "insertMultiSource";
      log_param["parentid"] = parentid;
      log_param["data_city"] = data_city;
      log_param["module"] = module;
      log_param["body"] = req.body;
      log_param["errmsg"] = err.message;
      insertLog(log_param);
      return res.status(500).json({error: 1, msg: err.stack});
    }

    if (done_flag == 2 && Object.keys(resdata).length > 0) {
      resp_obj["error"] = 0;
      resp_obj["msg"] = "success";
      resp_obj["info"] = resdata;
      return res.status(200).json(resp_obj);
    } else if (done_flag == 2 && Object.keys(resdata).length <= 0) {
      resp_obj["error"] = 1;
      resp_obj["msg"] = "problem in updating data";
      return res.status(500).json(resp_obj);
    }
  });
});

exports.getMatchedData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  req.body.noparentid = 1;
  const {errors, isValid} = validateTempInput(req.body);

  // Check Common Validations
  if (!isValid) {
    return res.status(400).json({error: 1, msg: errors});
  }

  // Action Specific Validations
  if (isEmpty(req.body.table)) {
    return res.status(400).json({error: 1, msg: "table is required."});
  }
  // Simple where condition key value pair
  let fnl_qry = [];
  let query = {};
  if (!isEmpty(req.body.queryfield)) {
    query = JSON.parse(req.body.queryfield);
    fnl_qry.push(query);
  }

  // Date operations (gte,lte,gt,lt)
  let dtqry = {};
  if (!isEmpty(req.body.daterange)) {
    let daterange = JSON.parse(req.body.daterange);
    let dtvalues = {};
    for (let dtfld in daterange) {
      let dtval = daterange[dtfld];
      for (let dtop in dtval) {
        if (_.includes(DATE_OPERATORS, dtop)) {
          dtvalues["$" + dtop] = dtval[dtop];
          dtqry[dtfld] = dtvalues;
        } else {
          dtvalues.$gte = dtval[0];
          dtvalues.$lte = dtval[1];
          dtqry[dtfld] = dtvalues;
        }
      }
    }
    if (Object.keys(dtvalues).length <= 0) {
      return res.status(400).json({
        error: 1,
        msg: "invalid daterange passed."
      });
    } else {
      fnl_qry.push(dtqry);
    }
  }
  // Not Equal To
  let neqry = {};
  if (!isEmpty(req.body.neqry)) {
    let nedata = JSON.parse(req.body.ne);

    for (let nekey in nedata) {
      let neval = nedata[nekey];
      if (Array.isArray(neval)) {
        let nevalues = {};
        nevalues.$ne = neval;
        neqry[nekey] = nevalues;
      } else {
        let nevalarr = neval.split("|~|");
        let nevalues = {};
        nevalues.$ne = nevalarr;
        neqry[nekey] = nevalues;
      }
    }
    fnl_qry.push(neqry);
  }
  // In
  let inqry = {};
  if (!isEmpty(req.body.in)) {
    let indata = JSON.parse(req.body.in);
    for (let inkey in indata) {
      let inval = indata[inkey];
      if (Array.isArray(inval)) {
        let invalues = {};
        invalues.$in = inval;
        inqry[inkey] = invalues;
      } else {
        let invalarr = inval.split("|~|"); // $in needs an array
        let invalues = {};
        invalues.$in = invalarr;
        inqry[inkey] = invalues;
      }
    }
    fnl_qry.push(inqry);
  }
  // Not In
  let ninqry = {};
  if (!isEmpty(req.body.nin)) {
    let nindata = JSON.parse(req.body.nin);
    for (let ninkey in nindata) {
      let ninval = nindata[ninkey];
      if (Array.isArray(ninval)) {
        let ninvalues = {};
        ninvalues.$nin = ninval;
        ninqry[ninkey] = ninvalues;
      } else {
        let ninvalarr = ninval.split("|~|"); // $nin needs an array
        let ninvalues = {};
        ninvalues.$nin = ninvalarr;
        ninqry[ninkey] = ninvalues;
      }
    }
    fnl_qry.push(ninqry);
  }
  // Like
  let likeqry = {};
  if (!isEmpty(req.body.like)) {
    let likedata = JSON.parse(req.body.like);
    for (let likekey in likedata) {
      let likeval = likedata[likekey];
      let likevalues = {};
      likevalues.$regex = new RegExp("^" + likeval, "i");

      likeqry[likekey] = likevalues;
    }
    fnl_qry.push(likeqry);
  }

  // Query Optional Params

  // Sort
  let options = {};
  if (!isEmpty(req.body.orderby)) {
    let sort_arr = [];
    let sortdata = JSON.parse(req.body.orderby);
    for (let sortkey in sortdata) {
      let sortval = sortdata[sortkey];
      let sortopt = "";
      let innerObj = [];
      if (sortval == 1) {
        sortopt = "asc";
      } else {
        sortopt = "desc";
      }
      sort_arr.push([sortkey, sortopt]);
    }
    options["sort"] = sort_arr;
  }
  if (!isEmpty(req.body.skip)) {
    let skipval = parseInt(req.body.skip);
    options["skip"] = skipval;
  }
  if (!isEmpty(req.body.limit)) {
    let limitval = parseInt(req.body.limit);
    options["limit"] = limitval;
  }
  let fld_obj = {_id: 0};
  let def_obj = {}; // default value - if not found return blank value

  if (!isEmpty(req.body.fields)) {
    let fields = req.body.fields.split(",");
    for (let prop in fields) {
      if (fields.hasOwnProperty(prop)) {
        let value = fields[prop];
        fld_obj[value] = 1;
        def_obj[value] = "";
      }
    }
  }
  let aliasdata = {};
  if (!isEmpty(req.body.aliaskey)) {
    aliasdata = JSON.parse(req.body.aliaskey);

    for (let prop in aliasdata) {
      if (aliasdata.hasOwnProperty(prop)) {
        fld_obj[prop] = 1;
      }
    }
  }
  const data_city = req.body.data_city;
  const module = req.body.module;
  const table = req.body.table;

  let dbName = DBINFO(module, data_city);

  const client = await MongoClient.connect(
    conf_var.mongoURISecondary,
    {useNewUrlParser: true}
  );
  let resp_obj = {};
  let final_data = [];
  try {
    const db = client.db(dbName);
    if (fnl_qry.length <= 0) {
      return res.status(400).json({
        error: 1,
        msg: "Please pass atleast one criteria to check."
      });
    }
    let result = await db
      .collection(table)
      .find({$and: fnl_qry}, options)
      .project(fld_obj)
      .toArray();

    var dynamic_obj = {};
    if (Object.keys(result).length > 0) {
      result = JSON.parse(JSON.stringify(result));
      for (let reskey in result) {
        dynamic_obj[reskey] = {};
        Object.assign(dynamic_obj[reskey], def_obj);
        let resval = {};
        resval = result[reskey];

        if (Object.keys(aliasdata).length > 0) {
          for (let prop in aliasdata) {
            let value = aliasdata[prop];
            if (resval.hasOwnProperty(prop)) {
              resval[value] = resval[prop];
              delete resval[prop];
            } else {
              dynamic_obj[reskey][value] = "";
            }
          }
        }
        let tempobj = {};
        tempobj = Object.assign(dynamic_obj[reskey], resval);
        final_data.push(tempobj);
      }
      resp_obj["error"] = 0;
      resp_obj["msg"] = "success";
      resp_obj["data"] = final_data;
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"] = 2;
      resp_obj["msg"] = "no data found";
      return res.status(200).json(resp_obj);
    }
  } catch (err) {
    let log_param = {};
    log_param["action"] = "getMatchedData";
    log_param["parentid"] = table;
    log_param["data_city"] = data_city;
    log_param["module"] = module;
    log_param["body"] = req.body;
    log_param["errmsg"] = err.message;
    insertLog(log_param);
    return res.status(500).json({error: 1, msg: err.stack});
  } finally {
    client.close();
  }
});
async function insertLog(params) {
  try {
    let dbName = DBINFO(params["module"], params["data_city"]);
    const dbLog = dbConn.getConn().db(dbName);
    let table = "errorlogs";
    let createdat = moment().format("YYYY-MM-DD HH:mm:ss");
    let qryobj = {
      action: params["action"],
      parentid: params["parentid"],
      data_city: params["data_city"],
      module: params["module"],
      body: params["body"],
      errmsg: params["errmsg"],
      createdat: createdat
    };
    let result = await dbLog.collection(table).insertOne(qryobj);
  } catch (err) {
    console.log("LOG ERROR !!!", err);
  }
}

exports.getLog = async function(req, res) {
  if (isEmpty(req.body.type)) {
    return res.status(400).json({error: 1, msg: "type is blank"});
  }

  // Assigning Params
  const type = req.body.type;

  let log_type = ["pm2-output", "pm2-error", "error"];

  if (!_.includes(log_type, type)) {
    return res.status(400).json({
      error: 1,
      msg: "Please pass type (pm2-output|pm2-error|error) "
    });
  }

  let dirpath = "",
    filePath = "";
  switch (type) {
    case "pm2-output":
      dirpath = __basedir + "/logs/pm2/";
      filePath = dirpath + "output.log";
      break;
    case "pm2-error":
      dirpath = __basedir + "/logs/pm2/";
      filePath = dirpath + "error.log";
      break;
    case "error":
      dirpath = __basedir + "/logs/errors/";
      filePath = dirpath + moment().format("YYYY-MM-DD") + ".log";
      break;
  }

  const readLastLines = require("read-last-lines");
  readLastLines
    .read(filePath, 50)
    .then(lines => {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.write(lines);
      res.end();
    })
    .catch(err => {
      return res.status(500).json({error: 1, msg: err});
    });
};
