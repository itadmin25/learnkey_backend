const userModel = require('../model/userModel.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

module.exports = {
    register: async (req, res) => {
        try {
            const { firstName, lastName, email, password, country } = req.body;

            // ✅ Check required fields
            if (!firstName || !lastName || !email || !password || !country) {
                return res.status(400).json({ message: "All fields are required" });
            }

            // ✅ Check if user already exists
            const existingUser = await userModel.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already registered" });
            }

            // ✅ Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // ✅ Create user
            const newUser = new userModel({
                firstName,
                lastName,
                email,
                country,
                password: hashedPassword
            });

            const userData = await newUser.save();

            return res.status(200).json({
                success: true,
                message: "User registered successfully",
                data: userData
            });

        } catch (err) {
            console.error("Register error:", err);
            return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
        }
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!(email && password)) {
                return res.status(400).json({ success: false, message: "All inputs are required" });
            }

            const userDetail = await userModel.findOne({ email: email });
            if (!userDetail) {
                return res.status(400).json({ success: false, message: "User does not exist." });
            }

            const passwordMatch = await bcrypt.compare(password, userDetail.password);
            if (!passwordMatch) {
                return res.status(400).json({ success: false, message: "Invalid credentials." });
            }

            const token = jwt.sign(
                { user_id: userDetail._id, email, role: userDetail.role },
                process.env.TOKEN_KEY,
                { expiresIn: "9h" }
            );

            return res.status(200).json({
                success: true,
                message: "Login successful.",
                data: userDetail,
                token
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Server error. Please try again later."
            });
        }
    },
    setupProfile: async (req, res) => {
        try {
            const { userId, role, year, subjects } = req.body;

            if (!userId || !role || !subjects || !year) {
                return res.status(400).json({success: false, message: "userId, role, year and subject are required" });
            }

            if (!["student", "teacher"].includes(role)) {
                return res.status(400).json({success: false, message: "Invalid role" });
            }

            if (role === "student" && year.length > 1) {
                return res.status(400).json({ success: false, message: "Student can select only one year" });
            }
            if (role === "teacher" && year.length < 1) {
                return res.status(400).json({ success: false, message: "Teacher must select at least one year" });
            }

            const updatedUser = await userModel.findByIdAndUpdate(
                userId,
                { role, year, subjects, isprofileSetup: true },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            return res.status(200).json({
                success: true,
                message: "Profile setup completed successfully",
                data: updatedUser

            });

        } catch (err) {
            console.error("SetupProfile error:", err);
            return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
        }
    },
    updateUser: async (req, res) => {
        try {
            const { firstName, lastName, email, country, role, years, subject } = req.body;

            const getUser = await userModel.findById(req.userId);

            if (!getUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found!"
                });
            }
            const updateUser = await userModel.findByIdAndUpdate(
                req.userId,
                {
                    $set: {
                        ...(firstName && { firstName }),
                        ...(lastName && { lastName }),
                        ...(email && { email }),
                        ...(country && { country }),
                        ...(role && { role }),
                        ...(years && { years }),
                        ...(subject && { subject })
                    }
                },
                { new: true }
            )
            return res.status(200).json({
                success: true,
                message: "User information updated successfully!",
                user: updateUser
            });

        } catch (err) {
            console.error("UpdateUser error:", err);
            return res.status(500).json({
                success: false,
                message: "Server error!"
            });
        }
    },
    getUserById: async (req, res) => {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({ success: false, message: "UserId is required" });
            }

            const user = await userModel.findById(userId)

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            return res.status(200).json({
                success: true,
                message: "User fetched successfully",
                data: user
            });

        } catch (err) {
            console.error("GetUserById error:", err);
            return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
        }
    }

};
