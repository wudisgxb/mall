
let makeAppintment = require('../../controller/admin/makeAppintment');


const router = new (require('koa-router'))()


//新增
router.post('/api/test/admin/makeAppintment', makeAppintment.saveMakeAppintment);
//编辑
router.put('/api/test/admin/makeAppintment', makeAppintment.updateMakeAppintment);
//查询
router.get('/api/test/admin/makeAppintment', makeAppintment.getMakeAppintmentTimeByStatus);
//删除
router.delete('/api/test/admin/makeAppintment', makeAppintment.deleteMakeAppintment);

module.exports = router
