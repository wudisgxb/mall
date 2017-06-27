/**
 * Created by Thinkpad on 2017/3/19.
 */

let scanCounts = []

const router = new(rootRequire('koa-router'))()

const logger = rootRequire('koa-log4').getLogger('qrcode')


router.get('/api/v1/qrcode', async(ctx, next) => {

    // 查询条件
  const cond = {
    scene: ctx.query.scene,
    merchantName: ctx.query.merchantName
  }

  const scan = scanCounts.find(e => e.scene === cond.scene && e.merchantName === cond.merchantName)
  if (scan) {
    scan.count += 1
    logger.info(`scene: ${cond.scene}, merchantName: ${cond.merchantName}, scanCount: ${scan.count}`)
  } else {
    scanCounts.push({
      scene: cond.scene,
      merchantName: cond.merchantName,
      count: 1
    })
    logger.info(`scene: ${cond.scene}, merchantName: ${cond.merchantName}, scanCount: 1`)
  }

  // 通过scene/merchantName查询qrcode
  const qrcode = {
    scene: cond.scene,
    merchantName: cond.merchantName,
    url: 'http://3gimg.qq.com/lightmap/v1/marker/?marker=$marker$&referer=myapp&key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77',
    enable: true,
    numberOfScan: 1
  }

  const merchant = {
    // name: '粤电工照明灯具厂',
    name: '晨鑫电器灯饰批发点',
    latitude: 31.71624,
    longitude: 119.01561,
    address: '溧水区经济开发区淳溧路18号(岔路口东风风行4S店对面, 辛鑫达物流大院内)'
  }

  if (qrcode.enable) {
    const mapUrl = qrcode.url.replace(/\$[^$]+\$/, function(m) {
      return encodeURIComponent(`coord:${merchant.latitude},${merchant.longitude};title:${merchant.name};addr:${merchant.address}`)
    })
    logger.info(`qrcode enabled; redirect url: ${mapUrl}`)
    ctx.body = {
      url: mapUrl
    }
  } else {
    logger.info(`qrcode disabled; redirect url: map.qq.com`)
    ctx.body = { url: 'map.qq.com' }
  }

})


router.get('/api/v1/qrcode-count', async(ctx, next) => {
   // 查询条件
  const cond = {
    scene: ctx.query.scene,
    merchantName: ctx.query.merchantName
  }

  const scan = scanCounts.find(e => e.scene === cond.scene && e.merchantName === cond.merchantName)

  ctx.body = {
    scene: cond.scene,
    merchantName: cond.merchantName,
    count: scan ? scan.count : 0
  }
})

module.exports = router
