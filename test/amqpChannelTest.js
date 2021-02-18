/*
    ezamqp NPM package
    amqpChannelTest.js
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

const amqpChannel = require('../src/amqpChannel.js');

describe("AMQP channel", () =>
{
    function channelMock() {}

    channelMock.prototype.on = function() { }

    channelMock.prototype.assertQueue = function(queueName)
    {
        return Promise.resolve(queueName);
    }

    channelMock.prototype.getVal = function()
    {
        return 42;
    }

    function amqpConnMock() {}

    amqpConnMock.prototype.createChannel = function()
    {
        return Promise.resolve(new channelMock());
    }

    it("Object without init", () =>
    {
        var channel = new amqpChannel();

        expect(channel.getChannel()).to.equal(undefined);
    });

    it("Successful init", async () =>
    {
        var connMock = new amqpConnMock();
        var channel = new amqpChannel(connMock);

        await channel.init();

        expect(channel.getChannel().getVal()).to.equal((await connMock.createChannel()).getVal());
    });

    it("Asserting a queue", async () =>
    {
        var connMock = new amqpConnMock();
        var channel = new amqpChannel(connMock);

        await channel.init();

        var queue = channel.assertQueue('queue1');

        expect(queue).to.be.eventually.equal('queue1');
    });

    it("Reasserting queues after failure", async () =>
    {
        var connMock = new amqpConnMock();
        var channel = new amqpChannel(connMock);

        await channel.init();

        channel.assertQueue('queue1');
        channel.assertQueue('queue2');

        var assertQueueSpy = sinon.spy();

        sinon.stub(channel, 'assertQueue').callsFake((value) =>
        {
            assertQueueSpy(value);
        });

        await channel.init();

        sinon.assert.calledWith(assertQueueSpy, 'queue1');
        sinon.assert.calledWith(assertQueueSpy, 'queue2');
    });

    it("getQueueByName - asserting new queue", async () =>
    {
        var connMock = new amqpConnMock();
        var channel = new amqpChannel(connMock);

        await channel.init();

        var gQueue = channel.getQueueByName('queue1');

        expect(gQueue).to.eventually.be.equal('queue1');
    });

    it("getQueueByName - getting asserted queue", async () =>
    {
        var connMock = new amqpConnMock();
        var channel = new amqpChannel(connMock);

        await channel.init();

        await channel.assertQueue('queue1');
        
        var gQueue = channel.getQueueByName('queue1');

        expect(gQueue).to.eventually.be.equal('queue1');
    });

    it("initFastReplyQueue - initialising new fast reply queue", async () =>
    {
        var connMock = new amqpConnMock();
        var channel = new amqpChannel(connMock);
        
        var consumeSpy  = sinon.spy();

        sinon.stub(channel, 'initConsumption').callsFake(() =>
        {
            consumeSpy();
        });

        await channel.init();

        var replyQueue1 = await channel.initFastReplyQueue();
        var replyQueue2 = await channel.initFastReplyQueue();

        sinon.assert.calledOnce(consumeSpy);
        expect(replyQueue1).to.equal('');
        expect(replyQueue2).to.equal('');
    });

});