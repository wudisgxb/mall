const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const db = require('../../db/mysql/index');
const HeadquartersStaff =db.models.HeadquartersStaff
// const register = require('../register/register')
module.exports = {
    async register(ctx,next){
        ctx.checkBody('userName').notEmpty
        ctx.checkBody('password').notEmpty
        ctx.checkBody('phone').notEmpty
        ctx.checkBody('headquartersId').notEmpty
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body
        let whereJson={
            nickname : body.userName,
            phone : body.password
        }
        let headquarter = await register.getAdmin(HeadquartersStaff,whereJson)
        if(headquarter!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"此平台已有这个用户")
            return
        }
        let headquarters = await register.getAdmins(HeadquartersStaff,{headquartersId:body.headquartersId})
        if(headquarters.length==0){
            let createJson = {
                nickname : body.userName,
                phone : body.phone,
                password : body.password,
                name : "管理员",
                status : 0,
                type :1000,
                headquartersType : "平台",
                headquartersId : body.headquartersId
            }
            await register.registerAdmin(HeadquartersStaff,createJson)
        }else{
            let createJson = {
                nickname : body.userName,
                phone : body.phone,
                password : body.password,
                name : "员工",
                status : 0,
                type :100,
                headquartersType : "平台",
                headquartersId :body.headquartersId
            }
            await register.registerAdmin(HeadquartersStaff,createJson)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }
}