const getHounthEchats = (function () {
    let getHounth = function (startTime, endTime) {
        //先得到起始时间的开始时间
        let startDay = new Date(startTime);
        // let startTime = startDay.format("yyyy-MM-dd 00:30:00");
        startDay.setHours(0, 30, 0)

        // let start = new Date(startTime)
        let beginDate = startDay.getTime();
        //先得到起始时间的结束时间
        let endDate = new Date(endTime);
        // let endTime = endDate.format("yyyy-MM-dd 00:30:00");
        // let end = new Date(endTime)
        endDate.setHours(0, 30, 0)
        let finish = endDate.getTime();
        let oneHounth = 60 * 60 * 1000

        let result = [];
        for (let i = beginDate; i < finish; i += oneHounth * 3) {
            result.push({
                start: new Date(i),
                end: new Date(i + oneHounth * 3)
            })
        }
        // console.log(result.length)
        // console.log(result)
        return result;
    }
    let instance = {
        getHounth: getHounth
    }
    return instance;
})();
module.exports = getHounthEchats;