import mysql from 'mysql2/promise'
import { getDbConfig } from './scripts/dbConfig.js'

// 我们借用之前的 data.ts 文件中的题目数据进行初始化导入
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
            { q: '以下哪个不是Vue3的响应式API？', opts: ['ref()', 'reactive()', 'computed()', 'observe()'], ans: 3, exp: 'observe()不是Vue3的响应式API。Vue3使用ref()、reactive()、computed()等组合式API，observe是Vue2内部的方法。' }
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
            { q: 'Python中深拷贝和浅拷贝的区别是？', opts: ['没有区别', '深拷贝复制所有层级，浅拷贝只复制顶层', '浅拷贝复制所有层级，深拷贝只复制顶层', '两者都只复制顶层'], ans: 1, exp: '浅拷贝只复制对象的顶层引用，内部嵌套对象仍指向原对象。深拷贝递归复制所有层级的对象，创建完全独立的副本。' }
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
            { q: '中华人民共和国成立的日期是？', opts: ['1949年9月21日', '1949年10月1日', '1950年1月1日', '1949年8月15日'], ans: 1, exp: '1949年10月1日，中华人民共和国中央人民政府成立典礼在北京天安门广场隆重举行。' }
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
            { q: '遇到前方车辆缓慢排队等候时，以下做法正确的是？', opts: ['从前方车辆两侧穿插', '占用对向车道', '依次排队等候', '从右侧路肩绕行'], ans: 2, exp: '遇前方排队等候时，应依次排队，不得穿插、占道或绕行，这是文明驾驶的基本要求。' }
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
            { q: 'Which of the following is a correct passive voice transformation of "They built the bridge in 1990"?', opts: ['The bridge was built in 1990.', 'The bridge is built in 1990.', 'The bridge has been built in 1990.', 'The bridge were built in 1990.'], ans: 0, exp: '一般过去时的被动语态结构为was/were + 过去分词。主语the bridge是单数，所以用was built。' }
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
            { q: 'DNA的双螺旋结构是由谁发现的？', opts: ['达尔文', '孟德尔', '沃森和克里克', '巴甫洛夫'], ans: 2, exp: '1953年，詹姆斯·沃森和弗朗西斯·克里克发现了DNA的双螺旋结构，因此获得诺贝尔生理学或医学奖。' }
        ]
    }
];

async function seedData() {
  const connection = await mysql.createConnection({ ...getDbConfig(), connectTimeout: 10000 })

  try {
    for (const bank of questionBanks) {
      // 插入题库
      await connection.execute(
        `INSERT IGNORE INTO \`banks\` (id, name, icon, color, type, type_name, description, total, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [bank.id, bank.name, bank.icon, bank.color, bank.type, bank.typeName, bank.desc, bank.questions.length, bank.difficulty]
      )

      // 插入题目
      for (let i = 0; i < bank.questions.length; i++) {
        const q = bank.questions[i]
        // 检查是否已经存在该题（基于bank_id和内容简单判断）
        const [rows] = await connection.execute('SELECT id FROM `questions` WHERE bank_id = ? AND content = ?', [bank.id, q.q])
        if (rows.length === 0) {
          await connection.execute(
            `INSERT INTO \`questions\` (bank_id, content, options, answer_index, explanation, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [bank.id, q.q, JSON.stringify(q.opts), q.ans, q.exp, i]
          )
        }
      }
    }
    console.log('Seed data imported successfully!')
  } catch (err) {
    console.error('Error importing seed data:', err)
    process.exitCode = 1
  } finally {
    await connection.end()
  }
}

seedData()
