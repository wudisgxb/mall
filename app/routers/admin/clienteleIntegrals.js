// const db = require('../../db/mysql/index');
// const sequelize = require('sequelize');
// const util = require('util');
// const moment = require('moment');
let clienteleIntegrals = require('../../controller/admin/clienteleIntegrals');


const router = new (require('koa-router'))()

router.put('/api/test/admin/clienteleIntegrals', clienteleIntegrals.updateClienteleIntegrals);
//新增
router.post('/api/test/admin/clienteleIntegrals', clienteleIntegrals.saveClienteleIntegrals);
//查询此客户在当前商家的所有积分信息
router.get('/api/test/admin/getClienteleIntegralsBytenantIdAndPhone', clienteleIntegrals.getClienteleIntegralsBytenantIdAndPhone);
//查询此客户的所有积分信息
router.get('/api/test/admin/getClienteleIntegralsByPhone', clienteleIntegrals.getClienteleIntegralsByPhone);
//查询当前商家的所有积分信息
router.get('/api/test/admin/getClienteleIntegralsByTenantId', clienteleIntegrals.getClienteleIntegralsByTenantId);
//查询此客户在当前商家的总积分
router.get('/api/test/admin/getClienteleIntegralsByCount', clienteleIntegrals.getClienteleIntegralsByCount);
// //编辑
// router.put('/api/test/admin/merchantIntegral', merchantIntegrals.updateAdminFoodsById);


module.exports = router