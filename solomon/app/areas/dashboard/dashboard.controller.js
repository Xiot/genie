
angular.module('app.dashboard')
    .controller('DashboardController', DashboardController);

// @ngInject
function DashboardController(httpClient, storeService, util, slaCharts) {

    var vm = angular.extend(this, {
        message: "Hello World",
        searchStats: [],
        chartOptions: null,
        responseTime: {
            data: [],
            options: {}
        },
		statusCount: {
			data: [],
			options: {}
		},
		productSearch: {
			data:[],
			options: {}
		},
        tasksByType: {
            data: [],
            options: {}
        },

        sla: {}
    });

    prepareStatusCountChart();
	prepareProductSearchChart();
    prepareResponseTimeChart();
    prepareTasksByTypeChart();

    slaCharts.get().then(function(ret){
        vm.sla = ret;
    });

    function prepareTasksByTypeChart(){
        vm.tasksByType.options = {
            series: {
                pie: {
                    show: true,
                    radius: 1,
                    innerRadius: 0.8,
                    label: {
                        show: false,
                        radius: 2/4,
                        formatter: labelFormatter,
                        background: {
                            opacity: 0.5
                        }
                    }
                }
            },
            legend:{
                // labelFormatter: function(label, series){
                //     return '<span class="legend-label">' + label + '</span>';
                // }
                //show: false
            }
        };

        function labelFormatter(label, series) {
        		return "<div style='font-size:12pt; text-align:center; padding:2px; color:white;'>" + label + "<br/>" + Math.round(series.percent) + "%</div>";
        	}

        var graphUrl = util.join('stores', storeService.currentStore.id, 'stats', 'tasks-by-type');
        httpClient.get(graphUrl)
        .then(function(res){
            var data = res.data.map(function(p){
                return {label: p.type, data: [p.count]}
            });
            vm.tasksByType.data = data;
        })
    }

	function prepareProductSearchChart(){

        var now = Date.now().valueOf();

		vm.productSearch.options = {
			xaxis: {
    //                panRange: [now - 1000 * 60 * 60 * 24 * 7, now + 1000*60*60*24],
                    zoomRange: [0.1, 10],
                    mode: 'time',

                    //min: now - 1000 * 60 * 60 * 24,
                    //max: now + 1000*60*60*24

                },
                yaxis: {
                    //zoomRange: [0.1, 10],
                    zoomRange: [1,1]
                },
			grid: {
				hoverable: true, clickable: true, borderWidth: 0
			},
			tooltip: true,
			tooltipOpts: {content: '%s %x - %y'},
			series: {shadowSize: 6},

			// zoom: {
			// 	interactive: true
			// },
			// pan: {
			// 	interactive: true
			// }
		};

        var graphUrl = util.join('stores', storeService.currentStore.id, 'products', 'recent-searches');
        httpClient.get(graphUrl)
        .then(function(res){
            var data = res.data.map(function(item){
                var i = 0;
                var seriesData = item.times.map(function(point){
                    return [moment(point).valueOf(), ++i];
                });
                return {label: item._id, data: seriesData}
            });
            vm.productSearch.data = data;
        })

		var url = util.join('stores', storeService.currentStore.id, 'products', 'stats', 'search');
	    httpClient.get(url)
	        .then(function(res) {
	            vm.searchStats = res.data.q;

				// var data = res.data.q.map(function(item){
                //
				// 	var seriesData = item.items.map(function(point){
				// 		return [moment.utc(point.date).valueOf(), point.count];
				// 	});
                //
				// 	return {label: item.search, data: seriesData}
				// });
                // data.push({label: 'fake', data: [now, 6]});
				// vm.productSearch.data = data;

	        });
	}

    function prepareStatusCountChart() {
		// http://www.pikemere.co.uk/blog/tutorial-flot-how-to-create-bar-charts-updated/
        vm.statusCount.options = {
            bars: {
                show: true,
                align: 'center',
                barWidth: 0.8,
                //order: 1,
				fill: true,
				lineWidth: 1
            },
			grid: {
				hoverable: true, clickable:true, borderWidth: 0, color: '#ccc'
			},
			tooltip: true,
			tooltipOpts: {content: '%s = %y'},
			series: {shadowSize: 1},
            xaxis: {
                show: false,
				//min: 0.4,
				//max: 4.6,
                //ticks: [[1, "unassigned"],[2,"assigned"],[3,"engaged"],[4,"complete"]]
            },
			yaxis: {tickDecimals: 0},
			legend: {show: true}
        }

        var url = util.join('stores', storeService.currentStore.id, 'stats', 'status-count');
        httpClient.get(url)
            .then(function(res) {
                var data = [];
                var i = 0;
                res.data.forEach(function(p) {
                    data.push({
                        label: p.status,
                        data: [
                            [++i, p.count]
                        ]
                    });
                });
                vm.statusCount.data = data;
            });
    }

    function prepareResponseTimeChart() {
		// http://www.pikemere.co.uk/blog/tutorial-flot-how-to-create-bar-charts-updated/
        vm.responseTime.options = {
            bars: {
                show: true,
                align: 'center',
                barWidth: 0.8,
                //order: 1,
				fill: true,
				lineWidth: 1
            },
			grid: {
				hoverable: true, clickable:true, borderWidth: 0, color: '#ccc'
			},
			tooltip: true,
			tooltipOpts: {content: '%s - %y.2 min'},
			series: {shadowSize: 1},
            xaxis: {
                show: false,
				//min: 0.4,
				//max: 4.6,
                //ticks: [[1, "unassigned"],[2,"assigned"],[3,"engaged"],[4,"complete"]]
            },
			yaxis: {tickDecimals: 0},
			legend: {show: true}
        }

        var url = util.join('stores', storeService.currentStore.id, 'stats', 'response-time');
        httpClient.get(url)
            .then(function(res) {
                var data = [];
                var i = 0;
                res.data.forEach(function(p) {
                    if(p.id === 'created')
                        return;

                    data.push({
                        label: p.id,
                        data: [
                            [++i, p.avg / 1000 / 60]
                        ]
                    });
                });
                vm.responseTime.data = data;
            });
    }

}
