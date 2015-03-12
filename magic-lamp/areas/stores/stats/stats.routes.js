var mongoose = require('mongoose');
var Task = mongoose.model('Task');
var User = mongoose.model('User');
var moment = require('moment');
var _ = require('lodash');

module.exports = function(server) {

    server
        .get('/allocation','alloc', async function(req) {

            var openTickets = await Task.countAsync({
                status: 'unassigned'
            });

            var availableEmployees = await User.countAsync({
                store: req.store.id,
                role: 'employee',
                active: true,
                status: 'available'
            });

            return {
                openTickets,
                availableEmployees
            };
        })
    .get('/status-count', async function(req){

        var results = await Task.aggregate()
            .match({store: req.store._id})
            .unwind('log')
            .match({'log.action': {$in: ['status', 'created']}})
            .group({
                _id: '$log.value',
                count: {$sum: 1}
            }).project({
                _id: 0,
                status: '$_id',
                count: '$count'
            }).exec();

        var order = ['unassigned', 'assigned', 'engaged', 'closed', 'aborted'];
        results = _.sortBy(results, function(item){
            return _.indexOf(order, item.status);
        });
        return results;

    })
    .get('/tasks-by-type', async function(req){
        return Task.aggregate()
            .match({store: req.store._id})
            .group({
                _id: '$type',
                count: {$sum: 1}
            })
            .project({
                _id: 0,
                type: '$_id',
                count: '$count'
            })
            .exec();
    })
    .get('/response-time', async function(req) {

        var o = {
            map: function() {

                //emit('created', 0);
                var lastTime = this.created_at;
                for(var i = 0; i < this.log.length; i++){
                    var log = this.log[i];
                    if(log.action === 'status') {
                        emit(log.value, log.timestamp - lastTime);
                        lastTime = log.timestamp;
                    }
                }

            },
            // http://www.mongovue.com/2010/11/03/yet-another-mongodb-map-reduce-tutorial/
            // reduce may be called multiple times, with the results of the first reduce being used
            // as the input of the second.
            reduce: function(stage, times) {
                //return {stage, times}
                var d = {
                    id: stage,
                    sum: 0,
                    count: 0,
                    avg: 0,
                    min: -1,
                    max: 0
                };

                if(typeof times[0] === 'object')
                    d = times[0];

                times.forEach(function(t) {

                    if(typeof t !== 'number')
                        return;

                    d.count++;
                    d.sum += t;

                    if (d.min === -1 || t < d.min)
                        d.min = t;

                    if (d.max === 0 || t > d.max)
                        d.max = t;

                });

                return d;
            },
            query: {
                // 'timings': {
                //     $exists: true
                // },
                store: req.store._id
            },
            jsMode: true,
            //out: 'response-time-chart',
            finalize: function(key, value) {
                value._count = value.count || -1;
                if (value.count > 0) {
                    value.avg = value.sum / value.count;
                } else {

                    value = {
                        id: key,
                        sum: value,
                        min: value,
                        max: value,
                        avg: value,
                        count: 1
                    }
                }
                return value;
            }
        }
        var g = await Task.mapReduce(o)
            .then(function(results, stats) {
                //return results;
                return results.map(function(x) {
                    return {
                        id: x._id,
                        avg: x.value.avg,
                        avg_format: moment.duration(x.value.avg).format(),
                        min: x.value.min,
                        min_format: moment.duration(x.value.min).format(),
                        max: x.value.max,
                        max_format: moment.duration(x.value.max).format(),
                        count: x.value.count
                    }
                });
            });

        var order = ['unassigned', 'assigned', 'engaged', 'closed', 'aborted'];
        g = _.sortBy(g, function(x){
            return _.indexOf(order, x.id);
        });

        return g;

    })
    .get('/within-sla', async function(req){

        //var sla = req.store.sla;

        var o = {
            map: function(){
                var lastTime = this.created_at;
                for(var i = 0; i < this.log.length; i++){
                    var log = this.log[i];
                    if(log.action !== 'status')
                        continue;
                    if(log.value === 'created')
                        continue;

                    var slaTime = sla[log.value];
                    if(!slaTime)
                        continue;

                    emit(log.value, (log.timestamp - lastTime) / slaTime);
                    lastTime = log.timestamp;
                }
            },
            reduce: function(key, times){

                var slaTime = sla[key];
                var d = {status: key, sla: slaTime, countTotal: 0, count80: 0, count100: 0, count120: 0, countOver: 0};

                times.forEach(function(time){
                    d.countTotal ++;

                    if(time < 0.8)
                        d.count80++;
                    else if (time <= 1.0)
                        d.count100++;
                    else if (time <= 1.2)
                        d.count120++;
                    else
                        d.countOver++;

                });

                return d;
            },
            query: {store: req.store._id},
            scope: {sla: req.store.sla}
        }

        var results = await Task.mapReduce(o).then(function(ret, stats){
                return ret;
            });
        return results;
    })

    .get('/chat-conversions', async function(req){

        var transfered = await Task.countAsync({
            type: 'chat',
            transfered_to: {$exists: true}
        });

        var closed = await Task.countAsync({
            type: 'chat',
            transfered_to: {$exists: false},
            status: 'closed'
        });
        var aborted = await Task.countAsync({
            type: 'chat',
            status: 'aborted'
        });

        return {
            transfered,
            closed,
            aborted
        };

    });
}
