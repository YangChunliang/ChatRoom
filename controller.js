const js = require('js');

function addMapping(router,mapping) {
  for (var url in mapping) {
    if (url.startsWith('GET ')) {
      var path = url.substring('4');
      router.get(path,mapping[url]);
      console.log(`已成功注册地址：GET ${path}`);
    }else if (url.startsWith('POST ')) {
      var path = url.substring('5');
      router.post(path,mapping[url]);
      console.log(`已成功注册地址：POST ${path}`);
    }else if (url.startsWith('PUT ')) {
      var path = url.substring('4');
      router.put(path,mapping[url]);
      console.log(`已成功注册地址：PUT ${path}`);
    }else if (url.startsWith('DELETE ')) {
      var path = url.substring('7');
      router.del(path,mapping[url]);
      console.log(`已成功注册地址：DELETE ${path}`);
    }else {

    }
  }
}

function addControllers(router,dir) {
  fs.readdirSync(__dirname + '/' + dir).filter((f)=>{
    return f.endsWith('.js');
  }).forEach((f)=>{
    console.log(`读取到逻辑文件：${f}`);
    let mapping = require(__dirname + '/' + dir + '/' + f);
    addMapping(router,mapping);
  });
}

module.exports = function(dir){
  let controllers_dir = dir || 'controllers';
  let router = require('koa-router')();
  addControllers(controllers_dir,router);
  return router.routes();
}
