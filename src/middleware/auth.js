const jwt = require("jsonwebtoken");
const User = require("../models/User");

const middleware = async (req, res, next) => {
	try {
		const token = req.header("Authorization").replace("Bearer ", "");
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

		const user = await User.findOne({
			_id: decoded._id,
			"tokens.token": token
		});

		if (!user) throw new Error();

		req.user = user;
		req.token = token;

		next();
	} catch (error) {
		res.status(401).send({ error: "You should be logged in." });
	}
};

module.exports = middleware;
