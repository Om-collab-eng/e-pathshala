module.exports = {
  apps : [{
    name: "librika",
    script: "app.js",
    interpreter: "node",
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: "production"
    }
  }]
}
