var mongoose = require('mongoose');
var restify = require('restify');
var Task = mongoose.model('Task');
var Chat = mongoose.model('ChatLog');
var Product = mongoose.model('Product');
var Department = mongoose.model('Department');
var User = mongoose.model('User');

var _ = require('lodash');
var wrap = load("~/core/routes/promiseRouter");
var patch = require('fast-json-patch');
var Promise = require('bluebird');

var moment = require('moment');
require("moment-duration-format");

var ticketService = load('~/core/services/ticket.service');
var employeeService = load('~/core/services/employee.service');

var formatter = load('~/core/services/formatter');

formatter.handle(Task, function(obj, req) {

    var value = obj.toObject();

    value.id = obj.id;
    delete value._id;
    delete value.__v;

    if (obj.product && obj.product instanceof Product) {
        value.product = formatter.format(obj.product, req);
    }

    if (obj.assigned_to && obj.assigned_to instanceof User)
    value.assigned_to = formatter.format(obj.assigned_to, req);

    return value;

});

module.exports = function(server, passport, io) {

    var route = server.route('/tasks')

    .get('', function(req, res, next) {

        Task.find({
            store: req.store.id
        })
        .populate('product')
        .populate('department')
        .sort({
            created_at: -1
        })
        .execAsync()
        .then(function(tasks) {
            res.send(tasks);

        }).catch(function(ex) {
            return next(new ServerError(ex));
        })
    })

    .get('/open',
    wrap(function(req) {
        var employeeId = req.params.employee;
        if (!employeeId)
            return null;

        if (employeeId === 'me' || employeeId === req.user.id) {
            req.employee = req.user;
            return null;
        }

        return User.findByIdAsync(employeeId)
        .then(function(employee) {
            req.employee = employee;
            return null;
        });
    }),
    wrap(function(req) {

        var query = {
            store: req.store.id,
            complete: false
        };

        if (req.employee) {
            query.assigned_to = {
                $in: [req.employee._id, null]
            }

            var departmentList = req.employee.departments;
            departmentList.push(null);

            query.department = {
                $in: departmentList
            }
        } else if(req.user.isCustomer){
            query.customer = req.user._id;
        }
        console.log(query);

        return Task.find(query)
            .populate('product')
            .populate('department')
            .sort({
                created_at: -1
            })
            .execAsync()
            .then(function(tasks) {
                return Department.populateAsync(tasks, 'product.department');
            });
    }))
    .get('/stats', function(req) {
        // http://lostechies.com/derickbailey/2013/10/28/group-by-count-with-mongodb-and-mongoosejs/

        return Task.aggregate()
        .match({
            store: req.store._id
        })
        .group({
            _id: '$status',
            count: {
                $sum: 1
            }
        })
        .project('count')
        .exec()
        .then(function(ret) {

            var stats = ret.map(function(s) {
                return {
                    status: s._id,
                    count: s.count
                };
            });
            return stats;
        });
    })

    .get('/stats/response', async function(req) {

        var o = {
            map: function() {
                emit(this.department, this.timings.unassigned.end - this.timings.unassigned.start);
            },
            reduce: function(dept, times) {
                var d = {
                    id: dept,
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
                'timings.unassigned.end': {
                    $exists: true
                }
            },
            finalize: function(key, value) {
                if (value.count > 0) {
                    value.avg = value.sum / value.count;
                }
                return value;
            }
        }
        var g = await Task.mapReduce(o)
        .then(function(results, stats) {
            return results.map(function(x) {
                return {
                    id: x._id,
                    avg: x.value.avg,
                    avg_format: moment.duration(x.value.avg).format(),
                    min: x.value.min,
                    min_format: moment.duration(x.value.min).format(),
                    max: x.value.max,
                    max_format: moment.duration(x.value.max).format()
                }
            });
        });

        var departmentList = await Promise.all(g.map(function(d){
            if(!d.id)
                return null;
            return Department.findByIdAsync(d.id);
        }));

        for(var i = 0; i < departmentList.length; i++){
            var dept = departmentList[i];
            if(dept)
                dept = {id: dept._id, name: dept.name};
            g[i].deptarment = dept;
        }

        return g;

    })
    .post('/',async function(req) {

        var task = new Task(req.body);
        task.store = req.store;
        task.created_by = req.user;
        //task.type = 'blah';

        if (!task.isInternal && !task.customer) {
            task.customer = req.user;
        }

        var validationResult = await (task.validateAsync()
             .then(function(){ return true;})
             .catch(function(ex) {return ex;}));

        if(validationResult !== true)
            return validationResult;

        var chat = new Chat({
            store: req.store,
            product: task.product
        });
        chat.participants.push(req.user);

        if (task.type === 'chat' && !task.product && task.searchText) {
            chat.messages.push({
                user: req.user,
                message: 'I am looking for \'' + task.searchText + '\'. Can you help me?'
            });
        }

        var chatResult = await chat.saveAsync();
        var chat = chatResult[0];

        task.chat = chat;

        if (task.product && !task.department) {
            var product = await Product.findByIdAsync(task.product);
            if(product){
                task.department = product.department;
            }
        }

        await task.saveAsync();

        await task.populate('product').populateAsync('department');

        var channel = io.to('aladdin:' + req.store.id);
        if (task.department) {
            var departmentChannel = 'department:' + task.department;
            channel = channel.to(departmentChannel);
            console.log('send to: ' + departmentChannel);
        }

        channel.emit('ticket:created', task);

        return task;

    });

    var taskRoute = route.route('/:task_id')
    .param('task_id', function(req, res, next, value) {

        ticketService.get(value)
        //Task.findByIdAsync(req.params.task_id)
        .then(function(task) {

            if (!task)
            return next(new restify.NotFoundError());

            req.task = task;
            next();
        }).catch(function(ex) {
            return next(new restify.InternalServerError(ex));
        });
    })

    .get('/', wrap(function(req) {

        if (!req.task)
        return new restify.NotFoundError();

        return req.task;
    }))

    .patch('/', wrap(function(req) {

        var task = req.task;
        var retVal = patch.apply(task, req.body);

        if (!retVal) {
            return new restify.PreconditionFailedError();
        }

        if (task.isModified('assigned_to'))
        return new restify.BadRequestError('To assign the task use PUT ' + req.url + '/assignee');

        return task.saveAsync();
    }))

    .put('/status', wrap(function(req) {

        var task = req.task;

        var employee = req.body.employee || req.user.id;
        var status = req.body.status;

        if (!status)
        return new restify.BadRequestError('status is required.');

        var now = Date.now();
        var oldStatus = task.status;

        task.status = status;

        if (status === 'assigned') {
            task.assigned_to = employee;

        } else if (status === 'complete') {
            task.complete = true;

        }

        // TODO: Create a user service that will set the current status, and send the notification
        var savedTask = null;
        return task.saveAsync()
        .spread(function(task) {
            savedTask = task;

            if (status === 'assigned') {
                return employeeService.setStatus(employee, 'busy').then(function() {
                    return savedTask;
                });
            } else if (status === 'complete') {
                return employeeService.setStatus(employee, 'available')
                .then(function() {
                    return savedTask;
                })
            }

            return savedTask;
        });
    }))

    .put('/assignee', wrap(function(req) {

        var employeeId = req.body.employee;
        var task = req.task;

        if (task.assigned_to)
        return new restify.PreconditionFailedError('The task was already assigned');

        return ticketService
        .assignTicket(employeeId, task)

        // task.assigned_to = employee;
        // task.status = 'assigned';

        // // send notification to user
        // // this should only have minimum info
        // console.log('io.to: ' + task.customer);
        // io.to(task.customer).emit('task:assigned', {
        // 	employee: employee,
        // 	task: task
        // });

        // var employeeTask = Promise.resolve();

        // if(employee.status === 'available'){
        // 	employee.status == 'busy';
        // 	employeeTask = employee.saveAsync()
        // 		.then(function(e){
        // 			io.to('store:' + employee.store + ':employee')
        // 			.emit('employee:status', {employee: employee});
        // 		});
        // }

        // return employeeTask
        // .then(function(){
        // 	return task.saveAsync();
        // });
    }))

    .post('/transfer', async function(req){

        if(req.task.type !== 'chat')
            return new restify.BadRequestError('Only `chat` tickets can be transfered.');

        var chatTicket = req.task;
        var newTask = new Task();
        newTask.type = 'call-associate';
        newTask.chat = chatTicket.chat;
        newTask.created_by = req.user;
        newTask.store = chatTicket.store;
        newTask.department = chatTicket.department;
        newTask.product = chatTicket.product;
        newTask.customer = chatTicket.customer;
        newTask.searchText = chatTicket.searchText;
        newTask.transfered_from = chatTicket;
        await newTask.saveAsync();

        chatTicket.transfered_to = newTask;
        chatTicket.status = 'closed';
        chatTicket.log.push({action: 'transfered', value: newTask.id});
        await chatTicket.saveAsync();

        return newTask;
    })
}
