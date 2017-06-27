/**
 * Created by Thinkpad on 2017/3/20.
 */

const VerificationCode = rootRequire('app/db/mongo/VerificationCode')
const rp = rootRequire('request-promise')
const crypto = rootRequire('crypto')
const getVerifyCode = rootRequire('app/libs/utils').getVerifyCode
const logger = rootRequire('koa-log4').getLogger('SMSController')

module.exports = {
  async sendCode(ctx, next) {
    const phoneNumber = ctx.query.phoneNumber
    const code = getVerifyCode(6)
    const sms = {
      appKey: 'e78e86d9912946ad99828a5b386d8435',
      token: '41Om3Xvk158L',
      templateId: 'CJF477RCMM8K'
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const sign = crypto.createHash('md5')
      .update(sms.appKey + sms.token + sms.templateId + phoneNumber + code + timestamp, 'utf8')
      .digest("hex");
    const url = 'https://sms.zhiyan.net/sms/sms/single/' + sms.appKey + '/' +
      sms.token + '/' + sms.templateId + '?timestamp=' + timestamp + '&sign=' + sign;
    const data = {
      mobile: phoneNumber,
      param: code,
      extend: ''
    }
    const opt = {
      rejectUnauthorized: false,
      url: url,
      method: 'POST',
      form: {
        data: JSON.stringify(data)
      }
    };

    const resp = await rp(opt).then(JSON.parse)
    ctx.body = resp
    
    // 第三方发送短信成功
    if (resp.result === 'SUCCESS') {
      // 5分钟失效
      const saveResp = await VerificationCode.newAndSave(phoneNumber, code, timestamp)
      logger.info(`save verifyCode resp: ${saveResp}`)
    }
  }
}
