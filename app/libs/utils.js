module.exports = {
  getVerifyCode (count) {
    const numbers = '0123456789'
    let str = ''
    for (let i = 0; i < count; i += 1) {
      str += numbers.substr(Math.round(Math.random() * count), 1)
    }
    return str 
  }
}