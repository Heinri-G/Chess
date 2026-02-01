import { Router } from 'express';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';

const router = Router();

router.post('/', async (req, res) => {
    const { username } = req.body;
    try {
        const [user] = await db.insert(users).values({ username }).returning();
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.get('/', async (req, res) => {
    try {
        const allUsers = await db.query.users.findMany();
        res.json(allUsers);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
