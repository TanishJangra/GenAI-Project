const authController = {};

const userModel = require('../model/user.model');
const blacklistTokenModel = require('../model/blacklist.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookies = require('cookie-parser');

authController.registerUserController = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if(!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        const hash = await bcrypt.hash(password, 10);
        const newUser = new userModel({ username, email, password: hash });
        const token = jwt.sign({ id: newUser._id, username: newUser.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie("token", token);
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully', user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email
        }});
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

authController.loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie("token", token);
        res.status(200).json({ message: 'User logged in successfully', user: {
            id: user._id,
            username: user.username,
            email: user.email
        }});
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

authController.logoutUserController = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(400).json({ message: 'No token provided' });
        }
        const blacklistedToken = new blacklistTokenModel({ token });
        await blacklistedToken.save();
        res.clearCookie("token");
        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

authController.getMeController = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: "User details fetched successfully", user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = authController;