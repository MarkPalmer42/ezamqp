/*
    ezamqp NPM package
    amqpChannel.js
    Author: Mark Palmer
    License: Apache 2.0
*/

const rpcApi = require('./rpcApi.js');

function amqpChannel(connection)
{
    this.connection = connection;
    this.rpc = new rpcApi(this);
    this.queueList = [];
    this.channel = undefined;
    this.fastReplyQueue = undefined;
    this.fastReplyQueueInitialised = false;
}

amqpChannel.prototype.getChannel = function()
{
    return this.channel;
}

amqpChannel.prototype.init = function()
{
    var self = this;

    return new Promise(function(resolve, reject)
	{
		self.connection.createChannel()
		.then(async channel =>
		{
			channel.on('close', function(err)
			{
                //TODO: handle error cases
			});

            self.channel = channel;

            for(var queueName in self.queueList)
            {
                self.queueList[queueName] = await self.assertQueue(queueName);
            }

            resolve(self);
		})
		.catch(err =>
		{
			reject(err);
		});
	});
}

amqpChannel.prototype.assertQueue = function(queueName, queueProperties = {})
{
    var self = this;

    return new Promise((resolve, reject) =>
    {
        self.channel.assertQueue(queueName, queueProperties)
        .then(queue =>
        {
            self.queueList[queueName] = queue;

            resolve(queue);
        })
        .catch(err =>
        {
            reject(err);
        });
    });
}

amqpChannel.prototype.getQueueByName = async function(queueName, queueProperties = {})
{
    if(queueName in this.queueList)
    {
        return this.queueList[queueName];
    }
    else
    {
        return await this.assertQueue(queueName, queueProperties);
    }
}

amqpChannel.prototype.initFastReplyQueue = async function(callback)
{
    if(!this.fastReplyQueueInitialised)
    {
        this.fastReplyQueue = await this.assertQueue('', { exlusive: true, durable: false });

        this.initConsumption(this.fastReplyQueue.queue, callback, { noAck: true });

        this.fastReplyQueueInitialised = true;
    }

    return this.fastReplyQueue;
}

amqpChannel.prototype.initConsumption = async function(queueName, callback, properties = {})
{
    this.channel.consume(queueName, callback, properties);
}

module.exports = amqpChannel;