/*
    ezamqp NPM package
    amqpConnection.js
    Author: Mark Palmer
    License: Apache 2.0
*/

const amqpLib = require('amqplib');
const EventEmitter = require('events');

const validEvents = ['close', 'reconnect', 'error'];

function amqpConnection(url, config)
{
    this.reconnectOnLostConnectionAttempted = false;
    this.reconnectCounter = 0;
    this.reconnectTime = 0;
    this.config = config;
    this.url = url;
    this.connectionCloseCalled = false;
    this.connection = undefined;
    this.eventEmitter = new EventEmitter();
}

amqpConnection.prototype.connect = function()
{
    return new Promise((resolve, reject) =>
    {
        this.brokerConnect(this.url, this.config, resolve, reject);
    });
}

amqpConnection.prototype.on = function(eventName, callback)
{
    if(validEvents.find(x => x == eventName))
    {
        this.eventEmitter.on(eventName, callback);
    }
    else
    {
        throw Error('ezamqp error: invalid event ' + eventName + ' added to connection object.');
    }
}

amqpConnection.prototype.close = function()
{
    this.connectionCloseCalled = true;
    this.connection.close();
}

amqpConnection.prototype.scheduleReconnect = function(url, config, reconnectTime, resolve, reject)
{
    const self = this;

    setTimeout(function()
    {
        self.brokerConnect(url, config, resolve, reject);
    }, reconnectTime);
}

amqpConnection.prototype.brokerConnect = function(url, config, resolve, reject)
{
	amqpLib.connect(url)
	.then(conn =>
	{
		if(this.reconnectOnLostConnectionAttempted)
		{
			/* Restore connection to its normal state after reconnection. */
			// await restore_connection(conn);
            this.eventEmitter.emit('reconnect');
		}

        var self = this;

		conn.on('error', function(exception)
		{
			self.eventEmitter.emit('error', exception);

            // TODO: handle error cases
		});

		conn.on('close', function(exception)
		{
            self.eventEmitter.emit('close', exception);

			if(!self.connectionCloseCalled && config['autoReconnectOnConnectionLost'])
			{
				self.reconnectOnLostConnectionAttempted = true;
				self.attemptReconnect(url, config, resolve, reject);
			}
		});

        this.connection = conn;

		resolve(this);
	})
	.catch(exception =>
	{
        if(config['autoReconnectOnInit'])
        {
            this.attemptReconnect(url, config, resolve, reject);
        }
        else
        {
            reject(exception);
        }
	});
}

amqpConnection.prototype.attemptReconnect = function(url, config, resolve, reject)
{
    if(0 === this.reconnectCounter)
    {
        this.reconnectTime = config['reconnectTimeMin'];
    }
    else
    {
        if('exponential' === config['reconnectStrategy'])
        {
            this.reconnectTime *= config['reconnectFactor'];
        }
        else if('linear' === config['reconnectStrategy'])
        {
            this.reconnectTime += config['reconnectFactor'];
        }

        if(this.reconnectTime > config['reconnectTimeMax'])
        {
            this.reconnectTime = config['reconnectTimeMax'];
        }
    }

    this.reconnectCounter++;

    this.scheduleReconnect(url, config, this.reconnectTime, resolve, reject);
}

module.exports = amqpConnection;
