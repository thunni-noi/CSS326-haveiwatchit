import pool from '../db/db.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) =>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
}

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
}

const wrapper = (errMsg, controller) => async (req, res) =>
    {try {
        await controller(req, res);
    } catch (error) {
        console.error(`${errMsg}`, error);
        res.status(500).json({message: errMsg});
    }};

export const authRegister = wrapper("Register failed", async(req, res) => {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields!" });
        }

    // check if username is valid
    const usernameRegex = /^[a-zA-Z0-9_]{1,25}/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({ message: "Username must be only contains letters, number, underscore with max of 25 characters"})
    }

    const [userExists] = await pool.execute(`SELECT * FROM users WHERE username = ? OR email = ?`, [username, email])
    if (userExists.length > 0){
        //console.log(userExists);
        return res.status(400).json({ message: "User already exists"});
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const [newUser] = await pool.execute(`INSERT INTO users(username, email, password) VALUES (?, ?, ?)`,
        [username, email, hashedPwd]
    );

    const token = generateToken(newUser.insertId);
    res.cookie('auth_token', token, cookieOptions)

    return res.status(201).json({ user: { id: newUser.insertId, username, email} });
});

export const authLogin = wrapper("Login Failed", async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password){
        return res.status(400).json({ message: "Please provide all required fields! "});
    }

    const [user] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    if (user.length === 0){
        return res.status(400).json({ message: "Invalid credentials"});
    }

    const userData = user[0];
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch){
        return res.status(400).json({ message: "Invalid credentials"});
    }

    const token = generateToken(userData.id);
    res.cookie('auth_token', token, cookieOptions)

    // remove password
    delete userData.password;
    return res.status(201).json({ user: userData });
});

export const authMe = wrapper("User's self authentication failed", async(req, res) => {
    res.json({user: req.user});
});

export const authLogout = wrapper("Logout failed" ,async(req, res) => {
    res.cookie('auth_token', '', {...cookieOptions, maxAge: 1});
    res.json({ message: "Logged out successfully" });
});

