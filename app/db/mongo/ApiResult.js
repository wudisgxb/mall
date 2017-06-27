class ApiResult {
  constructor(res, result = []) {
    Object.assign(this, res, { result })
  }
}

module.exports = ApiResult

const SUCCESS = 0
const DB_ERROR = 42

module.exports.Address = {
  SUCCESS: {
    resCode: SUCCESS,
    resMsg: '设置默认地址成功!'
  },
  DB_ERROR: {
    resCode: DB_ERROR,
    resMsg: 'DB_ERROR'
  },
  NOT_FOUND_ADDRESS: {
    resCode: 10001,
    resMsg: '未找到地址!'
  },

}
