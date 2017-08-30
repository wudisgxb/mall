var JPush = require("../../../node_modules/jpush-sdk/lib/JPush/JPush.js")
var client = JPush.buildClient('bd59abef4f3868f6c6edd605', '41fdfaa1e56a9f739031ea55')


const infoPushManager = (function () {

    let infoPush = function (content, tenantId) {
        var pushInfo;
        if (typeof content != 'String') {
            pushInfo = JSON.stringify(content);
        } else {
            pushInfo = content;
        }
        //easy push
        console.log("pushInfo: " + content + ",tenantId:" + tenantId);
        client.push().setPlatform(JPush.ALL)
        //.setAudience(JPush.ALL)
            .setNotification(content)
            .setAudience(JPush.alias(tenantId))
            .send(function (err, res) {
                if (err) {
                    console.log("消息推送失败：" + err.message)
                } else {
                    // console.log("pushInfo: " + content);
                    // console.log('Sendno: ' + res.sendno);
                    // console.log('Msg_id: ' + res.msg_id);
                }
            });
    }

    let instance = {
        infoPush: infoPush
    }

    return instance;
})();

module.exports = infoPushManager;