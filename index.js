const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://mongo:9756jeiBYT0zUa1Eo8AI3lVZmD2wXd4k@sfo1.clusters.zeabur.com:30901', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Item = mongoose.model('Item', {
    _id: mongoose.Types.ObjectId,
    text: String,
    description: String,
    date: { type: String, default: new Date().toLocaleDateString() },
    importance: { type: Number, default: 50 },
    category: String
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

// const Category = mongoose.model('Category', {
//     _id: mongoose.Types.ObjectId,
//     title: String,
//     description: String,
//     success_rate: { type: Number, default: 50 }
// });

app.get('/api/items', async (req, res) => {
    console.log('sdfsdf')
    const items = await Item.find();
    res.json(items);
});

app.get('/api/items/:id', async (req, res) => {
    const item = await Item.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
});

app.post('/api/items', async (req, res) => {
    const newItem = new Item({ _id: new mongoose.Types.ObjectId(), ...req.body });
    await newItem.save();
    res.json(newItem);
});

app.put('/api/items/:id', async (req, res) => {
    const existingItem = await Item.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!existingItem) {
        return res.status(404).json({ error: 'Item not found' });
    }

    existingItem.set(req.body);
    await existingItem.save();
    res.json(existingItem);
});

app.delete('/api/items/:id', async (req, res) => {
    const item = await Item.findByIdAndDelete({ _id: req.params.id });
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
