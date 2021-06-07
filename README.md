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

条件查询表达式请见 [JSObjectEvaluator](https://github.com/hemashushu/jsobjectevaluator) 包。

### orderBy 方法

排序表达式请见 [JSObjectUtils](https://github.com/hemashushu/jsobjectutils) 包的 [ObjectSorter](https://github.com/hemashushu/jsobjectutils/blob/main/src/objectsorter.js) 对象的说明

### select 方法

对象重组表达式请见 [JSObjectUtils](https://github.com/hemashushu/jsobjectutils) 包的 [ObjectComposer](https://github.com/hemashushu/jsobjectutils/blob/main/src/objectcomposer.js) 对象的说明