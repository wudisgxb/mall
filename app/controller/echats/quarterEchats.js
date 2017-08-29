const getQuarterEchats = (function () {
    let getQuarter =  function (startTime,endTime) {

        let startDate = parseInt(startTime.substring(0,4))
        //10
        let startQuarter = (parseInt(startTime.substring(4,5))-1)*3+1//2
        let endDate =  parseInt(endTime.substring(0,4))
        let endQuarter =  (parseInt(endTime.substring(4,5))-1)*3+1//3
        //相差的年份
        let differDates = (endDate-startDate)*12;
        //相差的月份
        let differDate = differDates+endQuarter;
        // let differMonth = differDate-startMonth;
        let eeeee=[];
        let aaa=startDate
        for(let i=startQuarter;i<=differDate;i+=3){

            let startDates = i;

            let endDates =startDates+3

            if(endDates>12){
                endDates=endDates%12==0?12:endDates%12;
            }
            if(endDates%12==1){
                aaa=aaa+1
            }
            if(i>1&&i % 12==1){
                startDate = startDate+1
            }
            if(i>12){
                startDates = startDates%12==0?12:startDates%12;
            }
            let start =startDate+"-"+startDates
            let end =aaa+"-"+endDates
            eeeee.push({
                start:start,
                end:end,
            })
        }
        console.log(eeeee);
        return eeeee;

    }
    let instance = {
        getQuarter: getQuarter
    }
    return instance;
})();
module.exports = getQuarterEchats;