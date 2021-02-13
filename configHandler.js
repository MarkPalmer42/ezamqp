/*
    ezamqp NPM package
    config.js
    Author: Mark Palmer
    License: Apache 2.0
*/

function validate(config, defaultConfig, acceptedValues)
{
    if(typeof config !== 'object')
    {
        throw Error('Config argument must be an object.');
    }

    for(configKey in config)
    {
        if(!defaultConfig.hasOwnProperty(configKey))
        {
            throw Error('Config key named ' + configKey + ' does not exist.');
        }

        const expectedType = typeof defaultConfig[configKey];
        const gotType = typeof config[configKey];

        if(gotType !== expectedType)
        {
            throw Error('Type of config key named ' + configKey + ' is not valid (expected ' + expectedType + ', got ' + gotType + ').');
        }
    }

    for(configKey in acceptedValues)
    {
        if(!acceptedValues[configKey].find(x => x == config[configKey]))
        {
            const values = acceptedValues[configKey].join(', ');
            throw Error('Value of config ' + configKey + ' is not valid, accepted values are [' + values + ']');
        }
    }
}

function prepare(config, defaultConfig)
{
    var preparedConfig = config;

    for(configKey in defaultConfig)
    {
        if(!config.hasOwnProperty(configKey))
        {
            preparedConfig[configKey] = defaultConfig[configKey];
        }
    }

    return preparedConfig;
}

module.exports = { validate, prepare }