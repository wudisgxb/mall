const ApiError = require('../db/mongo/ApiError')
const ApiResult = require('../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')


module.exports = {
  async setDefault (ctx, next) {
    const addressId = ctx.request.params.id
    const userId = ctx.state.user._id
    logger.info(`url: ${ctx.url}; method: ${ctx.method}; addressId: ${addressId}; userId: ${userId}`)
    let resp 
    try {
      resp = await Address.setDefault(addressId, userId)
      if (!resp) {
        logger.error('未找到地址!', ctx)
        throw new ApiError(ApiResult.Address.NOT_FOUND_ADDRESS)
      }
    } catch (e) {
      logger.error('设置默认地址失败!', e)
      throw new ApiError(ApiResult.Address.DB_ERROR)
    }
    return ctx.body = new ApiResult(ApiResult.Address.SUCCESS)
  },

  

  async getAll (ctx, next) {

  },

  async get (ctx, next) {

  },

  async post (ctx, next) {

  },

  async put (ctx, next) {

  },

  async delete (ctx, next) {

  }
}