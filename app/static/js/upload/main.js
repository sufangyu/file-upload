(function() {

  // 配置
  var config = {
    desc : 'Image Files',
    mimeType: 'image/*', // 多个用逗号分割. image/*
    fileTypes: 'gif|jpg|jpeg|bmp|png|pdf|txt', // 允许上传的文件格式
    fileLimitSize: 10 * 1024 * 1024, // 单个文件大小限制. 3M
    autoUpload: true, // 是否自动上传
    url: './upload',
  };


  var filesUpload = []; // 全部文件
  var uploadQueue = []; // 即将上传的文件队列
  var currUploadfile = {}; // 当前正在上传的文件对象
  var fileNumber		 = -1; // 文件编号
	var fileNumberPex	 = "yuFileUpload_"; // 编号前缀
  var isUploading    = false; // 文件是否正在上传中
  var isDragOver		 = false; // 是否拖拽触发点
  var XHR;
	try { 
		XHR = new XMLHttpRequest(); 
	} catch(e) {}
  
  document.addEventListener('DOMContentLoaded', function() {
    var $file = document.querySelector('.js-uploader');
    var $uploadDrag = document.querySelector('.js-upload-drag');
    // console.log($file);

    $file.setAttribute('accept', config.mimeType);

    $file.addEventListener('change', function(e) {
      var files = this.files;
      filterFiles(files, this);
    });


    $file.addEventListener('dragover', handleDragOver, false);
		$file.addEventListener('dragleave', handleDragLeave, false);
    $file.addEventListener('drop', handleDrop, false);


    document.addEventListener('click', handleCancelUpload, false);

  });

  
  /**
   * 取消文件上传
   * 
   * @param {any} e 
   */
  function handleCancelUpload(e) {
    var $target = e.target || e.srcElement;
    
    if ($target.classList.contains('js-cancel-upload')) {
      var fileId = $target.dataset.fileId;
      var type = $target.dataset.type;
      cancelUpload(fileId, type);
    }
  }
  

  /**
   * 触发dragenter后在有效目标范围内移动时连续触发该事件
   * 
   */
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();

    // 防止多次DOM操作
    if (!isDragOver) {
      document.querySelector('.js-upload-drag').classList.add('active');
			isDragOver = true;
    }
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();

    document.querySelector('.js-upload-drag').classList.remove('active');
    isDragOver = false;
  }

  function handleDrop (e) {
    e.stopPropagation();
    e.preventDefault();
    document.querySelector('.js-upload-drag').classList.remove('active');
    isDragOver = false;

    console.log(e.dataTransfer.files);
    var files = e.dataTransfer.files;
    var $input = e.target;

    filterFiles(files, this);
  }


  function filterFiles(files, $input) {
    var file = {};
    var errorMsgs = [];
    var len = files.length;

    // 对选择的文件循环检查
    for (var i = 0; i < len; i++) {
      file = files[i];
      var fileName = file.name;
      fileNumber++; 
      file.id = fileNumberPex + fileNumber;
      file.ext = fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length);

      // 检测文件是否符合条件
      var msg = checkFile(file);
      if (!msg) {
        // 添加到全局文件列表中
        filesUpload.push(file);
        // 添加到上传队列
        uploadQueue.push(file);
        // 在页面中渲染显示 render
        renderFileQueued(file, 1);
      } else {
        errorMsgs.push(msg);
      };
    }

    // 输出错误信息
    if (errorMsgs.length > 0) {
      if (len === 1) {
        console.error(errorMsgs[0]);
      } else {
        var errMsg = "你选择了" + len + "个文件，只能上传" + (len - errorMsgs.length) + "个文件。\n请选择" + config.fileTypes.split("|").join("、") + "格式的文件，文件名不能重复。";
        console.error(errMsg);
      }
    }


    // 开始上传
    if (config.autoUpload) {
      startUpload();
    }
  }



  function startUpload() {
    // 拿出第一个，进行上传
    if (!isUploading && uploadQueue.length > 0) {
      uploadFiles(uploadQueue.shift());
    }
  }

  /**
   * 上传文件
   * 
   * @param {any} file 
   */
  function uploadFiles(file) {
    console.log('将要上传的文件', file);
    isUploading = true;

    // 设置上传的数据对象
    var fd = new FormData();
    fd.append('Filename', file.name);
    fd.append('Filedata', file);
    fd.append("Upload", "Submit Query");
    //设置当前的上传对象
    currUploadfile = file;
    
    if (XHR.readyState > 0) {
			XHR = new XMLHttpRequest(); 
    }

    XHR.onreadystatechange = function() {
			// 只要上传完成不管成功失败
			if (XHR.readyState === 4){
				console.log("onreadystatechange " , XHR.status, +new Date());
				if (XHR.status == 200) {
					uploadSuccess(currUploadfile, {}, XHR.status)
				} else {
					uploadError(currUploadfile);
				}
				
				// 进行下一个文件上传
				nextUpload();
			}
    };
    
    XHR.upload.addEventListener("progress", progress, false);
		XHR.upload.addEventListener("load", requestLoad, false);
		XHR.upload.addEventListener("error", error, false);
		XHR.upload.addEventListener("abort", abort, false);
		XHR.upload.addEventListener("loadstart", loadstart, false);
		XHR.upload.addEventListener("loadend", loadend, false);

    XHR.open("POST", config.url);
		XHR.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		XHR.send(fd);
  }

  // 请求开始
  function loadstart() {}

  // 请求完成，无论失败或成功
  function loadend() {}

  // 在请求被取消时触发，例如，在调用 abort() 方法时。
  function abort() {}

  
  /**
   * 在请求失败时触发
   * 终止 ajax 请求; 执行上传错误; 进行下一个文件上传
   * 
   */
  function error() {
		XHR.abort();
		uploadError()
		nextUpload();
  }

  // 在请求成功完成时触发。
  function requestLoad() {}

  /**
   * 在请求发送或接收数据期间，在服务器指定的时间间隔触发
   * 
   * @param {any} e 
   */
  function progress(e) {
    console.log('progress =>', e);
    uploadProgress(currUploadfile, e.loaded || e.position, e.total);
  }


  /**
   * 更新上传进度
   * 
   * @param {any} file 
   * @param {any} loaded 
   * @param {any} total 
   */
  function uploadProgress(file, bytesLoaded, bytesTotal) {
    var percent = (bytesLoaded / bytesTotal) * 100 + "%";
    console.log('更新上传进度 =>>', percent, file);

    var $item = document.querySelector('#file_item_' + file.id);
    var $itemProgress = $item.querySelector('.file__progress');
    $itemProgress.style.width = percent;
  }

  /**
   * 进行下一个文件上传
   * 
   */
  function nextUpload() {
    isUploading = false;
    if (uploadQueue.length > 0) {
      uploadFiles(uploadQueue.shift());
    } else {
      // 没有待上传文件
      console.log('上传完成');
      currUploadfile = {};
      
    }
  }

  /**
   * 上传成功
   * 
   * @param {any} file 
   * @param {any} serverData 
   * @param {any} res 
   */
  function uploadSuccess(file, serverData, res) {
    console.log('上传成功：', file);

    var $item = document.querySelector('#file_item_' + file.id);
    var $itemProgress = $item.querySelector('.file__progress');
    var $itemResult = $item.querySelector('.file__result');
    $itemProgress.parentNode.removeChild($itemProgress);

    $itemResult.innerHTML = '成功';
    $itemResult.setAttribute('data-result', 'success');
  }


 /**
  * 上传出错误了，比如断网
  * 
  * @param {any} file 
  */
 function uploadError(file){
		// 移除全局变量中的上传出错的
		// removeFileFromFilesUpload(filesUpload, currUploadfile.id);
    console.log('上传出错误了', file);
    
    var $item = document.querySelector('#file_item_' + file.id);
    var $itemProgress = $item.querySelector('.file__progress');
    var $itemResult = $item.querySelector('.file__result');
    $itemProgress.style.width = '0%';

    $itemResult.innerHTML = '失败';
    $itemResult.setAttribute('data-result', 'fail');
	}


  /**
   * 取消上传
   * 
   * @param {any} fid 
   * @param {any} type 
   */
  function cancelUpload(fid, type) {
    console.log('取消上传 =>>', fid, type);

    if (type === '1') {
      uploadHTML5.cancelUpload(fid);
    }

    var $item = document.querySelector('#file_item_' + fid);
    var $itemResult = $item.querySelector('.file__result');

    $itemResult.innerHTML = '已取消';
    $itemResult.setAttribute('data-result', 'cancled');

    // 如果已经上传一部分了, 也处理
  
  }


  /**
   * 检查文件是否符合条件
   * 
   * @param {any} file 
   * @returns 
   */
  function checkFile(file) {
    if (file.size > config.fileLimitSize) {
      return '文件太大，不能超过'+ countFileSize(config.fileLimitSize);
    }

    if (!file.name || !file.name.toLowerCase().match('('+config.fileTypes+')$')) {
      return '文件格式不对';
    }


    for (var i = 0; i < filesUpload.length; i++) {
      if (filesUpload[i].name === file.name) {
        return '文件已经存在';
      }
    }

    return null;
  }

  /**
   * 计算文件大小
   * 
   * @param {any} fileSize 
   * @returns 
   */
  function countFileSize(fileSize) {
    var KB  = 1024;
    var MB = 1024 * 1024;
    if (KB >= fileSize) {
      return fileSize + 'B';
    } else if (MB >= fileSize) {
      return (fileSize/KB).toFixed(2) + 'KB';
    } else {
      return (fileSize/MB).toFixed(2) + 'MB';
    }
  }

  function formatFileSize(time) {
    var date = new Date(time);
    var _year = date.getFullYear();
    var _month = toDouble(date.getMonth() + 1);
    var _day = toDouble(date.getDay());
    var _hour = date.getHours();
    var _minutes = toDouble(date.getMinutes());
    var _seconds = toDouble(date.getSeconds());

    return _year + '-'+ _month + '-' + _day + ' ' + _hour + ':' + _minutes + ':' + _seconds;
  }

  function toDouble(num) {
    return parseInt(num) > 9 ? (num + '') : ('0' + num);
  }


  /**
   * 查找在数组中的位置
   */
  function findObjectKey(object, fid){
    var len = object.length; 
    for (var i = 0; i < len; i++) {
      if (object[i].id === fid) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 添加文件时，渲染文件列表
   * 
   * @param {any} file 
   * @param {any} type 
   */
  // var $header = null;
  function renderFileQueued(file, type) {
    var size = 0, fid = file.id, name = "", type = type || 0;
    var $list = document.querySelector('.file__list');
    var $header, $body;

    function renderHeader() {
      var $h = document.createElement('div');
      $h.classList.add('file__list__header');
      $h.innerHTML = '<div data-key="name">文件名</div><div data-key="size">大小</div><div data-key="time">修改日期</div><div data-key="result">结果</div>';
      $list.appendChild($h);
      return $h;
    }

    function renderBody() {
      var $b = document.createElement('div');
      $b.classList.add('file__list__body');
      $list.appendChild($b);
      return $b;
    }

    function renderItem(fid, type, file, name, size, time) {
      var isImg = !!file.name.toLowerCase().match('(gif|jpg|jpeg|bmp|png)$');

      var $file = document.createElement('div');
      $file.classList.add('file__item');
      $file.id = 'file_item_' + fid;

      $file.innerHTML = '<div class="file__icon" data-type="'+ file.ext +'"></div>'+
        '<div class="file__name">'+ name +'</div>' +
        '<div class="file__size">'+ size +'</div>' +
        '<div class="file__time">'+ time +'</div>' +
        '<div class="file__result" data-result="cancle">' +
          '<a class="js-cancel-upload" href="javascript:;" data-file-id="'+ fid + '" data-type="'+ type + '">取消</a>' + 
        '</div>' +
        '<span class="file__progress" style="width: 0%;"></span>';
      $list.appendChild($file);
      
      // 如果是图片，则显示图片的缩略图
      if (isImg) {
        previewImage(file, function(img) {
          var $img = $file.querySelector('.file__icon');
          $img.style.backgroundImage = 'url('+ img +')';
        });
      }

      return $file;
    }

    /**
     * 生成图片预览图
     * 
     * @param {any} file 
     */
    function previewImage(file, callback) {
      var oFileReader = new FileReader(); // 创建一个FileReader对象

      oFileReader.onload = function (event) {
        callback && callback(event.target.result)
      }

      oFileReader.readAsDataURL(file);
    }

    
    if (file != undefined) {
      if (!document.querySelector('.file__list__header')) {
        $header = renderHeader();
      }
      if (!document.querySelector('.file__list__body')) {
        $body = renderBody();
      }

      // 计算文件大小 单位MB
      size = countFileSize(file.size);
      name = file.name;
      time = formatFileSize(file.lastModifiedDate);

      renderItem(fid, type, file, name, size, time);
    }
  }


  /**
   * 从文件集合中移除文件
   * 
   * @param {any} files 
   * @param {any} fid 
   * @returns 
   */
  function removeFileFromFilesUpload(files, fid) {
    var filesUploadKey = findObjectKey(files, fid);

    if (filesUploadKey > -1) {
      files.splice(filesUploadKey, 1);
    }

    return files;
  }




  //对外部注册的函数
	var uploadHTML5 = {
		/**
		 * 取消上传
		 * @param string fid 文件的Id 
		 */
		cancelUpload : function(fid){
			
			var filesUploadKey = -1;
			var uploadQueueKey = -1;
			
			// 从全局中删除文件
			removeFileFromFilesUpload(filesUpload, fid);
			
			// 如果是正在上传的，AJAX 取消
			if(currUploadfile.id === fid){
				XHR.abort();
			} else {
				// 从上传队列中移除
				removeFileFromFilesUpload(uploadQueue, fid);
      }
      
      console.log(filesUpload);
      console.log(uploadQueue);
    },
    /**
		 * 开始上传
		 */
    startUpload: function() {
      startUpload();
    },
	}
	
	window.uploadHTML5 = uploadHTML5;


})();