import 'dotenv/config';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const questionBanks = [
    {
        id: 'js', name: 'JavaScript高级', icon: 'fab fa-js-square', color: '#F7DF1E',
        type: 'skill', typeName: '技能类', desc: '涵盖ES6+、异步编程、原型链等核心知识点',
        total: 10, difficulty: '中等',
        questions: [
            { q: '以下哪个方法不会改变原数组？', opts: ['push()', 'map()', 'splice()', 'sort()'], ans: 1, exp: 'map()方法会返回一个新数组，不会修改原数组。push()、splice()和sort()都会直接修改原数组。' },
            { q: 'Promise.all()在什么情况下会reject？', opts: ['所有Promise都reject时', '任一Promise reject时', '第一个Promise reject时', '最后一个Promise reject时'], ans: 1, exp: 'Promise.all()接收一组Promise，当任一Promise被reject时，整个Promise.all()就会立即reject。' },
            { q: '关于async/await，以下说法正确的是？', opts: ['await只能在全局作用域使用', 'async函数总是返回Promise', 'await会阻塞整个程序', 'async函数中不能使用try/catch'], ans: 1, exp: 'async函数总是返回一个Promise对象，即使函数内部return的不是Promise。await只能在async函数内使用，不会阻塞整个程序，只会暂停当前async函数的执行。' },
            { q: 'JavaScript中以下哪个不是基本数据类型？', opts: ['Symbol', 'BigInt', 'Array', 'undefined'], ans: 2, exp: 'Array是引用类型（对象），而Symbol、BigInt和undefined都是ES中的基本数据类型。' },
            { q: '关于事件循环，以下执行顺序正确的是？', opts: ['setTimeout > Promise > 同步代码', '同步代码 > Promise > setTimeout', 'Promise > 同步代码 > setTimeout', '同步代码 > setTimeout > Promise'], ans: 1, exp: '事件循环中，同步代码最先执行，然后是微任务（Promise），最后是宏任务（setTimeout）。' },
            { q: 'Object.freeze()和Object.seal()的区别是？', opts: ['没有区别', 'freeze不能修改属性值，seal可以', 'seal不能修改属性值，freeze可以', '两者都能修改属性值'], ans: 1, exp: 'Object.freeze()冻结对象，不能添加、删除、修改属性。Object.seal()密封对象，不能添加、删除属性，但可以修改已有属性的值。' },
            { q: '以下关于WeakMap的说法正确的是？', opts: ['键可以是任意类型', '可以被遍历', '键是弱引用，可被垃圾回收', '与Map完全相同'], ans: 2, exp: 'WeakMap的键必须是对象，且是弱引用。当键对象没有其他引用时，可被垃圾回收。WeakMap不可被遍历。' },
            { q: 'CSS中position:sticky的特性是？', opts: ['始终固定在视口', '相对定位但滚动到阈值时变为固定定位', '绝对定位的别名', '只在flex布局中生效'], ans: 1, exp: 'sticky定位是relative和fixed的混合体，元素在到达指定阈值前为relative，到达后变为fixed。' },
            { q: '关于箭头函数，以下哪项是正确的？', opts: ['有自己的this绑定', '可以作为构造函数', '没有arguments对象', '可以使用new调用'], ans: 2, exp: '箭头函数没有自己的this、arguments、super和new.target绑定，不能作为构造函数使用new调用。' },
            { q: '以下哪个不是Vue3的响应式API？', opts: ['ref()', 'reactive()', 'computed()', 'observe()'], ans: 3, exp: 'observe()不是Vue3的响应式API。Vue3使用ref()、reactive()、computed()等组合式API，observe是Vue2内部的方法。' },
            { q: 'JSON.parse(JSON.stringify(obj)) 与 Object.assign({}, obj) 的关键区别是？', opts: ['前者实现深拷贝（有限制），后者是浅拷贝', '两者完全等价', '后者才是深拷贝', '前者会改变原对象'], ans: 0, exp: 'JSON 序列化反序列化会递归复制嵌套结构，属于深拷贝（但无法处理函数、undefined、循环引用）；Object.assign 只复制第一层引用，是浅拷贝。' },
            { q: '0.1 + 0.2 === 0.3 的结果是？', opts: ['true', 'false', '取决于浏览器版本', '抛出异常'], ans: 1, exp: 'JavaScript 使用 IEEE 754 双精度浮点数，0.1 和 0.2 无法精确表示，相加结果为 0.30000000000000004，与 0.3 不严格相等。' },
            { q: 'console.log(typeof null) 的输出是？', opts: ['\'null\'', '\'object\'', '\'undefined\'', '抛出 TypeError'], ans: 1, exp: 'typeof null 返回 \'object\'，这是 JavaScript 早期实现的历史遗留缺陷，为了兼容性一直保留。' },
            { q: '以下关于闭包的说法正确的是？', opts: ['闭包必然导致内存泄漏，应避免使用', '闭包是函数与其词法作用域的组合，使内部函数可访问外部函数的变量', '只有显式 return 函数才会产生闭包', 'ES6 引入块级作用域后闭包被废弃'], ans: 1, exp: '闭包是函数和其词法环境的组合，常用于封装私有状态。只有被闭包引用的对象无法回收才可能造成内存问题，合理使用并无害处。' },
            { q: '[1, 2, 3].reduce((a, b) => a + b, 0) 的结果是？', opts: ['6', '123', '0', 'undefined'], ans: 0, exp: 'reduce 从初始值 0 开始累加：0+1+2+3=6。' },
            { q: '以下哪一项属于微任务（microtask）而非宏任务？', opts: ['setTimeout', 'setImmediate（Node）', 'Promise.then', 'I/O 回调'], ans: 2, exp: 'Promise.then/catch/finally、queueMicrotask 属于微任务，在每个宏任务结束后立即清空；setTimeout、I/O 等属于宏任务。' },
            { type: 'judge', q: 'let 声明的变量存在暂时性死区（TDZ），在声明语句之前访问会抛出 ReferenceError。', opts: ['正确', '错误'], ans: 0, exp: 'let/const 声明的变量从块级作用域开始到声明语句之间是暂时性死区，访问会抛 ReferenceError，而 var 会返回 undefined（变量提升）。' },
            { q: 'Array.prototype.slice.call(\'abc\') 的结果是？', opts: ['[\'abc\']', '[\'a\', \'b\', \'c\']', '\'abc\'', '抛出 TypeError'], ans: 1, exp: '字符串是类数组对象（有 length 和按索引访问），借用数组的 slice 方法可以将其转换为真正的数组 [\'a\',\'b\',\'c\']。' },
            { q: 'Object.getPrototypeOf([]) === Array.prototype 的结果是？', opts: ['true', 'false', '取决于运行环境', 'undefined'], ans: 0, exp: '数组字面量的原型就是 Array.prototype，实例通过原型链继承数组的原型方法。' },
            { q: '在 addEventListener 注册的回调中，return false 会阻止事件冒泡吗？', opts: ['会阻止，效果等同 stopPropagation()', '不会阻止，DOM 原生事件回调的返回值被忽略', '只阻止默认行为', '只在捕获阶段生效'], ans: 1, exp: 'addEventListener 的回调返回值会被忽略；return false 只在 onclick 内联处理和 jQuery 事件中有阻止冒泡/默认行为的效果。阻止冒泡应调用 event.stopPropagation()。' },
            { type: 'multi', q: '以下哪些是 ES6（ES2015）新增的语法特性？', opts: ['模板字符串', '箭头函数', 'var 变量提升', '解构赋值'], ans: [0, 1, 3], exp: 'var 是 ES5 就有的语法且存在变量提升；模板字符串、箭头函数、解构赋值都是 ES6 新增。' },
            { type: 'multi', q: '关于 Promise，下列说法正确的有？', opts: ['new Promise 传入的 executor 是同步执行的', 'then 会返回新的 Promise，支持链式调用', 'Promise.all 中任一 Promise 被 reject，整体立即 reject', 'Promise.race 要等所有 Promise 完成才返回'], ans: [0, 1, 2], exp: 'executor 在构造时同步执行；then 返回新 Promise 是链式调用的基础；all 遇到第一个失败即整体失败；race 是最先完成（无论成败）的那个决定结果。' },
            { type: 'judge', q: 'JavaScript中的null == undefined 的结果为 true。', opts: ['正确', '错误'], ans: 0, exp: 'null == undefined 为 true（宽松相等会互相转换），但 null === undefined 为 false。' },
            { type: 'multi', q: '以下哪些方法会返回一个新数组而不改变原数组？', opts: ['map()', 'filter()', 'splice()', 'concat()'], ans: [0, 1, 3], exp: 'map()、filter()、concat() 都返回新数组；splice() 会直接修改原数组。' }
        ]
    },
    {
        id: 'python', name: 'Python基础', icon: 'fab fa-python', color: '#3776AB',
        type: 'skill', typeName: '技能类', desc: 'Python语法基础、数据结构、面向对象等',
        total: 10, difficulty: '简单',
        questions: [
            { q: 'Python中以下哪种数据结构是不可变的？', opts: ['list', 'dict', 'set', 'tuple'], ans: 3, exp: 'tuple（元组）是Python中不可变的数据结构，一旦创建就不能修改其元素。' },
            { q: 'Python中==和is的区别是？', opts: ['完全相同', '==比较值，is比较身份', 'is比较值，==比较身份', '==用于数字，is用于字符串'], ans: 1, exp: '==运算符比较两个对象的值是否相等，is运算符比较两个对象的身份（内存地址）是否相同。' },
            { q: '关于Python列表推导式，以下写法正确的是？', opts: ['[x for x in range(10) if x%2==0]', '{x for x in range(10)}', '(x for x in range(10))', '以上都正确'], ans: 3, exp: '三种写法都正确：[]列表推导式、{}集合推导式、()生成器表达式。但题目问列表推导式，最典型的是第一种。实际上三种语法都是正确的Python语法。' },
            { q: 'Python中装饰器@staticmethod的作用是？', opts: ['定义类方法', '定义静态方法，不需要实例', '定义抽象方法', '定义属性'], ans: 1, exp: '@staticmethod定义的方法不需要实例或类作为第一个参数，可以通过类名直接调用。' },
            { q: '以下哪个不是Python的内置函数？', opts: ['map()', 'filter()', 'reduce()', 'len()'], ans: 2, exp: 'reduce()在Python3中不再是内置函数，需要从functools模块中导入。map()、filter()和len()都是内置函数。' },
            { q: 'Python中GIL的全称是？', opts: ['Global Interpreter Lock', 'General Input Loop', 'Graphical Interface Layer', 'Generic Index Library'], ans: 0, exp: 'GIL全称Global Interpreter Lock（全局解释器锁），是CPython中的一把互斥锁，确保同一时刻只有一个线程执行Python字节码。' },
            { q: '关于with语句，以下说法正确的是？', opts: ['只能用于文件操作', '自动调用__enter__和__exit__方法', '不需要导入任何模块', '等价于try-except-finally'], ans: 1, exp: 'with语句会自动调用上下文管理器的__enter__和__exit__方法，确保资源被正确释放。不仅限于文件操作，任何实现了上下文管理协议的对象都可以使用。' },
            { q: 'Python中*args和**kwargs的区别是？', opts: ['没有区别', '*args接收位置参数，**kwargs接收关键字参数', '*args接收关键字参数，**kwargs接收位置参数', '两者都只能接收字典'], ans: 1, exp: '*args将多余的位置参数收集为元组，**kwargs将多余的关键字参数收集为字典。' },
            { q: '以下关于Python生成器的说法正确的是？', opts: ['生成器可以重复迭代', 'yield关键字用于定义生成器', '生成器占用更多内存', '生成器不能使用for循环'], ans: 1, exp: '使用yield关键字的函数成为生成器函数，调用时返回生成器对象。生成器是惰性求值的，不会一次性生成所有值，因此更节省内存。' },
            { q: 'Python中深拷贝和浅拷贝的区别是？', opts: ['没有区别', '深拷贝复制所有层级，浅拷贝只复制顶层', '浅拷贝复制所有层级，深拷贝只复制顶层', '两者都只复制顶层'], ans: 1, exp: '浅拷贝只复制对象的顶层引用，内部嵌套对象仍指向原对象。深拷贝递归复制所有层级的对象，创建完全独立的副本。' },
            { q: 'print(type(10 / 2)) 的输出是？', opts: ['<class \'int\'>', '<class \'float\'>', '<class \'decimal.Decimal\'>', '报错'], ans: 1, exp: 'Python 的 / 是真除法，无论操作数是否整除都返回 float；整除要用 // 运算符。' },
            { q: '以下哪个是不可变对象？', opts: ['list', 'dict', 'set', 'frozenset'], ans: 3, exp: 'frozenset 是集合的不可变版本，创建后不能增删元素；list/dict/set 都是可变对象。' },
            { q: 'print(len({1, 1, 2, 3})) 的输出是？', opts: ['4', '3', '2', '1'], ans: 1, exp: '集合自动去重，{1, 1, 2, 3} 实际是 {1, 2, 3}，长度为 3。' },
            { q: '关于 GIL（全局解释器锁），下列说法正确的是？', opts: ['GIL 使多线程完全无法并发', 'GIL 下多线程仍适合 I/O 密集型任务', '多进程同样受 GIL 限制', '所有 Python 解释器都有 GIL'], ans: 1, exp: 'CPython 的 GIL 保证同一时刻只有一个线程执行字节码，但线程在 I/O 等待时会释放锁，所以多线程适合 I/O 密集任务；CPU 密集任务应使用 multiprocessing（多进程不受 GIL 限制，且 PyPy/Jython 等实现没有 GIL）。' },
            { q: 'list(map(lambda x: x * 2, [1, 2, 3])) 的结果是？', opts: ['[2, 4, 6]', '[1, 2, 3]', '[1, 4, 9]', '报错'], ans: 0, exp: 'map 将 lambda 逐元素应用后返回迭代器，list() 转换后得到 [2, 4, 6]。' },
            { q: 'print(bool([]), bool([0])) 的输出是？', opts: ['False True', 'False False', 'True True', 'False None'], ans: 0, exp: '空列表是假值（bool 为 False），但 [0] 是非空列表，其真值只取决于元素个数，与内容无关，为 True。' },
            { type: 'judge', q: 'Python 的默认参数值在函数定义时求值一次，使用可变默认值（如 list）可能导致多次调用之间共享同一个对象。', opts: ['正确', '错误'], ans: 0, exp: '这是 Python 的经典陷阱：def f(x, acc=[]) 中的 acc 在所有调用间共享，应改用 acc=None 然后在函数体内 acc = acc or []。' },
            { q: '以下哪种方式不能创建字典？', opts: ['dict(a=1)', '{\'a\': 1}', 'dict([(\'a\', 1)])', '{a, 1}'], ans: 3, exp: '{a, 1} 是集合字面量（若 a 已定义）；其余三种都能创建字典：关键字参数、字面量、键值对序列。' },
            { q: 's = \'abc\'，则 s[::-1] 的值是？', opts: ['\'abc\'', '\'cba\'', '\'bca\'', '报错'], ans: 1, exp: '切片 [::-1] 表示步长为 -1 的全序列遍历，效果是反转字符串。' },
            { type: 'multi', q: '以下哪些属于 Python 标准库（无需 pip 安装）？', opts: ['os', 'numpy', 'json', 'datetime'], ans: [0, 2, 3], exp: 'os、json、datetime 都是标准库；numpy 是著名的第三方科学计算库，需要单独安装。' }
        ]
    },
    {
        id: 'cpc', name: '党史知识竞赛', icon: 'fas fa-flag', color: '#DC2626',
        type: 'exam', typeName: '考试类', desc: '党的历史、重要会议、路线方针等',
        total: 5, difficulty: '简单',
        questions: [
            { q: '中国共产党第一次全国代表大会召开的地点是？', opts: ['北京', '上海', '广州', '武汉'], ans: 1, exp: '中共一大于1921年7月23日在上海法租界望志路106号开幕，后转移至浙江嘉兴南湖的游船上举行。' },
            { q: '改革开放的标志性事件是？', opts: ['中共十一届三中全会', '中共十二大', '中共十三大', '中共十四大'], ans: 0, exp: '1978年12月召开的十一届三中全会，作出了把党和国家工作中心转移到经济建设上来、实行改革开放的历史性决策。' },
            { q: '遵义会议的最主要历史功绩是？', opts: ['结束了王明"左"倾错误', '确立了毛泽东的领导地位', '制定了抗日方针', '实现了国共合作'], ans: 1, exp: '遵义会议确立了毛泽东在党和红军中的领导地位，是党的历史上一个生死攸关的转折点。' },
            { q: '"两个一百年"奋斗目标中，第一个百年目标是？', opts: ['全面建成小康社会', '基本实现现代化', '建成社会主义现代化强国', '实现共同富裕'], ans: 0, exp: '第一个百年目标是在中国共产党成立一百年时全面建成小康社会，这一目标已如期实现。' },
            { q: '中华人民共和国成立的日期是？', opts: ['1949年9月21日', '1949年10月1日', '1950年1月1日', '1949年8月15日'], ans: 1, exp: '1949年10月1日，中华人民共和国中央人民政府成立典礼在北京天安门广场隆重举行。' },
            { q: '中国共产党人的初心和使命是？', opts: ['为中国人民谋幸福，为中华民族谋复兴', '实现共产主义远大理想', '全面建成小康社会', '建设社会主义现代化强国'], ans: 0, exp: '十九大报告明确指出：中国共产党人的初心和使命，就是为中国人民谋幸福，为中华民族谋复兴。' },
            { q: '中国共产党的最高理想和最终目标是？', opts: ['实现共产主义', '实现民族复兴', '人民共同富裕', '国家繁荣富强'], ans: 0, exp: '党章规定：党的最高理想和最终目标是实现共产主义。' },
            { q: '五四运动发生在哪一年？', opts: ['1919年', '1921年', '1911年', '1925年'], ans: 0, exp: '1919年5月4日爆发的五四运动是一场彻底反帝反封建的爱国运动，促进了马克思主义在中国的传播，为中国共产党成立作了思想干部上的准备。' },
            { q: '南昌起义的历史意义是？', opts: ['打响了武装反抗国民党反动派的第一枪', '标志着国共合作正式形成', '建立了第一个农村革命根据地', '确立了土地革命总方针'], ans: 0, exp: '1927年8月1日的南昌起义打响了武装反抗国民党反动派的第一枪，标志着中国共产党独立领导革命战争和创建人民军队的开始。8月1日由此成为建军节。' },
            { q: '「枪杆子里面出政权」这一著名论断是在哪次会议上提出的？', opts: ['八七会议', '遵义会议', '古田会议', '瓦窑堡会议'], ans: 0, exp: '1927年8月7日的八七会议上，毛泽东提出「枪杆子里面出政权」的著名论断，确定了土地革命和武装反抗国民党反动派的总方针。' },
            { q: '统一战线、武装斗争、党的建设「三大法宝」出自毛泽东的哪篇著作？', opts: ['《〈共产党人〉发刊词》', '《实践论》', '《矛盾论》', '《论持久战》'], ans: 0, exp: '1939年毛泽东在《〈共产党人〉发刊词》中总结了中国革命的三大法宝：统一战线、武装斗争、党的建设。' },
            { q: '新中国第一部宪法颁布于哪一年？', opts: ['1954年', '1949年', '1956年', '1978年'], ans: 0, exp: '1954年9月第一届全国人民代表大会第一次会议通过了《中华人民共和国宪法》，这是新中国第一部宪法。' },
            { q: '中国特色社会主义进入新时代，我国社会主要矛盾已经转化为？', opts: ['人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾', '人民日益增长的物质文化需要同落后的社会生产之间的矛盾', '经济发展与生态保护之间的矛盾', '效率与公平之间的矛盾'], ans: 0, exp: '党的十九大报告指出，我国社会主要矛盾已经转化为人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾。' },
            { q: '抗日战争从战略防御阶段转入相持阶段的标志是？', opts: ['广州、武汉失守', '七七事变爆发', '台儿庄大捷', '百团大战'], ans: 0, exp: '1938年10月广州、武汉失守后，抗日战争进入战略相持阶段。' },
            { q: '毛泽东在七届二中全会上提出的「两个务必」是指？', opts: ['务必使同志们继续地保持谦虚、谨慎、不骄、不躁的作风，务必使同志们继续地保持艰苦奋斗的作风', '务必坚持真理，务必修正错误', '务必独立自主，务必自力更生', '务必百花齐放，务必百家争鸣'], ans: 0, exp: '1949年3月七届二中全会上，毛泽东告诫全党「两个务必」，西柏坡精神的核心内容之一。' }
        ]
    },
    {
        id: 'driving', name: '科目一考试', icon: 'fas fa-car', color: '#2563EB',
        type: 'license', typeName: '资格类', desc: '机动车驾驶证科目一理论考试',
        total: 5, difficulty: '简单',
        questions: [
            { q: '机动车驾驶人在一个记分周期内累积记分达到12分的，应当在十五日内到机动车驾驶证核发地或者违法行为地公安机关交通管理部门接受？', opts: ['科目一考试', '为期七天的道路交通安全法律法规和相关知识教育', '科目三考试', '吊销驾驶证'], ans: 1, exp: '根据《机动车驾驶证申领和使用规定》，累积记分达到12分的，需在15日内参加为期7天的道路交通安全法律法规和相关知识教育。' },
            { q: '这个标志是何含义？（红色圆圈内数字50）', opts: ['最低限速50公里/小时', '最高限速50公里/小时', '建议速度50公里/小时', '平均速度50公里/小时'], ans: 1, exp: '红色圆圈内的数字表示最高限速，蓝底白字圆圈内的数字表示最低限速。' },
            { q: '在高速公路上驾驶机动车，车辆发生故障后的处置方法，以下做法正确的是？', opts: ['在本车道停车等待', '把车停到应急车道，打开危险报警闪光灯并在车后150米外放置警告标志', '在来车方向30米处放置警告标志', '坐在车内等待救援'], ans: 1, exp: '高速公路上车辆故障，应将车停到应急车道，打开危险报警闪光灯，在车后150米外放置警告标志，车上人员转移到安全地带。' },
            { q: '饮酒后驾驶机动车一次记几分？', opts: ['2分', '3分', '6分', '12分'], ans: 3, exp: '饮酒后驾驶机动车的，一次记12分，并处暂扣驾驶证6个月，处1000元以上2000元以下罚款。' },
            { q: '遇到前方车辆缓慢排队等候时，以下做法正确的是？', opts: ['从前方车辆两侧穿插', '占用对向车道', '依次排队等候', '从右侧路肩绕行'], ans: 2, exp: '遇前方排队等候时，应依次排队，不得穿插、占道或绕行，这是文明驾驶的基本要求。' },
            { q: '驾驶机动车在道路上违反道路交通安全法的行为属于？', opts: ['违法行为', '违章行为', '过失行为', '纪律行为'], ans: 0, exp: '道路交通安全法是国家法律，违反即属违法行为，而非一般违章或纪律问题。' },
            { q: '造成交通事故后逃逸尚不构成犯罪的，一次记多少分？', opts: ['12分', '9分', '6分', '3分'], ans: 0, exp: '按照现行记分规则，造成交通事故后逃逸尚不构成犯罪的，一次记12分。' },
            { q: '机动车驾驶人初次申领驾驶证后的实习期是多久？', opts: ['12个月', '6个月', '24个月', '3个月'], ans: 0, exp: '初次申领驾驶证后的12个月为实习期，实习期内上高速需由持相应或更高准驾车型驾驶证3年以上的驾驶人陪同。' },
            { q: '在没有限速标志、标线的城市道路上（无中心线），最高时速不得超过？', opts: ['30公里/小时', '40公里/小时', '50公里/小时', '70公里/小时'], ans: 0, exp: '没有道路中心线的城市道路最高时速30公里；同方向只有一条机动车道的城市道路为50公里。' },
            { q: '驾驶机动车通过没有交通信号灯控制的路口，应当？', opts: ['减速慢行，让行人和优先通行的车辆先行', '加速抢行通过', '鸣笛示意后直接通过', '保持原速通过'], ans: 0, exp: '通过无信号灯路口应减速观察、文明礼让，行人和优先通行车辆享有先行权。' },
            { q: '车辆驾驶员血液中酒精含量达到多少为醉酒驾驶？', opts: ['80mg/100ml 以上', '20mg/100ml 以上', '50mg/100ml 以上', '100mg/100ml 以上'], ans: 0, exp: '血液酒精含量≥80mg/100ml 属醉酒驾驶（构成危险驾驶罪）；20~80mg/100ml 属饮酒驾驶。' },
            { q: '高速公路同方向有两条车道时，左侧车道的最低时速为？', opts: ['100公里/小时', '110公里/小时', '90公里/小时', '60公里/小时'], ans: 0, exp: '高速公路最低时速60公里；同方向两条车道时，左侧车道最低100公里、右侧最低60公里。' },
            { q: '驾驶机动车下长坡时，正确的做法是？', opts: ['利用发动机制动控制车速', '持续踩下制动踏板减速', '挂空挡滑行省油', '关闭发动机滑行'], ans: 0, exp: '下长坡持续用行车制动易导致刹车过热失灵，应挂低挡利用发动机制动辅助控速。' },
            { q: '机动车在高速公路上发生故障时，警告标志应设置在故障车来车方向多少米以外？', opts: ['150米', '50米', '100米', '200米'], ans: 0, exp: '普通道路来车方向50~100米，高速公路应在150米以外设置警告标志，同时人员转移到护栏外安全地带并报警。' },
            { q: '小型自动挡汽车驾驶证的准驾车型代号是？', opts: ['C2', 'C1', 'C3', 'A2'], ans: 0, exp: 'C1 为小型汽车（手动挡+自动挡），C2 为小型自动挡汽车，C3 为低速载货汽车，A2 为牵引车。' }
        ]
    },
    {
        id: 'english', name: '大学英语四级', icon: 'fas fa-language', color: '#7C3AED',
        type: 'language', typeName: '语言类', desc: 'CET-4词汇语法、阅读理解技巧',
        total: 5, difficulty: '中等',
        questions: [
            { q: 'Choose the correct word: The company has _____ a new policy regarding remote work.', opts: ['implemented', 'implied', 'imported', 'improved'], ans: 0, exp: 'implement意为"实施、执行"，implement a policy表示"实施一项政策"。imply暗示，import进口，improve改善。' },
            { q: 'Which sentence is grammatically correct?', opts: ['If I was you, I would go.', 'If I were you, I would go.', 'If I am you, I would go.', 'If I be you, I would go.'], ans: 1, exp: '在与现在事实相反的虚拟条件句中，be动词一律用were形式，不论主语人称。' },
            { q: 'The word "ubiquitous" most nearly means:', opts: ['rare', 'present everywhere', 'dangerous', 'beautiful'], ans: 1, exp: 'ubiquitous意为"无处不在的、普遍的"，来自拉丁语ubique（到处）。' },
            { q: 'Choose the correct preposition: She is interested _____ ancient history.', opts: ['at', 'on', 'in', 'for'], ans: 2, exp: 'be interested in是固定搭配，表示"对……感兴趣"。' },
            { q: 'Which of the following is a correct passive voice transformation of "They built the bridge in 1990"?', opts: ['The bridge was built in 1990.', 'The bridge is built in 1990.', 'The bridge has been built in 1990.', 'The bridge were built in 1990.'], ans: 0, exp: '一般过去时的被动语态结构为was/were + 过去分词。主语the bridge是单数，所以用was built。' },
            { q: 'Choose the correct word: The new regulation will ___ effect next month.', opts: ['take', 'make', 'put', 'bring'], ans: 0, exp: 'take effect 是固定搭配，意为「生效」。' },
            { q: 'He is used to ___ up early every morning.', opts: ['getting', 'get', 'got', 'be getting'], ans: 0, exp: 'be used to doing 表示「习惯于做某事」，to 是介词，后接动名词；而 used to do 表示「过去常常做」。' },
            { q: 'The meeting has been ___ until Friday because of the storm.', opts: ['postponed', 'promoted', 'proposed', 'prolonged'], ans: 0, exp: 'postpone 意为「推迟」；promote 提升、propose 提议、prolong 延长（时长），此处语义应为推迟到周五。' },
            { q: 'Choose the correct sentence:', opts: ['She suggested that he go to the doctor.', 'She suggested that he goes to the doctor.', 'She suggested him to go to the doctor.', 'She suggested that he will go to the doctor.'], ans: 0, exp: 'suggest 后接虚拟语气宾语从句：suggest that sb. (should) do，should 可省略，动词用原形。' },
            { q: 'The number of students ___ increasing every year.', opts: ['is', 'are', 'were', 'have been'], ans: 0, exp: 'the number of + 复数名词表示「……的数量」，谓语用单数；a number of + 复数名词（许多……）谓语才用复数。' },
            { q: 'The word "diligent" most nearly means:', opts: ['hardworking', 'lazy', 'wealthy', 'careless'], ans: 0, exp: 'diligent 意为「勤奋的、尽职的」，与 hardworking 近义。' },
            { q: 'Choose the correct preposition: He apologized ___ being late.', opts: ['for', 'to', 'of', 'on'], ans: 0, exp: 'apologize to sb. for (doing) sth. 是固定搭配，为某事向某人道歉用 for。' },
            { q: 'Neither of the two answers ___ correct.', opts: ['is', 'are', 'were', 'be'], ans: 0, exp: 'neither/either of + 复数名词作主语时，谓语动词用单数形式。' },
            { q: 'After "look forward to", which form should follow?', opts: ['动名词（doing）', '动词原形（do）', '不定式（to do）', '过去分词（done）'], ans: 0, exp: 'look forward to 中的 to 是介词而非不定式符号，后接动名词：I look forward to hearing from you. ' },
            { q: 'Choose the antonym of "abundant":', opts: ['scarce', 'plentiful', 'ample', 'rich'], ans: 0, exp: 'abundant 意为「丰富的、充裕的」，其反义词是 scarce（稀缺的）。' }
        ]
    },
    {
        id: 'trivia', name: '趣味百科', icon: 'fas fa-puzzle-piece', color: '#059669',
        type: 'interest', typeName: '兴趣类', desc: '天文地理、历史文化、生活常识',
        total: 5, difficulty: '简单',
        questions: [
            { q: '太阳系中最大的行星是？', opts: ['土星', '木星', '天王星', '海王星'], ans: 1, exp: '木星是太阳系中最大的行星，其质量是其他所有行星质量总和的2.5倍，直径约14万公里。' },
            { q: '"但愿人长久，千里共婵娟"的作者是？', opts: ['李白', '杜甫', '苏轼', '白居易'], ans: 2, exp: '此句出自苏轼的《水调歌头·明月几时有》，是中秋词中的千古名篇。' },
            { q: '人体最大的器官是？', opts: ['肝脏', '大脑', '皮肤', '肺'], ans: 2, exp: '皮肤是人体最大的器官，成年人的皮肤面积约为1.5-2平方米，重量约占体重的16%。' },
            { q: '以下哪个国家的国旗上有枫叶图案？', opts: ['美国', '英国', '加拿大', '澳大利亚'], ans: 2, exp: '加拿大国旗上有一片红色枫叶，枫叶是加拿大的国家象征。' },
            { q: 'DNA的双螺旋结构是由谁发现的？', opts: ['达尔文', '孟德尔', '沃森和克里克', '巴甫洛夫'], ans: 2, exp: '1953年，詹姆斯·沃森和弗朗西斯·克里克发现了DNA的双螺旋结构，因此获得诺贝尔生理学或医学奖。' },
            { q: '世界上最深的海沟是？', opts: ['马里亚纳海沟', '波多黎各海沟', '爪哇海沟', '汤加海沟'], ans: 0, exp: '马里亚纳海沟最深处约11000米，是地球表面最深的地方，深于珠穆朗玛峰的海拔高度。' },
            { q: '光在真空中的传播速度约为？', opts: ['30万公里/秒', '3万公里/秒', '300万公里/秒', '3000公里/秒'], ans: 0, exp: '真空光速约为每秒299792公里，通常取30万公里/秒，是宇宙中最快的速度。' },
            { q: '《红楼梦》的作者曹雪芹生活在哪个朝代？', opts: ['清代', '明代', '元代', '宋代'], ans: 0, exp: '曹雪芹是清代小说家，《红楼梦》创作于清代乾隆年间。' },
            { q: '成年人的全身骨骼共有多少块？', opts: ['206块', '208块', '200块', '210块'], ans: 0, exp: '成年人有206块骨骼；婴儿因骨骼未融合，数量可达300块以上，随成长逐渐融合。' },
            { q: '彩虹是阳光在雨滴中经过什么现象形成的？', opts: ['折射与反射（色散）', '干涉', '衍射', '偏振'], ans: 0, exp: '阳光进入雨滴时发生折射，在滴内反射后再次折射而出，不同波长的光偏折角度不同，形成色散光谱。' },
            { q: '世界上国土面积最大的国家是？', opts: ['俄罗斯', '加拿大', '中国', '美国'], ans: 0, exp: '俄罗斯国土面积约1709万平方公里，是世界第一大国；加拿大约998万平方公里居第二。' },
            { q: '《蒙娜丽莎》的作者是？', opts: ['达·芬奇', '拉斐尔', '米开朗基罗', '梵高'], ans: 0, exp: '《蒙娜丽莎》是文艺复兴大师达·芬奇的代表作，现藏于巴黎卢浮宫。' },
            { q: '声音在下列哪种介质中传播速度最快？', opts: ['固体（如钢铁）', '液体（如水）', '气体（如空气）', '真空中最快'], ans: 0, exp: '声音传播速度：固体 > 液体 > 气体，钢中约5000米/秒，水中约1500米/秒，空气中约340米/秒；真空不能传声。' },
            { q: '月球围绕地球公转一周大约需要多久？', opts: ['27天', '7天', '88天', '365天'], ans: 0, exp: '月球公转周期约27.3天（恒星月），与自转周期相同，因此月球总是以同一面朝向地球。' },
            { q: '地球上大气中含量最多的气体是？', opts: ['氮气', '氧气', '二氧化碳', '氩气'], ans: 0, exp: '大气中氮气约占78%，氧气约占21%，二氧化碳仅约0.04%。' }
        ]
    }
];

