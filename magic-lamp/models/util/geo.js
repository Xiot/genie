
var EARTH_RADIUS_KM = 6371;



module.exports = {
    nearInKmAsync: nearInKmAsync,
    createPoint: createPoint,
    createOptionsKm: createOptionsKm
}

function createPoint(long, lat){
    return { type: "Point", coordinates: [long, lat] };
}

function createOptionsKm(maxDistance) {
    return {
        maxDistance: maxDistance / EARTH_RADIUS_KM,
        spherical: true,
        distanceMultiplier: EARTH_RADIUS_KM
    }
}

function nearInKmAsync(model, coord, maxDistance, cb) {
    
    var point = { type : "Point", coordinates : coord };
    return model.geoNearAsync(point, {
        maxDistance: maxDistance / EARTH_RADIUS_KM, 
        spherical: true, 
        distanceMultiplier: EARTH_RADIUS_KM
    });
}