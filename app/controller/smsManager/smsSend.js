var request = require('request');
var crypto = require('crypto');

var zy = {
    // config: {},
    // set setConfig(config) {
    //     this.config = config;
    // },
    config : {

        appKey: 'e78e86d9912946ad99828a5b386d8435',

        token: '41Om3Xvk158L',


        templateId: 'CJF477RCMM8K'
    },
    sendSms: function(mobile, code, callback) {
        var timestamp = Math.round(new Date().getTime()/1000);
        var sign = crypto.createHash('md5').update(this.config.appKey + this.config.token
            + this.config.templateId + mobile + code + timestamp, 'utf8').digest("hex");
        var url = 'https://sms.zhiyan.net/sms/sms/single/' + this.config.appKey + '/' +
            this.config.token + '/' + this.config.templateId + '?timestamp=' + timestamp + '&sign=' + sign;
        var data = JSON.stringify({
            mobile: mobile,
            param: code,
            extend: ''
        });
        var opt = {
            rejectUnauthorized: false,
            url: url,
            method: 'POST',
            form: {
                data: data
            }
        };
        request(opt, callback);
    }
};
module.exports = zy;