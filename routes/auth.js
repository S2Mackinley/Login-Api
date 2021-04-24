const router = require('express').Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation');

router.post('/register', async (req, res) => {
	//validates the data before we add a new user
	const { error } = registerValidation(req.body);
	if (error) return res.status(400).send(error.details[0].message);
	//CHECKING IF THE USER EXISTS IN THE DATABASE
	const emailExist = await User.findOne({ email: req.body.email });
	if (emailExist) return res.status(400).send('Email already exists');
	//HASH THE PASSWORD
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(req.body.password, salt);

	//CREATE A NEW USER
	const user = new User({
		name: req.body.name,
		email: req.body.email,
		password: hashedPassword,
	});
	try {
		const savedUser = await user.save();
		res.send({ user: user._id });
	} catch (err) {
		res.status(400).send(err);
	}
});

//LOGIN
router.post('/login', async (req, res) => {
	//validates the data before we add a new user
	const { error } = loginValidation(req.body);
	if (error) return res.status(400).send(error.details[0].message);
	//CHECKING IF THE EMAIL EXISTS IN THE DATABASE
	const user = await User.findOne({ email: req.body.email });
	if (!user) return res.status(400).send('Email is not found');
	//Password is correct
	const validPass = await bcrypt.compare(req.body.password, user.password);
	if (!validPass) return res.status(400).send('Invalid Password');
	//Create and assign a token
	const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
	res.header('auth-token', token).send(token);
});

module.exports = router;

// //lets validate the data before we add a user
// const { error } = schema.validate(req.body);
// if (error) return res.status(400).send(error.details[0].message);
