const getAnYearEchats = (function () {
    let getAnYear =  function (startTime,endTime) {
        //先得到起始时间的开始时间
        let startDay = parseInt(startTime);
        //先得到起始时间的结束时间
        let endDay = parseInt(endTime);
        let year = (endDay - startDay)*12
        // let lastDate = endDate.getMonth();
        let result = [];

        for(let i = 0;i<year;i++){
            let Month = i+1
            let lastMonth = Month+1
            let startYear = startDay
            if(Month==12){
                startYear+1
                lastMonth==1
            }
            result.push({
                start:new Date(startDay.toString()+"-"+Month.toString()),
                end:new Date(startYear.toString()+"-"+lastMonth.toString())
            })
        }
        // console.log(result.length)
        // console.log(result)
        return result;
    }
    let instance = {
        getAnYear: getAnYear
    }

    return instance;
})();
module.exports = getAnYearEchats;
