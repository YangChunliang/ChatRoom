//首页的业务逻辑
module.exports = {
  'GET /':async(ctx,next) =>{
    let user = ctx.state.user;
    if (user) {//用户在cookie中存在，直接进入聊天页面
      ctx.render('room.html',{
        user:user
      });
    } else {//否则跳转到登录页面
      ctx.response.redirect('/signin');
    }
  }
};
