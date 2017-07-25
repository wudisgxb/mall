let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let Foods = db.models.Foods;

const getFindCount = (function () {

    let getCount = async function (tenantId,startTime,endTime,type,foodname) {
        let getTime;
        if(type==1){
             getTime = await getDayEchat.getDay(startTime,endTime)
        }
        let orderMenus = await Orders.find()
    }
    let instance = {
        getCount: getCount
    }
    return instance;
})();
module.exports = getFindCount;