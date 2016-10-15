'use strict';

const koa = require('koa');
const hbsKoa = require('koa-handlebars');
const serve = require('koa-static');
const koaLogger = require('koa-bunyan');
const handlebars = require('handlebars');
const logger = require('./../../lib/logger');

const app = module.exports = koa();

app.use(koaLogger(logger, {}));

app.use(function* mysqlConnection(next) {
    this.db = global.db = yield global.connectionPool.getConnection();
    yield this.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    yield next;
    this.db.release();
});


app.use(function* xml(next) {
    const ctx = this
    if(ctx.is('text/xml')){
        ctx.request.body =yield new Promise((resolve, reject) => {
            let xml = '';
            ctx.req.on('data', chunk => xml += chunk.toString('utf-8'))
                .on('error', reject)
                .on('end', () =>resolve(xml))
        })
    }
    yield next;
});

app.use(function* handleErrors(next) {
    try {
        yield next;
    } catch (e) {
        logger.error(e)
        const type = this.accepts('html', 'text', 'json');
        switch (e.status) {
            case 204: // No Content
                this.status = e.status;
                break;
            case 403:
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
    if (!this.is('text/xml') && this.request.body !== undefined) {
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
    // 过滤静态文件路径及其他资源文件
    if(this.url.indexOf(".") == -1){
        const healthLabToken = "1234567890123456"//this.cookies.get(this.envConfig.weixin.tokenName);
     //   const healthLabToken = this.cookies.get(this.envConfig.weixin.tokenName);
        if (healthLabToken && healthLabToken.length >= 16){
            this.healthLabToken = healthLabToken
            yield next;
        }else{
            this.cookies.set("nextUrl", this.url);
            this.redirect(this.envConfig.weixin.authUrl)
        }
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
