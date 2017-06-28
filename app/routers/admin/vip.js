let vip = require('../../controller/admin/vip');


module.exports = (router) => {
    router.post('/api/v3/admin/vip/save', vip.saveAdminVip);
    router.put('/api/v3/admin/vip/save/:id', vip.updateAdminVipById);
    router.get('/api/v3/admin/vip',vip.getAdminVip);
    router.delete('/api/v3/admin/vip/delete/:id',vip.deleteAdminVip);
};