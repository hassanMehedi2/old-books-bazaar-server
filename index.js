const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 5000

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.slqgxau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const sellPostCollection = client.db('bookBazaar').collection('sellPosts');
    const bidCollection = client.db('bookBazaar').collection('bids');

    // /api/v1/sell-posts       situation 1
    // /api/v1/sell-posts?email=queryEmail      situation 2
    app.get("/api/v1/sell-posts", async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        query.postedBy = email;
      }
      const cursor = sellPostCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/api/v1/sell-posts', async (req, res) => {
      const post = req.body;
      const result = await sellPostCollection.insertOne(post);
      res.send(result)
    })



    app.get('/api/v1/sell_posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const post = await sellPostCollection.findOne(query);
      res.send(post);
    })

    


    app.post('/api/v1/bids', async (req, res) => {
      const bid = req.body;
      const result = await bidCollection.insertOne(bid);
      res.send(result)
    })

    app.get('/api/v1/bids', async (req, res) => {
      let query = {};
      const email = req.params.email;
      if (email) {
        query.biddersEmail = email;
      }
      const cursor = bidCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

  



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})