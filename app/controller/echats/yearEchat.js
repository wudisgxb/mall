const getYearEchats = (function () {
    let getYear =  function (startTime,endTime) {


        let eeeee=[];
        let startYear = parseInt(startTime);
        let endYear = parseInt(endTime);

        for(let i=startYear;i<endYear;i++){
            let startDates = i;
            let start =startDates+"-1-1 0:0:0"
            let end =startDates+"-12-31 23:59:59"
            eeeee.push({
                start:start,
                end:end,
            })
        }
        console.log(eeeee)
        return eeeee;
    }
    let instance = {
        getYear: getYear
    }
    return instance;
})();
module.exports = getYearEchats;