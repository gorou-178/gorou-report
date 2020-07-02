
const dimentions = ['deaths', 'active', 'recovered', 'confirmed'];
let globalReports = [];
let charts = {
    'left': {},
    'right': {}
};

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
                        return index % 3 === 0 ? dataLabel : '';
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

const addCountryOption = function(targetId, country, defaultCountry = 'Japan') {
    const select = document.getElementById(targetId);
    const option = document.createElement("option");
    option.text = country;
    option.value = country;
    if (country === defaultCountry) {
        option.selected = true;
    }
    select.appendChild(option);
};

const updateChart = function(target, selectCountry) {
    for (let i = 0; i < dimentions.length; ++i) {
        charts[target][dimentions[i]].data.datasets.forEach(function(dataset) {
            dataset.data = globalReports[selectCountry][dimentions[i]];
        });
        charts[target][dimentions[i]].options = createOptions(charts[target][dimentions[i]].options.title.text, getMaxValueForChart(globalReports[selectCountry][dimentions[i]]))
        charts[target][dimentions[i]].update();
    }
}

/**
 * レポートデータを元にchartを作成
 * @param {*} results
 */
const createReportChart = function(response) {
    const reportDataset = JSON.parse(response.data);
    const reportDateList = Array.from(new Set(reportDataset.map(function(report){
        return moment(report.date).format('MM/DD');
    })));
    console.log('reportDateList: ', reportDateList);

    document.getElementsByClassName('js-last-tally-date')[0].innerHTML = reportDateList[0];

    const reportCountries = Array.from(new Set(reportDataset.map(function(report){
        return report.country;
    })));
    console.log('reportCountries: ', reportCountries);

    document.getElementById('country_left').addEventListener('change', function(){
        const options = document.querySelectorAll("#country_left option");
        updateChart('left', options[this.selectedIndex].value);
    });
    document.getElementById('country_right').addEventListener('change', function(){
        const options = document.querySelectorAll("#country_right option");
        console.log(options[this.selectedIndex].value);
        updateChart('right', options[this.selectedIndex].value);
    });

    for(let i = 0; i < reportCountries.length; ++i) {
        addCountryOption('country_left', reportCountries[i]);
    }
    for(let i = 0; i < reportCountries.length; ++i) {
        addCountryOption('country_right', reportCountries[i], 'US');
    }

    for(let i = 0; i < reportDataset.length; ++i) {
        const report = reportDataset[i];
        if (!globalReports[report.country]) {
            globalReports[report.country] = {
                'deaths': [],
                'recovered': [],
                'active': [],
                'confirmed': []
            };
        }
        globalReports[report.country]['deaths'].push({
            x: report.date,
            y: report.deaths
        });
        globalReports[report.country]['recovered'].push({
            x: report.date,
            y: report.recovered
        });
        globalReports[report.country]['active'].push({
            x: report.date,
            y: report.active
        });
        globalReports[report.country]['confirmed'].push({
            x: report.date,
            y: report.confirmed
        });
    }

    disabledLoadingContent();

    const chartColor = 'rgb(255, 99, 132)';
    charts.left.deaths = (createChart('left-report-deaths',
        createConfig('line', reportDateList, [{
                label: 'Deaths',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: globalReports['Japan']['deaths'],
                fill: false,
            }],
            createOptions('Report Deaths', getMaxValueForChart(globalReports['Japan']['deaths']))
        )
    ));
    charts.right.deaths = (createChart('right-report-deaths',
        createConfig('line', reportDateList, [{
                label: 'Deaths',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: globalReports['US']['deaths'],
                fill: false,
            }],
            createOptions('Report Deaths', getMaxValueForChart(globalReports['US']['deaths']))
        )
    ));


    charts.left.confirmed = createChart('left-report-confirmed',
        createConfig('line', reportDateList, [{
                label: 'confirmed',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: globalReports['Japan']['confirmed'],
                fill: false,
            }],
            createOptions('Report confirmed', getMaxValueForChart(globalReports['Japan']['confirmed']))
        )
    );
    charts.right.confirmed = createChart('right-report-confirmed',
        createConfig('line', reportDateList, [{
                label: 'confirmed',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: globalReports['US']['confirmed'],
                fill: false,
            }],
            createOptions('Report confirmed', getMaxValueForChart(globalReports['US']['confirmed']))
        )
    );

    charts.left.active = createChart('left-report-active',
        createConfig('line', reportDateList, [{
                label: 'active',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: globalReports['Japan']['active'],
                fill: false,
            }],
            createOptions('Report active', getMaxValueForChart(globalReports['Japan']['active']))
        )
    );
    charts.right.active = createChart('right-report-active',
        createConfig('line', reportDateList, [{
                label: 'active',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: globalReports['US']['active'],
                fill: false,
            }],
            createOptions('Report active', getMaxValueForChart(globalReports['US']['active']))
        )
    );

    charts.left.recovered = createChart('left-report-recovered',
        createConfig('line', reportDateList, [{
                label: 'recovered',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: globalReports['Japan']['recovered'],
                fill: false,
            }],
            createOptions('Report recovered', getMaxValueForChart(globalReports['Japan']['recovered']))
        )
    );
    charts.right.recovered = createChart('right-report-recovered',
        createConfig('line', reportDateList, [{
                label: 'recovered',
                backgroundColor: chartColor,
                borderColor: chartColor,
                data: globalReports['US']['recovered'],
                fill: false,
            }],
            createOptions('Report recovered', getMaxValueForChart(globalReports['US']['recovered']))
        )
    );
};

/**
 * レポートAPIからデータを取得してchartを表示
 * @param {*} datasetsUrlBase
 */
const loadReport = function(datasetsUrlBase) {
    const api = axios.create({
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        crossDomain: true
    });
    const reportUrl = 'https://us-central1-bq-github-sample-data.cloudfunctions.net/global_covid_report';
    api.get(reportUrl)
        .then(createReportChart);
};
