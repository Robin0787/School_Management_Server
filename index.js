const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const classes = require('./data.json');


app.use(cors());
app.use(express.json());



const users = [
    {
        name: 'Rahim',
        age: '40'
    },
    {
        name: 'Liton',
        age: '37'
    },
    {
        name: 'Abdul',
        age: '45'
    },
]

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.nxzja4k.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db('School_Management');
    const userCollection = database.collection('users');
    const subjectCollection = database.collection('subjects');

    app.get('/users', async (req, res) => {
        const result = await userCollection.insertMany(users);
        res.send(result);
    });

    app.get('/subjects/:class', async (req, res) => {
      const classNum = req.params.class;
      const query = {class: classNum};
      const specificClass = await subjectCollection.findOne(query);
      res.send(specificClass);
    });




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('School Management Server is running');
});


app.listen(port, () => {
    console.log('Server is running on port', port);
})