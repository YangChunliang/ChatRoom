//入口文件
//导入各个模块
const url = require('url');
const ws = require('ws');
const Cookies = require('cookies');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const controller = require('./controller');
const templating = require('./templating');

//创建WebSocketServer服务器
const WebSocketServer = ws.Server;
//创建koa服务器
const app = new Koa();

//输出请求方法和地址
app.use(async (ctx,next)=>{
  console.log(`请求方法：${ctx.request.method}请求地址：${ctx.request.url}`);
  await next();
});

//调用函数，从cookie中获取user对象
app.use(async (ctx,next)=>{
  ctx.state.user = parseUser(ctx.cookies.get('name') || '');
  await next();
});

//注册request body
app.use(bodyParser());

//注册模板引擎
app.use(templating('views',{
  noCache:true,
  watch:true
}));

//注册控制逻辑
app.use(controller);

//创建koa服务器
let server = app.listen(3000);

//返回user对象函数
function parseUser(obj){
  if (!obj) {
    return;
  }
  console.log('解析:' +obj);
  let s = '';
  if (typeof obj === 'string') {
    s = obj
  } else if(obj.headers){
    let cookies = new Cookies(obj,null);
    s = cookies.get('name');
  }
  if (s) {
    try {
      let user = JSON.parse(Buffer.from(s,'base64').toString());
      console.log(`USER: ${user.name},ID:${user.id}`);
      return user;
    } catch (e) {

    } finally {

    }
  }
}

//创建WebSocketServer函数
function createWebSocketServer(server,onConnection,onMessage,onClose,onError){
  let wss = new WebSocketServer({
    server:server
  });
  //创建广播函数
  wss.broadcast = function broadcast(data){
    wss.clients.forEach(function each(client){
      client.send(data);
    });
  };
  onConnection = onConnection || function(){
    console.log('[WebSocket] connected.');
  }
  onMessage = onMessage || function(msg){
    console.log('[WebSocket] message 接收.' + msg);
  }
  onClose = onClose || function(code,message){
    console.log(`[WebSocket] closed: ${code}-${message}`);
  }
  onError = onError || function(err){
    console.log('[WebSocket] error:' + err);
  }
  wss.on('connection',function(ws){
    let location = url.parse(ws.upgradeReq.url,true);
    console.log('[WebSocketServer]连接：' + location.href);
    ws.on('message',onMessage);
    ws.on('close',onClose);
    ws.on('error',onError);
    if (location.pathname !== '/ws/chat') {
      ws.close(4000,'Invalid user');
    }
    let user = parseUser(ws.upgradeReq);
    if (!user) {
      ws.close(4001,'Invalid user');
    }
    ws.user = user;
    ws.wss = wss;
    onConnection.apply(ws);
  });
  console.log('WebSocketServer was attached');
  return wss;
}

var messageIndex = 0;

function createMessage(type,user,data){
  messageIndex++;
  return JSON.stringify({
    id:messageIndex,
    type:type,
    user:user,
    data:data
  });
}

function onConnection(){
  let user = this.user;
  let msg = createMessage('join',user,`${user.name}进入聊天室`);
  this.wss.broadcast(msg);
  let users = this.wss.clients.map(function(client){
    return client.user;
  });
  this.send(createMessage('list',user,users));
}

function onMessage(message){
  console.log(message);
  if (message && message.trim()) {
    let msg = createMessage('chat',this.user,message.trim());
    this.wss.broadcast(msg);
  }
}

function onClose(){
  let user = this.user;
  let msg = createMessage('left',user,`${user.name}离开`);
  this.wss.broadcast(msg);
}

app.wss = createWebSocketServer(server,onConnect,onMessage,onClose);
console.log('服务器已经在3000端口挂起。。。');
