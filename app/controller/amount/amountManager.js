const request = require('request');

const path = require('path');
const db = require('../../db/mysql/index');

const Orders = db.models.NewOrders;
const OrderGoods = db.models.OrderGoods;
const Foods = db.models.Foods;
const VipIntegrals = db.models.VipIntegrals
const HeadquartersIntegrals = db.models.HeadquartersIntegrals
const Headquarters =db.models.Headquarters
const HeadquartersSetIntegrals = db.models.HeadquartersSetIntegrals
const AllianceIntegrals = db.models.AllianceIntegrals
const AllianceHeadquarters = db.models.AllianceHeadquarters;
const MerchantIntegrals = db.models.MerchantIntegrals
const MerchantSetIntegrals = db.models.MerchantSetIntegrals;
const AllianceSetIntegrals = db.models.AllianceSetIntegrals
const AllianceMerchants = db.models.AllianceMerchants
const Vips = db.models.Vips;
const ProfitSharings = db.models.ProfitSharings;
const Coupons = db.models.Coupons;
const Merchants = db.models.Merchants;
const Alliances = db.models.Alliances;
const DeliveryFees = db.models.DeliveryFees;
const DistanceAndPrices = db.models.DistanceAndPrices;
const TenantConfigs = db.models.TenantConfigs;
const Consignees = db.models.Consignees;
const orderManager = require('../customer/order');
const promotionManager = require('../customer/promotions')
const vipManager = require('../customer/vip');
const Tool = require('../../Tool/tool')

