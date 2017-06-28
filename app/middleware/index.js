/**
 * Created by Thinkpad on 2017/3/19.
 */
const convert = require('koa-convert')
const json = require('koa-json')
const koaBody = require('koa-body')
const cors = require('koa-cors')
const static = require('koa-static')
const jwt = require('koa-jwt')

const log4js = require('koa-log4')
require('../../log') //引入（运行）日志配置文件， 生产日志目录及相应文件
const logger = log4js.getLogger('app')

const timeCost = require('./timeCost')
const path = require('path')
const ApiError = require('../db/mongo/ApiError')

module.exports = function(app) {
  app.use(async(ctx, next) => {
    try {
      await next()
    } catch (err) {
      if (err.status === 401) {
        ctx.status = 401
        ctx.body = 'Protected resource, use Authorization header to get access; Format is "Authorization: Bearer <token>"\n'
      } else {
        ctx.status = err.status || 500
        if (err instanceof ApiError) {
          ctx.body = err
        } else {
          ctx.body = 'Server Internal Error!'
        }
        ctx.app.emit('error', err, ctx)
      }
    }
  })

  app.use(log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' }))

  app.use(koaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join(__dirname, '..', 'public/images')
    }
  }))
  app.use(convert(cors()))
  app.use(convert(json()))

  app.use(jwt({ secret: require('../config/config').jwtSecret }).unless(function() {
    // 匹配需要验证token的路径
    return !(/needAuth/i.test(this.originalUrl))
  }))

  app.use(timeCost())

  app.use(static(path.join(__dirname, '..', 'public/images')))

  // errorHandler
  app.on('error', function(err, ctx) {
    logger.error('server error', err, ctx)
  })
}
