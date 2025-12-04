import { store } from '../store.js';

export const categoriesController = {
  list(req, res) {
    res.json(store.categories);
  },

  create(req, res) {
    const { name } = req.body || {};

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" is required' });
    }

    const category = {
      id: store.nextCategoryId++,
      name: name.trim(),
    };

    store.categories.push(category);
    res.status(201).json(category);
  },

  remove(req, res) {
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Query param "id" is required and must be integer' });
    }

    const index = store.categories.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    store.categories.splice(index, 1);

    store.records = store.records.filter((r) => r.categoryId !== id);

    res.status(204).send();
  },
};
