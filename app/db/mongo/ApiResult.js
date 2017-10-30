class ApiResult {
    constructor(res, result = []) {
        Object.assign(this, res, { result })
    }
}

module.exports = ApiResult

const SUCCESS = 0
const PARAMS_ERROR = -1
const DB_ERROR = -2

module.exports.Result = {
    SUCCESS: {
        resCode: SUCCESS,
        resMsg: 'success'
    },
    DB_ERROR: {
        resCode: DB_ERROR,
        resMsg: 'DB_ERROR'
    },
    NOT_FOUND: {
        resCode: 10000,
        resMsg: '未找到记录!'
    },
    EXISTED: {
        resCode: 10001,
        resMsg: '记录已存在'
    },

    PARAMS_ERROR: {
    resCode: PARAMS_ERROR,
    resMsg: 'PARAMS_ERROR'
    }
}
