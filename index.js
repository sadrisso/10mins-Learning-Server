const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();



app.use(express.json());
app.use(cors());



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
        const bookedSessionsCollection = client.db("learningDB").collection("bookedSessions")
        const uploadedMaterialsCollection = client.db("learningDB").collection("uploadedMaterials")
        const reviewsCollection = client.db("learningDB").collection("reviews")


        //jwt releted apis starts from here
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        const verifyToken = (req, res, next) => {
            // console.log("inside verify token : ", req.headers.authorization)

            if (!req?.headers?.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req?.headers?.authorization.split(" ")[1]

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }
        //jwt releted apis ends here



        //user releted apis starts
        app.post("/users", async (req, res) => {
            const user = req.body
            const query = { email: user?.email }
            const existingUser = await userCollection.findOne(query)

            if (existingUser) {
                return res.send({ message: "user already exist" })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        app.get("/users", verifyToken, async (req, res) => {
            const search = req.query.search
            let query = {}

            if (search) {
                query = { name: { $regex: search, $options: "i" } }
            }

            if (search) {
                query = { email: { $regex: search, $options: "i" } }
            }

            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email }
            const result = await userCollection.findOne(filter)
            res.send(result)
        })

        app.patch("/users/admin/:id", async (req, res) => {
            const id = req.params;
            const info = req.body;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: info.role
                }
            }

            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.get("/user/admin/:email", verifyToken, async (req, res) => {
            const email = req.params.email;

            if (email !== req?.decoded?.email) {
                return res.status(403).send({ message: "forbidden access" })
            }

            const filter = { email }
            const user = await userCollection.findOne(filter)

            let admin = false
            if (user) {
                admin = user?.role === "Admin"
            }

            res.send({ admin })
        })


        app.get("/user/student/:email", verifyToken, async (req, res) => {
            const email = req.params.email;

            if (email !== req?.decoded?.email) {
                return res.status(403).send({ message: "forbidden access" })
            }

            const filter = { email }
            const user = await userCollection.findOne(filter)

            let student = false
            if (user) {
                student = user?.role === "Student"
            }

            res.send({ student })
        })
        //user releted apis ends



        //tutor releted apis starts from here
        app.get("/user/tutor/:email", verifyToken, async (req, res) => {
            const email = req.params.email;

            if (email !== req?.decoded?.email) {
                return res.status(403).send({ message: "forbidden access" })
            }

            const filter = { email }
            const user = await userCollection.findOne(filter)

            let tutor = false
            if (user) {
                tutor = user?.role === "Tutor"
            }

            res.send({ tutor })
        })


        app.get("/tutors", async (req, res) => {
            const filter = { role: "Tutor" }
            const result = await userCollection.find(filter).toArray()
            res.send(result)
        })

        app.post("/uploadMaterial", async (req, res) => {
            const data = req.body
            const result = await uploadedMaterialsCollection.insertOne(data)
            res.send(result)
        })

        app.get("/uploadedMaterials", async (req, res) => {
            const result = await uploadedMaterialsCollection.find().toArray()
            res.send(result)
        })

        app.get("/uploadedMaterial/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { sessionId: id }
            const result = await uploadedMaterialsCollection.find(filter).toArray()
            res.send(result)
        })

        app.get("/editMaterial/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await uploadedMaterialsCollection.findOne(filter)
            res.send(result)
        })

        app.patch("/editStudyMaterial/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateInfo = req.body;

            const updateDoc = {
                $set: {
                    title: updateInfo?.title,
                    uploadMaterialId: updateInfo?.uploadMaterialId,
                    tutorEmail: updateInfo?.tutorEmail,
                    link: updateInfo?.link
                },
            };

            const result = await uploadedMaterialsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete("/studyMaterial/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await uploadedMaterialsCollection.deleteOne(filter)
            res.send(result)
        })
        //tutor releted apis ends here



        //notes releted apis starts from here
        app.post("/myNotes", async (req, res) => {
            const note = req.body;
            const result = await notesCollection.insertOne(note)
            res.send(result)
        })

        app.get("/myNotes", verifyToken, async (req, res) => {
            const notes = await notesCollection.find().toArray()
            res.send(notes)
        })

        app.get("/myNote/:email", async (req, res) => {
            const email = req.params.email
            const filter = { email }
            const result = await notesCollection.find(filter).toArray()
            res.send(result)
        })

        app.get("/myNotes/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await notesCollection.findOne(filter)
            res.send(result)
        })

        app.delete("/myNotes/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const result = await notesCollection.deleteOne(filter)
            res.send(result)
        })

        app.patch("/updateNote/:id", async (req, res) => {
            const id = req.params.id
            const updateInfo = req.body
            const filter = { _id: new ObjectId(id) }
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

        app.delete("/studySession/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await studySessionsCollection.deleteOne(filter)
            res.send(result)
        })

        app.get("/studySession/:id", verifyToken, async (req, res) => {
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

        app.post("/bookedSessions", async (req, res) => {
            const data = req.body;
            const result = await bookedSessionsCollection.insertOne(data)
            res.send(result)
        })

        app.get("/bookedSessions", async (req, res) => {
            const result = await bookedSessionsCollection.find().toArray();
            res.send(result)
        })

        app.get("/bookedSessions/:email", async (req, res) => {
            const email = req.params.email
            const filter = { studentEmail: email }
            const result = await bookedSessionsCollection.find(filter).toArray()
            res.send(result)
        })

        app.get("/bookedSession/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const result = await bookedSessionsCollection.findOne(filter)
            res.send(result)
        })

        app.get("/isSessionBooked/:studentEmail/:studentSessionId", async (req, res) => {
            const studentEmail = req?.params?.studentEmail
            const studentSessionId = req?.params?.studentSessionId
            const filter = { studentEmail: studentEmail, studySessionId: studentSessionId }
            const result = await bookedSessionsCollection.findOne(filter)
            res.send(result)
        })


        app.patch("/studySessions/:id", async (req, res) => {
            const id = req.params;
            const info = req.body;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: info.status
                }
            }

            const result = await studySessionsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        //study session releted apis ends



        //reviews api starts from here
        app.post("/reviews", async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review)
            res.send(result)
        })


        app.get("/reviews", async (req, res) => {
            const result = await reviewsCollection.find().toArray()
            res.send(result)
        })


        app.get("/reviews/:id", async (req, res) => {
            const id = req.params.id
            const filter = { studySessionId: id }
            const result = await reviewsCollection.find(filter).toArray()
            res.send(result)
        })
        //reviews api ends from here





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