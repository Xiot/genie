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
                    if(log.action !== 'status')
                        continue;

                    emit(log.value, log.timestamp - lastTime);
                    //lastTime = log.timestamp;
                }

            },
            reduce: function(stage, times) {
                var d = {
                    id: stage,
                    sum: 0,
                    count: 0,
                    avg: 0,
                    min: -1,
                    max: 0
                };

                times.forEach(function(t) {
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

        //
        // var departmentList = await Promise.all(g.map(function(d) {
        //     if (!d.id)
        //         return null;
        //     return Department.findByIdAsync(d.id);
        // }));
        //
        // for (var i = 0; i < departmentList.length; i++) {
        //     var dept = departmentList[i];
        //     if (dept)
        //         dept = {
        //             id: dept._id,
        //             name: dept.name
        //         };
        //     g[i].deptarment = dept;
        // }

        return g;

    });
}
