"use strict";

var controllers = require('./lib/controllers'),
	db = module.parent.require('./database'),
	oauthServer = module.parent.require('oauth2-server'),
	util = module.parent.require('util'),
	Promise = module.parent.require('bluebird'),
	plugin = {};


function authenticateMiddleware(server) {
	return function (req, res, next) {
		var request = new oauthServer.Request(req);
		var response = new oauthServer.Response(res);
		request.req = req;

		return Promise.bind(this)
			.then(function () {
				return server.authenticate(request, response);
			})
			.tap(function (token) {
				req.token = token;
			})
			.catch(function (e) {
				throw e;
			})
			.then(function () {
				if (next)
					next();
			})
			.catch(function (e) {
				return handleError(e, req, res, response);
			});
	};
};


function authorizeMiddleware(server) {
	return function (req, res, next) {
		var request = new oauthServer.Request(req);
		var response = new oauthServer.Response(res);
		request.req = req;


		return Promise.bind(this)
			.then(function () {
				return server.authorize(request, response);
			})
			.tap(function (code) {
				req.code = code;
			})
			.then(function () {
				return handleResponse(req, res, response);
			})
			.catch(function (e) {
				throw e;
			})
			.then(function () {
				if (next)
					next();
			})
			.catch(function (e) {
				return handleError(e, req, res, response);
			});
	};
};

function tokenMiddleware(server) {
	return function (req, res, next) {
		var request = new oauthServer.Request(req);
		var response = new oauthServer.Response(res);

		return Promise.bind(this)
			.then(function () {
				return server.token(request, response);
			})
			.tap(function (token) {
				req.token = token;
			})
			.then(function () {
				return handleResponse(req, res, response);
			})
			.catch(function (e) {
				throw e;
			})
			.then(function () {
				if (next)
					next();
			})
			.catch(function (e) {
				return handleError(e, req, res, response);
			});
	};
};

function handleResponse(req, res, response) {
	res.status(response.status);
	res.set(response.headers);
	res.send(response.body);
};

function handleError(e, req, res, response) {
	res.status(e.code);
	if (response) {
		res.set(response.headers);
	}
	res.send({ error: e.name, error_description: e.message });
};

plugin.init = function (params, callback) {
	var router = params.router,
		hostMiddleware = params.middleware,
		hostControllers = params.controllers;

	var handler = {};
	handler.handle = function (req, res) {
		console.log(req.req.uid);
		return req.req.uid;
	}


	router.oauth = new oauthServer({
		model: require("./model"),
		authenticateHandler: handler
	});

	router.authorize = authorizeMiddleware(router.oauth);
	router.token = tokenMiddleware(router.oauth);
	router.authenticate = authenticateMiddleware(router.oauth);

	// Post token.
	router.post('/api/oauth2/token', function (req, res) {
		return router.token(req, res);
	});

	// Get authorization.
	//router.post('/oauth/authorize', function (req, res) {
	// Redirect anonymous users to login page.
	/*if (!req.user) {
		return res.redirect(util.format('/login?redirect=%s&client_id=%s&redirect_uri=%s', req.path, req.query.client_id, req.query.redirect_uri));
	}*/

	//	router.authorize(req, res);
	//});

	router.get('/api/oauth2/authorize', function (req, res, next) {
		if (!req.user) {
			return res.redirect('/login');
		}

		router.authorize(req, res);
	});

	router.post('/secret', router.authenticate, function (req, res) {
		// Will require a valid access_token.
		console.log(JSON.stringify(req.token.user));
		res.send(JSON.stringify(req.token.user));
	});

	// We create two routes for every view. One API call, and the actual route itself.
	// Just add the buildHeader middleware to your route and NodeBB will take care of everything for you.

	router.get('/admin/plugins/oauthserver', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
	router.get('/api/admin/plugins/oauthserver', controllers.renderAdminPage);

	var SocketAdmin = module.parent.require('./socket.io/admin');
	SocketAdmin.settings.saveSettings = function (socket, data, callback) {
		db.set('plugins:oauthserver', JSON.stringify(data), callback);
	};

	callback();
};

plugin.addAdminNavigation = function (header, callback) {
	header.plugins.push({
		route: '/plugins/oauthserver',
		icon: 'fa-tint',
		name: 'OAuth Server'
	});

	callback(null, header);
};

module.exports = plugin;