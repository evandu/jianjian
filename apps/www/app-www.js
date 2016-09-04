'use strict';

const koa = require('koa');
const hbsKoa = require('koa-handlebars');
const serve = require('koa-static');
const bunyan = require('bunyan');
const koaLogger = require('koa-bunyan');
const handlebars = require('handlebars');


const app = module.exports = koa();
const access = {type: 'rotating-file', path: './logs/www-access.log', level: 'trace', period: '1d', count: 4};
const error = {type: 'rotating-file', path: './logs/www-error.log', level: 'error', period: '1d', count: 4};
const logger = bunyan.createLogger({name: 'www', streams: [access, error]});
app.use(koaLogger(logger, {}));

const weixinConfig = require('./weixin.json');

app.use(function* mysqlConnection(next) {
    this.db = global.db = yield global.connectionPool.getConnection();
    yield this.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    yield next;
    this.db.release();
});


app.use(function* handleErrors(next) {
    try {
        yield next;
    } catch (e) {
        const type = this.accepts('html', 'text', 'json');
        switch (e.status) {
            case 204: // No Content
                this.status = e.status;
                break;
            case 404: // Not Found
            case 406: // Not Acceptable
            case 409: // Conflict
                this.status = e.status;
                if (type == 'json') {
                    this.body = {msg: e.message};
                } else {
                    yield this.render('templates/404-not-found', {msg: e.message});
                }
                break;
            default:
                this.status = e.status || 500;
                const errorMsg = {msg: app.env == 'development' ? e.stack : "服务器出错"};
                if (type == 'json') {
                    this.body = errorMsg;
                } else {
                    yield this.render('templates/500-internal-server-error', errorMsg);
                }
                this.app.emit('error', e, this);
        }
    }
});

app.use(function* ctxAddDomain(next) {
    this.domain = this.host.replace('www.', '');
    yield next;
});

app.use(hbsKoa({
    extension: ['html', 'handlebars'],
    viewsDir: 'apps/www',
    partialsDir: 'apps/www/templates',
    cache: app.env !== 'development',
    handlebars: handlebars,
}));

app.use(function* cleanPost(next) {
    if (this.request.body !== undefined) {
        for (const key in this.request.body) {
            this.request.body[key] = this.request.body[key].trim();
            if (this.request.body[key] == '') this.request.body[key] = null;
        }
    }
    yield next;
});

app.use(serve('public/www', {maxage: 1000 * 60 * 60}));

app.use(require('./routes-other.js'));


app.use(function* weiXin(next) {
    const jianJianOpenId1 = this.cookies.get('jianJianOpenId1');
    if (jianJianOpenId1 && jianJianOpenId1.length > 16){
         this.jianJianOpenId1 = jianJianOpenId1
         yield next;
    }else{
        this.redirect(weixinConfig.weixin.authUrl)
    }
});


app.use(require('./routes-www.js'));

app.use(function* notFound(next) {
    yield next;
    this.status = 404;
    const type = this.accepts('html', 'text', 'json');
    const errorMsg = {"msg": "没有找到对应页面"};
    if (type == 'json') {
        this.body = errorMsg;
    } else {
        yield this.render('templates/404-not-found', errorMsg);
    }
});
