var mongoose = require('mongoose');
var RequestMetric = mongoose.model('RequestMetric');
var ua = require('useragent');
var ipware = require('ipware')();

var service = {
	startCapture: startCapture,
	endCapture: endCapture
}

module.exports = service;

function startCapture() {

	return function(req, res, next) {
		//console.log('start capture');
		var metrics = new RequestMetric({
			startTime: Date.now(),
			url: req.url,
			method: req.method
		});

		req._requestStartTick = process.hrtime();
		req.metric = metrics;

		next();
	}
}

function endCapture(req, res, route, err) {

	var metric = req.metric;
	if (!metric)
		return;
	
	metric.statusCode = res.statusCode;
	metric.timeTaken = calculateResponseTime(req);
	metric.routeName = route.name;
	metric.params = req.params;
	
	var userAgentText =req.userAgent();

	var o = ua.lookup(userAgentText).toJSON();
	
	metric.ip = ipware.get_ip(req).clientIp;
	metric.userAgent = o;
	metric.userAgent.source = userAgentText;

	if (req.user)
		metric.user = req.user;

	metric.saveAsync();

}

function calculateResponseTime(req) {
	if (!req._requestStartTick) return NaN;
	var diff = process.hrtime(req._requestStartTick);
	var ms = diff[0] * 1e3 + diff[1] * 1e-6;
	return ms.toFixed(3);
}