const mongoose = rootRequire('mongoose')
const Schema = mongoose.Schema

const AdminSchema = new Schema({
  /**
   * 登录名，不可重复
   */
  nickname: String,
  /**
   * 真实姓名
   */
  name: String,
  password: String,
  phone: Number,
  status: Number,
  nickname: String,
  /**
    管理员类型
   * 1 => 商品管理
   * 2 => 会员管理
   * 3 => 交易管理
   * 4 => 分销管理
   * 99 => 管理员
   * 100 => 超级管理员
   */
  type: Number
})



const Admin = mongoose.model('Admin', AdminSchema)

module.exports = Address
