var express = require('express');
var router = express.Router();
var cassandra = require('cassandra-driver');

var client = new cassandra.Client({ contactPoints: ['127.0.0.1'] });
client.connect(function (err, result) {
	console.log('Cassandra Connected');
});

router.get('/', function (req, res, next) {
	if (req.query.state) {
		var query = "SELECT * FROM findadoc.doctors WHERE state = ?";
		client.execute(query, [req.query.state], function (err, results) {
			if (err) {
				res.status(404).send({ msg: err });
			} else {
				res.render('doctors', {
					doctors: results.rows
				});
			}
		});
	} else {
		var query = "SELECT * FROM findadoc.doctors";
		client.execute(query, [], function (err, results) {
			if (err) {
				res.status(404).send({ msg: err });
			} else {
				res.render('doctors', {
					doctors: results.rows
				});
			}
		});
	}
});

router.get('/details/:id', function (req, res, next) {
	var query = "SELECT * FROM findadoc.doctors WHERE doc_id = ?";
	client.execute(query, [req.params.id], function (err, result) {
		if (err) {
			res.status(404).send({ msg: err });
		} else {
			res.render('details', {
				doctor: result.rows['0']
			});
		}
	});
});

router.get('/category/:name', function (req, res, next) {
	var query = "SELECT * FROM findadoc.doctors WHERE category = ?";
	client.execute(query, [req.params.name], function (err, results) {
		if (err) {
			res.status(404).send({ msg: err });
		} else {
			res.render('doctors', {
				doctors: results.rows
			});
		}
	});
});

router.get('/add', function (req, res, next) {
	var query = "SELECT * FROM findadoc.categories";
	client.execute(query, [], function (err, results) {
		if (err) {
			res.status(404).send({ msg: err });
		} else {
			//res.json(result);
			res.render('add-doctors', {
				categories: results.rows
			});
		}
	});
});

router.post('/add', function (req, res, next) {
	///Form Validator
	req.checkBody('full_name', 'Name is required').notEmpty();
	req.checkBody('category', 'Category is required').notEmpty();
	req.checkBody('new_patients', 'new patients is not valid').notEmpty();
	req.checkBody('graduation_year', 'Graduation year is required').notEmpty();
	req.checkBody('practice_name', 'Practice name is required').notEmpty();
	req.checkBody('city', 'City is required').notEmpty();
	req.checkBody('state', 'State is required').notEmpty();

	// Check Errors
	var errors = req.validationErrors();
	if (errors) {
		var categories = "SELECT * FROM findadoc.categories";
		client.execute(categories, [], function (err, results) {
			if (err) {
				res.status(404).send({ msg: err });
			} else {
				res.render('add-doctors', {
					errors: errors,
					categories: results.rows

				});
			}
		});
	}
	else {
		var doc_id = cassandra.types.uuid();
		var query = "INSERT INTO findadoc.doctors(doc_id, full_name, category, new_patients, graduation_year, practice_name, street_address, city, state) VALUES(?,?,?,?,?,?,?,?,?)";
		client.execute(query,
			[doc_id,
				req.body.full_name,
				req.body.category,
				req.body.new_patients,
				req.body.graduation_year,
				req.body.practice_name,
				req.body.street_address,
				req.body.city,
				req.body.state,
			], { prepare: true }, function (err, result) {
				if (err) {
					res.status(404).send({ msg: err });
				} else {
					//req.flash('success', 'You are now registered and can login');
					res.location('/doctors');
					res.redirect('/doctors');
				}
			});
	}
});


//Get Edit Doctor Page
router.get('/edit/:id', function (req, res, next) {
	var categories = "SELECT * FROM findadoc.categories";
	var doctor = "SELECT * FROM findadoc.doctors WHERE doc_id = ?";
	client.execute(doctor, [req.params.id], function (err, result) {
		client.execute(categories, [], function (err, results) {
			if (err) {
				res.status(404).send({ msg: err });
			} else {
				//res.json(result);
				res.render('edit-doctors', {
					categories: results.rows,
					doctor: result.rows['0']
				});
			}
		});
	});
});

//Edit Doctor
router.post('/edit/:id', function (req, res, next) {
	var query = "UPDATE findadoc.doctors SET full_name ='" + req.body.full_name + "', category ='" + req.body.category + "', new_patients ='" + req.body.new_patients + "', graduation_year ='" + req.body.graduation_year + "', practice_name ='" + req.body.practice_name + "', street_address ='" + req.body.street_address + "', city ='" + req.body.city + "', state ='" + req.body.state + "' WHERE doc_id = " + req.params.id;
	client.execute(query,
		[], { prepare: true }, function (err, result) {
			if (err) {
				res.status(404).send({ msg: err });
			} else {
				res.location('/doctors');
				res.redirect('/doctors');
			}
		});
});

//Delete Doctor
router.get('/delete/:id', function (req, res, next) {
	var query = "DELETE FROM findadoc.doctors WHERE doc_id =" + req.params.id;
	client.execute(query, [], function (err, result) {
		if (err) {
			res.status(404).send({ msg: err });
		} else {
			res.location('/doctors');
			res.redirect('/doctors');
		}
	});
});

module.exports = router;
