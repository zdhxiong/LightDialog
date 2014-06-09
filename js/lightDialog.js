/*!
 * lightDialog v0.1
 * 基于dialogTools v0.1 修改而来 http://www.planeart.cn/
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function ($, window, undefined) {
	var _$body, _zIndexMaxElem,
		_docElem = document.documentElement,
		_$window = $(window),
		_$document = $(document),
		_isSetCapture = 'setCapture' in _docElem,
		_zIndexInit = 9,
		_call = function (object, fn) {
			return function () {
				return fn.apply(object, arguments);
			};
		};

	// 页面初始化
	$(function(){
		_$body = $('body');

		// 获取页面最大的zIndex
		var zIndex;
		$.each(this.getElementsByTagName('*'), function(i, name){
			zIndex = (name.style && parseFloat($(name).css('zIndex'))) || 0;
			_zIndexInit = Math.max(zIndex, _zIndexInit);
		});
	});

	$.lightDialog = function () {
		this.init.apply(this, arguments);
	};

	$.lightDialog.fn = $.lightDialog.prototype = {
		title: 'title',			// 标题名称
		topStyle: 'AT-focus',	// 置顶后的样式
		fixed: true,			// 是否设置为静止定位
		left: 'center',			// X轴距离
		top: 'center',			// Y轴距离
		width: 600,				// 初始宽度
		height: 360,			// 初始高度
		limit: false,			// 是否将移动位置的范围限制在可视范围
		drag: true,				// 是否允许拖拽调节位置与尺寸
		showHeader: true,		// 是否显示header
		actions:['close'],		// 显示的操作按钮，所有可用的操作 目前只有一个close
		dblfull: true,			// 是否双击handle时切换全屏状态
		ondown: $.noop,			// 鼠标按下准备拖动的回调函数
		onmove: $.noop,			// 鼠标拖动过程中的回调函数
		onup: $.noop,			// 鼠标拖动过程结束的回调函数
		onremove: $.noop,		// 移除窗口后的回调函数
		onshow: $.noop,			// 显示后的回调函数
		onhide: $.noop,			// 隐藏后的回调函数
		onfull: $.noop,			// 全屏后的回调函数
		onunfull: $.noop,		// 取消全屏的回调函数

		// 初始化
		init: function (wrapper, options) {
			var that = this;

			var i, resizes, dgr, cgr,
				leftInit = that.left,
				topInit = that.top,
				resize = that.resize,
				down = that.down,
				up = that.up,
				move = that.move,
				fullSwitch = that.fullSwitch,
				size = that.size,
				remove = that.remove;

			// 窗口外围
			that.wrapper = $(wrapper);

			// 获取窗口内容
			that.contentVal = that.wrapper.html();

			// 改变事件函数的作用域
			that.resize = _call(that, resize);
			that.down = _call(that, down);
			that.up = _call(that, up);
			that.move = _call(that, move);
			that.fullSwitch = _call(that, fullSwitch);
			that.size = _call(that, size);
			that.remove = _call(that, remove);

			// 填充默认设置
			if(options){
				$.each(options, function (name, val) {
					that[name] = val;
				});
			}

			//------------------模板
			// 不同操作的模板
			that.tpl_actions = {};
			that.tpl_actions.close =
				'<a href="javascript:void(0)" class="lu-window-action lu-window-action-close">×</a>';
			// 遍历添加操作
			for(var index in that.actions){
				that.tpl_actions_show = that.tpl_actions[that.actions[index]];
			}
			// 头部模板
			that.tpl_header =
				'<div class="lu-window-header">' +
					'<div class="lu-window-title">' + that.title + '</div>' +
					'<div class="lu-window-actions">'+ that.tpl_actions_show +'</div>' +
				'</div>';
			// 内容模板
			that.tpl_content =
				'<div class="lu-window-content">' + that.contentVal + '</div>';
			// 拖拽模板
			that.tpl_drag =
				'<div class="lu-window-resize lu-window-resize-n"></div>' +
				'<div class="lu-window-resize lu-window-resize-e"></div>' +
				'<div class="lu-window-resize lu-window-resize-s"></div>' +
				'<div class="lu-window-resize lu-window-resize-w"></div>' +
				'<div class="lu-window-resize lu-window-resize-se"></div>' +
				'<div class="lu-window-resize lu-window-resize-sw"></div>' +
				'<div class="lu-window-resize lu-window-resize-ne"></div>' +
				'<div class="lu-window-resize lu-window-resize-nw"></div>';

			//组织模板
			that.tpl = '';
			if(that.showHeader){
				that.tpl = that.tpl_header;
			}
			if(!that.drag){
				that.tpl = that.tpl + that.tpl_content;
			}else{
				that.tpl = that.tpl + that.tpl_content + that.tpl_drag;
			}
			that.tpl = '<div class="lu-window">' + that.tpl + '</div>';

			//创建窗口
			_$body.append(that.tpl);
			that.dialog = _$body.find('.lu-window').last().css({margin: 0});

			that.handle = that.dialog.find('.lu-window-header');
			that.content = that.dialog.find('.lu-window-content');
			that.resizes = {
				nw:	that.dialog.find('.lu-window-resize-nw'),
				n:	that.dialog.find('.lu-window-resize-n'),
				ne:	that.dialog.find('.lu-window-resize-ne'),
				e:	that.dialog.find('.lu-window-resize-e'),
				se:	that.dialog.find('.lu-window-resize-se'),
				s:	that.dialog.find('.lu-window-resize-s'),
				sw:	that.dialog.find('.lu-window-resize-sw'),
				w:	that.dialog.find('.lu-window-resize-w')
			};
			that.close = that.dialog.find('.lu-window-action-close');

			that.clientX = that.clientY = 0;

			// 记录内容区最小尺寸 [内部尺寸]
			that.minWidth = that.content[0].clientWidth;
			that.minHeight = that.content[0].clientHeight;

			// 计算内容区域的边框厚度
			that.xBorder = that.content[0].offsetWidth - that.content[0].clientWidth;
			that.yBorder = that.content[0].offsetHeight - that.content[0].clientHeight;

			// 计算内容区域与容器的边距
			dgr = that.dialog[0].getBoundingClientRect();
			cgr = that.content[0].getBoundingClientRect();
			that.xSize = cgr.left - dgr.left + dgr.right - cgr.right;
			that.ySize = cgr.top - dgr.top + dgr.bottom - cgr.bottom;

			if (that.drag) {
				// 绑定调节把柄事件
				resizes = that.resizes;
				for (i in resizes) {
					$(resizes[i]).bind('mousedown', that.down).css('cursor', i + '-resize')[0]['{$resizes}'] = i;
				}

				// 绑定拖拽把柄事件
				that.handle.bind('mousedown', that.down).css('cursor', 'move');
			}

			// 绑定浏览器窗口调节事件
			// IE resize事件有BUG，容易误触发
			if(!document.all){
				_$window.bind('resize', that.resize);
			}

			//绑定双击handle切换全屏状态
			if(that.dblfull){
				that.handle.bind('dblclick', that.fullSwitch);
			}

			// 绑定关闭按钮事件
			that.close.bind('click', that.remove);

			// 避免特殊情况导致无法卸载停止拖动
			_$document.bind('dblclick', that.up);

			//定位方式
			that.dialog.css('position', that.fixed ? 'fixed' : 'absolute');

			// 设置位置
			that.position(leftInit, topInit);
			// 初始大小
			that.size(that.width, that.height);
			// 再次设置位置
			that.position(leftInit, topInit);
		},

		/** 显示窗口 */
		show: function(){
			var that = this;
			that.dialog.css('visibility','visible');
			that.onshow(that.dialog);
		},

		hide: function(){
			var that = this;
			that.dialog.css('visibility','hidden');
			that.onhide(that.dialog);
		},

		/** 指定位置 */
		position: function (left, top) {
			var setLeft, setTop,
				that = this,
				style = that.dialog[0].style;

			that.positionAuto = function () {
				that.setCache();

				switch (left) {
					case 'left':
						setLeft = that.minLeft;
						break;
					case 'center':
						setLeft = Math.max(Math.min(that.centerX, that.maxLeft), that.minLeft);
						break;
					case 'right':
						setLeft = that.maxLeft;
						break;
					default:
						setLeft = left;
						break;
				}

				switch (top) {
					case 'top':
						setTop = that.minTop;
						break;
					case 'center':
						setTop = Math.max(Math.min(that.centerY, that.maxTop), that.minTop);
						break;
					case 'bottom':
						setTop = that.maxTop;
						break;
					default:
						setTop = top;
						break;
				}

				style.left = (that.limit ? Math.max(that.minLeft, Math.min(setLeft, that.maxLeft)) : setLeft) + 'px';
				style.top = (that.limit ? Math.max(that.minTop, Math.min(setTop, that.maxTop)) : setTop) + 'px';
			};
			that.positionAuto();
			that.zIndex();
		},

		/** 跟随元素 */
		follow: function (elem) {
			var that = this,
			//classX = 'center',
			//classY = 'bottom',
				$elem = (elem && $(elem)) || that.followElem,
				winWidth = _$window.width(),
				winHeight = _$window.height(),
				docLeft =  _$document.scrollLeft(),
				docTop = _$document.scrollTop(),
				offset = $elem.offset(),
				width = $elem[0].offsetWidth,
				height = $elem[0].offsetHeight,
				left = that.fixed ? offset.left - docLeft : offset.left,
				top = that.fixed ? offset.top - docTop : offset.top,
				dialog = that.dialog[0],
				style = dialog.style,
				dialogWidth = dialog.offsetWidth,
				dialogHeight = dialog.offsetHeight,
				setLeft = left - (dialogWidth - width) / 2,
				setTop = top + height,
				dl = that.fixed ? 0 : docLeft,
				dt = that.fixed ? 0 : docTop;

			if (setLeft + dialogWidth > winWidth) {
				setLeft = left - dialogWidth + width;
				//classX = 'right';
			}
			if (setLeft < dl) {
				setLeft = left;
				//classX = 'left';
			}
			if (setTop + dialogHeight > winHeight + dt) {
				setTop = top - dialogHeight;
				//classY = 'top';
			}

			style.left = setLeft + 'px';
			style.top = setTop + 'px';

			that.followElem = $elem;
			that.positionAuto = that.follow;
			that.zIndex();
		},

		/**
		 *	调节尺寸
		 *	@param	{Number}	宽度
		 *	@param	{Number}	高度
		 *	@param	{Boolean}	(可选)为true表示参照物为内容区域
		 */
		size: function (width, height, isContent) {
			var that = this;
			if (!isContent) {
				width = width - that.xSize;
				height = height - that.ySize;
			}
			that.setCache();

			width = Math.max(Math.min(width, that.maxWidth), that.minWidth);
			height = Math.max(Math.min(height, that.maxHeight), that.minHeight);

			that.dialog.css({
				width: 'auto',
				height: 'auto'
			});
			that.content.css({
				width: width + 'px',
				height: height + 'px'
			});

		},

		/** 全屏 */
		full: function () {
			var that = this,
				width = _$window.width() - that.xSize,
				height= _$window.height() - that.ySize;

			// 全屏之前记录状态，取消全屏时恢复之前状态
			that.recordWidth = that.offsetWidth;
			that.recordHeight = that.offsetHeight;
			that.recordLeft = that.left;
			that.recordTop = that.top;

			that.dialog.css({
				width: 'auto',
				height: 'auto',
				left: 0,
				top: 0
			});

			that.content.css({
				width: width + 'px',
				height: height + 'px'
			});
			that.onfull(that.dialog);
		},

		/** 切换全屏状态 */
		fullSwitch: function(){
			var that = this,
				width = _$window.width() - that.xSize,
				height= _$window.height() - that.ySize;

			//已经是全屏状态，对全屏状态的判断允许有误差，避免鼠标产生小范围的误拖动
			if(Math.abs(that.maxWidth - width) < 5 && Math.abs(that.maxHeight - height) < 5){
				that.size(that.recordWidth, that.recordHeight);
				that.position(that.recordLeft, that.recordTop);
				that.onunfull(that.dialog);
			}else{
				that.full();
			}
		},

		/** 置顶z-index */
		zIndex: function () {
			var that = this;
			_zIndexInit = Math.max(parseFloat(that.dialog.css('zIndex')) || 0, _zIndexInit);
			_zIndexInit ++;
			that.dialog.css('zIndex', _zIndexInit);
			if(that.mask){
				that.mask.css('zIndex', _zIndexInit - 1);
			}
			// 设置最高层的样式
			if (_zIndexMaxElem){
				_zIndexMaxElem.removeClass(that.topStyle);
			}
			_zIndexMaxElem = that.dialog;
			that.dialog.addClass(that.topStyle);
		},

		/** 删除层 */
		remove: function () {
			var that = this;
			that.up();
			_$window.unbind('resize', that.resize);
			that.dialog.remove();
			that.onremove();
		},

		// 设置数据缓存
		setCache: function (event) {
			var that = this, hc,
				dialog = that.dialog[0],
				content = that.content[0],
				dow = dialog.offsetWidth,
				dcw = dialog.clientWidth,
				ww = _$window.width(),
				wh = _$window.height(),
				doh = dialog.offsetHeight,
				dch = dialog.clientHeight,
				dl = that.fixed ? 0 : _$document.scrollLeft(),
				dt = that.fixed ? 0 : _$document.scrollTop(),
				left = parseFloat(that.dialog.css('left') || 0),
				top = parseFloat(that.dialog.css('top') || 0),
				handle = [1, 1, 0, 0],
				resizes = {
					nw:	[1, 1, -1, -1],		// 左上角\
					n:	[0, 1, 0, -1],		// 上边\
					ne:	[0, 1, 1, -1],		// 右上角\
					e:	[0, 0, 1, 0],		// 右边
					se:	[0, 0, 1, 1],		// 右下角
					s:	[0, 0, 0, 1],		// 下边
					sw:	[1, 0, -1, 1],		// 左下角
					w:	[1, 0, -1, 0]		// 左边
				},
				resizesVal = event && event.target['{$resizes}'],
				val = (resizesVal && resizes[resizesVal]) || handle;

			if (event) {
				that.clientX = event.clientX;
				that.clientY = event.clientY;
			}
			that.dragKey = val;

			that.isMove = resizesVal ? false : true;

			// 获取容器的尺寸
			that.clientWidth = dcw;
			that.clientHeight = dch;
			that.offsetWidth = dow;
			that.offsetHeight = doh;

			// 获取容器的坐标轴
			that.left = left;
			that.top = top;

			// 坐标最小值限制
			that.minLeft = dl;
			that.minTop = dt;

			// 坐标最大值限制
			that.maxLeft = !that.isMove && val[0] === 1 ? left + dcw - that.minWidth - that.xSize : ww - dow + dl;
			that.maxTop = !that.isMove && val[1] === 1 ? top + dch - that.minHeight - that.ySize : wh - doh + dt;

			// 最大尺寸限制 [内部尺寸]
			that.maxWidth = (val[0] === 0 ? ww - left + dl : dow + left - dl) - that.xSize;
			that.maxHeight = (val[1] === 0 ? wh - top + dt : doh + top - dt) - that.ySize;

			// 计算居中的坐标
			that.centerX = (that.maxLeft + dl) / 2;
			that.centerY = doh < 4 * wh / 7 ? wh * 0.382 - doh / 2 + dt : (that.maxTop + dt) / 2; // 黄金比例

		},

		// 清除文本选择
		clsSelect: 'getSelection' in window ?
			function () {
				window.getSelection().removeAllRanges();
			} : function () {
			try {
				document.selection.empty();
			} catch (e) {}
		},

		// 浏览器窗口调整
		resize: function () {
			this.positionAuto();
		},

		// 鼠标按下
		down: function (event) {
			var that = this;

			if (!that.drag){
				return;
			}

			that.setCache(event);
			that.zIndex();

			_$document.bind('mousemove', that.move).bind('mouseup', that.up);

			// IE鼠标超出视口仍可被监听
			if(_isSetCapture){
				that.handle[0].setCapture();
			}

			// 防止无范围限制拖动到边界造成容器变形
//			if((!that.limit && that.dialog[0] !== that.content[0])){
//				that.dialog.css({
//					width: that.isMove ? that.clientWidth + 'px' : 'auto',
//					height: that.isMove ? that.clientHeight + 'px' : 'auto'
//				});
//			}

			event.preventDefault();
			that.ondown(that.left, that.top, that.offsetWidth, that.offsetHeight);
		},

		// 鼠标松开
		up: function (event) {
			var that = this;
			_$document.unbind('mousemove', that.move).unbind('mouseup', that.up);

			if(_isSetCapture){
				that.handle[0].releaseCapture();
			}

			that.setCache(event);
			that.onup(that.left, that.top, that.offsetWidth, that.offsetHeight);
		},

		// 鼠标移动
		move: function (event) {
			var dialog, content, left, top, width, height,
				that = this,
				clientX = event.clientX - that.clientX,
				clientY = event.clientY - that.clientY;
			if (!that.drag){
				return;
			}

			left = clientX * that.dragKey[0] + that.left;
			top = clientY * that.dragKey[1] + that.top;
			width = Math.max(clientX * that.dragKey[2] + that.clientWidth - that.xSize, that.minWidth);
			height = Math.max(clientY * that.dragKey[3] + that.clientHeight - that.ySize, that.minHeight);

			if (that.limit || !that.isMove) {
				left = Math.max(Math.min(left, that.maxLeft), that.minLeft);
				top = Math.max(Math.min(top, that.maxTop), that.minTop);
				width = Math.min(width, that.maxWidth);
				height = Math.min(height, that.maxHeight);
			}
			//上边框不能拖拽出浏览器窗口
			if(top<0){
				top = 0;
			}

			dialog = that.dialog[0].style;
			content = that.content[0].style;
			dialog.left = left + 'px';
			dialog.top = top + 'px';
			content.width = width + 'px';
			content.height = height + 'px';

			that.clsSelect();
			that.onmove(left, top, that.dialog[0].offsetWidth, that.dialog[0].offsetHeight);
		}

	};

})(window.Zepto || window.jQuery, this);