const express = require("express");
const multer = require("multer");
const sharp = require("sharp");

const router = new express.Router();

const User = require("../models/User");

const checkAuthMiddleware = require("../middleware/auth");

router.post("/signup", async (req, res) => {
	try {
		const user = new User(req.body);
		const token = await user.generateAuthToken();

		res.status(201).send({ user, token });
	} catch (error) {
		res.status(400).send(error);
	}
});

router.post("/login", async (req, res) => {
	try {
		const user = await User.findByCredentials(req.body);

		const token = await user.generateAuthToken();

		res.send({ user, token });
	} catch (error) {
		res.status(400).send(error);
	}
});

router.post("/logout", checkAuthMiddleware, async (req, res) => {
	try {
		const tokenIdx = req.user.tokens.findIndex(
			token => token.token === req.token
		);

		req.user.tokens.splice(tokenIdx, 1);

		await req.user.save();

		req.user = req.token = null;

		res.send();
	} catch (error) {
		res.status(500).send(error);
	}
});

router.post("/logout-all", checkAuthMiddleware, async (req, res) => {
	try {
		req.user.tokens = [];

		await req.user.save();

		req.user = req.token = null;

		res.send();
	} catch (error) {
		res.status(500).send(error);
	}
});

router.patch("/user", checkAuthMiddleware, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowed = ["name", "email", "password"];
	const isUpdatesValid = updates.every(item => allowed.includes(item));

	try {
		if (!isUpdatesValid) throw new Error("Incorrect update fields");

		updates.forEach(item => (req.user[item] = req.body[item]));

		await req.user.save();

		res.send(req.user);
	} catch (error) {
		res.status(400).send(error);
	}
});

router.delete("/user", checkAuthMiddleware, async (req, res) => {
	try {
		await req.user.remove();

		req.user = req.token = null;

		res.send();
	} catch (error) {
		res.status(500).send(error);
	}
});

const upload = multer({
	limits: {
		fileSize: 1000000
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpe?g|png)$/)) {
			return cb(new Error("Upload an image."));
		}

		cb(undefined, true);
	}
});

router.post(
	"/user/upload/avatar",
	checkAuthMiddleware,
	upload.single("avatar"),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();

		req.user.avatar = buffer;

		await req.user.save();

		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

router.delete("/user/avatar", checkAuthMiddleware, async (req, res) => {
	try {
		req.user.avatar = undefined;

		await req.user.save();

		res.send();
	} catch (error) {
		res.status(500).send(error);
	}
});

router.get("/user/:id/avatar", async (req, res) => {
	const _id = req.params.id;

	try {
		const user = await User.findById(_id);

		if (!user) {
			throw new Error("No user found.");
		} else if (!user.avatar) {
			throw new Error("No avatar found");
		}

		res.set("Content-Type", "image/png");
		res.send(user.avatar);
	} catch (error) {
		res.status(404).send(error);
	}
});

module.exports = router;
