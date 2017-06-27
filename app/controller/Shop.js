/**
 * Created by Thinkpad on 2017/3/20.
 */

const Shop = rootRequire('app/db/mongo/Shop')

module.exports = {
  async list (ctx, next) {
    ctx.body = {
      signPackage: ctx.signPackage,
      shops: Shop.findAll()
    }
  },

  async save (ctx, next) {
    console.log(ctx.request.body)
    const shop = new Shop(ctx.request.body)
    const result = await Shop.save(shop)
    ctx.body = result
  },

  async findOne (ctx, next) {
    console.log(ctx.params)
    const shop = await Shop.findOne(ctx.params.id)
    
  }
}