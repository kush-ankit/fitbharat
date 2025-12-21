"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
router.get('/search', async (req, res) => {
    const query = req.query.query;
    console.log("query", query);
    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }
    try {
        const users = await User_1.default.find({
            $or: [
                { user_name: { $regex: query, $options: 'i' } },
                { user_email: { $regex: query, $options: 'i' } }
            ]
        }).select('-user_password');
        console.log("users", users);
        res.json({ users });
    }
    catch (err) {
        console.error('User search error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
