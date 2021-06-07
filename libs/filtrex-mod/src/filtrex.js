const Jison = require("jison").Jison;
const { ObjectAccessor } = require('jsobjectutils');

/**
 * Filtrex provides compileExpression() to compile user expressions to JavaScript.
 *
 * See https://github.com/joewalnes/filtrex for tutorial, reference and examples.
 * MIT License.
 *
 * Includes Jison by Zachary Carter. See http://jison.org/
 *
 * -Joe Walnes
 */
exports.compileExpression =
    function compileExpression(expression, extraFunctions, customProp) {
        var functions = {
            abs: Math.abs,
            // ceil: Math.ceil, // MOD:: REM 不常用
            // floor: Math.floor, // MOD:: REM 不常用
            // log: Math.log,
            ln: Math.log, // MOD:: ADD 自然对数
            exp: Math.exp, // MOD:: ADD e 的 x 次方
            log10: Math.log10, // MOD:: ADD 常用对数，以 10 为底数的对数函数
            max: Math.max,
            min: Math.min,
            // random: Math.random, // MOD:: REM 不常用
            round: Math.round,
            sqrt: Math.sqrt,

            // MOD:: ADD BLOCK
            // MOD:: REM new add 'maxof(p)' function
            // MOD:: REM e.g.
            // MOD:: REM maxof(someObject.arrayValueProperty)
            maxof: (v) => {
                return Math.max(...v);
            },
            // MOD:: ADD BLOCK END

            // MOD:: ADD BLOCK
            // MOD:: REM new add 'minof(p)' function
            // MOD:: REM e.g.
            // MOD:: REM minof(someObject.arrayValueProperty)
            minof: (v) => {
                return Math.min(...v);
            },
            // MOD:: ADD BLOCK END

            // MOD:: ADD BLOCK
            // MOD:: REM new add 'has v' syntax
            // MOD:: REM e.g.
            // MOD:: REM has "red"
            // MOD:: REM has 1234
            has: (s, v) => {
                return s !== undefined && s.includes(v);
            },
            // MOD:: ADD BLOCK END

            // MOD:: ADD BLOCK
            // MOD:: REM new add 'count(p)' function
            // MOD:: REM e.g.
            // MOD:: REM count('array-value-property-name')
            // MOD:: REM count(arrayValuePropertyName)
            count: (v) => {
                return v !== undefined ? v.length : 0;
            },
            // MOD:: ADD BLOCK END

            // MOD:: ADD BLOCK
            // MOD:: REM new add 'date(v)' function
            // MOD:: REM e.g.
            // MOD:: date("2000-1-1") // yyyy-MM-dd
            // MOD:: date(1000) // UNIX timestamp, seconds, from 1970-1-1 00:00
            // MOD:: date() // now
            date: (v) => {
                if (typeof v === 'number') {
                    let milliseconds = v * 1000; // convert to UNIX timestamp
                    return new Date(milliseconds);
                } else if (typeof v === 'string') {
                    return new Date(v); // yyyy-MM-dd
                } else {
                    return new Date(); // now
                }
            },
            // MOD:: ADD BLOCK END

            // MOD:: ADD BLOCK
            // MOD:: REM new add 'days(p,p)' function
            // MOD:: REM get the number of days between two dates
            // MOD:: REM e.g.
            // MOD:: REM days(d1, d2)
            // MOD:: REM days(d, "2000-1-1")
            // MOD:: REM days("2000-1-1", d)
            // MOD:: REM days("2000-1-1", "2000-1-2")
            // MOD:: REM days(1000, 2000)
            days: (v1, v2) => {
                let getDate = (v) => {
                    if (v instanceof Date) {
                        return v;
                    } else if (typeof v === 'number') {
                        let milliseconds = v * 1000; // convert to UNIX timestamp
                        return new Date(milliseconds);
                    } else if (typeof v === 'string') {
                        return new Date(v); // yyyy-MM-dd
                    } else {
                        return new Date(); // now
                    }
                };

                let leftDate = getDate(v1);
                let rightDate = getDate(v2);
                let milliseconds = rightDate - leftDate; // time span in milliseconds
                return Math.round(milliseconds / 1000 / 60 / 60 / 24);
            }
            // MOD:: ADD BLOCK END
        };

        if (extraFunctions) {
            for (var name in extraFunctions) {
                if (extraFunctions.hasOwnProperty(name)) {
                    functions[name] = extraFunctions[name];
                }
            }
        }
        if (!compileExpression.parser) {
            // Building the original parser is the heaviest part. Do it
            // once and cache the result in our own function.
            compileExpression.parser = filtrexParser();
        }
        var tree = compileExpression.parser.parse(expression);

        var js = [];
        js.push('return ');
        function toJs(node) {
            if (Array.isArray(node)) {
                node.forEach(toJs);
            } else {
                js.push(node);
            }
        }
        tree.forEach(toJs);
        js.push(';');

        function unknown(funcName) {
            throw 'Unknown function: ' + funcName + '()';
        }

        function coerceBoolean(value) {
            if (typeof value === 'boolean')
                return +value;
            else
                return value;
        }

        function prop(name, obj) {
            // return Object.prototype.hasOwnProperty.call(obj || {}, name) ? obj[name] : undefined; // MOD:: REM

            // MOD:: ADD BLOCK
            // MOD:: REM 添加对子对象的属性的访问支持，比如 addr.city 可以访问如下的 User 对象：
            // MOD:: REM user:{name: 'foo', addr: {city:'shenzhen', posecode:'518000'} }
            // MOD:: REM 的子对象 addr 的 city 属性。
            // MOD:: REM
            // MOD:: REM 此处更改会改变 filtrex 的原有的 “属性名当中的点号” 的含义，现在
            // MOD:: REM 属性名当中的点号表示子对象的意思。
            // MOD:: REM 如果对象属性名本身有点号，则写表达式时，需要用单引号引起来。
            return ObjectAccessor.getPropertyValueByNamePath(obj, name);
        }

        function safeGetter(obj) {
            return function get(name) {
                return Object.prototype.hasOwnProperty.call(obj || {}, name) ? obj[name] : undefined;
            }
        }

        if (typeof customProp === 'function') {
            prop = (name, obj) => coerceBoolean(customProp(name, safeGetter(obj), obj));
        }

        var func = new Function('functions', 'data', 'unknown', 'prop', js.join(''));

        return function (data) {
            return func(functions, data, unknown, prop);
        };
    }

