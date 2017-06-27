const WechatAPI = rootRequire('co-wechat-api')
const co = rootRequire('co')
const axios = rootRequire('axios')
const {
  wechat: {
    appid,
    appSecret,
    templates: {
      weatherForecastId
    }
  },
  thirdApiKeys: {
    weather: weatherKey
  }
} = rootRequire('config/config')
const api = new WechatAPI(appid, appSecret)
  // URL置空，则在发送后,点击模板消息会进入一个空白页面（ios）, 或无法点击（android）
const templateUrl = ''
const topColor = '#FF0000' // 顶部颜色
const openid = 'oogSSwFvUaF73gmXKDDFmeHTU4W0'

const city = 'nanjing'
const weatherForecastAPIURL = `https://free-api.heweather.com/v5/forecast?city=${city}&key=${weatherKey}`

module.exports = function weatherForecast(app) {
  return axios.get(weatherForecastAPIURL)
    .then(resp => {
      if (resp.data.HeWeather5[0].status !== 'ok') {
        const err = new Error('WeatherForecast scheduled task; weatherForecast API failed!')
        err.errmsg = resp.data.HeWeather5[0].status
        throw err
      } else {
        // 明后两天天气 
        // 将weatherAPI返回数据转换成公众号模板格式
        // {
        //   Abstract1: 明天天气摘要,
        //   MaxTmp1: 明天最高气温,
        //   MinTmp1: 明天最低气温,
        //   WindDir1: 明天风向,
        //   WindSc1: 明天风力级别,
        //   Abstract2: 后天天气摘要,
        //   MaxTmp2: 后天最高气温,
        //   MinTmp2: 后天最低气温,
        //   WindDir2: 后天风向,
        //   WindSc2: 后天风力级别
        // }
        const dailyForecast = resp.data.HeWeather5[0].daily_forecast.slice(1).map(e => {
          return {
            Abstract: e.cond.txt_d === e.cond.txt_n ? e.cond.txt_d : `${e.cond.txt_d} 转 ${e.cond.txt_n}`,
            MaxTmp: e.tmp.max,
            MinTmp: e.tmp.min,
            WindDir: e.wind.dir,
            WindSc: e.wind.sc
          }
        })
        return dailyForecast.reduce((accu, curr, i) => {
          Object.keys(curr).map(k => ({
            [k + (i + 1)]: { value: curr[k], color: '#173177' }
          })).forEach(o => {
            Object.assign(accu, o)
          })
          return accu
        }, {})
      }
    })
    .then(resp => {
      const bind = api.sendTemplate.bind(api, openid, weatherForecastId, templateUrl, topColor, resp)
      return co(bind)
    })
    .then(resp => {
      if (resp.errcode !== 0) {
        const error = new Error('WeatherForecast scheduled task; sendTemplate failed!')
        error.errcode = resp.errcode
        error.errmsg = resp.errmsg
        error.msgid = resp.msgid
        throw error
      }
    })
    .catch(err => {
      app.emit('error', err)
    })
}
