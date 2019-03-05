function initiator(router, app) {
  //app.use('/jdboxNode/user', routerApp);
  app.use("/api/shadowInfo/", router);

  const tempCntlr = require(__basedir + "/controllers/tempdata.controller");

  router.get("/test", (req, res) => res.json({msg: "Bform Works"}));
  router.post("/getData", tempCntlr.getData);
  router.post("/getalldata", tempCntlr.getAllData);
  router.post("/getshadowdata", tempCntlr.tableWiseData);
  router.post("/gettabledata", tempCntlr.mergeTableData);
  router.post("/getgeniodata", tempCntlr.sphinxWiseData);
  router.post("/getjoin", tempCntlr.joinTables);
  router.post("/getdatamatch", tempCntlr.getMatchedData);

  router.post("/insertdata", tempCntlr.insertData);
  router.post("/insertmultisrc", tempCntlr.insertMultiSource);
  router.post("/getlog", tempCntlr.getLog);
}
module.exports = initiator;
