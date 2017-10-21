const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Customers = db.models.Customers
let Vips = db.models.Vips
let getOneDayEchat = require('../echats/oneDayEchat')
let getMonthEchats = require('../echats/MonthEchats')


module.exports = {
    async getCustomerBehavior(ctx,next){
        ctx.checkQuery("tenantId").notEmpty();
        ctx.checkQuery("action").notEmpty();//0为未购买的//1为1次购买//2为多次购买
        ctx.checkQuery("startDate").notEmpty();
        ctx.checkQuery("endDate").notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        // let getTime = [];
        //
        // if (type == 1) {
        //     getTime = await getOneDayEchat.getDay(startTime, endTime)
        // }
        // if (type == 2) {
        //     getTime = await AnYearEchats.getAnYear(startTime, endTime)
        // }
        // if (type == 3) {
        //     getTime = await getMonthEchats.getMonth(startTime, endTime)
        // }

        let pageNumber = parseInt(ctx.query.pageNumber);

        if(pageNumber<1){
            pageNumber=1
        }

        let pageSize = parseInt(ctx.query.pageSize);
        if(pageNumber<1){
            pageNumber=1
        }
        let place = (pageNumber - 1) * pageSize;

        let customers =[]
        if(ctx.query.pageSize!=null&&ctx.query.pageNumber!=null&&ctx.query.pageNumber!=""&&ctx.query.pageSize!=""){
            if(ctx.query.action==0){
                customers = await Customers.findAll({
                    where:{
                        tenantId : ctx.query.tenantId,
                        status : 2,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    },
                    offset: Number(place),
                    limit: Number(pageSize)
                })
            }
            if(ctx.query.action==1){
                let customerss = await Customers.findAll({
                    where:{
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }
                })
                //获得第一次登陆的用户
                /**
                 * 第一次登陆：这段时间之前没登陆过，登录之后也没登陆过
                 *
                 */
                //第一次登陆
                console.log(customerss.length)
                let customerArray = []
                for(let l = 0; l < customerss.length; l++){
                    let customer = await Customers.findOne({
                        where:{
                            phone : customerss[l].phone,
                            tenantId : ctx.query.tenantId,
                            status : 3,
                            createdAt :{
                                $gte : new Date(ctx.query.startDate),
                                $lt : new Date(ctx.query.endDate)
                            }
                        }

                    })
                    customerArray.push(customer)
                }
                console.log(customerArray.length)
                //第一次登陆的Id
                let custArray = []
                for(let carray of customerArray){
                    if(!custArray.contains(carray.id)){
                        custArray.push(carray.id)
                    }
                }
                //第一次登陆完之后还登陆了就是多次登陆的人员
                let customersNotOne = await Customers.findAll({
                    where:{
                        id : {
                          $notIn : custArray
                        },
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }
                })
                let customersNotOnePhoneArray = []
                for(let cno of customersNotOne){
                    if(!customersNotOnePhoneArray.contains(cno.phone)){
                        customersNotOnePhoneArray.push(cno.phone)
                    }
                }
                customers = await Customers.findAll({
                    where:{
                        phone : {
                            $notIn : customersNotOnePhoneArray
                        },
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    },
                    offset: Number(place),
                    limit: Number(pageSize)

                })

            }

            if(ctx.query.action==2){
                let customerss = await Customers.findAll({
                    where:{
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }
                })
                //获得第一次登陆的用户
                /**
                 * 第一次登陆：这段时间之前没登陆过，登录之后也没登陆过
                 *
                 */
                    //第一次登陆
                let customerArray = []
                for(let l = 0; l < customerss.length; l++){
                    let customer = await Customers.findOne({
                        where:{
                            phone : customerss[l].phone,
                            tenantId : ctx.query.tenantId,
                            status : 3,
                            createdAt :{
                                $gte : new Date(ctx.query.startDate),
                                $lt : new Date(ctx.query.endDate)
                            }
                        }

                    })
                    customerArray.push(customer)
                }
                //第一次登陆的Id
                let custArray = []
                for(let carray of customerArray){
                    if(!custArray.contains(carray.id)){
                        custArray.push(carray.id)
                    }
                }
                //第一次登陆完之后还登陆了就是多次登陆的人员
                customers = await Customers.findAll({
                    where:{
                        id : {
                            $notIn : custArray
                        },
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    },
                    offset: Number(place),
                    limit: Number(pageSize)
                })
            }
        }

        if(ctx.query.pageSize==null&&ctx.query.pageNumber==null){
            if(ctx.query.action==0){
                customers = await Customers.findAll({
                    where:{
                        tenantId : ctx.query.tenantId,
                        status : 2,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }
                })
            }
            if(ctx.query.action==1){
                let customerss = await Customers.findAll({
                    where:{
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }
                })
                //获得第一次登陆的用户
                /**
                 * 第一次登陆：这段时间之前没登陆过，登录之后也没登陆过
                 *
                 */
                //第一次登陆
                console.log(customerss.length)
                let customerArray = []
                for(let l = 0; l < customerss.length; l++){
                    let customer = await Customers.findOne({
                        where:{
                            phone : customerss[l].phone,
                            tenantId : ctx.query.tenantId,
                            status : 3,
                            createdAt :{
                                $gte : new Date(ctx.query.startDate),
                                $lt : new Date(ctx.query.endDate)
                            }
                        }

                    })
                    customerArray.push(customer)
                }
                console.log(customerArray.length)
                //第一次登陆的Id
                let custArray = []
                for(let carray of customerArray){
                    if(!custArray.contains(carray.id)){
                        custArray.push(carray.id)
                    }
                }
                //第一次登陆完之后还登陆了就是多次登陆的人员
                let customersNotOne = await Customers.findAll({
                    where:{
                        id : {
                            $notIn : custArray
                        },
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }
                })
                let customersNotOnePhoneArray = []
                for(let cno of customersNotOne){
                    if(!customersNotOnePhoneArray.contains(cno.phone)){
                        customersNotOnePhoneArray.push(cno.phone)
                    }
                }
                customers = await Customers.findAll({
                    where:{
                        phone : {
                            $notIn : customersNotOnePhoneArray
                        },
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }
                })

            }

            if(ctx.query.action==2){
                let customerss = await Customers.findAll({
                    where:{
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }
                })
                //获得第一次登陆的用户
                /**
                 * 第一次登陆：这段时间之前没登陆过，登录之后也没登陆过
                 *
                 */
                    //第一次登陆
                let customerArray = []
                for(let l = 0; l < customerss.length; l++){
                    let customer = await Customers.findOne({
                        where:{
                            phone : customerss[l].phone,
                            tenantId : ctx.query.tenantId,
                            status : 3,
                            createdAt :{
                                $gte : new Date(ctx.query.startDate),
                                $lt : new Date(ctx.query.endDate)
                            }
                        }

                    })
                    customerArray.push(customer)
                }
                //第一次登陆的Id
                let custArray = []
                for(let carray of customerArray){
                    if(!custArray.contains(carray.id)){
                        custArray.push(carray.id)
                    }
                }
                //第一次登陆完之后还登陆了就是多次登陆的人员
                customers = await Customers.findAll({
                    where:{
                        id : {
                            $notIn : custArray
                        },
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }
                })
            }
        }

        let cusArray = []
        for(let cus of customers){
            let cusJson = {}
            let vip
            if(cus.isVip){
                vip = await Vips.findOne({
                    phone : cus.phone
                })
            }
            cusJson.id = cus.id
            cusJson.phone=cus.phone
            cusJson.vip = cus.isVip==false?{}:vip
            cusArray.push(cusJson)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,cusArray)
    },
    async getCustomerBehaviorCount(ctx,next){
        ctx.checkQuery("tenantId").notEmpty();
        ctx.checkQuery("action").notEmpty();//0为未购买的//1为1次购买//2为多次购买
        ctx.checkQuery("startDate").notEmpty();
        ctx.checkQuery("endDate").notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }

        let customers


        if(ctx.query.action==0){
            customers = await Customers.count({
                where:{
                    tenantId : ctx.query.tenantId,
                    status : 2,
                    createdAt :{
                        $gte : new Date(ctx.query.startDate),
                        $lt : new Date(ctx.query.endDate)
                    }
                }
            })
        }
        if(ctx.query.action==1){
            let customerss = await Customers.findAll({
                where:{
                    tenantId : ctx.query.tenantId,
                    status : 3,
                    createdAt :{
                        $gte : new Date(ctx.query.startDate),
                        $lt : new Date(ctx.query.endDate)
                    }
                }
            })
            //获得第一次登陆的用户
            /**
             * 第一次登陆：这段时间之前没登陆过，登录之后也没登陆过
             *
             */
            //第一次登陆
            console.log(customerss.length)
            let customerArray = []
            for(let l = 0; l < customerss.length; l++){
                let customer = await Customers.findOne({
                    where:{
                        phone : customerss[l].phone,
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }

                })
                customerArray.push(customer)
            }
            console.log(customerArray.length)
            //第一次登陆的Id
            let custArray = []
            for(let carray of customerArray){
                if(!custArray.contains(carray.id)){
                    custArray.push(carray.id)
                }
            }
            //第一次登陆完之后还登陆了就是多次登陆的人员
            let customersNotOne = await Customers.findAll({
                where:{
                    id : {
                        $notIn : custArray
                    },
                    tenantId : ctx.query.tenantId,
                    status : 3,
                    createdAt :{
                        $gte : new Date(ctx.query.startDate),
                        $lt : new Date(ctx.query.endDate)
                    }
                }
            })
            let customersNotOnePhoneArray = []
            for(let cno of customersNotOne){
                if(!customersNotOnePhoneArray.contains(cno.phone)){
                    customersNotOnePhoneArray.push(cno.phone)
                }
            }
            customers = await Customers.count({
                where:{
                    phone : {
                        $notIn : customersNotOnePhoneArray
                    },
                    tenantId : ctx.query.tenantId,
                    status : 3,
                    createdAt :{
                        $gte : new Date(ctx.query.startDate),
                        $lt : new Date(ctx.query.endDate)
                    }
                }
            })

        }

        if(ctx.query.action==2){
            let customerss = await Customers.findAll({
                where:{
                    tenantId : ctx.query.tenantId,
                    status : 3,
                    createdAt :{
                        $gte : new Date(ctx.query.startDate),
                        $lt : new Date(ctx.query.endDate)
                    }
                }
            })
            //获得第一次登陆的用户
            /**
             * 第一次登陆：这段时间之前没登陆过，登录之后也没登陆过
             *
             */
                //第一次登陆
            let customerArray = []
            for(let l = 0; l < customerss.length; l++){
                let customer = await Customers.findOne({
                    where:{
                        phone : customerss[l].phone,
                        tenantId : ctx.query.tenantId,
                        status : 3,
                        createdAt :{
                            $gte : new Date(ctx.query.startDate),
                            $lt : new Date(ctx.query.endDate)
                        }
                    }

                })
                customerArray.push(customer)
            }
            //第一次登陆的Id
            let custArray = []
            for(let carray of customerArray){
                if(!custArray.contains(carray.id)){
                    custArray.push(carray.id)
                }
            }
            //第一次登陆完之后还登陆了就是多次登陆的人员
            customers = await Customers.count({
                where:{
                    id : {
                        $notIn : custArray
                    },
                    tenantId : ctx.query.tenantId,
                    status : 3,
                    createdAt :{
                        $gte : new Date(ctx.query.startDate),
                        $lt : new Date(ctx.query.endDate)
                    }
                }
            })
        }


        let cusArray = []
        for(let cus of customers){
            let cusJson = {}
            let vip
            if(cus.isVip){
                vip = await Vips.findOne({
                    phone : cus.phone
                })
            }
            cusJson.id = cus.id
            cusJson.phone=cus.phone
            cusJson.vip = cus.isVip==false?{}:vip
            cusArray.push(cusJson)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,cusArray)
    }

}