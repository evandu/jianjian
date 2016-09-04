/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* 'Admin' app - basic pages for adding/editing/deleting members & teams                          */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';


const koa        = require('koa');
const flash      = require('koa-flash');
const hbsKoa     = require('koa-handlebars');
const lusca      = require('koa-lusca');
const passport   = require('koa-passport');
const serve      = require('koa-static');
const bunyan     = require('bunyan');
const koaLogger  = require('koa-bunyan');
const handlebars = require('handlebars');


const app = module.exports = koa();
// logging
const access = { type: 'rotating-file', path: './logs/admin-access.log', level: 'trace', period: '1d', count: 4 };
const error  = { type: 'rotating-file', path: './logs/admin-error.log',  level: 'error', period: '1d', count: 4 };
const logger = bunyan.createLogger({ name: 'admin', streams: [access, error] });
app.use(koaLogger(logger, {}));

app.use(function* mysqlConnection(next) {
    this.db = global.db = yield global.connectionPool.getConnection();
    yield this.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    yield next;
    this.db.release();
});


require('./passport.js');
app.use(passport.initialize());
app.use(passport.session());


app.use(function* handleErrors(next) {
    try {
        yield next;
    } catch (e) {
        let context = null;
        this.status = e.status || 500;
        switch (this.status) {
            case 404:
                context = { msg: e.message=='Not Found'?null:e.message };
                yield this.render('templates/404-not-found', context);
                break;
            case 403:
            case 409:
                yield this.render('templates/400-bad-request', e);
                break;
            case 500:
                context = app.env=='production' ? {} : { e: e };
                yield this.render('templates/500-internal-server-error', context);
                this.app.emit('error', e, this); // github.com/koajs/examples/blob/master/errors/app.js
                break;
        }
    }
});

app.use(hbsKoa({
    extension:    ['html', 'handlebars'],
    viewsDir:     'apps/admin',
    partialsDir:   'app/templates/partials',
    cache:         app.env !== 'development',
    layoutsDir:    'apps/admin/templates/layouts',
    defaultLayout: 'main',
    handlebars:    handlebars,
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

app.use(flash());


app.use(function* ctxAddDomain(next) {
    this.domain = this.host.replace('admin.', '');
    yield next;
});


app.use(serve('public/admin', { maxage: 1000*60*60 }));

app.use(require('./routes/login-routes.js'));


app.use(function* authSecureRoutes(next) {
    if (this.isAuthenticated()) {
        yield next;
    } else {
        this.redirect('/login');
    }
});


app.use(require('./routes/admin-routes.js'));
app.use(require('./routes/logs-routes.js'));

app.use(function* notFound(next) {
    yield next;
    this.status = 404;
    yield this.render('templates/404-not-found',{module:{
        name:    '404页面'
    }});
});


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
