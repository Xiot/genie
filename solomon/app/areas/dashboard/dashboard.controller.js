angular.module('app.dashboard')
	.controller('DashboardController', DashboardController);

// @ngInject
function DashboardController(httpClient, storeService, util) {

	var vm = angular.extend(this, {
		message: "Hello World",
		searchStats: [],
		chartOptions: null
	});

	var url = util.join('stores', storeService.currentStore.id, 'products', 'stats', 'search');
	httpClient.get(url)
		.then(function(res) {
			vm.searchStats = res.data.q; 

			var data = {
				series: [],
				data: []
			};

			_.forEach(res.data.q, function(tag){
				data.series.push(tag.search);
			});

			_.forEach(res.data.r, function(item){
				var point = addValues(data.series, item);
				data.data.push(point);
			});
			vm.data = data;

		});

vm.config = {
    title: 'Search Terms by Day',
    tooltips: false,
    labels: false,
    lineCurveType: 'linear',
    mouseover: function() {},
    mouseout: function() {},
    click: function() {},
    legend: {
      display: false,
      //could be 'left, right'
      position: 'left',
      htmlEnabled: false,

    }
  };



	function addValues(series, item){

		var x = moment.utc(item.date).startOf('day').format('DD');

		var y = [];

		_.forEach(series, function(s){
			var value = _.find(item.values, function(x) {
				return x.search == s;
			});

			y.push(value && value.count || 0);
		});
		return {x: x, y:y};
	}
}