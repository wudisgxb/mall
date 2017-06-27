

module.exports = {
  async find (ctx, next) {
    console.log(ctx.query)
    const {lat, lgt} = ctx.query
    // TODO 第三方地图API 根据经纬度获取地理位置
    const address = '南京建邺区河西大街'
    ctx.body = address
  }
}