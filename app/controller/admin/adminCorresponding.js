const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')
let Captcha = db.models.Captcha
let Admins = db.models.Adminer
let Alliances = db.models.Alliances
let AdminCorresponding = db.models.AdminCorresponding
let Merchants = db.models.Merchants
let Headquarters = db.models.Headquarters
let TenantConfigs = db.models.TenantConfigs



module.exports = {
    // 上级管理下级的员工
    async administration(ctx,next){
        ctx.checkBody('companyUser').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }


    },
    //新增公司员工岗位
    async saveAdministration(ctx,next){
        ctx.checkBody('username').notEmpty();
        ctx.checkBody('correspondingId').notEmpty();
        ctx.checkBody('adminType').notEmpty();

        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }

        let body = ctx.request.body
        let admin = await Admins.findOne({
            where : {
                nickname : body.username
            }
        })
        if(admin==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此昵称，请先注册")
            return
        }
        // console.log(AdminCorresponding)
        let adminCorresponding = await AdminCorresponding.findAll({
            where:{
                correspondingId : body.correspondingId
            }
        })
        // console.log(adminCorresponding)
        if(adminCorresponding.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此公司")
            return
        }
        //如果公司表中包含
        console.log(adminCorresponding.length)
        let isPhone

        adminCorresponding.forEach(function (e) {
            if(e.phone==admin.phone){
                isPhone= e.phone;
            }
        })
        console.log(isPhone)
        if(isPhone!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"此公司已有该员工信息")
            return
        }
        await AdminCorresponding.create({
            phone : admin.phone,
            correspondingType : adminCorresponding[0].correspondingType,
            correspondingId : adminCorresponding[0].correspondingId,
            adminType : body.adminType
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //修改公司员工的岗位
    async updateAdminCorresponding(ctx,next){
        ctx.checkBody('username').notEmpty();
        ctx.checkBody('correspondingId').notEmpty();
        ctx.checkBody('adminType').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body
        let admin = await Admins.findOne({
            where:{
                nickname : body.username
            }
        })
        if(admin==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个用户")
            return
        }
        console.log(AdminCorresponding)
        let adminCorresponding = await AdminCorresponding.findOne({
            where:{
                phone : admin.phone,
                correspondingId :body.correspondingId
            }
        })

        if(adminCorresponding==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"这个公司下找不到这个员工")
            return
        }
        console.log(adminCorresponding.adminType)
        console.log(body.adminType)
        adminCorresponding.adminType=body.adminType
        await adminCorresponding.save();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //查询自己所在公司的员工
    async getThisCompanyStaff(ctx,next){
        ctx.checkQuery('correspondingId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }

        let adminCorrespondingAll = await AdminCorresponding.findAll({
            where:{
                correspondingId : ctx.query.correspondingId
            }
        })
        console.log(adminCorrespondingAll[0].phone)
        if(adminCorrespondingAll.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有找到这家公司")
            return
        }
        let correspondingArray = []
        let correspondingJson = {}
        let corresponding
        let tenantInfo
        if(adminCorrespondingAll[0].correspondingType==1) {
            let headquarters = await Headquarters.findOne({
                where: {
                    headquartersId: ctx.query.correspondingId
                }
            })
            corresponding = headquarters
            correspondingJson.type = "平台"
        }
        if(adminCorrespondingAll[0].correspondingType==2){
            let alliance = await Alliances.findOne({
                where: {
                    alliancesId: ctx.query.correspondingId
                }
            })
            corresponding = alliance
            correspondingJson.type = "商圈"
        }
        if(adminCorrespondingAll[0].correspondingType==3){
            let merchant = await Merchants.findOne({
                where: {
                    tenantId: ctx.query.correspondingId
                }
            })
            corresponding = merchant
            correspondingJson.type = "租户"
            let tenantconfig = await TenantConfigs.findOne({
                where:{
                    tenantId : merchant.tenantId
                }
            })
            tenantInfo = tenantconfig

        }
        correspondingJson.correspondingId = ctx.query.correspondingId
        correspondingJson.name = corresponding.name
        correspondingJson.phone = corresponding.phone
        correspondingJson.industry = corresponding.industry
        correspondingJson.aggregateScore = corresponding.aggregateScore
        correspondingJson.address = corresponding.address
        if(adminCorrespondingAll[0].correspondingType==3){
            corresponding=tenantInfo
        }
        correspondingJson.wecharPayee_account = corresponding.wecharPayee_account
        correspondingJson.payee_account = corresponding.payee_account
        correspondingJson.homeImage = corresponding.homeImage
        correspondingJson.longitude = corresponding.longitude
        correspondingJson.latitude = corresponding.latitude
        correspondingJson.officialNews = corresponding.officialNews

        for(let i = 0; i < adminCorrespondingAll.length; i++){
            let admin = await Admins.findOne({
                where:{
                    phone : adminCorrespondingAll[i].phone
                }
            })
            correspondingArray.push(admin)
        }
        correspondingJson.correspondingArray = correspondingArray
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,correspondingJson)

    },

    //查询全部
    async getAll(ctx,next){
        // ctx.checkQuery('correspondingType').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }

        let adminCorresponding = await AdminCorresponding.findAll({
            where:{
                correspondingType : ctx.query.correspondingType!=null?ctx.query.correspondingType:3
            }
        })
        ctx.body= new ApiResult(ApiResult.Result.SUCCESS,adminCorresponding)
    },

    async getAdminCorresponding(ctx,next){
        ctx.checkQuery('correspondingType').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let adminCorresponding = await AdminCorresponding.findAll({
            where:{
                correspondingType:ctx.query.correspondingType
            }
        })
        if(adminCorresponding.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"未找到当前记录")
            return
        }
        let correspondingArray =[]
        if(ctx.query.correspondingType==1){
            console.log(adminCorresponding.length)
            for(let admin of adminCorresponding){
                let headquarters = await Headquarters.findOne({
                    where:{
                        headquartersId : admin.correspondingId
                    }
                })
                correspondingArray.push(headquarters)
            }
        }
        console.log(correspondingArray)
        if(ctx.query.correspondingType==2){
            for(let admin of adminCorresponding){
                let alliances = await Alliances.findOne({
                    where:{
                        alliancesId : admin.correspondingId
                    }
                })
                correspondingArray.push(alliances)
            }
        }
        if(ctx.query.correspondingType==3){
            for(let admin of adminCorresponding){
                let merchant = await Merchants.findOne({
                    where:{
                        tenantId : admin.correspondingId
                    }
                })
                correspondingArray.push(merchant)
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,correspondingArray)


    },






}




