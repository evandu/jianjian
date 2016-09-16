/**
  * @author  wang-zifei
  * @version 1.0.0  2016/8/22  
  */
(function(){
    // 气泡提示
    $.toast = {
        show: function(msg, delaytime){
            if(this.visible()){
                $.toast.hide();
            }
            var tpl = '<div class="toast">' + this._msg(msg) + '</div>';
            $("body").append(tpl);
            if(delaytime){
                var t= setTimeout(function(){
                    $.toast.hide();
                }, delaytime);
            }
        },
        create: function(msg, close){
            if(this.visible()){
                $.toast.hide();
            }
            if(close){
                var tpl = '<div class="pop-bg"><div class="pop">' + this._msg(msg) + '<a href="javascript:$.toast.hide();" class="pop-close-btn">×</a></div></div>';
            }else{
                var tpl = '<div class="pop-bg"><div class="pop">' + this._msg(msg) + '</div></div>';
            }
            
            $("body").append(tpl);
        },
        success: function(msg, delaytime){
            var tpl = '<span class="toast-icon toast-success"></span>' + this._msg(msg);
            this.show(tpl,delaytime);
        },
        info: function(msg, delaytime){
            var tpl = '<span class="toast-icon toast-info"></span>' + this._msg(msg);
            this.show(tpl,delaytime);
        },
        error: function(msg, delaytime){
            var tpl = '<span class="toast-icon toast-error"></span>' + this._msg(msg);
            this.show(tpl,delaytime);
        },
        alert: function(title,content,sure, cancel){
            var tpl = '<p class="a-title">'+title+'</p><p class="a-sub">'+content+'</p>' +
                '<div class="a-btn-group">' +
                '<a class="toast-cancel" href="javascript: void(0);">否</a>' +
                '<a class="toast-sure" href="javascript: void(0)">是</a></div>';
            this.create(tpl);
            $(".pop-bg").on("click",".toast-cancel",function () {
                $.toast.cancel(cancel);
            })
            $(".pop-bg").on("click",".toast-sure",function () {
                $.toast.sure(sure);
            })
        },
        cancel: function(cancel){
            $.toast.hide();
            if($.isFunction(cancel)) cancel();
            return false;
        },
        sure: function(sure){
            $.toast.hide();
            if($.isFunction(sure)) sure();
            return true;
        },
        loading: function(msg){
            var tpl = '<div class="toast-icon">\
                            <span class="toast-loading-leaf toast-loading-leaf-0"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-1"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-2"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-3"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-4"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-5"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-6"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-7"></span>\
                        </div>'+this._msg(msg); 
            this.show(tpl);
        },
        hide: function(){
            if($(".toast")){
                $(".toast").remove();
            };
            if($(".pop")){
                $(".pop-bg").remove();
            };
        },
        visible: function(){
            return Boolean($(".toast").length);
        },
        _msg: function(msg){ 
            return msg || "";
        }
    };
})(jQuery);

function checkForm(){};
checkForm.prototype.isEmpty = function (target) {
    var hasError = false;
    var notEmpty = $(target).find("[data-empty='no']");
    $.each(notEmpty, function (idx, elem) {
        var val = $(elem).val();
        if($(elem).is("select")){
            val = $(elem).prev().val();
        }
        if (!hasError && val.length == 0) {
            hasError = true;
            $.toast.error($(elem).attr("placeholder") + "不能为空");
            return;
        }
        if (!hasError && $(elem).attr("type") == "tel") {
            if (!(/^1[3|4|5|7|8]\d{9}$/.test(val))) {
                hasError = true;
                $.toast.error("您填写的手机号格式不正确，请重新填写。");
            }
        }
    })

    var email = $(target).find("[type='email']");
    if(!hasError){
        $.each(email, function (idx, elem) {
            var val = $(elem).val();
            if(val!='' ){
                if (!(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(val))) {
                    hasError = true;
                    $.toast.error("您填写的邮箱格式不正确，请重新填写。");
                }
                return;
            }
        })
    }

    var isLimit = $(target).find("[data-length]");
    $.each(isLimit, function (idx, elem) {
        var val = $(elem).val();
        var limit = parseInt($(elem).attr("data-length"));
        if(!hasError && val.length < limit){
            $.toast.error($(elem).attr("placeholder") + "不能少于"+limit+"个汉字");
            hasError = true;
            return;
        }
    })

    return hasError;
}


function initHeight(){
    var h = $(window).height()*0.78;
    $(".deal-container").height(h+"px");
}

var userAgent = navigator.userAgent;
function IsPC () {  
  var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");  
  var flag = true;  
  for (var v = 0; v < Agents.length; v++) {  
     if (userAgent.indexOf(Agents[v]) > 0) { flag = false; break; }  
  }  
  return flag;  
}  

function initSwiper(){
    $("head").append('<link rel="stylesheet" href="/plus/swiper/swiper3.07.min.css" />');
    $("head").append('<link rel="stylesheet" href="/css/aboutme.css" type="text/css" />');
    var navObj = ["首页","关于何勒","产品服务","联系我们"];
    var mySwiper = new Swiper(".swiper-container", {
        direction : 'vertical',
        autoHeight: true,
        slidesPerView: 'auto',
        freeMode : true,
        freeModeMomentum : false,
        parallax : true,
        grabCursor : true,
        resistanceRatio : 0,
        iOSEdgeSwipeDetection : true,
        watchSlidesProgress : true,
        mousewheelControl : true,
        mousewheelReleaseOnEdges : true,
        pagination: '.swiper-nav',
        paginationClickable: true,
        paginationBulletRender: function (index, className) {
            return '<span class="' + className + '">' + navObj[index] + '</span>';
        }
    })
}



//微信支付的代码

function onBridgeReady(config) {
    WeixinJSBridge.invoke(
        'getBrandWCPayRequest',config,
        function (res) {
            if (res.err_msg.indexOf("ok") >-1 ) {
                window.location.href="/pay-success"
            }else if(res.err_msg.indexOf('cancel') >-1 ){
               alert("支付已取消")
            }else{
                window.location.href="/pay-error"
            }
        }
    );
}

function wechatPay(config) {
    if (typeof WeixinJSBridge == "undefined") {
        if (document.addEventListener) {
            document.addEventListener('WeixinJSBridgeReady', function(){onBridgeReady(config)}, false);
        } else if (document.attachEvent) {
            document.attachEvent('WeixinJSBridgeReady', function(){onBridgeReady(config)});
            document.attachEvent('onWeixinJSBridgeReady', function(){onBridgeReady(config)});
        }
    } else {
        onBridgeReady(config);
    }
}


