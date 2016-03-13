'use strict';

var Controllers = {},
	db = module.parent.parent.require('./database');

	
function getSettings(callback) {
	db.get('plugins:oauthserver', function(err, data) {
		callback(err, JSON.parse(data));
	});
}

Controllers.renderAdminPage = function (req, res, next) {
	/*
		Make sure the route matches your path to template exactly.

		If your route was:
			myforum.com/some/complex/route/
		your template should be:
			templates/some/complex/route.tpl
		and you would render it like so:
			res.render('some/complex/route');
	*/
	getSettings(function(err, data){
		res.render('admin/plugins/oauthserver', {
			clients: data
		});
	});
};

module.exports = Controllers;