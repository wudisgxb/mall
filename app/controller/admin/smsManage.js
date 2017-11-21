let db = require('../../db/mysql/index')
let MarketingSMSs = db.models.MarketingSMSs
module.exports = {
    async saveMarketingSMSs(ctx,next){
        ctx.checkBody('phoneNumber')
    },
}