function seedData() {
  const file = resolve(process.env.DATABASE_FILE || './data/exam.sqlite');
  mkdirSync(dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('foreign_keys = ON');

  try {
    for (const bank of questionBanks) {
      // 插入题库
      db.prepare(
        `INSERT OR IGNORE INTO \`banks\` (id, name, icon, color, type, type_name, description, total, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(bank.id, bank.name, bank.icon, bank.color, bank.type, bank.typeName, bank.desc, bank.questions.length, bank.difficulty);

      // 插入题目
      for (let i = 0; i < bank.questions.length; i++) {
        const q = bank.questions[i];
        // 检查是否已经存在该题（基于bank_id和内容简单判断）
        const rows = db.prepare('SELECT id FROM `questions` WHERE bank_id = ? AND content = ?').all(bank.id, q.q);
        if (rows.length === 0) {
          const type = q.type || 'single';
          db.prepare(
            `INSERT INTO \`questions\` (bank_id, type, content, options, answer_index, answer_multi, explanation, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(bank.id, type, q.q, JSON.stringify(q.opts), type === 'multi' ? 0 : q.ans, type === 'multi' ? JSON.stringify(q.ans) : null, q.exp, i);
        }
      }

      // 同步题库总数（题库已存在时 INSERT IGNORE 会跳过，total 不会自动更新）
      db.prepare('UPDATE banks SET total = (SELECT COUNT(*) FROM questions WHERE bank_id = ?) WHERE id = ?').run(bank.id, bank.id);
    }
    console.log('Seed data imported successfully!');
  } catch (err) {
    console.error('Error importing seed data:', err);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

seedData();