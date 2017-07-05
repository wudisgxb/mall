/**
 * Created by bian on 12/3/15.
 */
let debug = require('../../instances/debug');
let render = require('../../instances/render');
let db = require('../../models/db/index');
let auth = require('../../helpers/auth.js');
let Admins = db.models.Adminer;
let captchas = require('');


module.exports = {

    async postAdminLogin(ctx,next){
        ctx.checkBody("username").notEmpty();
        ctx.checkBody("password").notEmpty();
        ctx.checkBody("captcha").notEmpty();
        let body = ctx.request.body;
        let captchaname = captchas.name();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
            return;
        }

        let login = await auth.findOne({
            where:{
                username:body.username,
                password:body.password
            }
        })
        if(login==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"用户名密码错误");
            return;
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
        // if(login!=null&&captchaname.equals("body.captcha")){
        //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
        //     return;
        // }
        // if(login!=null&&!captchaname.equals("body.captcha")){
        //     ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,"验证码错误");
        //     return;
        // }



    },

    async saveAdminregister(ctx,next){
        ctx.checkBody("username").notEmpty();
        ctx.checkBody("password").notEmpty();
        ctx.checkBody("captcha").notEmpty();
        let body = ctx.request.body;
        let captchaname = captchas.name();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
            return;
        }
        //验证码判断，如果是正确的进行下一步，如果是错误的跳出
        //若果验证码是正确的执行查询语句
        let login = await auth.findOne({
            where:{
                username:body.username,
                password:body.password
            }
        })
        //判断数据库里面是否有此数据
        if(login!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"您的用户名已存在" );
            return;
        }
        //如果没有此数据则新增
        login = await auth.create({
            username:body.username,
            password:body.password

        })


    },




      async getAdminLogin(ctx,next){
        this.body = yield render('admin/login');
    },


    // todo: redirect
    async saveAdminLogin(){
        var ctx = this;
        var body = this.request.body;
        this.checkBody('nickname').notEmpty();
        this.checkBody('password').notEmpty();
        if (this.errors) {
            this.body = this.errors;
            return;
        }
        try {

            var c = yield Admins.findOne({
                where: {
                    nickname: body.nickname,
                    password: body.password,
                    status: 0
                }
            });

            var pageSrc;
            if (c != null && c.status == 0) {
                ///登陆
                this.body = {
                    retCode:0,
                    result:{
                        type:c.type,
                        tenantId:c.tenantId
                    }
                };
            } else {
                this.body = {
                    retCode:-1,
                    result:{
                    }
                };
            }
        } catch (err) {
            this.body = {
                retCode:-1,
                result:{
                }
            };
        }
    },
    async getAdminLogout(){
        yield auth.logout(this);
        this.redirect('/admin-login');
    }
};