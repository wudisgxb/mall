/**
 * Created by Thinkpad on 2017/3/20.
 */
const OAuth = rootRequire('co-wechat-oauth')
const debug = rootRequire('debug')('OauthController')

const {
  wechat: wechatConfig,
  frontEndDomain
} = rootRequire('config/config')
const client = new OAuth(wechatConfig.appid, wechatConfig.appSecret)

module.exports = {
  async redirect (ctx, next) {
    const path = ctx.query.path
    const auth_callback_url = `http://${frontEndDomain}/#/${path}`

    // const auth_callback_url = 'http://119.29.180.92/user'

    console.log(`auth_callback_url: ${auth_callback_url}`)

    const url = client.getAuthorizeURL(auth_callback_url, '123', 'snsapi_userinfo')
    console.log(`redirect url: ${url}`)
    // 重定向请求到微信服务器
    ctx.redirect(url)
    console.log(`start: ${new Date()}`)
  },
  async getUser (ctx, next) {
    const {
      openid
    } = await client.getAccessToken(ctx.query.code)
    debug(`openid: ${openid}`)
    const userInfo = await client.getUser(openid)
    debug(`userInfo: ${userInfo}`)
    ctx.body = userInfo
  }
}