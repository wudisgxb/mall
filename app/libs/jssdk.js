/**
 * Created by Thinkpad on 2017/3/19.
 */
const crypto = rootRequire('crypto')
const debug = rootRequire('debug')('jssdk')
const httpAgent = rootRequire('app/libs/httpAgent')
const fs = rootRequire('fs')
const wechatConfig = rootRequire('config/config').wechat

//将默认两小时失效时间分为4份(即半个小时刷新cache一次)
const DIVIDE = 4

function expireTime(expires_in) {
  return Math.round(Date.now() / 1000) + expires_in / DIVIDE
}

class JSSDK {
  constructor(appId, appSecret) {
    this.appId = appId
    this.appSecret = appSecret
  }

  getSignPackage(url) {
    // url = encodeURIComponent(url)
    return this.getJsApiTicket()
      .then(jsapiTicket => {
        const nonceStr = this.createNonceStr()
        const timestamp = Math.round(Date.now() / 1000)
        const rawString = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`
        const hash = crypto.createHash('sha1')
        const signature = hash.update(rawString).digest('hex')

        return {
          appId: this.appId,
          nonceStr,
          timestamp,
          url,
          rawString,
          signature
        }
      })
      .catch(err => {
        debug('getSignPackage() error: ', err)
        return Promise.reject(err)
      })
  }

  getJsApiTicket() {
    const data = this.readCacheFile('.jsapiTicket.json')
    const time = Math.round(Date.now() / 1000)

    if (typeof data.expireTime === 'undefined' || data.expireTime < time) {
      debug('getJsApiTicket: from server')

      return this.getAccessToken()
        .then(accessToken => {
          const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=${accessToken}`
          return httpAgent({
            method: 'GET',
            url
          })
        })
        .then(resp => {
          debug('getJsApiTicket.request.body: ', resp.data)

          this.writeCacheFile('.jsapiTicket.json', {
            expireTime: expireTime(resp.data.expires_in),
            jsapiTicket: resp.data.ticket
          })
          return resp.data.ticket
        })
        .catch(err => {
          debug('getJsApiTicket() error: ', err)
          return Promise.reject(err)
        })

    } else {
      debug('getJsApiTicket: from cache')
      return Promise.resolve(data.jsapiTicket)
    }
  }

  getAccessToken() {
    const data = this.readCacheFile('.accessToken.json')
    const time = Math.round(Date.now() / 1000)

    if (typeof data.expireTime === 'undefined' || data.expireTime < time) {
      debug('getAccessToken: from server')

      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`
      return httpAgent({
          method: 'GET',
          url
        })
        .then(resp => {
          debug('getAccessToken.request.body: ', resp.data)

          this.writeCacheFile('.accessToken.json', {
            expireTime: expireTime(resp.data.expires_in),
            accessToken: resp.data.access_token
          })
          return Promise.resolve(resp.data.access_token)
        })
        .catch(err => {
          debug('getAccessToken.request.error: ', err, url)
          return Promise.reject(err)
        })
    } else {
      debug('getAccessToken: from cache')
      return Promise.resolve(data.accessToken)
    }
  }

  createNonceStr() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const length = chars.length
    let str = ''
    for (let i = 0; i < length; i += 1) {
      str += chars.substr(Math.round(Math.random() * length), 1)
    }
    return str
  }

  readCacheFile(filename) {
    try {
      return JSON.parse(fs.readFileSync(filename))
    } catch (e) {
      debug('read file %s failed: %s', filename, e)
      return {}
    }
  }

  writeCacheFile(filename, data) {
    return fs.writeFileSync(filename, JSON.stringify(data))
  }
}

const sdk = new JSSDK(wechatConfig.appid, wechatConfig.appSecret)



module.exports = sdk
