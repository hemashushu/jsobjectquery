const assert = require('assert/strict');

const filtrex = require('../index');
const {compileExpression} = filtrex;

const { describe, it } = require("mocha");
const { expect } = require("chai");

const {ObjectUtils} = require('jsobjectutils');

describe('filtrex-mod Test', () => {

    it('Test access sub-object', () => {
        let user1 = {
            name: 'foo',
            addr: {
                city: {
                    name: 'shenzhen',
                    posecode: '518000'
                },
                street: 'bar'
            }
        };

        let f1 = compileExpression('name');
        let r1 = f1(user1);
        assert.equal(r1, 'foo');

        let f2 = compileExpression('addr.city.name');
        let r2 = f2(user1);
        assert.equal(r2, 'shenzhen')
    });

    it('Test has() function', ()=>{
        let i1 = {numbers: [1,2,8,9]};
        assert(compileExpression('numbers has 1')(i1));
        assert(compileExpression('numbers has 8')(i1));
        assert(!compileExpression('numbers has 3')(i1));
        assert(!compileExpression('numbers has 4')(i1));

        let s1 = {names: ['foo','bar']};
        assert(compileExpression('names has "foo"')(s1));
        assert(compileExpression('names has "bar"')(s1));
        assert(!compileExpression('names has "hello"')(s1));
        assert(!compileExpression('names has "world"')(s1));
    });

    it('Test count() function', ()=>{
        let i1 = {
            numbers: [1,2,8,9],
            names: ['foo','bar']
        };

        assert.equal(compileExpression('count(numbers)')(i1), 4);
        assert.equal(compileExpression('count(names)')(i1), 2);
    });

    it('Test date() function', ()=>{
        let r1 = compileExpression('date()')({});
        assert(r1 instanceof Date);

        let r2 = compileExpression('date(1000)')({});
        assert(ObjectUtils.dateEquals(r2, new Date(1000000)));

        let r3 = compileExpression('date("2021-6-1")')({});
        assert(ObjectUtils.dateEquals(r3, new Date('2021-6-1')));
    });

    it('Test days() function', ()=>{
        let r1 = compileExpression('days("2021-1-1", "2021-1-10")')({});
        assert.equal(r1, 9);

        // 3 days = 3 * 24 * 60 * 60 seconds
        let r2 = compileExpression('days(0, 259200)')({});
        assert.equal(r2, 3);
    });

});
