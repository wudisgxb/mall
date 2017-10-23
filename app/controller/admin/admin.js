const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')
let Captcha = db.models.Captcha
let Admins = db.models.Adminer
let Alliances = db.models.Alliances
let AdminCorresponding = db.models.AdminCorresponding
let Merchants = db.models.Merchants

module.exports = {
    async register (ctx, next) {
        ctx.checkBody('userName').notEmpty()
        ctx.checkBody('password').notEmpty()
        ctx.checkBody('phone').notEmpty()
        ctx.checkBody('role').notEmpty()
        ctx.checkBody('industry').notEmpty()

        // ctx.checkBody('adminType').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let admin = await Admins.findOne({
            where: {
                nickname: body.userName
            }
        })
        if (admin != null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "用户名已存在！");
            return;
        }
        let adminPhone = await Admins.findOne({
            where: {
                phone: body.phone
            }
        })
        if (adminPhone != null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "手机号已存在已存在！");
            return;
        }

        // let correspondingId
        // if (body.adminType != null && body.adminType != "") {
        //     if (body.adminType == 1) {
        //         correspondingId = "1111" + (Tool.allocTenantId().substring(4))//平台
        //     }
        //     if (body.adminType == 2) {
        //         correspondingId = "2222" + (Tool.allocTenantId().substring(4))//商圈
        //     }
        //     if (body.adminType == 3) {
        //         correspondingId = "3333" + (Tool.allocTenantId().substring(4))//租户
        //     }
        // }

        let industry = body.industry
        let correspondingId
        if (body.role == 1) {
            correspondingId = "1111" + (Tool.allocTenantId().substring(4))//平台
            industry = ""
        }
        if (body.role == 2) {
            correspondingId = "2222" + (Tool.allocTenantId().substring(4))//商圈
            industry =""
        }
        if (body.role == 3) {
            correspondingId = "3333" + (Tool.allocTenantId().substring(4))//租户
        }


        await Admins.create({
            nickname: body.userName,
            name: body.name == null ? "超级管理员" : body.name,
            password: body.password,
            phone: body.phone,
            style :industry,
            status: body.status == null ? 0 : body.status,
            type: body.type == null ? 100 : body.type,
        })
        console.log(correspondingId)
        await AdminCorresponding.create({
            phone: body.phone,
            correspondingType: body.role,
            adminType : 1000,
            correspondingId: correspondingId
        })

        // await AdminCorresponding.create({
        //     phone: body.phone,
        //     correspondingType: body.adminType,
        //     correspondingId: correspondingId
        // })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,{
            phone: body.phone,
            userName: body.userName,
            style : industry
        });
    },
    async roleRegister(ctx,next){
        ctx.checkBody('phone').notEmpty()
        ctx.checkBody('adminType').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let adminPhone = await Admins.findOne({
            where: {
                phone: body.phone
            }
        })
        if(adminPhone==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此电话号码,请注册")
            return
        }
        let correspondingId
        if (body.adminType == 1) {
            correspondingId = "1111" + (Tool.allocTenantId().substring(4))//平台
        }
        if (body.adminType == 2) {
            correspondingId = "2222" + (Tool.allocTenantId().substring(4))//商圈
        }
        if (body.adminType == 3) {
            correspondingId = "3333" + (Tool.allocTenantId().substring(4))//租户
        }
        await AdminCorresponding.create({
            phone: body.phone,
            correspondingType: body.adminType,
            correspondingId: correspondingId
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,correspondingId)
    },
    async putAdmins(ctx,next){
        ctx.checkBody('userName').notEmpty()
        ctx.checkBody('password').notEmpty()
        ctx.checkBody('phone').notEmpty()
        ctx.checkBody('style').notEmpty()
        ctx.checkBody('id').notEmpty()
        // ctx.checkBody('adminType').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let admin = await Admins.findOne({
            where: {
                nickname: body.userName
            }
        })
        if (admin != null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "用户名已存在！");
            return;
        }
        let adminPhone = await Admins.findOne({
            where: {
                phone: body.phone
            }
        })
        if (adminPhone != null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "手机号已存在已存在！");
            return;
        }
        await Admins.update({
            nickname: body.userName,
            name: body.name == null ? "超级管理员" : body.name,
            password: body.password,
            phone: body.phone,
            style : body.style
        },{
            where: {
                id: body.id
            }
        })

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);

    },
    async putAdmin(ctx, next){
        let admin = await Admins.findAll({})
        for(let i = 0; i < admin.length; i++){
            let correspondingType = 3
            let correspondingId = admin[i].tenantId
            if(admin[i].type==1000){
                correspondingId = "1111"+Tool.allocTenantId().substring(4)
                correspondingType =1
            }
            if(admin[i].type==500){
                correspondingId = "2222"+Tool.allocTenantId().substring(4)
                correspondingType =2
            }
            await AdminCorresponding.create({
                phone : admin[i].phone,
                correspondingType : correspondingType,
                correspondingId :correspondingId
            })
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getAdminAllTenantId(ctx, next){
        ctx.checkQuery('adminType').notEmpty()
        //查询tenantId不为All的所有数据
        let id = []
        if(ctx.query.adminType=="3"){
            id = await Merchants.findAll({
            })
        }
        if(ctx.query.adminType=="2"){
            id = await Alliances.findAll({
            })
        }
        if(ctx.query.adminType=="1"){
            id = await Headquarters.findAll({})
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,id);
    },
    //公司员工注册
    async getAdminAllByPhone(ctx, next){
        //角色的Id
        ctx.checkBody('adminId').notEmpty()
        ctx.checkBody('phone').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body
        let admin = await Admins.findOne({
            where:{
                phone:body.phone
            }
        })
        if(admin==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此电话号码")
            return
        }
        let adminId = (body.adminId).substring(0,4)
        if(adminId="1111"){
            await AdminCorresponding.create({
                phone : body.phone,
                correspondingType : 1,
                correspondingId : adminId
            })
        }else if(adminId="2222"){
            await AdminCorresponding.create({
                phone : body.phone,
                correspondingType : 2,
                correspondingId : adminId
            })
        }else{
            await AdminCorresponding.create({
                phone : body.phone,
                correspondingType : 3,
                correspondingId : adminId
            })
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async updateAdmin(ctx, next){
        let admins = await Admins.findAll({});
        for (let i = 0; i < admins.length; i++) {
            if (admins.type == 100) {
                Admins.update({
                    name: "普通租户"
                }, {
                    where: {
                        id: admins[i].id
                    }
                })
            }
            if (admins.type == 1000) {
                Admins.update({
                    name: "超级管理员",
                    type: "平台管理员"
                }, {
                    where: {
                        id: admins[i].id
                    }
                })
            }
            if (admins.type == 500) {
                Admins.update({
                    name: "商家联盟",
                    type: "商家管理员"
                }, {
                    where: {
                        id: admins[i].id
                    }
                })
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    
}


