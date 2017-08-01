var request = require('request');
var crypto = require('crypto');

var zy = {
    // config: {},
    // set setConfig(config) {
    //     this.config = config;
    // },
    config: {
        apiAccount: 'ACCd865926c10ea49719632b76b67560f06',

        apiKey: 'API522c6e001f514e1ea31e3a4660ac7730',

        //token: '41Om3Xvk158L',

        templateId: 'mtldUDX6ZymEebOQ',

        singerId: 'msn9E415cjHH1bQj',
    },
    sendSms: function (mobile, code, callback) {
        //var timestamp = Math.round(new Date().getTime()/1000);
        var timestamp = new Date().getTime();
        var sign = crypto.createHash('md5').update(this.config.apiAccount + this.config.apiKey + timestamp, 'utf8').digest("hex");
        var url = 'http://www.zypaas.com:9988/V1/Account/ACCd865926c10ea49719632b76b67560f06/sms/sureTempalteSend';
        var data = {
            "apiAccount": "ACCd865926c10ea49719632b76b67560f06",
            "appId": "APPa013394712af44ef9d777654f7774cfc",
            "sign": sign,
            "timeStamp": timestamp,
            "templateId": this.config.templateId,
            "singerId": this.config.singerId,
            "mobile": mobile,
            "param": code,
        };
        var opt = {
            url: url,
            method: 'POST',
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body: data
        };
        request(opt, callback);
    }
};
module.exports = zy;