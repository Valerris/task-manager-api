const express = require("express");
const Task = require("../models/Task");
const checkAuthMiddleware = require("../middleware/auth");

const router = new express.Router();

router.post("/task/create", checkAuthMiddleware, async (req, res) => {
	try {
		const task = new Task({ ...req.body, userId: req.user._id });
		await task.save();

		res.send(task);
	} catch (error) {
		res.status(400).send(error);
	}
});

router.get("/tasks", checkAuthMiddleware, async (req, res) => {
	const match = {};
	const sort = {};

	if (req.query.completed) {
		match.done = req.query.completed === "true";
	}

	if (req.query.sortBy) {
		const [field, method] = req.query.sortBy.split("_");
		sort[field] = method === "desc" ? -1 : 1;
	}

	try {
		await req.user
			.populate({
				path: "tasks",
				match,
				options: {
					limit: parseInt(req.query.limit),
					skip: parseInt(req.query.skip),
					sort
				}
			})
			.execPopulate();

		res.send(req.user.tasks);
	} catch (error) {
		res.status(500).send(error);
	}
});

router.get("/tasks/:id", checkAuthMiddleware, async (req, res) => {
	const _id = req.params.id;

	try {
		const task = await Task.findOne({ _id, userId: req.user._id });

		if (!task) return res.status(404).send();

		res.send(task);
	} catch (error) {
		res.status(500).send(error);
	}
});

router.patch("/tasks/:id", checkAuthMiddleware, async (req, res) => {
	const _id = req.params.id;
	const updates = Object.keys(req.body);
	const allowed = ["task", "comment"];
	const isUpdatesValid = updates.every(item => allowed.includes(item));

	try {
		if (!isUpdatesValid) throw new Error("Invalid update fields.");

		const updatedTask = await Task.findOne({ _id, userId: req.user._id });

		if (!updatedTask) return res.status(404).send();

		updates.forEach(item => (updatedTask[item] = req.body[item]));

		await updatedTask.save();

		res.send(updatedTask);
	} catch (error) {
		res.status(400).send(error);
	}
});

router.delete("/tasks/:id", checkAuthMiddleware, async (req, res) => {
	const _id = req.params.id;

	try {
		const deletedTask = await Task.findOneAndRemove({
			_id
		});

		if (!deletedTask) return res.status(404).send();

		res.send(deletedTask);
	} catch (error) {
		res.status(400).send(error);
	}
});

module.exports = router;
