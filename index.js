/*
    ezamqp NPM package
    index.js
    Author: Mark Palmer
    License: Apache 2.0
*/

const amqpConn = require('./amqpConnection.js');

const configHandler = require('./configHandler.js');

const defaultConfig = 
{
    'autoReconnect': true,
    'reconnectStategy': 'exponential',
    'reconnectTimeMin': 200,
    'reconnectTimeMax': 60000,
    'reconnectFactor': 2,
    'encoding': 'application/json'
};

const acceptedValues = 
{
    'reconnectStategy': ['exponential', 'linear', 'constant']
};

function connect(url, config = {})
{
    return new Promise(function(resolve, reject)
    {
        var ezamqpConfig;

        try
        {
            configHandler.validate(config, defaultConfig, acceptedValues);
            ezamqpConfig = configHandler.prepare(config, defaultConfig);
        }
        catch(error)
        {
            reject('ezampq error: ' + error.message());
        }
        
        amqpConn.connect(url, ezamqpConfig, resolve, reject);
    });
}

module.exports.connect = connect;
