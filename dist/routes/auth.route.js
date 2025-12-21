"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
// validate request through token in cookies and response with user data
router.post('/validate', async (req, res) => {
    const token = req.body.token || req.cookies?.token;
    const result = await (0, authController_1.verifyToken)(token);
    if (result.success) {
        return res.status(200).json({ message: 'Token is valid', user: result.user });
    }
    else {
        return res.status(401).json({ message: result.message });
    }
});
router.post('/login', authController_1.loginUser);
router.post('/register', authController_1.registerUser);
exports.default = router;
