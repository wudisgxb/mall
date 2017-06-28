const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let AlipayConfigs = db.models.AlipayConfigs;
let ChildAlipayConfigs = db.models.ChildAlipayConfigs;
let RelationshipOfAlipays = db.models.RelationshipOfAlipays;

module.exports = {

  async saveAdminTransferAccounts (ctx, next) {
    let body = ctx.request.body;
    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }
    let isCreate = true;

    if (isCreate) {
      let alipayConfigs = await AlipayConfigs.findAll({
        where : {
          tenantId:ctx.query.tenantId
        }
      })
      if(alipayConfigs.length > 0) {
        ctx.body ={
          resCode:-1,
          result:"主商户转账只能设置一个！"
        }
        return;
      }
      alipayConfig =  await AlipayConfigs.create({
        merchant: body.alipayconfig.merchant,
        payee_account: body.alipayconfig.payee_account,
        payee_real_name:body.alipayconfig.payee_real_name || "匿名",
        remark:body.alipayconfig.remark,
        isRealTime:body.alipayconfig.isRealTime,
        tenantId:ctx.query.tenantId
        // todo: ok?
        //deletedAt: Date.now()
      });

      if (body.childAlipayconfigs.length >0) {
        let childAlipayConfig;
        for (let i = 0;i<body.childAlipayconfigs.length;i++) {
          childAlipayConfig =  await ChildAlipayConfigs.create({
            merchant: body.childAlipayconfigs[i].merchant,
            payee_account: body.childAlipayconfigs[i].payee_account,
            payee_real_name:body.childAlipayconfigs[i].payee_real_name || "匿名",
            remark:body.childAlipayconfigs[i].remark,
            rate:body.childAlipayconfigs[i].rate,
            ownRate:body.childAlipayconfigs[i].ownRate || 0,
            tenantId:ctx.query.tenantId,
            excludeFoodId:JSON.stringify(body.excludeFoodId)
            // todo: ok?
            //deletedAt: Date.now()
          });

          await RelationshipOfAlipays.create({
            AlipayConfigId: alipayConfig.id,
            ChildAlipayConfigId: childAlipayConfig.id,
            tenantId:ctx.query.tenantId
            // todo: ok?
            //deletedAt: Date.now()
          });
        }
      }
    }
    ctx.body =new ApiResult(ApiResult.Result.SUCCESS);
  },

  async UpdateAdminTransferAccountsById (ctx,next) {
    let body = ctx.request.body;
    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }
    let isCreate = true;
    let alipayConfig;
    if (ctx.params.id) {
      alipayConfig = await AlipayConfigs.findById(ctx.params.id);
      if (alipayConfig != null) {
        alipayConfig.merchant = body.alipayconfig.merchant;
        alipayConfig.payee_account = body.alipayconfig.payee_account;
        alipayConfig.payee_real_name = body.alipayconfig.payee_real_name || "匿名";
        alipayConfig.remark = body.alipayconfig.remark;
        alipayConfig.isRealTime = body.alipayconfig.isRealTime;
        await alipayConfig.save();

        //子表 关系表先删后加
        let childAlipayConfigs  = await  ChildAlipayConfigs.findAll({
          where:{
            tenantId:ctx.query.tenantId
          }
        });
        for (let i=0;i<childAlipayConfigs.length;i++) {
          await childAlipayConfigs[i].destroy();
        }

        let relationshipOfAlipays  = await  RelationshipOfAlipays.findAll({
          where:{
            tenantId:ctx.query.tenantId
          }
        });
        for (let i=0;i<relationshipOfAlipays.length;i++) {
          await relationshipOfAlipays[i].destroy();
        }

        if (body.childAlipayconfigs.length > 0) {
          for (i = 0;i<body.childAlipayconfigs.length;i++) {
            childAlipayConfig =  await ChildAlipayConfigs.create({
              merchant: body.childAlipayconfigs[i].merchant,
              payee_account: body.childAlipayconfigs[i].payee_account,
              payee_real_name:body.childAlipayconfigs[i].payee_real_name || "匿名",
              remark:body.childAlipayconfigs[i].remark,
              rate:body.childAlipayconfigs[i].rate,
              ownRate:body.childAlipayconfigs[i].ownRate || 0,
              tenantId:ctx.query.tenantId,
              excludeFoodId:JSON.stringify(body.excludeFoodId)
              // todo: ok?
              //deletedAt: Date.now()
            });

            await RelationshipOfAlipays.create({
              AlipayConfigId: ctx.params.id,
              ChildAlipayConfigId: childAlipayConfig.id,
              tenantId:ctx.query.tenantId
              // todo: ok?
              //deletedAt: Date.now()
            });
          }
        }
        isCreate = false;
      } else {
        ctx.body =new ApiResult(ApiResult.Result.SUCCESS,"未找到记录，无法更改！");

        return;
      }
    }


  },

  async getAdminTransferAccounts (ctx, next) {
    let result = {};
    let childAlipayConfigsArray = [];
    let alipayConfigs = await AlipayConfigs.findAll({
      where:{
        tenantId:ctx.query.tenantId
      }
    });
    if(alipayConfigs.length == 0) {
      ctx.body ={
        resCode:-1,
        result:"未找到记录！"
      }
      return;
    }

    if(alipayConfigs.length > 1) {
      ctx.body ={
        resCode:-1,
        result:"主商户支付账户有多个，请只保留一个！"
      }
      return;
    }

    let relationshipOfAlipays = await RelationshipOfAlipays.findAll({
      where: {
        AlipayConfigId : alipayConfigs[0].id
      }
    });

    let childAlipayConfigs;
    let json = {};
    for (let j = 0; j<relationshipOfAlipays.length; j++) {
      childAlipayConfigs = await ChildAlipayConfigs.findAll({
        where: {
          id: relationshipOfAlipays[j].ChildAlipayConfigId
        }
      })
      json = {};
      json.merchant = childAlipayConfigs[0].merchant;
      json.payee_account = childAlipayConfigs[0].payee_account;
      json.payee_real_name = childAlipayConfigs[0].payee_real_name;
      json.remark = childAlipayConfigs[0].remark;
      json.rate = childAlipayConfigs[0].rate;
      json.ownRate = childAlipayConfigs[0].ownRate;
      json.excludeFoodId = JSON.parse(childAlipayConfigs[0].excludeFoodId);
      childAlipayConfigsArray.push(json);
    }
    result.alipayConfig = alipayConfigs[0];
    result.childAlipayConfigs = childAlipayConfigsArray;
    ctx.body = new ApiResult(ApiResult.Result.SUCCESS,result);
  },

  async deleteAdminTransferAccounts(ctx,next){
    ctx.checkParams('id').notEmpty().isInt().toInt();
    let alipayConfigs = await AlipayConfigs.findById(ctx.params.id);
    if (alipayConfigs == null) {
      ctx.body = {
        resCode:-1,
        result:"未找到记录id！"
      };
      return;
    }
    let relationshipOfAlipays = await RelationshipOfAlipays.findAll({
      where: {
        AlipayConfigId : alipayConfigs.id
      }
    });

    let childAlipayConfigs;
    for (let i = 0; i<relationshipOfAlipays.length; i++) {
      childAlipayConfigs = await ChildAlipayConfigs.findAll({
        where: {
          id: relationshipOfAlipays[i].ChildAlipayConfigId
        }
      })
      for (let j = 0; j<childAlipayConfigs.length; j++) {
        await childAlipayConfigs[j].destroy();
      }
      await relationshipOfAlipays[i].destroy();
    }

    await alipayConfigs.destroy();
    ctx.body = {
      resCode:0,
      result:"success"
    };
    ctx.body =new ApiResult(ApiResult.Result.SUCCESS);
  }
}