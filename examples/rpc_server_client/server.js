
const ezamqp = require('../../index.js');

ezamqp.connect('amqp://localhost')
.then(conn => 
{

    conn.addHandler('mult', function(request)
    {
        var val1 = request.getValue('val1');
        var val2 = request.getValue('val2');

        return { 'result': val1 + val2 };
    });

    conn.errorHandler(function(err)
    {
        return { 'result': 'error' };
    });

    conn.invalidHandler(function(request)
    {
        return { 'result': 'invalid' };
    });

    conn.rpcListen('rpcQueue');
})
.catch(err =>
{
    console.log('An error has occured during connection: ' + err);
});