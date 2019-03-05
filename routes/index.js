function initiator(router, app) {
  let api_path = __basedir + "/routes/api";

  require(api_path + "/tempdata.js")(router, app);
  require(api_path + "/empinfo.js")(router, app);
}
module.exports = initiator;
