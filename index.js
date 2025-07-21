const express = require('express');
const mongoose = require('./db');
const Book = require('./models/bookModel');
const logger = require('./middlewares/logger');
const contentTypeCheck = require('./middlewares/contentTypeCheck');

const app = express();
app.use(express.json());
app.use(logger);
app.use(contentTypeCheck);

app.get('/books', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const books = await Book.find().skip(skip).limit(limit);
  res.json(books);
});

app.get('/books/:isbn', async (req, res) => {
  const book = await Book.findOne({ isbn: req.params.isbn });
  if (!book) return res.status(404).json({ error: 'Không tìm thấy sách' });
  res.json(book);
});

app.post('/books', async (req, res) => {
  try {
    const { isbn, title, author, year, category } = req.body;
    if (!isbn || !title || !author || !category || !Number.isInteger(year) || year < 1900) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }
    const existing = await Book.findOne({ isbn });
    if (existing) return res.status(400).json({ error: 'ISBN đã tồn tại' });

    const book = new Book({ isbn, title, author, year, category });
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.put('/books/:isbn', async (req, res) => {
  const { title, author, year, category } = req.body;
  if (!title || !author || !category || !Number.isInteger(year) || year < 1900) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
  const book = await Book.findOneAndUpdate(
    { isbn: req.params.isbn },
    { title, author, year, category, updatedAt: new Date() },
    { new: true }
  );
  if (!book) return res.status(404).json({ error: 'Không tìm thấy sách' });
  res.json(book);
});

app.delete('/books/:isbn', async (req, res) => {
  const book = await Book.findOneAndDelete({ isbn: req.params.isbn });
  if (!book) return res.status(404).json({ error: 'Không tìm thấy sách' });
  res.json({ message: 'Đã xoá sách' });
});

app.get('/books/search', async (req, res) => {
  const cat = req.query.category?.toLowerCase() || '';
  const books = await Book.find({ category: new RegExp(cat, 'i') });
  res.json(books);
});

app.get('/books/sort', async (req, res) => {
  const by = req.query.by;
  const order = req.query.order === 'desc' ? -1 : 1;
  if (!['title', 'year'].includes(by)) {
    return res.status(400).json({ error: 'Chỉ được sắp xếp theo title hoặc year' });
  }
  const books = await Book.find().sort({ [by]: order });
  res.json(books);
});

app.get('/stats', async (req, res) => {
  const books = await Book.find();
  const years = books.map(b => b.year);
  res.json({
    totalBooks: books.length,
    oldestBook: Math.min(...years),
    newestBook: Math.max(...years)
  });
});

app.get('/books/filter', async (req, res) => {
  const author = req.query.author?.toLowerCase() || '';
  const year = parseInt(req.query.year);
  const books = await Book.find({
    author: new RegExp(author, 'i'),
    year
  });
  res.json(books);
});

app.listen(3000, () => {
  console.log('Server đang chạy tại http://localhost:3000');
});
