
/**
 * 現在日付+daysの日付を指定フォーマットで返す
 * @param {int} days
 * @param {string} format
 * @returns {string}
 */
const newDateString = function(days, format) {
    return moment().add(days, 'd').format(format);
};

/**
 * valueをbase倍に切り上げる
 * @param {*} value
 * @param {int} base
 */
const baseCeil = function(value, base) {
    return Math.ceil(value / base) * base;
};

/**
 * レポートデータ（object.y）の最大値 * 1.2を1000倍数で切り上げた値を返す
 * グラフの最大値表示をいい感じにする
 * @param {*} reports
 */
const getMaxValueForChart = function(reports) {
    return baseCeil(Math.max.apply(Math, reports.map(o => { return o.y; })) * 1.2, 1000);
};

/**
 * chartを作成
 * @param {*} id
 * @param {*} config
 */
const createChart = function(id, config) {
    const ctx = document.getElementById(id).getContext('2d');
    return new Chart(ctx, config);
};

/**
 * chartオプションのテンプレート
 * @param {*} title
 * @param {*} maxNum
 */
const createOptions = function(title, maxNum) {
    return {
        responsive: true,
        aspectRatio: 0.5,
        title: {
            display: true,
            text: title
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: false
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Date'
                },
                ticks: {
                    callback: function(dataLabel, index) {
                        return index % 2 === 0 ? dataLabel : '';
                    }
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Number of people'
                },
                ticks: {
                    beginAtZero: true,
                    max: maxNum
                }
            }]
        }
    };
};

/**
 * chartのconfigのテンプレート
 * @param {*} type
 * @param {*} labels
 * @param {*} datasets
 * @param {*} options
 */
const createConfig = function(type, labels, datasets, options) {
    return {
        type: type,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: options
    };
};

const disabledLoadingContent = function() {
    document.getElementById("graph-loading").style.display = 'none';
};

/**
 * レポートデータを元にchartを作成
 * @param {*} results
 */
const createReportChart = function(results) {
    let days = [];
    let deathsReports = [];
    let recoveredReports = [];
    let activeReports = [];
    let confirmedReports= [];
    for(let i = 0; i < results.length; ++i) {
        if (!results[i].data) {
            console.log('data is null: ' + i);
            continue;
        }
        const response = JSON.parse(results[i].data);
        days.push(moment(response.date).format('MM/DD'));
        deathsReports.push({
            x: response.date,
            y: response.deaths
        });
        recoveredReports.push({
            x: response.date,
            y: response.recovered
        });
        activeReports.push({
            x: response.date,
            y: response.active
        });
        confirmedReports.push({
            x: response.date,
            y: response.confirmed
        });
    }

    days = days.sort((a, b) => new Date(a) - new Date(b));
    const dateSortReport = (a, b) => { new Date(a.x) - new Date(b.x); };
    deathsReports = deathsReports.sort(dateSortReport);
    confirmedReports = confirmedReports.sort(dateSortReport);
    activeReports = activeReports.sort(dateSortReport);
    recoveredReports = recoveredReports.sort(dateSortReport);

    disabledLoadingContent();

    const chartColor = 'rgb(255, 99, 132)';
    createChart('report-deaths',
        createConfig('line', days, [{
                label: 'Deaths',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: deathsReports,
                fill: false,
            }],
            createOptions('Report Deaths', getMaxValueForChart(deathsReports))
        )
    );
    createChart('report-confirmed',
        createConfig('line', days, [{
                label: 'confirmed',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: confirmedReports,
                fill: false,
            }],
            createOptions('Report confirmed', getMaxValueForChart(confirmedReports))
        )
    );
    createChart('report-active',
        createConfig('line', days, [{
                label: 'active',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: activeReports,
                fill: false,
            }],
            createOptions('Report active', getMaxValueForChart(activeReports))
        )
    );
    createChart('report-recovered',
        createConfig('line', days, [{
                label: 'recovered',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: recoveredReports,
                fill: false,
            }],
            createOptions('Report recovered', getMaxValueForChart(recoveredReports))
        )
    );
};

/**
 * レポートAPIからデータを取得してchartを表示
 * @param {*} datasetsUrlBase
 * @param {*} reportPeriod
 */
const loadReport = function(datasetsUrlBase, reportPeriod) {
    // 当日のレポートが未集計+時差の関係で2日前からのレポートとする
    const startPeriod = 3;
    let reportDates = [];
    for (let i = startPeriod; i <= startPeriod + reportPeriod; ++i) {
        reportDates.push(newDateString(-1*i, 'YYYY/MM/DD'));
    }

    const api = axios.create({
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        crossDomain: true
    });

    let reportRequests = [];
    for (let i = 0; i < reportDates.length; ++i) {
        reportRequests.push(api.get(datasetsUrlBase + reportDates[i] + '/'));
    }

    Promise.all(reportRequests).then(createReportChart);
};