const amountManger = (function () {


    let getTransAccountAmount = async function (tenantId, consigneeId, trade_no, paymentMethod, refund_amount) {
        let amountJson = await this.getAmountByTradeNo(tenantId, consigneeId, trade_no);

        let totalAmount = 0;

        let platformAmount = 0;
        let platformCouponFee = 0;
        let merchantCouponFee = 0;
        let couponType = null;
        let couponValue = null;
        let firstDiscountAmount = 0;
        let tmpTotalPrice = 0;
        //是否折扣和优惠券共享
        let isShared = await promotionManager.getOrderAndGoodsPromotionIsShared(trade_no);

        let retJson = {};
        let order = await Orders.findOne({
            where: {
                trade_no: trade_no,
                tenantId: tenantId,
                consigneeId: consigneeId
            },
            paranoid: false
        })

        //异常情况不转账
        if (order == null) {
            // console.log("order==null; trade_no ====" + trade_no);
            retJson.totalAmount = 0;
            retJson.merchantAmount = 0;
            retJson.consigneeAmount = 0;
            retJson.totalPrice = 0;
            return retJson;
        }

        //查询代售和租户是否相同
        let isSame = await this.isTenantIdAndConsigneeIdSame(tenantId, consigneeId);

        let phone = order.phone;

        //通过订单号获取优惠券
        let coupon = await Coupons.findOne({
            where: {
                trade_no: trade_no,
                phone: phone,
                tenantId: tenantId,
                //status: 0
            }
        })

        //获取会员信息算会员价
        let vip = await vipManager.isVipWithoutPrice(phone, tenantId);
        if (vip == true) {
            totalAmount = amountJson.totalVipPrice;
            tmpTotalPrice = amountJson.totalVipPrice;
            amountJson.totalGoodsDiscount = 0;
        } else {
            totalAmount = amountJson.totalPrice - amountJson.totalGoodsDiscount;
            tmpTotalPrice = amountJson.totalPrice;
        }

        //首单折扣，-1表示不折扣，根据手机号和租户id,暂时没用（原青豆家）
        let firstDiscount = await orderManager.getFirstDiscountByTradeNo(trade_no, tenantId);

        if (firstDiscount != -1) {
            // console.log("转账firstDiscount=" + firstDiscount);
            firstDiscountAmount = totalAmount * (1 - firstDiscount);
            firstDiscountAmount = Math.round(firstDiscountAmount * 100) / 100;
            // console.log("firstDiscountAmount=" + firstDiscountAmount);
            totalAmount = totalAmount * firstDiscount;
            totalAmount = Math.round(totalAmount * 100) / 100;
        }

        //首杯半价
        let firstOrderFlag = false;
        let firstOrderDiscount = await orderManager.getFirstOrderDiscountByTradeNo(trade_no, tenantId);
        // console.log("转账||firstOrderDiscount===========" + firstOrderDiscount);
        if (firstOrderDiscount != 0) {
            totalAmount = totalAmount - firstOrderDiscount;
            firstOrderFlag = true;
        }

        // //couponRate 平台出优惠券比率 比如0.6 商家0.4
        // if (coupon != null) {
        //     switch (coupon.couponType) {
        //         case 'amount':
        //             //totalAmount = ((totalAmount - coupon.value * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount - coupon.value * (1 - coupon.couponRate));
        //             totalAmount = ((totalAmount - coupon.value * (coupon.couponRate)) <= 0) ? 0.01 : (totalAmount - coupon.value * (coupon.couponRate));
        //             break;
        //         case 'discount':
        //             //totalAmount = totalAmount - totalAmount * (1 - coupon.value) * (1 - coupon.couponRate);
        //             totalAmount = totalAmount - totalAmount * (1 - coupon.value) * (coupon.couponRate);
        //             break;
        //         case 'reduce':
        //             if (totalAmount >= coupon.value.split('-')[0]) {
        //                 //totalAmount = totalAmount - coupon.value.split('-')[1] * (1 - coupon.couponRate);
        //                 totalAmount = totalAmount - coupon.value.split('-')[1] * (coupon.couponRate);
        //             }
        //             break;
        //         default:
        //             totalAmount = totalAmount;
        //     }
        //     // if (coupon.couponRate == '1') {
        //     //     //平台付
        //     //     console.log('平台付：' + totalAmount)
        //     // } else if (coupon.couponRate == '0') {
        //     //     //商家付
        //     //     switch (coupon.couponType) {
        //     //         case 'amount':
        //     //             totalAmount = ((totalAmount - coupon.value) <= 0) ? 0.01 : (totalAmount - coupon.value);
        //     //             break;
        //     //         case 'discount':
        //     //             totalAmount = totalAmount * coupon.value;
        //     //             break;
        //     //         case 'reduce':
        //     //             if (coupon.value.split('-')[0] >= total_amount) {
        //     //                 totalAmount = totalAmount - coupon.value.split('-')[1];
        //     //             }
        //     //             break;
        //     //         default:
        //     //             totalAmount = totalAmount;
        //     //     }
        //     //     console.log('商家付：' + totalAmount)
        //     // } else {
        //     //     switch (coupon.couponType) {
        //     //         case 'amount':
        //     //             totalAmount = ((totalAmount - coupon.value * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount - coupon.value * (1 - coupon.couponRate));
        //     //             break;
        //     //         case 'discount':
        //     //             totalAmount = totalAmount - totalAmount * (1 - coupon.value) * (1 - coupon.couponRate);
        //     //             break;
        //     //         case 'reduce':
        //     //             if (coupon.value.split('-')[0] >= total_amount) {
        //     //                 totalAmount = totalAmount - coupon.value.split('-')[1] * (1 - coupon.couponRate);
        //     //             }
        //     //             break;
        //     //         default:
        //     //             totalAmount = totalAmount;
        //     //     }
        //     //     console.log('平台商家共付：' + totalAmount)
        //     // }
        // }

        //加上配送费
        let dbDeliveryFee = await DeliveryFees.findOne({
            where: {
                trade_no: trade_no,
                tenantId: tenantId,
            }
        })

        let deliveryFee = 0;
        if (dbDeliveryFee != null) {
            let distanceAndPrice = await DistanceAndPrices.findOne({
                where: {
                    deliveryFeeId: dbDeliveryFee.deliveryFeeId,
                    tenantId: tenantId,
                }
            })
            if (distanceAndPrice != null) {
                deliveryFee = distanceAndPrice.deliveryFee;
            }
        }

        if (paymentMethod == '支付宝') {
            //暂时我们出手续费
            // //四舍五入 千分之0.994转账
            totalAmount = Math.round(totalAmount * 99.4) / 100;//减去配送费的支付宝手续费
            totalAmount = totalAmount - refund_amount; //减去退款
        } else {
            totalAmount = totalAmount - refund_amount; //减去退款
        }

        let profitsharing = await ProfitSharings.findOne({
            where: {
                tenantId: tenantId,
                consigneeId: consigneeId
            }
        });


        let merchantAmount = 0;
        let consigneeAmount = 0;

        if (profitsharing == null) {
            //首杯半价不享受优惠券
            if (firstOrderFlag == true || (isShared == false && amountJson.totalGoodsDiscount > 0)) {
                //全转给商家
                merchantAmount = totalAmount * (1 - 0.02);
                consigneeAmount = 0;
            } else {
                if (coupon != null) {
                    console.log(coupon)

                    //总金额*自己分润 - 商家承担优惠
                    switch (coupon.couponType) {
                        case 'amount':
                            merchantAmount = ((totalAmount - coupon.value * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount - coupon.value * (1 - coupon.couponRate));
                            merchantAmount = Math.round(merchantAmount * 100) / 100;

                            platformCouponFee = coupon.value * coupon.couponRate;
                            merchantCouponFee = coupon.value * (1 - coupon.couponRate);

                            consigneeAmount = 0;
                            break;
                        case 'discount':
                            merchantAmount = totalAmount - totalAmount * (1 - coupon.value) * (1 - coupon.couponRate);
                            merchantAmount = Math.round(merchantAmount * 100) / 100;

                            platformCouponFee = totalAmount * (1 - coupon.value) * coupon.couponRate;
                            merchantCouponFee = totalAmount * (1 - coupon.value) * (1 - coupon.couponRate);

                            consigneeAmount = 0;

                            break;
                        case 'reduce':
                            if (totalAmount >= coupon.value.split('-')[0]) {
                                merchantAmount = ((totalAmount - coupon.value.split('-')[1] * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount - coupon.value.split('-')[1] * (1 - coupon.couponRate));
                                // console.log("TTTTTTTTTTTTTTTTTTTTT1==" + merchantAmount);
                                merchantAmount = Math.round(merchantAmount * 100) / 100;

                                platformCouponFee = coupon.value.split('-')[1] * coupon.couponRate;
                                merchantCouponFee = coupon.value.split('-')[1] * (1 - coupon.couponRate);

                                consigneeAmount = 0;
                            }
                            break;
                        default:
                            totalAmount = totalAmount * (1 - 0.02);
                            return retJson;
                    }
                    couponType = coupon.couponType;
                    couponValue = coupon.value;
                } else {
                    //门店收百分之2，写死
                    merchantAmount = totalAmount * (1 - 0.02);
                    consigneeAmount = 0;
                }
            }
        } else {
            //首杯半价不享受优惠券
            if (firstOrderFlag == true || (isShared == false && amountJson.totalGoodsDiscount > 0)) {
                //全转给商家
                merchantAmount = totalAmount * (1 - 0.02);
                consigneeAmount = 0;
            } else {
                if (coupon != null) {
                    //总金额*自己分润 - 商家承担优惠
                    switch (coupon.couponType) {
                        case 'amount':
                            // merchantAmount = ((totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - coupon.value * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - coupon.value * (1 - coupon.couponRate));
                            // merchantAmount = Math.round(merchantAmount * 100) / 100;

                            platformCouponFee = coupon.value * coupon.couponRate;
                            merchantCouponFee = coupon.value * (1 - coupon.couponRate);

                            merchantAmount = (((totalAmount - coupon.value) * (1 - profitsharing.rate - profitsharing.ownRate) + platformCouponFee) <= 0) ? 0.01 : ((totalAmount - coupon.value) * (1 - profitsharing.rate - profitsharing.ownRate) + platformCouponFee);
                            merchantAmount = Math.round(merchantAmount * 100) / 100;

                            consigneeAmount = (((totalAmount - coupon.value) * profitsharing.rate - platformCouponFee) <= 0) ? 0 : ((totalAmount - coupon.value) * profitsharing.rate - platformCouponFee);
                            consigneeAmount = Math.round(consigneeAmount * 100) / 100;

                            break;
                        case 'discount':
                            // merchantAmount = totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - totalAmount * (1 - coupon.value) * (1 - coupon.couponRate);
                            // merchantAmount = Math.round(merchantAmount * 100) / 100;

                            platformCouponFee = totalAmount * (1 - coupon.value) * coupon.couponRate;
                            merchantCouponFee = totalAmount * (1 - coupon.value) * (1 - coupon.couponRate);

                            merchantAmount = totalAmount * coupon.value * (1 - profitsharing.rate - profitsharing.ownRate) + platformCouponFee;
                            merchantAmount = Math.round(merchantAmount * 100) / 100;

                            consigneeAmount = ((totalAmount * coupon.value * profitsharing.rate - platformCouponFee) <= 0) ? 0 : (totalAmount * coupon.value * profitsharing.rate - platformCouponFee);
                            consigneeAmount = Math.round(consigneeAmount * 100) / 100;

                            break;
                        case 'reduce':
                            if (totalAmount >= coupon.value.split('-')[0]) {
                                // merchantAmount = ((totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - coupon.value.split('-')[1] * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - coupon.value.split('-')[1] * (1 - coupon.couponRate));
                                // console.log("TTTTTTTTTTTTTTTTTTTTT1==" + merchantAmount);
                                // merchantAmount = Math.round(merchantAmount * 100) / 100;
                                // console.log("TTTTTTTTTTTTTTTTTTTTT2==" + merchantAmount);

                                platformCouponFee = coupon.value.split('-')[1] * coupon.couponRate;
                                merchantCouponFee = coupon.value.split('-')[1] * (1 - coupon.couponRate);

                                // consigneeAmount = ((totalAmount * profitsharing.rate - coupon.value.split('-')[1]) <= 0) ? 0 : (totalAmount * profitsharing.rate - coupon.value.split('-')[1]);
                                // consigneeAmount = Math.round(consigneeAmount * 100) / 100;

                                // consigneeAmount = ((totalAmount * profitsharing.rate - platformCouponFee) <= 0) ? 0 : (totalAmount * profitsharing.rate - platformCouponFee);
                                // consigneeAmount = Math.round(consigneeAmount * 100) / 100;

                                //if (tenantId == '18d473e77f459833bb06c60f9a8f0000') {
                                merchantAmount = (totalAmount - coupon.value.split('-')[1]) * (1 - profitsharing.rate - profitsharing.ownRate) + platformCouponFee;
                                // console.log("TTTTTTTTTTTTTTTTTTTTT2==" + merchantAmount);
                                //
                                consigneeAmount = (((totalAmount - coupon.value.split('-')[1]) * profitsharing.rate - platformCouponFee) <= 0) ? 0 : ((totalAmount - coupon.value.split('-')[1]) * profitsharing.rate - platformCouponFee);
                                consigneeAmount = Math.round(consigneeAmount * 100) / 100;
                                // console.log("青豆家转账===" + merchantAmount);
                                // }
                            }
                            break;
                        default:
                            totalAmount = totalAmount;
                            return retJson;
                    }
                    couponType = coupon.couponType;
                    couponValue = coupon.value;
                } else {
                    if (isSame == false) {
                        //不使用优惠券百分之20，按*2去处理
                        merchantAmount = totalAmount * (1 - profitsharing.rate * 2 - profitsharing.ownRate * 2);
                        merchantAmount = Math.round(merchantAmount * 100) / 100;

                        consigneeAmount = totalAmount * profitsharing.rate * 2;//代售商户提成
                        consigneeAmount = Math.round(consigneeAmount * 100) / 100;
                    } else {
                        //门店收百分之2，写死
                        //ownRate为平台分成比率
                        //1-平台分成比率 = 商家分成比率
                        console.log(11111111111111111111)
                        merchantAmount = totalAmount * (1-profitsharing.ownRate);
                        consigneeAmount = 0;
                    }
                }
            }
        }

        //商家优惠 加上首单折扣
        merchantCouponFee = merchantCouponFee + firstDiscountAmount + firstOrderDiscount + amountJson.totalGoodsDiscount;

        platformAmount = tmpTotalPrice - (platformCouponFee + merchantCouponFee) - merchantAmount - consigneeAmount;
        platformAmount = Math.round(platformAmount * 100) / 100;

        platformCouponFee = Math.round(platformCouponFee * 100) / 100;
        merchantCouponFee = Math.round(merchantCouponFee * 100) / 100;

        let totalPrice = Math.round(tmpTotalPrice * 100) / 100;

        retJson.totalAmount = parseFloat(totalAmount) + parseFloat(deliveryFee);//加配送费
        retJson.totalAmount = Math.round(retJson.totalAmount * 100) / 100;

        retJson.merchantAmount = parseFloat(merchantAmount) + parseFloat(deliveryFee);//加配送费
        retJson.merchantAmount = Math.round(retJson.merchantAmount * 100) / 100;

        retJson.consigneeAmount = consigneeAmount;
        retJson.consigneeAmount = Math.round(retJson.consigneeAmount * 100) / 100;

        retJson.totalPrice = totalPrice;
        retJson.platformCouponFee = platformCouponFee;
        retJson.merchantCouponFee = merchantCouponFee;
        retJson.deliveryFee = deliveryFee;
        retJson.refund_amount = refund_amount;
        retJson.platformAmount = platformAmount;
        retJson.couponType = couponType;
        retJson.couponValue = couponValue;

        // console.log("返回给订单的所有金额:")
        // console.log("trade_no===" + trade_no);
        // console.log("totalPrice====" + totalPrice);
        // console.log("merchantAmount====" + merchantAmount);
        // console.log("consigneeAmount====" + consigneeAmount);
        // console.log("platformCouponFee====" + platformCouponFee);
        // console.log("merchantCouponFee====" + merchantCouponFee);
        // console.log("deliveryFee====" + deliveryFee);
        // console.log("refund_amount====" + refund_amount);
        // console.log("platformAmount====" + platformAmount);
        // console.log("couponType===" + couponType);
        // console.log("couponValue===" + couponValue);
        return retJson;

    }


    //通过订单号获取总金额
    let getAmountByTradeNo = async function (tenantId, consigneeId, trade_no) {
        let orderGoods = await OrderGoods.findAll({
            where: {
                trade_no: trade_no,
                tenantId: tenantId,
                consigneeId: consigneeId
            }
        });

        let foodIds = [];
        for (let k = 0; k < orderGoods.length; k++) {
            if (!foodIds.contains(orderGoods[k].FoodId)) {
                foodIds.push(orderGoods[k].FoodId)
            }
        }

        let totalPrice = 0;
        let totalVipPrice = 0;
        let goodsDiscount = 0;
        let totalGoodsDiscount = 0;
        for (var i = 0; i < foodIds.length; i++) {
            orderGoods = await OrderGoods.findAll({
                where: {
                    trade_no: trade_no,
                    FoodId: foodIds[i]
                }
            })

            var foodNum = 0;
            for (var j = 0; j < orderGoods.length; j++) {
                foodNum += orderGoods[j].num;
                totalPrice += orderGoods[0].price * orderGoods[j].num;//原价
                totalVipPrice += orderGoods[0].vipPrice * orderGoods[j].num;//会员价
            }
            //根据订单号和商品id查询商品折扣优惠
            goodsDiscount = await promotionManager.getGoodsDiscount(trade_no, foodIds[i], foodNum);
            totalGoodsDiscount += goodsDiscount;

        }

        let json = {};
        json.totalPrice = Math.round(totalPrice * 100) / 100;
        json.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
        json.totalGoodsDiscount = Math.round(totalGoodsDiscount * 100) / 100;
        return json;
    }

    //判断是否给自己代售
    let isTenantIdAndConsigneeIdSame = async function (tenantId, consigneeId) {
        let tenantConfig = await TenantConfigs.findOne({
            where: {
                tenantId: tenantId,
            }
        })

        let consignee = await Consignees.findOne({
            where: {
                consigneeId: consigneeId,
            }
        })

        if (consignee == null) {
            return false;
        }

        if (tenantConfig.name == consignee.name) {
            return true;
        } else {
            return false;
        }

    }
    //会员购买商品后的积分分配
    let integralAllocation = async function (trade_no, tenantId, phone, totalPrice, pay) {
        // console.log("会员购买商品后的积分分配中的交易商:"+tenantId)
        // console.log("会员购买商品后的积分分配中的电话:"+phone)
        // console.log("会员购买商品后的积分分配中的价格:"+totalPrice)
        let allianceMerchants = await AllianceMerchants.findOne({
            where: {
                tenantId: tenantId
            }
        })
        let alliancesId = allianceMerchants.alliancesId
        // console.log("商圈的Id"+alliancesId)
        let vip = await Vips.findOne({
            where: {
                alliancesId: alliancesId,
                phone: phone
            }
        })
        // console.log("vip用户信息"+vip.phone)

        //查询此租户的积分配置
        let merchantSetIntegrals = await MerchantSetIntegrals.findOne({
            where: {
                tenantId: tenantId
            }
        })
        // console.log("租户积分配置信息"+merchantSetIntegrals)

        let priceIntegralsRate
        //转换成int类型
        if (merchantSetIntegrals != null) {
            priceIntegralsRate = Number(merchantSetIntegrals.priceIntegralsRate).toFixed(2)
        }
        // console.log(priceIntegralsRate)
        //积分记录ID
        let vipIntegralsId
        // console.log("pay的值为:"+pay)
        if (pay == "支付宝") {
            vipIntegralsId = "alpy" + (Tool.allocTenantId().substring(4));
        }
        else if (pay == "微信") {
            vipIntegralsId = "wxpy" + (Tool.allocTenantId().substring(4));
        } else {
            vipIntegralsId = "wupy" + (Tool.allocTenantId().substring(4));
        }

        //得到本次消费的积分数
        let integral = priceIntegralsRate == 0 ? 0 : Math.ceil(totalPrice / priceIntegralsRate)

        //得到商家返利积分（暂时写死为20）
        let merchantRebate = 20;
        //得到商家返给平台的积分
        let merchantRebateTerrace = Math.floor(merchantRebate * 0.1)
        //得到商家返给商圈的积分
        let merchantRebateAlliance = Math.floor(merchantRebate * 0.2)
        //得到商家返给开户商积分
        let merchantRebateMerchant = Math.floor(merchantRebate * 0.7)
        //查询商家的总积分数
        // console.log(Merchants)
        let merchant = await Merchants.findOne({
            where: {
                tenantId: tenantId
            }
        })
        // console.log("租户为"+merchant.name)
        // console.log("商家积分"+merchant.aggregateScore)
        // console.log("给会员的积分"+integral)
        //商家剩余积分数
        let merchantResidueIntegral = merchant.aggregateScore - (merchantRebate + integral)

        // // console.log("商家积分"+merchant.aggregateScore)
        // console.log("商家返利积分"+merchantRebate)
        // // console.log("给会员的积分"+integral)
        // console.log("商家剩余的总积分"+merchantResidueIntegral)
        // //检查vip积分Id是否存在
        // console.log("检查vip积分Id是否存在"+vipIntegralsId)
        // //添加一条vip积分表的记录
        // console.log("会员积分表"+VipIntegrals)
        // console.log("商圈Id"+alliancesId)
        if (merchantResidueIntegral < 0) {
            return "-1"
        }
        await VipIntegrals.create({
            vipIntegralsId: vipIntegralsId,
            vipId: vip.membershipCardNumber,
            buyOrSale: "1",
            buyOrSaleMerchant: tenantId,
            price: totalPrice,
            integral: integral,
            allianceId: alliancesId,
            trade_noId: trade_no
        })
        //用查询到的积分数+本次消费的积分数得到会员的总积分数
        let aggregateScore = Number(vip.aggregateScore) + integral
        //修改VIP表中的总积分数
        await Vips.update({
            aggregateScore: aggregateScore
        }, {
            where: {
                phone: phone,
                alliancesId: alliancesId
            }
        })
        //在menchant积分表中增加一条vip购买的记录记录
        let merchantVipId = "VipM" + Tool.allocTenantId().substring(4)
        await MerchantIntegrals.create({
            merchantIntegralsId: merchantVipId,
            tenantId: tenantId,
            buyOrSale: 0,//失去积分
            buyOrSaleMerchant: vip.phone,//积分给此vip
            price: totalPrice,//获得的钱数
            integral: integral,//失去的积分数
            trade_noId: trade_no
        })

        //修改商家表中的总积分数
        await Merchants.update({
            aggregateScore: merchantResidueIntegral
        }, {
            where: {
                tenantId: tenantId
            }
        })
        //获得商圈积分
        let alliances = await Alliances.findOne({
            where: {
                alliancesId: alliancesId
            }
        })
        //修改商圈总积分
        let alliancesResidueIntegral = alliances.aggregateScore + merchantRebateAlliance
        await Alliances.update({
            aggregateScore: alliancesResidueIntegral
        }, {
            where: {
                alliancesId: alliancesId
            }
        })
        let merchantAlliancesId = "AllM" + Tool.allocTenantId().substring(4)
        await MerchantIntegrals.create({
            merchantIntegralsId: merchantAlliancesId,
            tenantId: tenantId,
            buyOrSale: 0,//失去积分
            buyOrSaleMerchant: alliancesId,//积分给此商圈
            price: 0,//获得的钱数
            integral: merchantRebateAlliance,//失去的积分数
            trade_noId: null
        })
        let alliancesMerchantId = "MerA" + Tool.allocTenantId().substring(4)
        await AllianceIntegrals.create({
            allianceIntegralsId: alliancesMerchantId,
            alliancesId: alliancesId,
            buyOrSale: 0,//获取积分
            buyOrSaleMerchant: tenantId,//积分给此从租户获取
            price: 0,//失去的钱数
            integral: merchantRebateAlliance,//获取的积分数
        })


        //获得开户商
        let openMerchant = await Merchants.findOne({
            where: {
                tenantId: vip.tenantId
            }
        })
        let openMerchantResidueIntegral = openMerchant.aggregateScore + merchantRebateMerchant
        //修改开户商总积分
        await Merchants.update({
            aggregateScore: openMerchantResidueIntegral
        }, {
            where: {
                tenantId: vip.tenantId
            }
        })
        let merchantOpenId = "OpenM" + Tool.allocTenantId().substring(4)
        await MerchantIntegrals.create({
            merchantIntegralsId: merchantOpenId,
            tenantId: tenantId,
            buyOrSale: 0,//失去积分
            buyOrSaleMerchant: vip.tenantId,//积分给此租户
            price: 0,//获得的钱数
            integral: merchantRebateMerchant,//失去的积分数
            trade_noId: null
        })
        //开户商的租户
        let openMerchantId = "MerO" + Tool.allocTenantId().substring(4)
        await MerchantIntegrals.create({
            merchantIntegralsId: openMerchantId,
            tenantId: vip.tenantId,
            buyOrSale: 1,//获得积分
            buyOrSaleMerchant: tenantId,//积分从此租户获取
            price: 0,//获得的钱数
            integral: merchantRebateMerchant,//失去的积分数
            trade_noId: null
        })

        let allianceHeadquarters = await AllianceHeadquarters.findOne({
            where: {
                alliancesId: alliancesId
            }
        })
        //获得平台积分
        let headquarters = await Headquarters.findOne({
            where: {
                headquartersId: allianceHeadquarters.headquartersId
            }
        })
        //修改平台总积分
        let headquartersResidueIntegral = Number(headquarters.aggregateScore) + merchantRebateTerrace;
        await Headquarters.update({
            aggregateScore: headquartersResidueIntegral
        }, {
            where: {
                headquartersId: allianceHeadquarters.headquartersId
            }
        })
        //在menchant积分表中增加一条给平台积分的记录
        let merchantHeaId = "heaM" + Tool.allocTenantId().substring(4)
        await MerchantIntegrals.create({
            merchantIntegralsId: merchantHeaId,
            tenantId: tenantId,
            buyOrSale: 0,//失去积分
            buyOrSaleMerchant: headquarters.headquartersId,//积分给此平台
            price: 0,//获得的钱数
            integral: merchantRebateTerrace,//失去的积分数
            trade_noId: null
        })
        let HeadquartersMer = "merH" + Tool.allocTenantId().substring(4)
        await HeadquartersIntegrals.create({
            headquartersIntegralsId: HeadquartersMer,
            headquartersId: headquarters.headquartersId,
            buyOrSale: 1,//获得积分
            buyOrSaleMerchant: tenantId,
            price: 0,//失去的钱数
            integral: merchantRebateTerrace,//获得的积分数
        })
        return "1"
    }
    //充值积分
    let rechargeIntegral = async function (alliancesId, totalPrice) {
        // console.log("用了"+totalPrice)
        // console.log(alliancesId)
        //查询商圈对应的平台
        let alliancesHeadquarters = await AllianceHeadquarters.findOne({
            where: {
                alliancesId: alliancesId
            }
        })
        // let dealId
        //如果对应的平台不为null的话
        if (alliancesHeadquarters != null) {
            //如果这个付款的alliancesId是商圈的，那么就是在平台充值
            let dealId = alliancesHeadquarters.headquartersId
            //生成一个和商圈有关的平台Id
            let headquartersIntegralsId = "allH" + (Tool.allocTenantId().substring(4))
            //查询这个平台的积分设置
            let headquartersSetIntegrals = await HeadquartersSetIntegrals.findOne({
                where: {
                    alliancesId: alliancesId
                }
            })
            //积分=总价格/积分配置的比率
            let integral = totalPrice / (Number(headquartersSetIntegrals.priceIntegralsRate))
            //平台的操作记录下来
            await HeadquartersIntegrals.create({
                headquartersIntegralsId: headquartersIntegralsId,
                headquartersId: dealId,
                buyOrSale: "0",//失去积分
                buyOrSaleMerchant: alliancesId,
                price: totalPrice,
                integral: integral,
            })
            let headquarters = await Headquarters.findOne({
                where: {
                    headquartersId: dealId,
                }
            })
            let aggregateScoreHeadquarters = headquarters.aggregateScore - integral
            await Headquarters.update({
                aggregateScore: aggregateScoreHeadquarters
            }, {
                where: {
                    headquartersId: dealId,
                }
            })

            //生成一个和平台有关的商圈Id
            let alliancesIntegralsId = "heaA" + (Tool.allocTenantId().substring(4))
            //将商圈的操作记录下来
            await AllianceIntegrals.create({
                allianceIntegralsId: alliancesIntegralsId,
                alliancesId: alliancesId,
                buyOrSale: "1",
                buyOrSaleMerchant: dealId,
                price: totalPrice,
                integral: integral,
            })
            let alliances = await Alliances.findOne({
                where: {
                    alliancesId: alliancesId,
                }
            })
            let aggregateScoreAlliances = alliances.aggregateScore + integral
            await Alliances.update({
                aggregateScore: aggregateScoreAlliances
            }, {
                where: {
                    alliancesId: alliancesId,
                }
            })


        }
        if (alliancesHeadquarters == null) {
            //如果没找到的话就说明这个付款的Id是租户的
            //查询商圈和租户的关联表查询到在那个商圈充值的


            let alliancesMerchant = await AllianceMerchants.findOne({
                where: {
                    tenantId: alliancesId
                }
            })
            // console.log("alliancesMerchant商圈租户关联的关系"+alliancesMerchant)
            //获得商圈IdW
            // console.log(alliancesMerchant.alliancesId)

            //获得一个和租户有关的Id
            let alliancesIntegralsId = "tenA" + (Tool.allocTenantId().substring(4))
            //查询商圈设置的积分
            let allianceSetIntegrals = await AllianceSetIntegrals.findOne({
                where: {
                    alliancesId: alliancesMerchant.alliancesId
                }
            })
            //计算出购买的积分量
            let integral = totalPrice / (Number(allianceSetIntegrals.priceIntegralsRate))
            // console.log("alliancesIntegralsId为"+alliancesIntegralsId)
            //新增商圈记录
            await AllianceIntegrals.create({
                allianceIntegralsId: alliancesIntegralsId,
                alliancesId: alliancesMerchant.alliancesId,
                buyOrSale: "0",//失去积分
                buyOrSaleMerchant: alliancesId,//给积分给那个租户
                price: totalPrice,
                integral: integral,
            })
            let alliance = await Alliances.findOne({
                where: {
                    alliancesId: alliancesMerchant.alliancesId,
                }
            })
            let aggregateScoreAlliances = Number(alliance.aggregateScore) - integral
            await Alliances.update({
                aggregateScore: aggregateScoreAlliances
            }, {
                where: {
                    alliancesId: alliancesMerchant.alliancesId
                }
            })

            let merchantIntegralsId = "allM" + (Tool.allocTenantId().substring(4))
            await MerchantIntegrals.create({
                merchantIntegralsId: merchantIntegralsId,
                tenantId: alliancesId,
                buyOrSale: "1",
                buyOrSaleMerchant: alliancesMerchant.alliancesId,
                price: totalPrice,
                integral: integral,
                trade_noId: null
            })
            let merchant = await Merchants.findOne({
                where: {
                    tenantId: alliancesId,
                }
            })
            let aggregateScoreMerchant = Number(merchant.aggregateScore) + integral
            await Merchants.update({
                aggregateScore: aggregateScoreMerchant
            }, {
                where: {
                    tenantId: alliancesId,
                }
            })
        }
    }
    //查询商家利润
    let getProfitRate = async function (tenantId,trade_no) {
        // console.log(444444444444444444444444)
        let totalPrices = 0//总价格
        let saleGoodsTotalPrices = 0//进价
        let profitPrice = 0//单个商品的价格
        let merchantTotalPrice = 0//给商户的钱
        let terracePrice = 0//给平台的价格
        let goodsArray = []
        let goodsJson = {}

        let tenantConfigs = await TenantConfigs.findOne({
            where:{
                tenantId : tenantId
            }
        })

        if (tenantConfigs == null) {
            return "没找到当前租户信息"
        }
        // let date = new Date().getTime()
        let ordergoods = await OrderGoods.findAll({
            where:{
                tenantId : tenantId,
                trade_no : trade_no
            }
        })
        // let endDate = new Date().getTime()

        let tenantConfigsJson = {}
        tenantConfigsJson.profitRate = tenantConfigs.profitRate != null ? tenantConfigs.profitRate + "%" : "0"
        let totalPrice = 0
        for (let og of ordergoods){
            let food = await Foods.findById(og.FoodId)
            if(food.isPlatformDelivery){
                let goodsMessgae = {}
                //商品总价格

                totalPrice=og.num * og.price
                totalPrices += totalPrice
                //卖出商品的进价价格
                let saleGoodsTotalPrice = 0
                saleGoodsTotalPrice = og.num*og.constPrice
                saleGoodsTotalPrices += saleGoodsTotalPrice
                //单个商品的利润
                let profitPriceOne = 0
                profitPriceOne = totalPrice - saleGoodsTotalPrice
                profitPrice +=profitPriceOne

                let terracePriceOne = 0
                let merchantTotalPriceOne = 0
                //这个租户有没有设置利润比率
                if (tenantConfigs.profitRate != null) {
                    //给租户的钱

                    merchantTotalPriceOne = profitPriceOne*(Number(tenantConfigs.profitRate))/100
                    merchantTotalPrice += merchantTotalPriceOne
                    //给平台的钱

                    terracePriceOne = profitPriceOne*(100-Number(tenantConfigs.profitRate))/100
                    terracePrice += terracePriceOne
                }
                goodsMessgae={
                    type : "小V宝商品",
                    totalPrices : totalPrice,//总价格
                    saleGoodsTotalPrices : saleGoodsTotalPrice,//总进价
                    profitPrice : profitPriceOne,//商品的利润
                    merchantTotalPrice : merchantTotalPriceOne,
                    terracePrice : terracePriceOne,
                    foodName : og.goodsName,
                    num : og.num
                }
                goodsArray.push(goodsMessgae)
            }else{
                let goodsMessgae = {}
                //商品总价格
                totalPrice=og.num * og.price
                // totalPrices += totalPrice
                //商家与平台的利率
                let saleGoodsTotalPrice = 0
                saleGoodsTotalPrice = og.num*og.constPrice
                saleGoodsTotalPrices += saleGoodsTotalPrice
                //单个商品的利润
                let profitPriceOne = 0
                profitPriceOne = totalPrice - saleGoodsTotalPrice
                profitPrice +=profitPriceOne

                let terracePriceOne = 0
                let merchantTotalPriceOne = 0
                //这个租户有没有设置利润比率
                if (tenantConfigs.profitRate != null) {
                    //给租户的钱

                    merchantTotalPriceOne = profitPriceOne*(Number(tenantConfigs.profitRate))/100
                    merchantTotalPrice += merchantTotalPriceOne
                    //给平台的钱

                    terracePriceOne = profitPriceOne*(100-Number(tenantConfigs.profitRate))/100
                    terracePrice += terracePriceOne
                }
                goodsMessgae={
                    type : "商家自己的商品",
                    totalPrices : totalPrice,//总价格
                    saleGoodsTotalPrices : saleGoodsTotalPrice,//总进价
                    profitPrice : profitPriceOne,//商品的利润
                    merchantTotalPrice : merchantTotalPriceOne,
                    terracePrice : terracePriceOne,
                    foodName : og.goodsName,
                    num : og.num
                }
                goodsArray.push(goodsMessgae)
            }
        }

        goodsJson.totalPrices = totalPrices,
            goodsJson.saleGoodsTotalPrices = saleGoodsTotalPrices,
            goodsJson.profitPrice = profitPrice,
            goodsJson.merchantTotalPrice = merchantTotalPrice,
            goodsJson.terracePrice = terracePrice,
            goodsJson.goodsArray = goodsArray
        // console.log(goodsJson)
        return goodsJson
    }

    let getNewOrder = async function (tenantId) {
        let orders = await Orders.findAll({
            where:{
                tenantId : tenantId,
                consigneeId : {
                    $ne : null
                }
            }
        })
        let arrayOrder = []
        for(let o of orders){
            let orderJson = {
                phone : o.phone,
                status : o.status,
                trade_no : o.trade_no,
            }
            arrayOrder.push(orderJson)
        }
        return arrayOrder

    }
    let getBill = async function (tenantId) {
        let ordersJson = {}
        let totalPrice = 0
        let saleGoodsTotalPrices = 0
        let profitPrice = 0
        let merchantTotalPrice = 0
        let terracePrice = 0
        let orderArray = []
        let order = await getNewOrder(tenantId)
        // console.log(order)
        let getProfitRateArray = []
        for(let i = 0; i < order.length; i++){
            let orderJson = {}
            let orderGoods =await getProfitRate(tenantId,order[i].trade_no)
            // console.log(orderGoods)
            totalPrice += orderGoods.totalPrices
            saleGoodsTotalPrices += orderGoods.saleGoodsTotalPrices
            profitPrice += orderGoods.profitPrice
            merchantTotalPrice += orderGoods.merchantTotalPrice
            terracePrice += orderGoods.terracePrice
            orderJson.phone = order[i].phone
            orderJson.status = order[i].status
            orderJson.orderGoods = orderGoods
            orderArray.push(orderJson)
            getProfitRateArray.push(orderGoods)
        }
        Promise.all(getProfitRateArray)
        ordersJson.totalPrice = totalPrice
        ordersJson.saleGoodsTotalPrices = saleGoodsTotalPrices
        ordersJson.profitPrice = profitPrice
        ordersJson.merchantTotalPrice = merchantTotalPrice
        ordersJson.terracePrice = terracePrice
        ordersJson.orderArray = orderArray
        return ordersJson
    }
    //比利和分润
    let billyAndDividends = async function (tenantId,tradeNo,paymentMethod) {
        // console.log(222222222)
        // let order = await Orders.findOne({
        //     where:{
        //         tenantId : tenantId,
        //         trade_no : tradeNo
        //     }
        // })
        let ordergoods = await OrderGoods.findAll({
            where:{
                tenantId : tenantId,
                trade_no : tradeNo
            }
        })
        let tenantConfig = await TenantConfigs.findOne({
            where:{
                tenantId : tenantId
            }
        })
        if(tenantConfig==null){
            return "找不到此租户信息"
        }
        let merchantIntos = 0
        let platformInfos = 0
        let totalPrice = 0
        let serviceFee = 0.006
        if(paymentMethod=="ali"){
            serviceFee = 0.006
        }else if(paymentMethod=="weixin"){
            serviceFee = 0.01
        }

        let serviceFeePrice = 0
        let constPrices = 0
        let customerPaymentPrice = 0
        for(let og of ordergoods){

            let goodsOrder =0
            //单个商品的总价格
            let goodsTotalPrice = og.num*og.price
            customerPaymentPrice += goodsTotalPrice
            //用户转给的钱（）
            let realGoodsPrice = goodsTotalPrice*(1-serviceFee)
            serviceFeePrice += goodsTotalPrice*serviceFee
            totalPrice += realGoodsPrice
            // let merchantPrice =0

            let food = await Foods.findById(og.FoodId)
            //判断当前商品是否来自平台
            if(food.isPlatformDelivery){
                console.log()
                //判断利润分成的值
                let profitRate = tenantConfig.profitRate
                //算出商品的进价
                let constPrice = Number(og.constPrice)*Number(og.num)
                constPrices += constPrice
                //计算给商家的钱()
                merchantIntos += (realGoodsPrice-constPrice)*profitRate/100
                //计算给平台的钱()
                platformInfos += realGoodsPrice-realGoodsPrice*profitRate/100

            }else{
                let rate = tenantConfig.rate
                merchantIntos += realGoodsPrice*(1-rate)
                platformInfos += realGoodsPrice*rate
            }
        }
        let json = {
            customerPaymentPrice : customerPaymentPrice.toFixed(2),
            merchantPrice : (merchantIntos).toFixed(2),
            platformPrice : (platformInfos).toFixed(2),
            totalPrice : (totalPrice).toFixed(2),
            serviceFeePrice : serviceFeePrice.toFixed(2),
            constPrice : constPrices
        }
        return json
    }

    let aaa = {
        getTransAccountAmount: getTransAccountAmount,
        getAmountByTradeNo: getAmountByTradeNo,
        isTenantIdAndConsigneeIdSame: isTenantIdAndConsigneeIdSame,
        integralAllocation : integralAllocation,
        rechargeIntegral : rechargeIntegral,
        getProfitRate : getProfitRate,
        // getNewOrder : getNewOrder,
        getBill : getBill,
        billyAndDividends : billyAndDividends,
    }
    return aaa
})();

module.exports = amountManger;