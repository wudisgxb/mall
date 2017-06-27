const mongoose = rootRequire('mongoose')
const Schema = mongoose.Schema
const DURATION = 5 * 60

const VerificationCodeSchema = new Schema({
  phoneNumber: {type: Number},
  code: {type: Number},
  expireTime: {type: Number}
})

// 新建 删除 已存在的phone 验证码 保存新的
VerificationCodeSchema.statics.newAndSave = async function (phoneNumber, code, timestamp) {
  const verify = new VerificationCode({
    phoneNumber, 
    code, 
    expireTime: timestamp + DURATION
  })
  await VerificationCode.deleteManyAsync({phoneNumber})
  return await verify.saveAsync()
}

// 验证 phone code 存在并且 未失效
VerificationCodeSchema.statics.check = async function (phoneNumber, code) {
  const now = Math.round(Date.now() / 1000)
  return await VerificationCode.findAsync({
    phoneNumber: phoneNumber, 
    code: code, 
    expireTime: {'$gte': now}
  })
}

const VerificationCode = mongoose.model('VerificationCode', VerificationCodeSchema)

module.exports = VerificationCode