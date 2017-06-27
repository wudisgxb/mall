/**
 * Created by Thinkpad on 2017/3/19.
 */
module.exports = {
  async index (ctx, next) {

    console.log(`end: ${new Date()}`)
    ctx.body = [{
      id: 0,
      name: 'user1'
    }, {
      id: 1,
      name: 'user2'
    }]
  }
}