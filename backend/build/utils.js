"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtVerify = exports.jwtSign = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const jwtSign = (username) => jsonwebtoken_1.default.sign({ username: username.toLowerCase() }, process.env.SECRET, { expiresIn: "7 days" });
exports.jwtSign = jwtSign;
const jwtVerify = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, process.env.SECRET).username;
    }
    catch (err) { }
};
exports.jwtVerify = jwtVerify;
