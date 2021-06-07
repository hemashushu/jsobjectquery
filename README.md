# JSObjectQuery

A module for querying, filtering and sorting objects.

一个用于查询、筛选、排序对象的模块。

## 示例

假设有对象数组 itemObjects，则下面语句

```
let r = ObjectQuery
  .from(itemObjects)
  .where('number > 60 and checked')
  .select('id, name, number, checked')
  .orderBy('id')
  .collect();
```

表示：
1. 筛选对象的 number 属性的值大于 60，并且 checked 属性的值为 true 的对象；
2. 使用对象的 id, name, number, checked 这四个属性重构新对象；
3. 按 id 属性的值排序；
4. 返回新的对象数组。

## 语法

### where 方法

where 方法接受一个对象查询语句（表达式），查询语句由数值、运算符（含比较符、逻辑运算符）及函数组成。

#### 数据类型

| 数值 | 说明 |
| --- | --- |
| 123, -273.15, 3.14159 | 数字 |
| "Hello world!" | 字符串，使用双引号包括起来的表示字符串 |
| foo, 'foo-bar' | 变量名（即参与运算的对象的属性名称，以下简称为“属性名”）。 <br/>没有双引号包括起来的字符串表示属性名。<br/>如果属性名本身含有逗号、点号等等特殊符号，则需要使用单引号包括起来。<br/>如果属性名本身含有单引号，则使用两个连续的单引号表示，比如 'user''s addr' |
| user.name <br/> user.'home-addr'.city | 子对象的属性名，使用点号把多个属性名拼接起来表示子对象的属性名 |
| (2,3,4), ("abc", "xyz"), (a, b, c) | 数组，使用括号将多个数字、字符串、或者属性名包括起来表示数组。 |

#### 布尔型（Boolean）数据类型

- 表达式不支持 true 或者 false 这两个关键字。
- 输入比较表达式时，非 0 的数字和非空的字符串都视为逻辑上的 true。数字 0 和空字符串视为逻辑上的 false。
- 比较表达式的结果只能是 1 或者 0，其中 1 表示逻辑上的 true，0 表示逻辑上的 false。比如表达式 `where ('55 < 99')` 的结果为 1，`where ('1 + 1 == 1')` 的结果为 0。
- 当需要判断某个属性值是否为 true 时，只需在比较表达式里直接写属性名到即可。比如 `where ('user.checked')` 表示当子对象 user 的属性 checked 的值为逻辑上的 true 时条件成立。请**不要**将表达式写成 `where ('user.checked == true')`，因为不支持 true 这个关键字。当需要属性值为逻辑 false 时条件成立，只需在属性名前添加 not 关键字，比如 `where ('not user.checked')`。
- 如果输入对象有布尔型的属性，在原样输出该属性时，值会保持 JavaScript 的 true 和 false，而不会被转换为 1 和 0。

#### 算术运算

| 算术表达式 | 说明 |
| --- | --- |
| x + y | 加 |
| x - y | 减 |
| x * y | 乘 |
| x / y | 除 |
| x % y | 余 |
| x ^ y | 乘方 |

#### 比较运算

| 比较表达式 | 说明 |
| --- | --- |
| x == y | 等于，注意是**两个**等于号，不是一个或者三个等于号 |
| x < y | 小于 |
| x <= y | 小于等于 |
| x > y | 大于 |
| x >= y | 大于等于 |
| x ~= regex | 匹配正则表达式，比如 `x ~= [bpc]at` 表示当 x 的值为 'bat','pat' 或者 'cap' 时，比较表达式的值为 1 |
| x in (a, b, c) | 判断 x 是否等于数组里的任一值，即相当于 (x == a or x == b or x == c)，这里的数组也可以是“值为数组的”属性 |
| x not in (a, b, c) | 判断 x 是否**不等于**数组里的任一值，即相当于 (x != a and x != b and x != c) ，这里的数组也可以是“值为数组的”属性 |
| (a, b, c) has y | 判断数组里是否包含有 y 值，这里的数组也可以是“值为数组的”属性 |
| (a, b, c) not has y | 判断数组里是否**不包含**有 y 值，这里的数组也可以是“值为数组的”属性 |

#### 逻辑运算

| 逻辑表达式 | 说明 |
| --- | --- |
| x or y | 逻辑或 or |
| x and y | 逻辑与 and |
| not x | 逻辑非 not |
| x ? y : z | 三元运算符，如果 x 的值为逻辑上的 true，则返回值 y，否则返回值 z |
| ( x ) | 使用括号可以改变表达式运算的顺序（优先级） |

#### 函数

| 函数名称 | 说明 |
| --- | --- |
| abs(x) | 求绝对值 |
| ln(x) | 求自然对数，即以数学常数 e 为底数的对数函数 |
| log10(x) | 以 10 为底数的对数函数 |
| exp(x) | 求 e 的 x 次方 |
| max(a, b, c...) | 求多个参数数值的最大值 |
| min(a, b, c...) | 求多个参数数值的最小值 |
| maxof(a) | 求数组的最大值，跟 max 函数不同，maxof 函数只接受一个参数，且参数必须是数组类型 |
| minof(a) | 求数组的最小值，跟 min 函数不同，minof 函数只接受一个参数，且参数必须是数组类型 |
| round(x) | 求整数，四舍五入 |
| sqrt(x) | 求开方 |

**注意**

调用函数时必须带上括号，且这里的括号并不表示数组。比如 `max(1,2,3,4)` 这里表示一共有 4 个参数，并且都传入函数 max 里，而不是表示一个有 4 个元素的数组。相对的，maxof 函数接受一个数组类型的参数，如果想求 (1,2,3,4) 这 4 个数的最大值，则可以这样调用 `maxof((1,2,3,4))`，其中外围一对括号表示函数的参数，里面一对括号表示数组。

### orderBy 方法

排序表达式请见 [JSObjectUtils](https://github.com/hemashushu/jsobjectutils) 包的 [ObjectSorter](https://github.com/hemashushu/jsobjectutils/blob/main/src/objectsorter.js) 对象的说明

### select 方法

对象重组方法请见 [JSObjectUtils](https://github.com/hemashushu/jsobjectutils) 包的 [ObjectComposer](https://github.com/hemashushu/jsobjectutils/blob/main/src/objectcomposer.js) 对象的说明