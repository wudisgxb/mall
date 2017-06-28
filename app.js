const app = new(require('koa'))()
const port = require('./app/config/config').port
const logger = require('koa-log4').getLogger('app')

// 绑定中间件
const mountMiddleWares = require('./app/middleware/index')
mountMiddleWares(app)

// 绑定路由
const mountRouters = require('./app/routers/index')
mountRouters(app)

// 启动定时任务
const tasks = require('./app/tasks/index')
tasks(app)

app.listen(port, () => {
  logger.info(`Listening on port: ${port}`)
})
