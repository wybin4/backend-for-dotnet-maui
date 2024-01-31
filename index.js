const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://mongo:15XbTj2p07nO8UgA6cWx3aq9zrBVC4Yh@hnd1.clusters.zeabur.com:31583', {
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

app.use((req, res, next) => {
    res.jsonOriginal = res.json;

    res.json = function (data) {
        if (Array.isArray(data)) {
            data = data.map(item => {
                if (item && item._id) {
                    item.id = item._id;
                    delete item._id;
                }
                return item;
            });
        } else if (data && data._id) {
            const dataCopy = { ...data };
            dataCopy.id = data._id;
            delete dataCopy._id;
            data = dataCopy;
        }

        res.jsonOriginal.call(this, data);
    };

    next();
});

app.get('/api/items', async (req, res) => {
    const items = await Item.find().lean();
    res.json(items);
});

app.get('/api/items/:id', async (req, res) => {
    const item = await Item.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) }).lean();
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
});

app.post('/api/items', async (req, res) => {
    const newItem = new Item({ _id: new mongoose.Types.ObjectId(req.body.id), ...req.body });

    await newItem.save();
    const { _id, text, description, date, importance, category } = newItem;

    const newItemPlain = {
        id: _id,
        text,
        description,
        date,
        importance,
        category
    };
    res.json(newItemPlain);
});

app.put('/api/items/:id', async (req, res) => {
    const existingItem = await Item.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) }).lean();
    if (!existingItem) {
        return res.status(404).json({ error: 'Item not found' });
    }

    existingItem.set(req.body);
    await existingItem.save();
    res.json(existingItem);
});

app.delete('/api/items/:id', async (req, res) => {
    const item = await Item.findByIdAndDelete({ _id: req.params.id }).lean();
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
