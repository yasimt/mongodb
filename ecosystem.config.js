module.exports = {
  apps: [
    {
      name: "server",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      output: "./logs/pm2/output.log",
      error: "./logs/pm2/error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD hh:mm:ss",
      log_type: "json",
      node_args: ["--max_old_space_size=500"]
    }
  ]
};
