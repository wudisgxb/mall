const logger = require('koa-log4').getLogger('AddressController')
const sqlOrder = (function () {
     let selectOrOrderStatistic =function(tenantId) {
         logger.info(tenantId)
         let sql = "select * from Distanceandprice where tenantId ="+tenantId
         return sql
    }
    let instance = {
        selectOrOrderStatistic:selectOrOrderStatistic
    }
    return instance;
})();
module.exports = sqlOrder;