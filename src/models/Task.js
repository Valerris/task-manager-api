const mongoose = require("mongoose");

const taskScheme = new mongoose.Schema(
	{
		task: {
			type: String,
			required: true,
			trim: true
		},
		comment: {
			type: String,
			required: true,
			trim: true
		},
		done: {
			type: Boolean,
			default: false
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User"
		}
	},
	{
		timestamps: true
	}
);

taskScheme.methods.toJSON = function() {
	const task = this;

	const taskObj = task.toObject();

	delete taskObj.__v;

	return taskObj;
};

const Task = mongoose.model("Task", taskScheme);

module.exports = Task;
