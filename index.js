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
    category: String,
    order: Number
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
    try {
        const items = await Item.find().sort('order').lean();
        res.json(items);
    } catch (error) {
        console.error('Error getting items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/api/items/:id', async (req, res) => {
    try {
        const item = await Item.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) }).lean();
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Error getting item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/items', async (req, res) => {
    try {
        const maxOrderItem = await Item.findOne().sort('-order');

        let newOrder = 1;

        if (maxOrderItem) {
            newOrder = maxOrderItem.order + 1;
        }

        const newItem = new Item({ _id: new mongoose.Types.ObjectId(req.body.id), ...req.body, order: newOrder });

        await newItem.save();
        const { _id, text, description, date, importance, category } = newItem;

        const newItemPlain = {
            id: _id,
            text,
            description,
            date,
            importance,
            category,
        };

        res.json(newItemPlain)
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/items/:id', async (req, res) => {
    try {
        const existingItem = await Item.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) }).lean();
        if (!existingItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        existingItem.set(req.body);
        await existingItem.save();
        res.json(existingItem);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/items/:id/move', async (req, res) => {
    const itemId = req.params.id;
    const direction = req.query.where; // "up" или "down"

    try {
        const itemToMove = await Item.findById(itemId);
        if (!itemToMove) {
            return res.status(404).json({ error: 'Item not found' });
        }

        let targetItem;
        if (direction === 'up') {
            targetItem = await Item.findOne({ order: { $lt: itemToMove.order } }).sort('-order');
        } else if (direction === 'down') {
            targetItem = await Item.findOne({ order: { $gt: itemToMove.order } }).sort('order');
        } else {
            return res.status(400).json({ error: 'Invalid direction' });
        }

        if (!targetItem) {
            return res.status(400).json({ error: 'Invalid move' });
        }

        const tempOrder = itemToMove.order;
        itemToMove.order = targetItem.order;
        targetItem.order = tempOrder;

        await itemToMove.save();
        await targetItem.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error moving item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/items/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete({ _id: req.params.id }).lean();
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
