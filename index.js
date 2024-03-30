const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 5000

// middleware 
const corsOptions = {
  origin: '*',
  credentials: true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
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

    app.post('/api/v1/sell-posts', async (req, res) => {
      const post = req.body;
      const result = await sellPostCollection.insertOne(post);
      res.send(result)
    })

    //paigination format
    // /api/v1/sell_post?page=1&size=10

    app.get('/api/v1/sell_posts', async (req, res) => {
      let query = {};
      const category = req.query.category;
      const id = req.query.id;
      const email = req.query.email;



      //paigination
      const page = Number(req.query.page);
      const size = Number(req.query.size);
      const skip = (page - 1) * size;


      if (category) {
        query.category = category;
      }
      if (id) {
        query = { _id: new ObjectId(id) };
      }
      if (email) {
        query.postedBy = email;
      }

      // price less then {have to add category also if has}
      const less_than = Number(req.query.less_than);

      if (less_than) {
        query = {
          minimumPrice: { $lte: less_than }
        }
      }
      // if filtered by category and also less the price 
      if (category && less_than) {
        query = {
          category: category,
          minimumPrice: { $lte: less_than }
        }
      }

      const posts = sellPostCollection.find(query).skip(skip).limit(size);
      const result = await posts.toArray();

      // /total count 
      const total = await sellPostCollection.countDocuments();

      res.send({
        result,
        total

      });
    })


    app.post('/api/v1/bids', async (req, res) => {
      const bid = req.body;
      const result = await bidCollection.insertOne(bid);
      res.send(result)
    })

    app.get('/api/v1/bids', async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        query.biddersEmail = email;
      }
      const cursor = bidCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/api/v1/bids/:postId', async (req, res) => {
      const sellPostId = req.params.postId;
      const query = { sellPostId: sellPostId };
      const cursor = bidCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })


    // api for the top 3 id of top bidded sell post 

    app.get('/api/v1/topBiddedSellPosts', async (req, res) => {
      try {
        const pipeline = [  //defined the pipeline in saparate way
          { $group: { _id: "$sellPostId", totalBids: { $sum: 1 } } },
          { $sort: { totalBids: -1 } },
          { $limit: 3 }
        ]

        const topBiddedSellPosts = await bidCollection.aggregate(pipeline).toArray();

        if (topBiddedSellPosts.length === 0) {
          return res.json({ sellPostId: null })
        }

        // Extract sellPostIDs from the result 
        const topSellPostsIds = topBiddedSellPosts.map(item => item._id);
        res.json({ topBiddedSellPostsIds: topSellPostsIds });
      }

      catch (err) {
        console.log(err);
        res.status(500).json({ message: "internal server error" })
      }
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