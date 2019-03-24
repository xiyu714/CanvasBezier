function Point(x, y) {
  /*
    方便其他元素的使用
    但好像没有编译器的特殊语法支持，好像比直接传入两个参数还有麻烦使用
  */

  this.x = x;
  this.y = y;
}

function p() {  //参数 x = 0， y = 0
  /*
    对point的简单封装，使调用更加简单
  */
  let x = arguments[0] ? arguments[0] : 0;
  let y = arguments[1] ? arguments[1] : 0;
  return new Point(x, y);
}

function CanvasManage(canvas) {
  //传入一个canvas上下文
  this.context = canvas.getContext("2d");
  canvas.addEventListener("mousemove", (function(self) {//闭包中使用变量名closure标识闭包中的变量，以防被函数作用域覆盖
    var closure = {};
    closure.this = self;
    return function(event) {
      closure.this.mouse.x = event.offsetX;  //将浏览器事件绑定到canvasManage上来
      //console.log(event.offsetX)
      closure.this.mouse.y = event.offsetY;
      closure.this.refresh();
    }
  })(this))
  canvas.addEventListener("mousedown", (function(self) {
    var closure = {};
    closure.this = self;
    return function(event) {
      closure.this.mouse.down = true;
    }
  })(this))
  canvas.addEventListener("mouseup", (function(self) {
    var closure = {};
    closure.this = self;
    return function(event) {
      closure.this.mouse.down = false;
    }
  })(this))
  this.typeMap = new Map();
  this.elementArray = new Array();
  this.mouse = {
    element: null,
    x: undefined,
    y: undefined,
    down: undefined,
    oldX: undefined,
    oldY: undefined
  }
  this.createElement = function(typeName) { //类型参数以arguments获得
    //用来构造一个CanvasElement对象
    arguments.parent = this;  //方便在 构造中访问canvasManage
    canvasElement = new (this.typeMap.get(typeName))(arguments);
    canvasElement.parent = this;
    this.elementArray.push(canvasElement);
    return canvasElement;
  }

  //添加内置类型
  this.typeMap.set("circle", function(arguments) {//x, y, r
    //用来构造一个CanvasElement对象
    this.name = arguments[0];   //暂时用类型做为名字
    this.path = new Path2D();
    this.fillColor = "rgba(0,170,187,0.6)";
    this.point = true;
    if(arguments.length < 4) {
      this.x = 20;
      this.y = 20;
      this.radius = 15;
      this.path.arc(this.x, this.y, this.radius, 0, Math.PI*2)
    } else {
      this.x = arguments[1];
      this.y = arguments[2];
      this.radius = arguments[3];
      this.path.arc(this.x, this.y, this.radius, 0, Math.PI*2)
    }

    this.set = function(x, y, r) {
      this.path = new Path2D();
      this.x = x;
      this.y = y;
      this.radius = r;
      this.path.arc(this.x, this.y, this.radius, 0, Math.PI*2)
      return this
    }

    this.show = function() {
      ctx.save()
      ctx.fillStyle = this.fillColor;
      ctx.fill(this.path)
      //console.log("show", this.name)
      ctx.restore()
    }//一个默认的显示方法，需要手动来覆盖

    this.move = function(offsetX, offsetY) {
      this.path = new Path2D();
      this.x += offsetX;
      this.y += offsetY;
      this.path.arc(this.x, this.y, this.radius, 0, Math.PI*2)
    }

    this.drag = false; //表示被拖拽，事件处理的一部分，暂时这样
  })

  this.typeMap.set("straightLink", function(args) { //起始对象，终点对象
    //用来构造一个CanvasElement对象
    this.name = arguments[0];   //暂时用类型做为名字
    this.path = new Path2D();
    this.color = "rgba(0,170,187,0.6)";
    this.point = false;
    //只有可填充类型，才会有fillColor属性

    Object.defineProperty(this, "startX", {
      get: function(){
        return args[1].x;
      }
    })
    Object.defineProperty(this, "startY", {
      get: function(){
        return args[1].y;
      }
    })
    Object.defineProperty(this, "endX", {
      get: function(){
        return args[2].x;
      }
    })
    Object.defineProperty(this, "endY", {
      get: function(){
        return args[2].y;
      }
    })

    this.show = function() {
      ctx.save()
      ctx.strokeStyle = this.color;
      this.path = new Path2D();
      this.path.moveTo(this.startX, this.startY);
      this.path.lineTo(this.endX, this.endY)
      ctx.stroke(this.path)
      //console.log("show", this.name)
      ctx.restore()
    }//一个默认的显示方法，需要手动来覆盖
  })

  this.typeMap.set("quadraticBezierLink", function(args) {  //起始对象，终点对象，控制点对象
    //用来构造一个CanvasElement对象
    this.name = args[0];   //暂时用类型做为名字
    this.path = new Path2D();
    this.color = "rgba(0,170,187,0.6)";
    this.point = false;

    var start = args[1];
    var end = args[2];
    var c = args[3];

    //创建两个连线
    var link1 = args.parent.createElement("straightLink", start, c).color = "rgba(38, 38, 21, 0.5)"
    var link2 = args.parent.createElement("straightLink", end, c).color = "rgba(38, 38, 21, 0.5)"
    this.set = function(start, end, c) {
      this.path = new Path2D();
      this.path.moveTo(start.x, start.y);
      this.path.quadraticCurveTo(c.x, c.y, end.x, end.y)
      return this
    }

    this.show = function() {
      ctx.save()
      ctx.strokeStyle = this.color;
      this.set(args[1], args[2], args[3])
      ctx.stroke(this.path)
      ctx.restore()
    }
  })

  this.typeMap.set("cubicBezierLink", function(args) {  //起始对象，终点对象，控制点1, 控制点2
    //用来构造一个CanvasElement对象
    this.name = args[0];   //暂时用类型做为名字
    this.path = new Path2D();
    this.color = "rgba(0,170,187,0.6)";
    this.point = false;
    var start = args[1]
    var end = args[2]
    var c1 = args[3]
    var c2 = args[4]

    //创建两个连线
    var link1 = args.parent.createElement("straightLink", start, c1).color = "rgba(38, 38, 21, 0.5)"
    var link2 = args.parent.createElement("straightLink", end, c2).color = "rgba(38, 38, 21, 0.5)"
    this.set = function(start, end, c1, c2) { //由于闭包的性质，这里甚至可以不用传参
      this.path = new Path2D();
      this.path.moveTo(start.x, start.y);
      this.path.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y)
      return this
    }

    this.show = function() {
      ctx.save()
      ctx.strokeStyle = this.color;
      this.set(start, end, c1, c2)
      ctx.stroke(this.path)
      ctx.restore()
    }
  })

  this.drawFrame = function() {
    ctx = this.context
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    //在这里先修改bezier看看效果
    //this.map.get("bezier").setQuadraticBezier()
    for (let element of this.elementArray) {
      element.show()
    }
  }

  this.refresh = function() {
    //在鼠标状态发生改变时触发
    ctx = this.context
    /*
    事件，也就是状态处理分为两部分：
      1. 判断事件状态，也就是是否发生
      2. 根据事件执行代码
    */
    for (let element of this.elementArray) {
      //判断
      if(element.point) {  //元素是否支持鼠标事件
        if(ctx.isPointInPath(element.path, this.mouse.x, this.mouse.y)){
          //所有鼠标事件，只有在元素内才会触发
          //console.log("select", element.name)
          if(this.mouse.down && element.drag == false) {
            element.drag = true;
            this.mouse.oldX = this.mouse.x;
            this.mouse.oldY = this.mouse.y;
          }
        }
        if(!this.mouse.down) {
          element.drag = false;
        }

        //进行处理
        if(element.drag) {
          //console.log(this.mouse.x-this.mouse.oldX)
          element.move(this.mouse.x-this.mouse.oldX, this.mouse.y - this.mouse.oldY)
          this.mouse.oldX = this.mouse.x;
          this.mouse.oldY = this.mouse.y;
        }
      }

    }
    //在这里更新
    //this.map.get("bezier").setQuadraticBezier(this.map.get("start"), this.map.get("end"), this.map.get("c"))
    this.drawFrame();
  }
}
