const getMonthEchats = (function () {
    let getMonth = function (startTime, endTime) {

        let startDate = parseInt(startTime.substring(0, 4))
        //10
        let startMonth = parseInt(startTime.substring(5))//10
        let endDate = parseInt(endTime.substring(0, 4))
        let endMonth = parseInt(endTime.substring(5))//4
        let differDates = (endDate - startDate) * 12;
        let differDate = differDates + endMonth;
        // let differMonth = differDate-startMonth;
        let eeeee = [];
        let aaa = startDate
        for (let i = startMonth; i < differDate; i++) {

            let startDates = i;

            let endDates = startDates + 1

            if (i > 10) {
                endDates = endDates % 12 == 0 ? 12 : endDates % 12;
            }
            if (i % 12 == 11) {
                aaa = aaa + 1
            }
            if (i % 12 == 1) {
                startDate = startDate + 1
            }
            if (i > 12) {
                startDates = startDates % 12 == 0 ? 12 : startDates % 12;
            }
            let start = startDate + "-" + startDates
            let end = aaa + "-" + endDates
            eeeee.push({
                start: start,
                end: end,
            })
        }
        console.log(eeeee)
        return eeeee;
    }
    let instance = {
        getMonth: getMonth
    }
    return instance;
})();
module.exports = getMonthEchats;