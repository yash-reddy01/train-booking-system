const express = require("express");
const bcrypt = require('bcrypt');
const path = require("path");
const app = express();
const cors = require('cors')
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5100;
const mongoose = require('mongoose');
const { MONGO_URI } = require('./db/connect');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const models = require("./models/schema");
app.use(cors());

// user schema
app.post('/register', async (req, res) => {
    try {
        const { firstname, lastname, type, email, password } = req.body;
        const user = await models.Users.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new models.Users({
            firstname,
            lastname,
            type,
            email,
            password: hashedPassword
        });
        const userCreated = await newUser.save();
        console.log(userCreated, 'user created');
        return res.status(200).json({ message: 'Successfully registered' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await models.Users.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.type === 'passenger') {
        const token = jwt.sign({ userId: user._id }, 'mysecretkey1');
        res.json({ user, token });
    } else if (user.type === 'admin') {
        const jwtToken = jwt.sign({ userId: user._id }, 'mysecretkey2');
        res.json({ user, jwtToken });
    }
});





// get users
app.get('/users', async (req, res) => {
    try {
        const users = await models.Users.find();
        res.send(users);
    } catch (error) {
        res.status(500).send('Server error');
        console.log(error);
    }
});

// Create a new train
app.post('/trains', async (req, res) => {
    try {
        const train = new models.Train(req.body);
        const savedTrain = await train.save();
        res.status(201).json(savedTrain);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Get a single train by ID
app.get('/trains/:id', async (req, res) => {
    try {
        const train = await models.Train.findById(req.params.id);
        if (!train) {
            return res.status(404).json({ message: 'Train not found' });
        }
        res.json(train);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.delete('/bookings/:id', async (req, res) => {
    try { 
      const booking = await models.Booking.findOne({_id: req.params.id});
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      await models.Booking.deleteOne({ _id: req.params.id });
      res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });

// Get all trains
app.get('/trains', async (req, res) => {
    try {
        const trains = await models.Train.find();
        res.json(trains);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});




app.post('/book-ticket', async (req, res) => {
    try {
        console.log(req.body)
        const newBooking = new models.Booking(req.body);
        console.log("neww", newBooking);
        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/bookings', async (req, res) => {
    try {
        const bookingDetails = await models.Booking.find();
        res.status(200).json(bookingDetails);
        console.log(bookingDetails)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/bookings/user/:userId', async (req, res) => {
    try {
        const bookingDetails = await models.Booking.find({ user: req.params.userId });
        res.status(200).json(bookingDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/bookings/:id/payments', async (req, res) => {
    try {
        const bookingDetails = await models.Booking.findById(id);
        bookingDetails.paymentstatus = 'success'
        const savedBooking = bookingDetails.save()
        res.status(200).json(savedBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;