'use strict';

const Koa = require('koa');
const serve = require('koa-static');
const router = require('koa-router')();
const bodyParser = require('koa-bodyparser')();

const getCardsController = require('./controllers/cards/get-cards');
const createCardController = require('./controllers/cards/create-cards');
const deleteCardController = require('./controllers/cards/delete-cards');

const getTransactionsController = require('./controllers/transactions/get-transaction');
const createTransactionsController = require('./controllers/transactions/create-transaction');

const errorController = require('./controllers/error');

const ApplicationError = require('libs/application-error');
const CardsModel = require('source/models/cards');
const TransactionsModel = require('source/models/transactions');

const app = new Koa();

// Сохраним параметр id в ctx.params.id
router.param('id', (id, ctx, next) => next());
// Cards
router.get('/cards/', getCardsController);
router.post('/cards/', createCardController);
router.delete('/cards/:id', deleteCardController);
// Transactions
router.get('/cards/:id/transactions/', getTransactionsController);
router.post('/cards/:id/transactions/', createTransactionsController);

router.all('/error', errorController);

// logger
app.use(async (ctx, next) => {
	const start = new Date();
	await next();
	const ms = new Date() - start;
	console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// error handler
app.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		console.log('Error detected', err);
		ctx.status = err instanceof ApplicationError ? err.status : 500;
		ctx.body = `Error [${err.message}] :(`;
	}
});

// Создадим модель Cards на уровне приложения и проинициализируем ее
app.use(async (ctx, next) => {
	ctx.CardsModel = new CardsModel();
	await ctx.CardsModel.loadFile();
	await next();
});

// Создадим модель Transactions на уровне приложения и проинициализируем ее
app.use(async (ctx, next) => {
    ctx.TransactionsModel = new TransactionsModel();
    await ctx.TransactionsModel.loadFile();
    await next();
});

app.use(bodyParser);
app.use(router.routes());
app.use(serve('./public'));

app.listen(3001, () => {
	console.log('Application started');
});
