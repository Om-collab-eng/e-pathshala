module.exports = {
  apps : [{
    name: "library-system",
    script: "python",
    args: "server.py",
    cwd: "c:/Users/ayush/Desktop/librARY",
    interpreter: "none",
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
