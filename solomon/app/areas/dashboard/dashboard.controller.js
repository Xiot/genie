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
			vm.searchStats = res.data;


			var options = {
				type: "BarChart",
				displayed: true,
				data: {
					cols: [
					{
						id: 'search',
						label: 'Search',
						type: 'string'
					}, 
					{
						id: 'count',
						label: 'count',
						type: 'number'
					}],
					rows: []
				}
			};

			_.forEach(res.data, function(item) {

				options.data.rows.push({
					c: [{
						v: item.search
					}, {
						v: item.count
					}]
				});

			});
			vm.chartOptions = options;

		});
}