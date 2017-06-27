/**
 * Created by Thinkpad on 2017/3/20.
 */

const wechat = rootRequire('co-wechat')
const convert = rootRequire('koa-convert')
const debug = rootRequire('debug')('WechatController')
const wechatConfig = rootRequire('config/config').wechat
const fetchTuringResp = rootRequire('app/thirdApi/index').fetchTuringResp
const logger = rootRequire('koa-log4').getLogger('WeChat')


module.exports = convert(wechat(wechatConfig).middleware(function*() {
  const msg = this.weixin
  logger.info(`weixin msgType: ${msg.MsgType}`)
    // 文字消息
  if (msg.MsgType === 'text') {
    const data = yield fetchTuringResp(msg.Content)
    debug(`turingRobot resp: ${data}`)
    return this.body = data.text
  }

  // TODO 上报地理位置消息
  if (msg.MsgType === 'event' && msg.Event === 'LOCATION') {
    return this.body = ''
  }


  return this.body = '我还不会回答此类问题哎'
}))
