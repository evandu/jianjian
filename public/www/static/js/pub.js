/**
 * @author  wang-zifei
 * @version 1.0.0  2016/8/22
 */
(function () {
    // 气泡提示
    $.toast = {
        show: function (msg, delaytime) {
            if (this.visible()) {
                $.toast.hide();
            }
            var tpl = '<div class="toast">' + this._msg(msg) + '</div>';
            $("body").append(tpl);
            if (delaytime) {
                var t = setTimeout(function () {
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
        success: function (msg, delaytime) {
            var tpl = '<span class="toast-icon toast-success"></span>' + this._msg(msg);
            this.show(tpl, delaytime);
        },
        info: function (msg, delaytime) {
            var tpl = '<span class="toast-icon toast-info"></span>' + this._msg(msg);
            this.show(tpl, delaytime);
        },
        error: function (msg, delaytime) {
            var tpl = '<span class="toast-icon toast-error"></span>' + this._msg(msg);
            this.show(tpl, delaytime);
        },
        alert: function (title, content, sure, cancel) {
            var tpl = '<p class="a-title">' + title +
                '</p><p class="a-sub">' + content +
                '</p><div class="a-btn-group">' +
                '<a class="toast-cancel" href="javascript: void(0);">否</a>' +
                '<a class="toast-sure" href="javascript: void(0);">是</a>' +
                '</div>';
            this.create(tpl);
            $(".pop-bg").on("click",".toast-cancel",function () {
                $.toast.cancel(cancel);
            })
            $(".pop-bg").on("click",".toast-sure",function () {
                $.toast.sure(sure);
            })
        },
        cancel: function (cancel) {
            $.toast.hide();
            if($.isFunction(cancel)) cancel();
            return false;
        },
        sure: function (sure) {
            $.toast.hide();
            if($.isFunction(sure)) sure();
            return true;
        },
        loading: function (msg) {
            var tpl = '<div class="toast-icon">\
                            <span class="toast-loading-leaf toast-loading-leaf-0"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-1"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-2"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-3"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-4"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-5"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-6"></span>\
                            <span class="toast-loading-leaf toast-loading-leaf-7"></span>\
                        </div>' + this._msg(msg);
            this.show(tpl);
        },
        hide: function () {
            if ($(".toast")) {
                $(".toast").remove();
            }
            ;
            if ($(".pop")) {
                $(".pop-bg").remove();
            }
            ;
        },
        visible: function () {
            return Boolean($(".toast").length);
        },
        _msg: function (msg) {
            return msg || "";
        }
    };
})(jQuery);

function checkForm() {};

checkForm.prototype.isEmpty = function (target) {
    var hasError = false;
    var notEmpty = $(target).find("[data-empty='no']");
    $.each(notEmpty, function (idx, elem) {
        var val = $(this).val();
        if (val.length == 0) {
            hasError = true;
            $.toast.error($(this).attr("placeholder") + "不能为空", 5000);
            return;
        }
        if ($(elem).attr("type") == "tel") {
            if (!(/^1[3|4|5|7|8]\d{9}$/.test(val))) {
                hasError = true;
                $.toast.error("您填写的手机格式不正确，请重新填写。");
            }
        }
    })
    return hasError;
}



function initHeight(){
    var h = $(window).height()*0.78;
    $(".deal-container").height(h+"px");
}