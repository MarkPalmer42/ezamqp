/*
    ezamqp NPM package
    amqpConnectionTest.js
    Author: Mark Palmer
    License: Apache 2.0
*/

const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");

const sinon = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const amqplib = require('amqplib');
const amqpConn = require('../amqpConnection.js');

describe("AMQP connection", () =>
{

    const connectionObject =
    {
        closeCallback: undefined,
        errorCallback: undefined,
        on: function(event, callback)
        {
            if('close' === event)
            {
                this.closeCallback = callback;
            }
            else if('error' === event)
            {
                this.errorCallback = callback;
            }
        },
        error: function()
        {
            if(this.errorCallback)
            {
                this.errorCallback();
            }
        },
        close: function()
        {
            if(this.closeCallback)
            {
                this.closeCallback();
            }
        }
    };

    var config;

    var connectCallCounter;

    var maxRejections;

    before(() =>
    {
        sinon.stub(amqplib, 'connect').callsFake(() =>
        {
            return new Promise((resolve, reject) =>
            {
                if(connectCallCounter < maxRejections)
                {
                    ++connectCallCounter;
                    reject(Error('error' + connectCallCounter));
                }
                else
                {
                    resolve(connectionObject);
                }
            });
        });
    });

    beforeEach(() =>
    {
        connectCallCounter = 0;
        maxRejections = 1;

        config = 
        {
            'autoReconnectOnInit': true,
            'autoReconnectOnConnectionLost': true,
            'reconnectStrategy': 'exponential',
            'reconnectTimeMin': 200,
            'reconnectTimeMax': 60000,
            'reconnectFactor': 2,
            'encoding': 'application/json'
        };
    });

    it("Reject on init failure", () =>
    {
        config['autoReconnectOnInit'] = false;

        var amqp = new amqpConn('amqp://nonexistent', config);

        var connPromise = amqp.connect();

        expect(connPromise).to.be.rejectedWith(300);
    });

    it("Reconnect on init failure", async () =>
    {
        config['reconnectTimeMin'] = 300;

        var amqp = new amqpConn('amqp://nonexistent', config);

        var shceduleSpy = sinon.spy();

        sinon.stub(amqp, 'scheduleReconnect').callsFake((url, conf, reconn, res, rej) =>
        {
            shceduleSpy(reconn);
            amqp.brokerConnect(url, conf, res, rej);
        });

        var conn = await amqp.connect();

        sinon.assert.calledWith(shceduleSpy, 300);
        
        expect(conn.connection).to.equal(connectionObject);
    });

    it("Reconnect with exponential strategy", async () =>
    {
        maxRejections = 4;
        config['reconnectTimeMin'] = 100;
        config['reconnectTimeMax'] = 1000;
        config['reconnectFactor'] = 3;

        var amqp = new amqpConn('amqp://nonexistent', config);

        var shceduleSpy = sinon.spy();

        sinon.stub(amqp, 'scheduleReconnect').callsFake((url, conf, reconn, res, rej) =>
        {
            shceduleSpy(reconn);
            amqp.brokerConnect(url, conf, res, rej);
        });

        var conn = await amqp.connect();

        sinon.assert.calledWith(shceduleSpy, 100);
        sinon.assert.calledWith(shceduleSpy, 300);
        sinon.assert.calledWith(shceduleSpy, 900);
        sinon.assert.calledWith(shceduleSpy, 1000);

        expect(conn.connection).to.equal(connectionObject);
    });

    it("Reconnect with linear strategy", async () =>
    {
        maxRejections = 4;
        config['reconnectStrategy'] = 'linear';
        config['reconnectTimeMin'] = 100;
        config['reconnectTimeMax'] = 500;
        config['reconnectFactor'] = 150;

        var amqp = new amqpConn('amqp://nonexistent', config);

        var shceduleSpy = sinon.spy();

        sinon.stub(amqp, 'scheduleReconnect').callsFake((url, conf, reconn, res, rej) =>
        {
            shceduleSpy(reconn);
            amqp.brokerConnect(url, conf, res, rej);
        });

        var conn = await amqp.connect();

        sinon.assert.calledWith(shceduleSpy, 100);
        sinon.assert.calledWith(shceduleSpy, 250);
        sinon.assert.calledWith(shceduleSpy, 400);
        sinon.assert.calledWith(shceduleSpy, 500);

        expect(conn.connection).to.equal(connectionObject);
    });

    it("Reconnect with constant strategy", async () =>
    {
        maxRejections = 4;
        config['reconnectStrategy'] = 'constant';
        config['reconnectTimeMin'] = 142;
        config['reconnectTimeMax'] = 500;
        config['reconnectFactor'] = 150;

        var amqp = new amqpConn('amqp://nonexistent', config);

        var shceduleSpy = sinon.spy();

        sinon.stub(amqp, 'scheduleReconnect').callsFake((url, conf, reconn, res, rej) =>
        {
            shceduleSpy(reconn);
            amqp.brokerConnect(url, conf, res, rej);
        });

        var conn = await amqp.connect();

        sinon.assert.calledWith(shceduleSpy, 142);
        sinon.assert.calledWith(shceduleSpy, 142);
        sinon.assert.calledWith(shceduleSpy, 142);
        sinon.assert.calledWith(shceduleSpy, 142);

        expect(conn.connection).to.equal(connectionObject);
    });

    it("Successful connection", async () =>
    {
        maxRejections = 0;

        var amqp = new amqpConn('amqp://nonexistent', config);

        var conn = await amqp.connect();

        expect(conn.connection).to.equal(connectionObject);
    });

    it("No reconnect attempt if connection closed by user", async () =>
    {
        maxRejections = 0;

        var amqp = new amqpConn('amqp://nonexistent', config);

        var conn = await amqp.connect();

        var reconnectSpy = sinon.spy();

        sinon.stub(amqp, 'attemptReconnect').callsFake(() =>
        {
            reconnectSpy();
        });

        conn.close();

        sinon.assert.neverCalledWith(reconnectSpy);
    });

    it("Reconnect attempt on connection close", async () =>
    {
        maxRejections = 0;
        config['autoReconnectOnConnectionLost'] = false;

        var amqp = new amqpConn('amqp://nonexistent', config);

        await amqp.connect();

        var reconnectSpy = sinon.spy();

        sinon.stub(amqp, 'attemptReconnect').callsFake(() =>
        {
            reconnectSpy();
        });

        connectionObject.close();

        sinon.assert.neverCalledWith(reconnectSpy);
    });

    it("Close event called", async () =>
    {
        maxRejections = 0;

        var amqp = new amqpConn('amqp://nonexistent', config);

        await amqp.connect();

        var closeEventSpy = sinon.spy();

        amqp.on('close', () =>
        {
            closeEventSpy();
        });

        amqp.close();

        sinon.assert.calledOnce(closeEventSpy);
    });

    it("Error event called", async () =>
    {
        maxRejections = 0;

        var amqp = new amqpConn('amqp://nonexistent', config);

        await amqp.connect();

        var errorEventSpy = sinon.spy();

        amqp.on('error', () =>
        {
            errorEventSpy();
        });

        connectionObject.error();

        sinon.assert.calledOnce(errorEventSpy);
    });

    it("Invalid event", async () =>
    {
        var amqp = new amqpConn('amqp://nonexistent', config);

        expect(() => { amqp.on('something'); }).to.throw();
    });

});