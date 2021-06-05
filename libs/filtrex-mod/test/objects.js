const { compileExpression } = require("../src/filtrex");

const { describe, it } = require("mocha");
const { expect } = require("chai");




describe('Object support', () => {

    it('can bind to data', () => {
        const something = compileExpression('1 + foo * bar');

        expect(something({foo:5, bar:2})).equals(11);
        expect(something({foo:2, bar:1})).equals(3);
    });

    // MOD:: REM BLOCK
    // MOD:: REM 不支持直接访问包含有点号的属性
    // it('includes symbols with dots', () => {
    //     expect( compileExpression('hello.world.foo'  )({'hello.world.foo':   123}) ).equals(123);
    //     expect( compileExpression('order.gooandstuff')({'order.gooandstuff': 123}) ).equals(123);
    // });

    it('includes quoted symbols', () => {
        expect( compileExpression('\'hello-world-foo\''    )({'hello-world-foo':     123}) ).equals(123);
        expect( compileExpression('\'order+goo*and#stuff\'')({'order+goo*and#stuff': 123}) ).equals(123);
    });

    it('includes object property accessors', () => {
        // MOD:: REM BLOCK
        // MOD:: REM 不支持直接访问包含有点号的属性
        // expect(compileExpression(`hat of 'the captain' of Danube.Steamboat.Shipping.Company`)(
        //     {'Danube.Steamboat.Shipping.Company': {'the captain': {hat: "epic"}}}
        // )).equals("epic");

        // MOD:: ADD BLOCK
        // MOD:: REM 包含有点号的属性加上单引号包围
        expect(compileExpression(`hat of 'the captain' of 'Danube.Steamboat.Shipping.Company'`)(
            {'Danube.Steamboat.Shipping.Company': {'the captain': {hat: "epic"}}}
        )).equals("epic");

        expect(compileExpression('something of nothing')({})).equals(undefined);
        expect(compileExpression('toString of something')({ something: {}})).equals(undefined);
    });

});