(function(){

    var vm = new Vue({
        el : "#app",
        data : {
            // наши данные с id и contents (будт в дальнейшем содержать "Х", или "О"
            // при выводе в HTML будет иметь вид стандартного поля 3х3фф
            // Если вывести id:
            // id=1 id=2 id=3
            // id=4 id=5 id=6
            // id=7 id=8 id=9
            board : [
                [
                    {id: 0, contents: '', led: false},
                    {id: 1, contents: '', led: false},
                    {id: 2, contents: '', led: false}
                ],
                [
                    {id: 3, contents: '', led: false},
                    {id: 4, contents: '', led: false},
                    {id: 5, contents: '', led: false}
                ],[
                    {id: 6, contents: '', led: false},
                    {id: 7, contents: '', led: false},
                    {id: 8, contents: '', led: false}
                ]
            ],
            playerFigure : "x",
            botFigure : "o",
            // winVectors содержит выигрышные комбинации, их 8:
            // 3 по горизонтали
            // 3 по вертикали
            // и 2 диагонали
            message : '',
            myTurn : true,
            winVectors : function() {
                var board = this.board,
                    vectors = [
                        [board[0][0], board[0][1], board[0][2]],
                        [board[1][0], board[1][1], board[1][2]],
                        [board[2][0], board[2][1], board[2][2]],
                        [board[0][0], board[1][0], board[2][0]],
                        [board[0][1], board[1][1], board[2][1]],
                        [board[0][2], board[1][2], board[2][2]],
                        [board[0][0], board[1][1], board[2][2]],
                        [board[0][2], board[1][1], board[2][0]]
                ];
                return vectors;
            }
        },
        computed: {
            // проверяем возвможные варианты хода для бота
            availableChoice: function(){
                //разворачивание многомерного массива (взято тут https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)
                var flattened = this.board.reduce(function(a, b) {
                    return a.concat(b);
                });
                //Метод filter() вызывает переданную функцию callback один раз для каждого элемента, присутствующего в массиве
                // в данном случае колбэком является метод empty, который вернет нам пустые клетки
                return flattened.filter(this.empty);
            }
        },
        methods : {
            // метод myMove описывает ход игрока. То есть изначально проверяем кликнутое поле (пустое ли оно)
            // если пустое, то закрашиваем его крестиком и запускаем ход компьютера
            // если кликаем по заполненому полю, то ничего не происходит
            myMove : function(field){
                console.log(this.myTurn + "мой ход")
                if (this.empty(field)){
                    if (this.myTurn === true) {
                        field.contents = this.playerFigure;
                        this.myTurn = false;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
                // если игра еще не закончена, запускаем ход бота
                // сделаем небольшую задержку для хода бота.
                // не уверен, что это тут нужно, но для лично моего восприятия так приятнее
                // имитация мыслительного процесса =)
                // толкьо при этом нужно еще сделать так, что бы мы не могли нажимать на клетки, пока комьоютер "думает" над своим ходом
                // для этого создадим свойство myTurn = true
                // после нашего хода меняем значение на false
                // и в конце метода botMove обратно меняем на myTurn=true;
                if (!this.checkGame(field)){
                    setTimeout(function(){
                        vm.botMove();
                    }, Math.floor(Math.random() * 2000));
                }
            },
            // данный метод проверяет поле на заполнение
            empty: function(field){
                if (field.contents === "") {
                    return true;
                } else {
                    return false;
                }
            },
            // метод описывающий ход бота
            botMove : function(){
                var choices = this.planMove(),
                    field;
                if (choices[0]) {
                    field = choices[Math.floor(Math.random() * choices.length)];
                } else {
                    // выбираем поле(клетку) из всех допустимых
                    field = this.availableChoice[Math.floor(Math.random() * this.availableChoice.length)];
                }
                field.contents = this.botFigure;
                this.myTurn = true;
                this.checkGame(field);
            },
            // данный метод возвращает допустимые ходы
            // создаем пустой массив choices
            // пробегаем все выигрышные варианты,возвращаемые методом winVectors
            // и запускаем функцию planMove
            planMove : function(){
                var choices = [],
                    winVectors = this.winVectors();
                this.winVectors().forEach(function(vector) {
                    if (planMove(vector)) {
                        choices.push(planMove(vector));
                    }
                });
                return choices;
            },
            // метод, который проверяет закончилась игра, или нет
            checkGame : function(item){
                var won;
                this.winVectors().forEach(function(elem) {
                    if (checkMe(elem)) {
                        won = elem;
                    }
                });
                // делаем проверку по свойсту contents
                // и выводим сообщение
                // так же в случае окончиная игры, меняем флаг myTurn на false,что бы мы больше не могли ходить
                // в принципе игра уже окончена,выигрышная комбинация зачеркнута и сообщение выведено, но дополнительные ходы портят картину
                if (won){
                    if (item.contents == this.playerFigure){
                        this.message = "You won ! =)"
                    } else {
                        this.message = "You lost =("
                    }
                    won.forEach(function(elem){
                        elem.led = true;
                    });
                    this.myTurn = false;
                    return true;
                }
                if (!won && this.availableChoice == false) {
                    this.message = 'Tie! Try it again';
                    this.myTurn = false;
                    return true;
                }
            }
        }

    });

    // функция planMove возвращает пустое поле в выигрышной комбинации (предположительно выигрышной)
    function planMove(array){
        // переменные empty и nonEmpty будут содержать пустые и занятые поля
        var empty = [];
        var nonEmpty = [];
        array.forEach(function(el) {
            if (vm.empty(el)) {
                empty.push(el);
            } else {
                nonEmpty.push(el);
            }
        });
        // делаем проверку. Если есть 2 заполненных поля (в данном случае ботом), возвращаем первое пустое
        if (nonEmpty.length === 2 && nonEmpty[0].contents == nonEmpty[1].contents) {
            return empty[0];
        }
    }

    function checkMe(arr){
        var one = arr[0].contents;
        return one != "" && one == arr[1].contents && one == arr[2].contents;
    }


})();