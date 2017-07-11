/**
 * Created by Administrator on 2017/6/28.
 */
/**
 * Created by Administrator on 2017/3/28.
 */
const path = require('path')
module.exports = {
    port: 8092,
    redis: {
        port: 6379,
        host: '127.0.0.1'
    },
    wechat: {
        domain: 'http://123.206.213.100',
        partnerKey: '',
        mchId: '',
        appId: 'wx09b412b006792e2c',
        secret: '0e32eb3b17baa77d2ea46abd990b7c4d',
        token: 'xiaovbao',
        encodingAESKey: '0b0QgxmoY2nbQlrRYPpSiDlKZXDGfwhKbERot9UvA0K'
    },
	
    root: path.join(__dirname, '..'),
    log: {
        access() {
            return path.join(__dirname, '..', 'logs')
        },
        dir() {
            return path.join(__dirname, '..', 'logs')
        },
        error() {
            return path.join(__dirname, '..', 'logs')
        }
    }
}