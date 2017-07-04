/**
 * Created by bian on 12/3/15.
 */
var db = require('../../db/mysql/index');
var Admins = db.models.Adminer;

const router = new (require('koa-router'))()

    // todo: redirect
    router.post('/api/v3/admin-login', async function(ctx,next) {
        var body = ctx.request.body;
        ctx.checkBody('nickname').notEmpty();
        ctx.checkBody('password').notEmpty();
        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }
        try {
            var c = await Admins.findOne({
                where: {
                    nickname: body.nickname,
                    password: body.password,
                    status: 0
                }
            });

            var pageSrc;
            if (c != null && c.status == 0) {
                ///登陆
                ctx.body = {
                    retCode:0,
                    result:{
                        type:c.type,
                        tenantId:c.tenantId
                    }
                };
            } else {
                ctx.body = {
                    retCode:-1,
                    result:{
                    }
                };
            }
        } catch (err) {
            ctx.body = {
                retCode:-1,
                result:{
                }
            };
        }
    });
module.exports = router