function filtrexParser() {

    // Language parser powered by Jison <http://zaach.github.com/jison/>,
    // which is a pure JavaScript implementation of
    // Bison <http://www.gnu.org/software/bison/>.

    function code(args, skipParentheses) {
        var argsJs = args.map(function (a) {
            return typeof (a) == 'number' ? ('$' + a) : JSON.stringify(a);
        }).join(',');

        return skipParentheses
            ? '$$ = [' + argsJs + '];'
            : '$$ = ["(", ' + argsJs + ', ")"];';
    }

    var grammar = {
        // Lexical tokens
        lex: {
            rules: [
                ['\\*', 'return "*";'],
                ['\\/', 'return "/";'],
                ['-', 'return "-";'],
                ['\\+', 'return "+";'],
                ['\\^', 'return "^";'],
                ['\\%', 'return "%";'],
                ['\\(', 'return "(";'],
                ['\\)', 'return ")";'],
                ['\\,', 'return ",";'],
                ['==', 'return "==";'],
                ['\\!=', 'return "!=";'],
                ['\\~=', 'return "~=";'],
                ['>=', 'return ">=";'],
                ['<=', 'return "<=";'],
                ['<', 'return "<";'],
                ['>', 'return ">";'],
                ['\\?', 'return "?";'],
                ['\\:', 'return ":";'],
                ['and[^\\w]', 'return "and";'],
                ['or[^\\w]', 'return "or";'],
                ['not[^\\w]', 'return "not";'],
                ['in[^\\w]', 'return "in";'],
                // ['of[^\\w]', 'return "of";'], // MOD:: REM 改用点号来访问子属性

                ['has[^\\w]', 'return "has";'], // MOD:: ADD new operator

                ['\\s+', ''], // skip whitespace
                ['[0-9]+(?:\\.[0-9]+)?\\b', 'return "NUMBER";'], // 212.321

                ['[a-zA-Z][\\.a-zA-Z0-9_]*',
                    `yytext = JSON.stringify(yytext);
                  return "SYMBOL";`
                ], // some.Symbol22

                // MOD:: REM BLOCK
                // MOD:: REM 这里仅仅匹配单引号之间的内容
                // [`'(?:[^\'])*'`,
                //     `yytext = JSON.stringify(
                //      yytext.substr(1, yyleng-2)
                //   );
                //   return "SYMBOL";`
                // ], // 'some-symbol'

                // MOD:: ADD BLOCK
                // MOD:: REM 添加 'name' 和 'foo''bar' 的单引号的支持。
                // MOD:: REM 返回的内容包含单引号
                // MOD:: REM
                // MOD:: 如果要允许
                [
                    //`'((?:''|(?:(?!')).)*)'`, // 单独一个单引号对包括起来的内容： 'foobar'
                    `('((?:''|(?:(?!')).)*)'|\\w+)(\\.('((?:''|(?:(?!')).)*)'|\\w+))*`, // 多个属性值使用点号拼接的属性名称路径
                    `yytext = JSON.stringify(yytext);
                    return "SYMBOL";`
                ], // 'some-symbol' and 'some''symbol', 即匹配属性值

                // MOD:: REM 这里返回的是双引号之间的值，不是属性名称，请勿修改这里
                // MOD:: REM
                // MOD:: REM 如果要允许值里面含有转义字符 \" 或者 \'
                // MOD:: REM 可以使用如下正则表达式
                // MOD:: REM `(["'])((?:\\\1|(?:(?!\1)).)*)(\1)`
                ['"(?:[^"])*"',
                    `yytext = JSON.stringify(
                     yytext.substr(1, yyleng-2)
                  );
                  return "STRING";`
                ], // "foo"

                // End
                ['$', 'return "EOF";'],
            ]
        },
        // Operator precedence - lowest precedence first.
        // See http://www.gnu.org/software/bison/manual/html_node/Precedence.html
        // for a good explanation of how it works in Bison (and hence, Jison).
        // Different languages have different rules, but this seems a good starting
        // point: http://en.wikipedia.org/wiki/Order_of_operations#Programming_languages
        operators: [
            ['left', '?', ':'],
            ['left', 'or'],
            ['left', 'and'],
            ['left', 'in'],

            ['left', 'has'], // MOD:: ADD for new operator 'has'

            ['left', '==', '!=', '~='],
            ['left', '<', '<=', '>', '>='],
            ['left', '+', '-'],
            ['left', '*', '/', '%'],
            ['left', '^'],
            ['left', 'not'],
            ['left', 'UMINUS'],
            // ['left', 'of'], // MOD:: REM 改用点号来访问子属性
        ],
        // Grammar
        bnf: {
            expressions: [ // Entry point
                ['e EOF', 'return $1;']
            ],
            e: [
                ['e + e', code([1, '+', 3])],
                ['e - e', code([1, '-', 3])],
                ['e * e', code([1, '*', 3])],
                ['e / e', code([1, '/', 3])],
                ['e % e', code([1, '%', 3])],
                ['e ^ e', code(['Math.pow(', 1, ',', 3, ')'])],
                ['- e', code(['-', 2]), { prec: 'UMINUS' }],
                ['e and e', code(['Number(', 1, '&&', 3, ')'])],
                ['e or e', code(['Number(', 1, '||', 3, ')'])],
                ['not e', code(['Number(!', 2, ')'])],
                ['e == e', code(['Number(', 1, '==', 3, ')'])],
                ['e != e', code(['Number(', 1, '!=', 3, ')'])],
                ['e ~= e', code(['Number(RegExp(', 3, ').test(', 1, '))'])],
                ['e < e', code(['Number(', 1, '<', 3, ')'])],
                ['e <= e', code(['Number(', 1, '<=', 3, ')'])],
                ['e > e', code(['Number(', 1, '> ', 3, ')'])],
                ['e >= e', code(['Number(', 1, '>=', 3, ')'])],

                ['e has e', code(['Number(functions.has(', 1, ',', 3, '))'])], // MOD:: ADD for new operator 'has'
                ['e not has e', code(['Number(!functions.has(', 1, ',', 3, '))'])], // MOD:: ADD for new operator 'has'

                ['e ? e : e', code([1, '?', 3, ':', 5])],
                ['( e )', code([2])],
                ['( array , e )', code(['[', 2, ',', 4, ']'])],
                ['NUMBER', code([1])],
                ['STRING', code([1])],
                ['SYMBOL', code(['prop(', 1, ', data)'])],
                // ['SYMBOL of e', code(['prop(', 1, ',', 3, ')'])], // MOD:: REM 改用点号来访问子属性
                ['SYMBOL ( )', code(['(functions.hasOwnProperty(', 1, ') ? functions[', 1, ']() : unknown(', 1, '))'])],
                ['SYMBOL ( argsList )', code(['(functions.hasOwnProperty(', 1, ') ? functions[', 1, '](', 3, ') : unknown(', 1, '))'])],
                ['e in ( inSet )', code(['+(function(o) { return ', 4, '; })(', 1, ')'])],
                ['e not in ( inSet )', code(['+!(function(o) { return ', 5, '; })(', 1, ')'])],
            ],
            argsList: [
                ['e', code([1], true)],
                ['argsList , e', code([1, ',', 3], true)],
            ],
            inSet: [
                ['e', code(['o ==', 1], true)],
                ['inSet , e', code([1, '|| o ==', 3], true)],
            ],
            array: [
                ['e', code([1])],
                ['array , e', code([1, ',', 3], true)],
            ],
        }
    };
    return new Jison.Parser(grammar);
}