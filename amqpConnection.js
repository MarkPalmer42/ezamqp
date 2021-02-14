/*
    ezamqp NPM package
    amqpConnection.js
    Author: Mark Palmer
    License: Apache 2.0
*/

const amqpLib = require('amqplib');

function amqpConnection(url, config)
{
    this.reconnectOnLostConnectionAttempted = false;
    this.reconnectCounter = 0;
    this.reconnectTime = 0;
    this.config = config;
    this.url = url;
}

amqpConnection.prototype.connect = function()
{
    return new Promise((resolve, reject) =>
    {
        this.brokerConnect(this.url, this.config, resolve, reject);
    });
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
		}

        var self = this;

		conn.on('error', function(exception)
		{
			
		});

		conn.on('close', function(exception)
		{
			if(config['autoReconnectOnConnectionLost'])
			{
				self.reconnectOnLostConnectionAttempted = true;
				self.attemptReconnect(url, config, resolve, reject);
			}
		});

		resolve(conn);
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
