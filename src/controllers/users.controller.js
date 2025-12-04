import { store } from '../store.js';

export const usersController = {
  list(req, res) {
    res.json(store.users);
  },

  get(req, res) {
    const id = Number(req.params.userId);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = store.users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  },

  create(req, res) {
    const { name } = req.body || {};

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" is required' });
    }

    const user = {
      id: store.nextUserId++,
      name: name.trim(),
    };

    store.users.push(user);
    res.status(201).json(user);
  },

  remove(req, res) {
    const id = Number(req.params.userId);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const index = store.users.findIndex((u) => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    store.users.splice(index, 1);
    store.records = store.records.filter((r) => r.userId !== id);

    res.status(204).send();
  },
};
