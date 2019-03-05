function initiator(router, app) {
  app.use("/api/employee/", router);

  const empCntlr = require(__basedir + "/controllers/employee.controller");

  router.get("/test", (req, res) => res.json({msg: "Bform Works"}));
  router.post("/get-emp-data", empCntlr.getEmployeeData);
  app.use("/", router);
  router.get("/health-check", (req, res) => {
    res.status(200).send("OK");
  });
}
module.exports = initiator;
