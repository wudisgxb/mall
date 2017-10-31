const infoPushManager = require('../infoPush/infoPush')



module.exports = {
    async saveMessages(ctx,next){
        ctx.checkBody('phone').notEmpty()
        ctx.checkBody('phone').notEmpty()
        //下单成功发送推送消息
        let date = new Date().format("hh:mm");
        let content = table.name + '已下单成功，请及时处理！ ' + date;
        infoPushManager.infoPush(content, body.tenantId);
    }
}