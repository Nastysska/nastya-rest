import { store } from '../store.js';

export const recordsController = {
  list(req, res) {
    const { user_id, category_id } = req.query;

    if (!user_id && !category_id) {
      return res.status(400).json({
        error: 'At least one of query params "user_id" or "category_id" is required',
      });
    }

    let result = store.records;

    if (user_id) {
      const uid = Number(user_id);
      if (!Number.isInteger(uid)) {
        return res.status(400).json({ error: 'Invalid user_id' });
      }
      result = result.filter((r) => r.userId === uid);
    }

    if (category_id) {
      const cid = Number(category_id);
      if (!Number.isInteger(cid)) {
        return res.status(400).json({ error: 'Invalid category_id' });
      }
      result = result.filter((r) => r.categoryId === cid);
    }

    res.json(result);
  },

  get(req, res) {
    const id = Number(req.params.recordId);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid record id' });
    }

    const record = store.records.find((r) => r.id === id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(record);
  },

  create(req, res) {
    const { userId, categoryId, amount } = req.body || {};

    const uid = Number(userId);
    const cid = Number(categoryId);
    const amt = Number(amount);

    if (!Number.isInteger(uid)) {
      return res.status(400).json({ error: 'Field "userId" is required and must be integer' });
    }

    if (!Number.isInteger(cid)) {
      return res.status(400).json({ error: 'Field "categoryId" is required and must be integer' });
    }

    if (!Number.isFinite(amt)) {
      return res.status(400).json({ error: 'Field "amount" is required and must be a number' });
    }

    const user = store.users.find((u) => u.id === uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const category = store.categories.find((c) => c.id === cid);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const record = {
      id: store.nextRecordId++,
      userId: uid,
      categoryId: cid,
      amount: amt,
      createdAt: new Date().toISOString(),
    };

    store.records.push(record);
    res.status(201).json(record);
  },

  remove(req, res) {
    const id = Number(req.params.recordId);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid record id' });
    }

    const index = store.records.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Record not found' });
    }

    store.records.splice(index, 1);
    res.status(204).send();
  },
};
