const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express()



app.use(express.json())
app.use(cors())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oq68b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // await client.connect();


        const userCollection = client.db("learningDB").collection("users")
        const notesCollection = client.db("learningDB").collection("notes")
        const studySessionsCollection = client.db("learningDB").collection("studySessions")





        //user releted apis starts
        app.post("/users", async (req, res) => {
            const user = req.body
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        app.get("/users", async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        app.get("/tutor", async (req, res) => {
            const filter = { role: "Tutor" }
            const result = await userCollection.find(filter).toArray()
            res.send(result)
        })
        //user releted apis ends


        //notes releted apis starts from here
        app.post("/myNotes", async (req, res) => {
            const note = req.body;
            const result = await notesCollection.insertOne(note)
            res.send(result)
        })

        app.get("/myNotes", async (req, res) => {
            const notes = await notesCollection.find().toArray()
            res.send(notes)
        })

        app.get("/myNotes/:id", async (req, res) => {
            const id = req.params;
            const filter = { _id: new ObjectId(id) }
            const result = await notesCollection.findOne(filter)
            res.send(result)
        })

        app.delete("/myNotes/:id", async (req, res) => {
            const id = req.params
            const filter = { _id: new ObjectId(id) }
            const result = await notesCollection.deleteOne(filter)
            res.send(result)
        })

        app.patch("/updateNote/:id", async (req, res) => {
            const id = req.params
            const updateInfo = req.body
            const filter = {_id: new ObjectId(id)}
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    title: updateInfo?.title,
                    email: updateInfo?.email,
                    description: updateInfo?.description
                }
            }

            const result = await notesCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        //notes releted apis ends here



        //study session releted apis starts
        app.get("/approvedStudySessions", async (req, res) => {
            const query = { status: "ongoing" }
            const result = await studySessionsCollection.find(query).limit(6).toArray();
            res.send(result)
        })

        app.get("/allStudySessions", async (req, res) => {
            const result = await studySessionsCollection.find().toArray()
            res.send(result)
        })

        app.get("/studySession/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await studySessionsCollection.findOne(query)
            res.send(result)
        })

        app.post("/studySessions", async (req, res) => {
            const data = req.body;
            const result = await studySessionsCollection.insertOne(data)
            res.send(result)
        })
        //study session releted apis ends






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get("/", (req, res) => {
    res.send({ running: true })
})

app.listen(port, () => {
    console.log("running on port: ", port)
})