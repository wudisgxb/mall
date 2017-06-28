/**
 * Created by bian on 12/3/15.
 */

var db = require('../../db/mysql/index');
var PaymentReqs = db.models.PaymentReqs;
var Tables = db.models.Tables;
var tool = require('../../Tool/tool')
var revenueManager = require('../../controller/admin/revenueManager')
module.exports = (router) => {

    //查询收退款信息
    router.get('/api/v3/admin/receivablesInfo', revenueManager.getAdminReceivablesInfo);

   

};