const assert = require('assert/strict');

const {ObjectQuery} = require('../index');
const {ObjectUtils} = require('jsobjectutils');

describe('ObjectQuery Test', () => {
    it('Test where()', () => {
        // 基本数值计算
        let ra1 = new ObjectQuery().where('1 + 2 * 3').collect();
        assert.equal(ra1, 7);

        let ra2 = new ObjectQuery().where('2 ^ 3 % 3').collect();
        assert.equal(ra2, 2);

        // 基本数学函数
        let rb1 = new ObjectQuery().where('round(4.5)').collect();
        assert.equal(rb1, 5);

        let rb2 = new ObjectQuery().where('log10(100)').collect();
        assert.equal(rb2, 2);

        // 基本比较
        let rc1 = new ObjectQuery().where('0 > 1').collect();
        assert.equal(rc1, 0);

        let rc2 = new ObjectQuery().where('2>=1').collect();
        assert.equal(rc2, 1);

        // 基本逻辑
        let rd1 = new ObjectQuery().where('0 and 1').collect();
        assert.equal(rd1, 0);

        let rd2 = new ObjectQuery().where('1 and 1').collect();
        assert.equal(rd2, 1);

        let rd3 = new ObjectQuery().where('1 ? 2 : 3').collect();
        assert.equal(rd3, 2);

        // 集合
        let re1 = new ObjectQuery().where('3 in (2,3,4)').collect();
        assert.equal(re1, 1);

        let re2 = new ObjectQuery().where('3 not in (2,3,4)').collect();
        assert.equal(re2, 0);

        let re3 = new ObjectQuery().where('not (3 in (2,3,4))').collect();
        assert.equal(re3, 0);

        let re4 = new ObjectQuery().where('(2,3,4) has 4').collect();
        assert.equal(re4, 1);

        let re5 = new ObjectQuery().where('max(2,3,4)').collect();
        assert.equal(re5, 4);

        let re6 = new ObjectQuery().where('min(2,3,4)').collect();
        assert.equal(re6, 2);

        // 属性值为集合
        let rf1 = ObjectQuery.from({numbers:[2,3,4]}).where('count(numbers)').collect();
        assert.equal(rf1, 3);

        let rf2 = ObjectQuery.from({numbers:[2,3,4]}).where('maxof(numbers)').collect();
        assert.equal(rf2, 4);

        let rf3 = ObjectQuery.from({numbers:[2,3,4]}).where('minof(numbers)').collect();
        assert.equal(rf3, 2);

        // 对象
        let o1 = {
            number: 123,
            user:{
                name: 'foo',
                addr: {
                    city: 'sz'
                }
            }
        };

        let rg1 = ObjectQuery.from(o1).where('number').collect();
        assert.equal(rg1, 123);

        let rg2 = ObjectQuery.from(o1).where('user.name').collect();
        assert.equal(rg2, 'foo');

        let rg3 = ObjectQuery.from(o1).where('user.addr.city').collect();
        assert.equal(rg3, 'sz');
    });

    it('Test select()', ()=>{
        let u1 = {
            id: 123,
            name: 'foo',
            addr: {
                city: 'sz',
                postcode: '518000'
            }
        };

        let r1 = ObjectQuery.from(u1).select('id, name').collect();
        assert(ObjectUtils.equals(r1, {id: 123, name: 'foo'}));

        let r2 = ObjectQuery.from(u1).select('id, checked').collect();
        assert(ObjectUtils.equals(r2, {
            id: 123
        }));
    });

    let createItemObjects = ()=>{
        let itemObjects = [
            {id:5, type: 'foo', checked:false, sub: {name: 'e'} },
            {id:2, type: 'foo', checked:true, sub: {name: 'd'} },
            {id:1, type: 'foo', checked:false, sub: {name: 'f'} },
            {id:6, type: 'bar', checked:true, sub: {name: 'c'} },
            {id:9, type: 'bar', checked:false, sub: {name: 'a'} },
            {id:3, type: 'bar', checked:true, sub: {name: 'b'} }
        ];
        return itemObjects;
    };

    let isMatchObjectIds = (itemObjects, ids) => {
        let actualIds = itemObjects.map(item=>{
            return item.id;
        });

        for (let idx = 0; idx < ids.length; idx++) {
            if (ids[idx] !== actualIds[idx]) {
                return false;
            }
        }
        return true;
    }

    it('Test orderBy()', ()=>{
        let itemObjects = createItemObjects();
        ObjectQuery.from(itemObjects).orderBy('type').collect();
        assert(isMatchObjectIds(itemObjects, [ 6, 9, 3, 5, 2, 1 ]));

        ObjectQuery.from(itemObjects).orderBy('id DESC').collect();
        assert(isMatchObjectIds(itemObjects, [ 9, 6, 5, 3, 2, 1 ]));

        ObjectQuery.from(itemObjects).orderBy('type, id').collect();
        assert(isMatchObjectIds(itemObjects, [3, 6, 9, 1, 2, 5]));

        ObjectQuery.from(itemObjects).orderBy('sub.name').collect();
        assert(isMatchObjectIds(itemObjects, [ 9, 3, 6, 2, 5, 1 ]));

        ObjectQuery.from(itemObjects).orderBy('checked, sub.name').collect();
        assert(isMatchObjectIds(itemObjects, [ 9, 5, 1, 3, 6, 2 ]));

        ObjectQuery.from(itemObjects).orderBy('checked, sub.name DESC').collect();
        assert(isMatchObjectIds(itemObjects, [1, 5, 9, 2, 6, 3]));

    });

    it('Test where,orderBy,select', ()=>{
        let itemObjects = createItemObjects();
        let r1 = ObjectQuery.from(itemObjects)
            .where('id >= 3 and checked')
            .select('id, type')
            .orderBy('id')
            .collect();

        assert(ObjectUtils.arrayEquals(r1,[
            { id: 3, type: 'bar' },
            { id: 6, type: 'bar' }
        ]));
    });

});
