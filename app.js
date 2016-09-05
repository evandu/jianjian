
'use strict';
/* eslint no-shadow:off */

const koa          = require('koa');
const body         = require('koa-body');
const compose      = require('koa-compose');
const compress     = require('koa-compress');
const responseTime = require('koa-response-time');
const session      = require('koa-session');
const mysql        = require('mysql-co');
const moment = require('moment');
const Order = require('./models/order');
const _ = require('lodash');


const app = module.exports = koa();
const handlebars = require('handlebars');

app.use(responseTime());

app.use(compress({}));

app.use(function* robots(next) {
    yield next;
    if (this.hostname.slice(0,3) != 'www') this.response.set('X-Robots-Tag', 'noindex, nofollow');
});

app.use(body());
app.keys = ['jianjian-app'];
app.use(session(app));

handlebars.registerHelper('static', function () {
    return '/static';
});

handlebars.registerHelper('ctx', function () {
    return '';
});

handlebars.registerHelper('YYYY年MM月DD日', function (timestamp) {
    return moment(new Date(timestamp)).format('YYYY年MM月DD日')
});

handlebars.registerHelper('yyy-MM-ddHHmmss', function(timestamp) {
    return moment(new Date(timestamp)).format('YYYY-MM-DD HH:mm:ss')
});


handlebars.registerHelper('price', function (price1, price2) {
    if (!price2) price2 = 0;
    if (!price1) price1 = 0;
    return (price2 + price1) / 100.00
});


handlebars.registerHelper('amount', function (price1) {
    if (!price1) price1 = 0;
    return (price1) / 100.00
});

handlebars.registerHelper('gender', function (status) {
   return status == 1? '男':'女'
});


handlebars.registerHelper('OrderStatus', function (key) {
    return Order.Status[key];
});

handlebars.registerHelper('nextStatus', function (key) {
    return Order.Status[1+parseInt(key)];
});


handlebars.registerHelper('OrderTimeline', function (currStatus, status) {
    if(currStatus > status){
        return 'prev'
    }else if(currStatus  == status) {
        return 'active'
    }else{
        return ''
    }
});

handlebars.registerHelper('compare', function(left, operator, right, options) {
    if (arguments.length < 3) {
        throw new Error('Handlerbars Helper "compare" needs 2 parameters');
    }
    const operators = {
        'in':     function(l, r) {return _.find(r.split(","), f=>f==l) },
        '==':     function(l, r) {return l == r; },
        '===':    function(l, r) {return l === r; },
        '!=':     function(l, r) {return l != r; },
        '!==':    function(l, r) {return l !== r; },
        '<':      function(l, r) {return l < r; },
        '>':      function(l, r) {return l > r; },
        '<=':     function(l, r) {return l <= r; },
        '>=':     function(l, r) {return l >= r; },
        'typeof': function(l, r) {return typeof l == r; },
    };

    if (!operators[operator]) {
        throw new Error('Handlerbars Helper "compare" doesn\'t know the operator ' + operator);
    }

    const result = operators[operator](left, right);

    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

const config = require('./config/db-'+app.env+'.json');
global.connectionPool = mysql.createPool(config.db);

app.use(function* subApp(next) {
    /* eslint no-unused-vars:off */
    const subapp = this.hostname.split('.')[0];

    switch (subapp) {
        case 'admin':
            yield compose(require('./apps/admin/app-admin.js').middleware);
            break;
        case 'www':
            yield compose(require('./apps/www/app-www.js').middleware);
            break;
        default: // no (recognised) subdomain? canonicalise host to www.host
            // note switch must include all registered subdomains to avoid potential redirect loop
            this.redirect(this.protocol+'://'+'www.'+this.host+this.path+this.search);
            break;
    }
});

if (!module.parent) {
    /* eslint no-console:off */
    const port = process.env.PORT||9000;
    app.listen(port);
    const db = require('./config/db-'+app.env+'.json').db.database;
    console.log(process.version+' listening on port '+port+' ('+app.env+'/'+db+')');
}
