const db = require('../../db/mysql/index');
const sequelizex = require('../../lib/sequelizex.js');
const Orders = db.models.NewOrders;
const OrderGoods = db.models.OrderGoods;
const Foods = db.models.Foods;
const Consignees = db.models.Consignees;
const Tables = db.models.Tables;
const ShoppingCarts = db.models.ShoppingCarts;
const Vips = db.models.Vips;
const TenantConfigs = db.models.TenantConfigs;
const GoodsPromotions = db.models.GoodsPromotions;
const QRCodeTemplates = db.models.QRCodeTemplates;
const DeliveryFees = db.models.DeliveryFees;
const DistanceAndPrices = db.models.DistanceAndPrices;
const PaymentReqs = db.models.PaymentReqs;
const webSocket = require('../../controller/socketManager/socketManager');
const infoPushManager = require('../../controller/infoPush/infoPush');
const tool = require('../../Tool/tool');
const ApiResult = require('../../db/mongo/ApiResult');
const vipManager = require('./vip');
const Promise = require('Promise');

module.exports = {
    //通过foodId，二维码ID，租户id（感觉多余）获取商品优惠
    async getGoodsPromotion(QRCodeTemplateId, goodsId, tenantId) {
        //待完善
        let json = {};
        //查询商品折扣优惠
        let goodsPromotion = await GoodsPromotions.findOne({
            where: {
                QRCodeTemplateId: QRCodeTemplateId,
                tenantId: tenantId,
                goodsId: goodsId,
                status: 1
            }
        })

        if (goodsPromotion != null && goodsPromotion.activityPrice != -1) {
            json.activityPrice = goodsPromotion.activityPrice;
            json.purchaseLimit = goodsPromotion.purchaseLimit;
        } else {
            return null;
        }

        return json;
    },

    //获取订单每单限购
    async getOrderLimit(QRCodeTemplateId, tenantId) {
        //待完善
        let json = {};
        //查询商品折扣优惠
        let QRCodeTemplate = await QRCodeTemplates.findOne({
            where: {
                QRCodeTemplateId: QRCodeTemplateId,
                tenantId: tenantId,
            }
        })

        if (QRCodeTemplate != null) {
            return QRCodeTemplate.orderLimit;
        } else {
            return -1;
        }
    },

    //根据订单号获取商品折扣和订单优惠（满减）是否共享
    async getOrderAndGoodsPromotionIsShared(trade_no) {
        let order = await Orders.findOne({
            where: {
                trade_no: trade_no
            }
        })
        //查询商品折扣优惠
        let QRCodeTemplate = await QRCodeTemplates.findOne({
            where: {
                QRCodeTemplateId: order.QRCodeTemplateId,
                tenantId: order.tenantId,
            }
        })
        if (QRCodeTemplate != null) {
            let isShared = QRCodeTemplate.isShared;
            return isShared;
        } else {
            return false;
        }
    },

    //通过二维码id，foodId获取活动价
    async getActivityPrice(QRCodeTemplateId, goodsId, tenantId) {
        //查询商品折扣优惠
        let goodsPromotion = await GoodsPromotions.findOne({
            where: {
                QRCodeTemplateId: QRCodeTemplateId,
                tenantId: tenantId,
                goodsId: goodsId
            }
        })
        if (goodsPromotion != null) {
            return goodsPromotion.activityPrice;
        } else {
            return null;
        }
    },

    //暂不考虑优惠的时间段
    async getGoodsDiscount(trade_no, goodsId, goodsNum) {
        //待完善
        let goodsDiscount = 0;
        // //通过订单号查询二维码id
        // let order = await Orders.findOne({
        //     where: {
        //         trade_no: trade_no
        //     }
        // })

        let orderGoods = await OrderGoods.findAll({
            where: {
                trade_no: trade_no,
                FoodId: goodsId
            }
        })

        // //查询商品折扣优惠
        // let goodsPromotion = await GoodsPromotions.findOne({
        //     where: {
        //         QRCodeTemplateId: order.QRCodeTemplateId,
        //         tenantId:order.tenantId,
        //         goodsId:goodsId
        //     }
        // })

        if (orderGoods[0].activityPrice == -1) {
            return 0;
        } else {
            if (orderGoods[0].purchaseLimit != -1) {
                if (goodsNum < orderGoods[0].purchaseLimit) {
                    goodsDiscount = goodsNum * (orderGoods[0].price - orderGoods[0].activityPrice);
                } else {
                    goodsDiscount = orderGoods[0].purchaseLimit * (orderGoods[0].price - orderGoods[0].activityPrice)
                }
            } else {
                goodsDiscount = goodsNum * (orderGoods[0].price - orderGoods[0].activityPrice);
            }
            return goodsDiscount;
        }
    },

    //暂不考虑优惠的时间段
    async getGoodsDiscountAndPurchaseLimit(trade_no, goodsId, goodsNum) {
        //待完善
        let json = {};
        let goodsDiscount = 0;
        let orderGoods = await OrderGoods.findAll({
            where: {
                trade_no: trade_no,
                FoodId: goodsId
            }
        })

        if (orderGoods[0].activityPrice == -1) {
            json.goodsDiscount = 0;
            json.goodsNum = -1;
            return json;
        } else {
            if (orderGoods[0].purchaseLimit != -1) {
                if (goodsNum < orderGoods[0].purchaseLimit) {
                    goodsDiscount = goodsNum * (orderGoods[0].price - orderGoods[0].activityPrice);
                    json.goodsDiscount = goodsDiscount;
                    json.goodsNum = goodsNum;
                } else {
                    goodsDiscount = orderGoods[0].purchaseLimit * (orderGoods[0].price - orderGoods[0].activityPrice);
                    json.goodsDiscount = goodsDiscount;
                    json.goodsNum = orderGoods[0].purchaseLimit;
                }
            } else {
                goodsDiscount = goodsNum * (orderGoods[0].price - orderGoods[0].activityPrice);
                json.goodsDiscount = goodsDiscount;
                json.goodsNum = goodsNum;
            }
            return json;
        }
    },

}