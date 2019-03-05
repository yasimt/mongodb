module.exports = {
  devmode: 0,
  mongoURI:
    "mongodb://genio:genio123@tmedashboard2:27017,tmedashboard4:27017,tmedashboard3:27017/admin?replicaSet=tmedashboard&readPreference=primaryPreferred",
  mongoURISecondary:
    "mongodb://genio:genio123@tmedashboard2:27017,tmedashboard4:27017,tmedashboard3:27017/admin?replicaSet=tmedashboard&readPreference=secondaryPreferred",
  mongodb: {
    tme: {
      mumbai: "tme_mumbai",
      delhi: "tme_delhi",
      kolkata: "tme_kolkata",
      bangalore: "tme_bangalore",
      chennai: "tme_chennai",
      pune: "tme_pune",
      hyderabad: "tme_hyderabad",
      ahmedabad: "tme_ahmedabad",
      remote: "tme_remote"
    },
    me: {
      mumbai: "online_regis_mumbai",
      delhi: "online_regis_delhi",
      kolkata: "online_regis_kolkata",
      bangalore: "online_regis_bangalore",
      chennai: "online_regis_chennai",
      pune: "online_regis_pune",
      hyderabad: "online_regis_hyderabad",
      ahmedabad: "online_regis_ahmedabad",
      remote: "online_regis_remote_cities"
    }
  }
};
