var Adapter = require('socket.io-adapter');
var debug = require('debug')('mongoose-adapter');
var uuid = require('node-uuid');

var instanceId = uuid.v4();

module.exports = adapter;

function adapter(mongoose) {

	var schema = new mongoose.Schema({
		name: String,
		timestamp: {type: Date, default: Date.now},
		source: {type: String, default: instanceId},
		rooms: {
			type: [String]
		},
		data: mongoose.Schema.Types.Mixed
	}, {
		collection: 'socket.io.messages',
		capped: {
			max: 5000,
			size: 8 * 1024 * 1024
		}
	});

	var SocketMessage = mongoose.model('SocketMessage', schema);


	function MongoAdapter(nsp) {

		Adapter.call(this, nsp);
		debug('ctor', nsp.name);

		this._initialize();
	}


	MongoAdapter.prototype.__proto__ = Adapter.prototype;

	MongoAdapter.prototype.onmessage = function(item) {

		if(item.source === instanceId)
			return;

		debug('onmessage: ', Date.now(), item.name);

		var opts = {
			rooms: item.rooms
		};

		var packet = {
			type: 2,
			data: [item.name, item.data],
			nsp: this.nsp.name
		};

		this.broadcast(packet, opts, true);
	}

	MongoAdapter.prototype.broadcast = function(packet, opts, remote) {
		Adapter.prototype.broadcast.call(this, packet, opts);

		if (remote)
			return;

		var name = packet.data[0];
		var data = packet.data[1];

		//debug('broadcast:', packet, opts);
		//debug('broadcast: ' + name, data);

		var model = new SocketMessage({
			name: name,
			data: data,
			rooms: opts.rooms
		});

		model.save(function(err, saved) {
			if(err)
				this.emit('error', err);
			//debug('broadcasted', err);
		});
	}


	MongoAdapter.prototype.add = function(id, room, fn) {
		Adapter.prototype.add.call(this, id, room, fn);
		debug('add', id, room);
	}

	MongoAdapter.prototype.del = function(id, room, fn) {
		Adapter.prototype.del.call(this, id, room, fn);

		debug('del', id, room);

	}

	MongoAdapter.prototype.delAll = function(id, fn) {
		Adapter.prototype.delAll.call(this, id, fn);
		debug('delAll', id);
	}

	MongoAdapter.prototype._initialize = function() {

		if (mongoose.connection.readyState !== 1 /* connected */ ) {

			debug('_initializing');
			mongoose.connection.on('connected', this._initialize.bind(this));
			return;
		}

		debug('initialized');

		var self = this;
		var startupDate = Date.now();

		var stream = SocketMessage.find({
				timestamp: {
					$gt: startupDate
				},
				source: {
					$ne: instanceId
				}
			})
			.tailable()
			.stream();

		stream.on('data', function(item) {
			if(item.name !== "init") {
				debug('message received: ' + item.name);
				self.onmessage.bind(self)(item);
			}
		});
	}

	return MongoAdapter;
}
