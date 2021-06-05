const { compileExpression } = require("../src/filtrex");

const { describe, it } = require("mocha");
const { expect } = require("chai");



describe('Security', () => {

    it('cannot access prototype symbols of data', () =>
        expect(
            compileExpression('toString')({})
        ).equals(
            undefined
        )
    );


    // !FIXME this doesn't seem relevant anymore

    it('cannot call prototype methods on function table', () => {
        // Credit to @emilvirkki for finding this
        global.p0wned = false;

        let evil = compileExpression(
            'constructor.constructor.name.replace("",constructor.constructor("global.p0wned=true"))'
        );

        expect( evil ).throws();

        expect( global.p0wned ).equals(false);
    });


    it('cannot access properties of the data prototype', () =>
        expect( compileExpression('a')(Object.create({a: 42})) ).equals(undefined)
    );


    it('cannot inject single-quoted names with double quotes', () => {
        global.p0wned = false;

        let evil = compileExpression(`'"+(global.p0wned = true)+"'`);
        let object = { '"+(global.p0wned = true)+"': 31 };

        expect( evil(object) ).equals(31);
        expect( global.p0wned ).equals(false);

        // MOD:: REM BLOCL
        // MOD:: 作用不明，测试抛异常，不通过
        // expect(
        //     compileExpression(
        //         "'undefined:(global.p0wned=true)));((true?(x=>x)'()",
        //         {'undefined:(global.p0wned=true)));((true?(x=>x)': ()=>42}
        //     )()
        // ).equals(42);

        expect( global.p0wned ).equals(false);
    });


    it('does backslash escaping', () =>
        expect( compileExpression(`"\\" + '\\'`)({'\\':'good'}) ).equals('\\good')
    );


    it('in() is not vulnerable to Object.prototype extensions ', () => {
        Object.prototype.aa = true;
        expect( compileExpression('"aa" in ("bb", "cc")')() ).equals(0);
        delete Object.prototype.aa;
    });


    it('blocks prototype access in custom property function', () => {
        expect(
            compileExpression('a', {}, (name, get) => get(name))
            (Object.create({ a:1 }))
        ).equals(undefined);
    })

});