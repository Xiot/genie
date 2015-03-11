var mongoose = require('mongoose');
var User = mongoose.model('User');
var Task = mongoose.model('Task');
var Store = mongoose.model('OrganizationLocation');
var Product = mongoose.model('Product');
var Department = mongoose.model('Department');
var Chat = mongoose.model('ChatLog');

var moment = require('moment');

function TaskCreator() {

    var products = [];
    var terms = ["coffee", "large", "smile", "none", "keurig"];
    var employees = [];
    var users = [];
    var store = null;

    this.init = async function(){

        store = await Store.findByIdAsync('54bbe9e04c72702035848af9');
        products = await Product.find({store: store._id})
            .execAsync();

        employees = await User.findAsync({
            store: store._id,
            role: 'employee',
            active: true
        });

        users = await User.findAsync({
            role: 'device'
        });
    }

    this.cycleTicket = async function(ticket) {

        var states = ['unassigned', 'assigned', 'engaged', 'closed'];
        var lastTime = ticket.created_at;

        for(var i = 1; i < states.length; i++){

            lastTime = moment.utc(lastTime).add(randomRange(30, 60, 200 + 50*i, 1000), 's').toDate();
            var nextState = states[i];

            var shouldAbort = random(1,100) <= 15;
            if(shouldAbort){
                nextState = 'aborted';
                console.log('aborting');
            }

            ticket.status = nextState;
            ticket.logDate = lastTime;

            if(i == 1){
                var employee = oneOf(employees);
                ticket.assigned_at = lastTime;
                ticket.assigned_to = employee;

                //ticket.chat.participants.push(employee);
            }

            await ticket.saveAsync();
            if(shouldAbort)
                break;
        }
    }

    this.createTicket = async function(type) {

        var customer = oneOf(users);

        var now = moment.utc().subtract(random(10,150), 'hours');

        var task = new Task({
            customer: customer,
            created_by: customer,
            created_at: now,
            type: type,
            store: store
        });
        task.logDate = now;

        var noProduct = random(1,10) <= 2;
        if(!noProduct) {
            var product = oneOf(products);
            task.product = product;
            console.log('department: ', product.department);
            task.department = product.department;
        }
        var chat = new Chat({
            store: store._id,
            product: task.product,
            participants: [customer],
            startTime: now
        });

        await chat.saveAsync();
        task.chat = chat;


        await task.saveAsync();
        return task;
    }
}

function randomRange(low1, low2, high1, high2){
    var low = random(low1, low2);
    var high = random(high1, high2);
    return random(low, high);
}

function random (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
function oneOf(list){
    var index = random(0, list.length -1);
    return list[index];
}

module.exports = TaskCreator;
