/**
 * Created by bian on 12/3/15.
 */
let table = require('../../controller/admin/table');
const router = new (require('koa-router'))()
//获取租户下桌状态
router.get('/api/v3/admin/deal/table',table.getAdminTableByTableName);
//获取租户下 代售点下桌状态
router.get('/api/v3/admin/eshop/table',table.getAdminTableByConsigneeId);
//新增租户下桌状态
router.post('/api/v3/admin/deal/table',  table.saveAdminTableByTableName);
//新增租户下 代售点下桌号(即代售 桌号)
router.post('/api/v3/admin/eshop/table',  table.saveAdminTableByConsigneeId);


router.put('/api/v3/admin/table/save/:id',  table.updateAdminTableById);
router.delete('/api/v3/admin/table/delete/:id',table.deleteAdminTable);
module.exports = router