var _ = require('lodash');
var uuid = require('node-uuid');

var mappings = [];
var keyedMappings = {};

var service = {
	format: format,
	handle: handle
};

module.exports = service;

function format(obj, req){

	var map = findMapFn(obj);
	if(!map)
		return obj;

	// currently assuming that arrays are homogeneous
	if(Array.isArray(obj)){

		var mappedValues = [];
		return _.map(obj,function(item) { return map(item,req);});
	}

	return map(obj, req);
}

function handle(ctor, map){
	mappings.push({ctor: ctor, map: map});

	ctor.__classId = uuid.v4();
	keyedMappings[ctor.__classId] = map;
}

function findMapFn(obj){

	if(!obj)
		return obj;

	if(Array.isArray(obj)){
		if(obj.length === 0)
			return obj;

		return findMapFn(obj[0]);
	}

	var classId = obj.constructor && obj.constructor.__classId;
	if(classId && keyedMappings[classId]) {
		return keyedMappings[classId];
	}

	for(var i = 0; i < mappings.length; i++){
		var map = mappings[i].map;
		var ctor = mappings[i].ctor;

		if(obj instanceof ctor)
			return map;
	}

	return null;
}