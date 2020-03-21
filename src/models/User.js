const mongoose = require("mongoose");

const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Task = require("../models/Task");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true
		},
		email: {
			type: String,
			unique: true,
			required: true,
			trim: true,
			lowercase: true,
			validate(value) {
				if (!validator.isEmail(value)) throw new Error("Incorrect email.");
			}
		},
		password: {
			type: String,
			required: true,
			trim: true,
			minLength: 8,
			validate(value) {
				if (value.toLowerCase().includes("password"))
					throw new Error("Password should not contain string 'password'");
			}
		},
		tokens: [
			{
				token: {
					type: String,
					required: true
				}
			}
		],
		avatar: {
			type: Buffer
		}
	},
	{
		timestamps: true
	}
);

userSchema.virtual("tasks", {
	ref: "Task",
	localField: "_id",
	foreignField: "userId"
});

userSchema.statics.findByCredentials = async creds => {
	const { email, password } = creds;

	const user = await User.findOne({ email });

	if (!user) throw new Error("Incorrect email.");

	const isPasswrdMatching = await bcrypt.compare(password, user.password);

	if (!isPasswrdMatching) throw new Error("Incorrect password.");

	return user;
};

userSchema.methods.generateAuthToken = async function() {
	const user = this;

	const token = jwt.sign(
		{ _id: user._id.toString() },
		process.env.JWT_SECRET_KEY
	);

	user.tokens = user.tokens.concat({ token });

	await user.save();

	return token;
};

userSchema.methods.toJSON = function() {
	const user = this;

	const userObj = user.toObject();

	delete userObj.password;
	delete userObj.tokens;
	delete userObj.__v;
	delete userObj.avatar;

	return userObj;
};

userSchema.pre("save", async function(next) {
	const user = this;

	user.isModified("password") &&
		(user.password = await bcrypt.hash(user.password, 8));

	next();
});

userSchema.pre("remove", async function(next) {
	const user = this;

	await Task.deleteMany({
		userId: user._id
	});

	next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
