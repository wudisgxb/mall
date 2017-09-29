const db = require('../../db/mysql/index');
const sequelize = require('sequelize');
const util = require('util');
const moment = require('moment');
let merchantIntegrals = require('../../controller/admin/merchantIntegrals');


const router = new (require('koa-router'))()


//新增
router.post('/api/test/admin/merchantIntegrals', merchantIntegrals.saveMerchantIntegrals);
//编辑
router.put('/api/test/admin/merchantIntegrals', merchantIntegrals.updateMerchantIntegrals);
//查询
router.get('/api/test/admin/merchantIntegrals', merchantIntegrals.getMerchantIntegrals);
//查询全部
router.get('/api/test/admin/merchantIntegralsAll', merchantIntegrals.getMerchantIntegralsAll);

module.exports = router