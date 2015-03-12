angular.module('app.charts')
    .factory('chatConversionChart', chatConversionChart);

function chatConversionChart(storeService, httpClient, util) {


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
        legend: {}
    };

    return {
        get: get
    }

    function get() {

        var graphUrl = util.join('stores', storeService.currentStore.id, 'stats', 'chat-conversions');
        return httpClient.get(graphUrl)
            .then(function(res) {


                var value = res.data;

                var data = [{
                    label: 'closed',
                    data: [value.closed],
                    color: 'green'
                }, {
                    label: 'transfered',
                    data: [value.transfered],
                    color: 'yellow'
                }, {
                    label: 'aborted',
                    data: [value.aborted],
                    color: 'orange'
                }]

                return {
                    options: options,
                    data: data
                }

            });
    }

}
