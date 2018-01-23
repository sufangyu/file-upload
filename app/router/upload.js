/**
 * 登录 模块
 * 
 * @param {any} req 
 * @param {any} res 
 * @returns 
 */
exports.upload = function(req, res) {
  // const requestMethod = req.method;  
  // 上传页面渲染
  res.render('upload.html', {
    pageTitle: 'File upload',
  });

};



exports.postUpload = function(req, res) {
  const file = req.body;
  console.log(file.Filename);
  console.log('=====================================');
  console.log(file);

  var result = {
    success: true,
    msg: 'success',
  };

  setTimeout(function() {
    res.send(result);
  }, 1500);
};