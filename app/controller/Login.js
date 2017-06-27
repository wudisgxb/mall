
const Shop = rootRequire('app/db/mongo/Shop')
const VerificationCode = rootRequire('app/db/mongo/VerificationCode')
const jwt = rootRequire('jsonwebtoken')

module.exports = {
  async login (ctx, next) {
    const { phoneNumber, code } = ctx.request.body
    const verify = await VerificationCode.check(phoneNumber, code)

    const id = 1
    const token = jwt.sign({id: id}, rootRequire('config/config').jwtSecret, {expiresIn: '1h'})
    
    ctx.body = {verify, token}
  }
}