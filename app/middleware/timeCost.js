/**
 * Created by Thinkpad on 2017/3/19.
 */
const debug = require('debug')('timeCost: ')

module.exports = function (options) {
  return async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start

    debug(`${ctx.method} ${ctx.url} - ${ms}ms`)
  }
}