// 生成一个静态的 parser

const fs = require('fs/promises');

const filtrex = require('./filtrex');
const compileExpression = filtrex.compileExpression;

compileExpression('1 == 1'); // build the parser once

const parser = compileExpression.parser; // 最后生成（的文件）的对象跟这个 parser 一致。
let script = parser.generate();

let save = async () => {
    await fs.writeFile('./src/parser.js', script);
};

save();
