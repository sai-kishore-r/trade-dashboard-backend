import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbWrapper from '../utils/dbWrapper.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'User API is working' });
});

router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        const existingUser = await dbWrapper.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await dbWrapper.createUser({ name, email, password: hashedPassword });

        const token = jwt.sign({ id: user.id || user._id, email: user.email }, process.env.JWT_SECRET || 'secret_key', {
            expiresIn: '24h',
        });

        res.status(201).json({ success: true, token, user: { id: user.id || user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        const user = await dbWrapper.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id || user._id, email: user.email }, process.env.JWT_SECRET || 'secret_key', {
            expiresIn: '24h',
        });

        res.status(200).json({ success: true, token, user: { id: user.id || user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
