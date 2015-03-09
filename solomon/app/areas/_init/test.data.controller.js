angular.module('app._init')
.controller('TestDataController', TestDataController);

function TestDataController(httpClient) {

    var vm = angular.extend(this, {
        generateTestData: generateTestData
    });


    function generateTestData(){

    }
}
