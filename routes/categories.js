var express = require('express');
var router = express.Router();
var cassandra = require('cassandra-driver');

var client = new cassandra.Client({ contactPoints: ['127.0.0.1'] });
client.connect(function (err, result) {
	console.log('Cassandra Connected');
});

router.get('/', function (req, res, next) {
	var query = "SELECT * FROM findadoc.categories";
	client.execute(query, [], function (err, results) {
		if (err) {
			res.status(404).send({ msg: err });
		} else {
			//res.json(result);
			res.render('categories', {
				categories: results.rows
			});
		}
	});
});

//Get Add-category page
router.get('/add', function (req, res, next) {
	res.render('add-categories');
});

//Get Edit page
router.get('/edit/:id', function (req, res, next) {
	var query = "SELECT * FROM findadoc.categories WHERE cat_id = ?";
	client.execute(query, [req.params.id], function (err, result) {
		if (err) {
			res.status(404).send({ msg: err });
		} else {
			//res.json(result);
			res.render('edit-categories', {
				category: result.rows['0']
			});
		}
	});
});

//Edit method for Ctegories
router.post('/edit/:id', function (req, res, next) {
	var query = "UPDATE findadoc.categories SET name ='" + req.body.name + "' WHERE cat_id = " + req.params.id;
	client.execute(query,
		[], { prepare: true }, function (err, result) {
			if (err) {
				res.status(404).send({ msg: err });
			} else {
				res.location('/categories');
				res.redirect('/categories');
			}
		});
});

//Post method for Categories
router.post('/add', function (req, res, next) {
	///Form Validator
	req.checkBody('name', 'Name is required').notEmpty();
	// Check Errors
	var errors = req.validationErrors();
	if (errors) {
		res.render('add-categories', {
			errors: errors
		});

	} else {

		var cat_id = cassandra.types.uuid();
		var query = "INSERT INTO findadoc.categories(cat_id, name) VALUES(?,?)";

		client.execute(query,
			[cat_id,
				req.body.name
			], { prepare: true }, function (err, result) {
				if (err) {
					res.status(404).send({ msg: err });
				} else {
					res.location('/categories');
					res.redirect('/categories');
				}
			});
	}
});


//Delete Category
router.get('/delete/:id', function (req, res, next) {
	var query = "DELETE FROM findadoc.categories WHERE cat_id =" + req.params.id;
	client.execute(query, [], function (err, result) {
		if (err) {
			res.status(404).send({ msg: err });
		} else {
			res.location('/categories');
			res.redirect('/categories');
		}
	});
});

module.exports = router;
