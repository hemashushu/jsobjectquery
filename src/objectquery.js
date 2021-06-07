const filtrex = require('../libs/filtrex-mod');
const { compileExpression } = filtrex;

const { ObjectUtils, ObjectComposer, ObjectSorter } = require('jsobjectutils');
const { UnsupportedOperationException } = require('jsexception');

/**
 * 对象查询器，用于查询/筛选/重组/排序一组数据对象。
 *
 */
class ObjectQuery {

    constructor(sourceObject = {}) {
        this.sourceObject = sourceObject;
    }

    /**
     * 设置原始对象，作用同 'new ObjectQuery(sourceObject)'
     *
     * @param {*} sourceObject
     * @returns
     */
    static from(sourceObject = {}) {
        return new ObjectQuery(sourceObject);
    }

    /**
     * 执行查询表达式
     *
     * 查询表达式执行之后的结果有可能是：
     * - 一个基本类型的数据
     * - 一个数据对象
     * - 一个数据对象数组
     *
     * @param {*} conditionExpression 字符串，查询表达式，比如：
     *     - 1+2+3 // 返回 1 + 2 + 3
     *     - "hello" // 返回 "hello"
     *     - city // 返回对象的 city 属性值
     *     - city == "shenzhen" // 返回比较结果
     *     - score in (60, 100)
     *     - addr.posecode == "518000" and checked == true
     * @returns
     */
    where(conditionExpression) {
        let evaluate = compileExpression(conditionExpression);
        let value;

        if (Array.isArray(this.sourceObject)) {
            value = this.sourceObject.filter(item=>{
                // filtrex 的条件比较结果只有 1 和 0 两种结果，分别表示 true 和 false
                let result = evaluate(item);
                return (result === true ||
                    (typeof result === 'number' && result !== 0) ||
                    (typeof result === 'string' && result !== ''));
            });

        }else {
            value = evaluate(this.sourceObject);
        }

        return new ObjectQuery(value);
    }

    /**
     * 重构对象
     *
     * 示例，设有原始对象:
     * {
     *   id: 123,
     *   name: 'foo',
     *   checked: true
     *   city: 'sz'
     * }
     *
     * .select('id, name')
     *
     * 将获得新对象：
     * {
     *   id: 123,
     *   name: 'foo'
     * }
     *
     * - 只有当原始值是数据对象、或者数据对象数组时才支持该方法，否则会抛出异常
     * - 只能浅复制数据对象的第一层属性，即不支持诸如 "addr.city" 的子对象属性名称。
     *
     * @param {*} nameSequence 对象的属性名称序列
     * @returns
     */
    select(nameSequence) {
        if (Array.isArray(this.sourceObject)){
            if (this.sourceObject.length === 0) {
                return this;
            }

            let names = ObjectComposer.splitProperityNameSequence(nameSequence);
            let value = this.sourceObject.map((item) => {
                return ObjectComposer.compose(item, names);
            });

            return new ObjectQuery(value);

        }else if (ObjectUtils.isObject(this.sourceObject)) {
            let value = ObjectComposer.composeByProperityNameSequence(this.sourceObject, nameSequence);
            return new ObjectQuery(value);
        }

        throw new UnsupportedOperationException('Source data should be a data object or an array of data object.');
    }

    /**
     * 排序数据对象数组
     *
     * @param {*} orderExpression 排序表达式，一个使用逗号将待排序的
     *     属性名称拼接而成的字符串。
     * @returns
     */
    orderBy(orderExpression) {
        if (!Array.isArray(this.sourceObject)) {
            throw new UnsupportedOperationException('Source data should be a data object array');
        }

        if (this.sourceObject.length === 0) {
            return this;
        }

        ObjectSorter.sortByOrderExpression(this.sourceObject, orderExpression);
        return this;
    }

    /**
     * 返回结果，结果的数据类型有可能是：
     * - 基本数据类型的数值
     *   比如单单执行条件表达式：from().where('1+2+3').collect();
     * - 单独一个数据对象
     *   比如单单执行重构操作：from({...}).select('id, name,...').collect();
     * - 一个数据对象数组
     *
     */
    collect() {
        return this.sourceObject;
    }

}

module.exports = ObjectQuery;