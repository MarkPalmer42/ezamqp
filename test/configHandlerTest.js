
const chai = require("chai");

const validate = require('../configHandler.js').validate;
const prepare = require('../configHandler.js').prepare;

describe("Configuration", () =>
{

    it("Invalid config object type", () =>
    {
        const excMsg = 'Config argument must be an object.';
        chai.expect(() => validate('', undefined, undefined)).to.throw(excMsg);
    });

    it("Invalid config element key", () =>
    {
        const config = 
        {
            'a': 'value1',
            'c': 'value2'
        };

        const defaultConfig = 
        {
            'a': 'value1',
            'b': 'value2'
        };

        const excMsg = 'Config key named c does not exist.';
        chai.expect(() => validate(config, defaultConfig, undefined)).to.throw(excMsg);
    });

    it("Invalid config element type", () =>
    {
        const config = 
        {
            'a': 'value1',
            'b': '42'
        };

        const defaultConfig = 
        {
            'a': 'value1',
            'b': 42
        };

        const excMsg = 'Type of config key named b is not valid (expected number, got string).';
        chai.expect(() => validate(config, defaultConfig, undefined)).to.throw(excMsg);
    });

    it("Config element with unaccepted value", () =>
    {
        const config = 
        {
            'a': 'value1',
            'b': '42'
        };

        const defaultConfig = 
        {
            'a': 'value1',
            'b': '52'
        };

        const acceptedValues = 
        {
            'b': ['52', '62']
        };

        const excMsg = 'Value of config b is not valid, accepted values are [52, 62]';
        chai.expect(() => validate(config, defaultConfig, acceptedValues)).to.throw(excMsg);
    });

    it("Validation successful", () =>
    {
        const config = 
        {
            'b': 42
        };

        const defaultConfig = 
        {
            'a': 'value2',
            'b': 52
        };

        const acceptedValues = 
        {
            'b': [42, 52]
        };

        chai.expect(() => validate(config, defaultConfig, acceptedValues)).to.not.throw();
    });

    it("Prepare incomplete config", () =>
    {
        const config = 
        {
            'b': 42
        };

        const defaultConfig = 
        {
            'a': 'value2',
            'b': 52
        };

        const preparedConfig = prepare(config, defaultConfig);

        chai.expect(preparedConfig).to.deep.equal({ 'b': 42, 'a': 'value2' });
    });

    it("Prepare complete config", () =>
    {
        const config = 
        {
            'a': 'value1',
            'b': 42
        };

        const defaultConfig = 
        {
            'a': 'value2',
            'b': 52
        };

        const preparedConfig = prepare(config, defaultConfig);

        chai.expect(preparedConfig).to.deep.equal({ 'a': 'value1', 'b': 42 });
    });

});
