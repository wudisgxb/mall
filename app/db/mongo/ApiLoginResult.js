class ApiLoginResult {
    constructor(res, result = []) {
        Object.assign(this, res, { result })
    }
}

module.exports = ApiLoginResult

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
    NOT_MATCH: {
        resCode: 10000,
        resMsg: '用户名密码不匹配!'
    },
    CAPTCHA_ERROR: {
        resCode: 10001,
        resMsg: '验证码错误'
    },
    CAPTCHA_TIMEOUT: {
        resCode: 10002,
        resMsg: '验证码超时'
    },

    PARAMS_ERROR: {
        resCode: PARAMS_ERROR,
        resMsg: 'PARAMS_ERROR'
    },
    IMPORT_ERROR:{
        resCode: 10004,
        resMsg: '输入错误'
    }
}
