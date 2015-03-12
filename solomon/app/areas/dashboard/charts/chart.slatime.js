angular.module('app.charts')
    .factory('slaCharts', slaChart);

function slaChart(httpClient, util, storeService) {

    var options = {
        series: {
            pie: {
                show: true,
                radius: 1,
                innerRadius: 0.8,
                label: {
                    show: false,
                    radius: 2 / 4,
                    //formatter: labelFormatter,
                    background: {
                        opacity: 0.5
                    }
                }
            }
        },
        legend: {
            // labelFormatter: function(label, series){
            //     return '<span class="legend-label">' + label + '</span>';
            // }
            //show: false
        }
    };

    return {
        get: get
    }

    function get() {

        var data = {
            assigned: {},
            engaged: {},
            closed: {}
        }

        var graphUrl = util.join('stores', storeService.currentStore.id, 'stats', 'within-sla');
        return httpClient.get(graphUrl)
            .then(function(res) {
                res.data.forEach(function(p) {
                    var value = p.value;

                    data[value.status] = [
                        {
                            label: '< 80%',
                            data: [value.count80],
                            color: 'green'
                        },
                        {
                            label: '80 - 100',
                            data: [value.count100],
                            color: 'yellow'
                        },
                        {
                            label: '100 - 120',
                            data: [value.count120],
                            color: 'orange'
                        },
                        {
                            label: '> 120',
                            data: [value.countOver],
                            color: 'red'
                        },
                    ]
                });

                return {
                    assigned: {
                        options: options,
                        data: data.assigned
                    },
                    engaged: {
                        options: options,
                        data: data.engaged
                    },
                    closed: {
                        options: options,
                        data: data.closed
                    }
                }

            });
    }
}
