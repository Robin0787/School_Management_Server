const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.nxzja4k.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("School_Management");
    const approvedUserCollection = database.collection("Approved_Users");
    const currentStudentsCollection = database.collection("current-students");
    const subjectCollection = database.collection("subjects");

    const instructorRequests = database.collection("instructor-requests");
    const approvedInstructors = database.collection("approved-instructors");
    const rejectedInstructors = database.collection("rejected-instructors");

    const studentsRequest = database.collection("student-requests");
    const ApprovedStudents = database.collection("approved-students");
    const RejectedStudents = database.collection("rejected-students");

    // ----------- GET ----------- GET ----------- GET ----------- GET ----------- //
    
    // Getting user based on email
    app.get('/user/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const result = await approvedUserCollection.findOne(query);
      res.send(result);
    })

    // Getting all current Students
    app.get('/get-all-current-students', async(req, res) => {
      const result = await currentStudentsCollection.aggregate([
        {
          $sort: { roll: 1 },
        },
        {
          $group: {
            _id: { $toLower: "$class" },
            students: { $push: "$$ROOT" },
          },
        },
      ]).toArray();

      const groupedData = {};
      result.forEach((item) => {
        groupedData[item._id] = item.students;
      });
      res.send(groupedData);
    })
    
    // Getting all subject according to className
    app.get("/subjects/:class", async (req, res) => {
      const classNum = req.params.class;
      const query = { class: classNum };
      const specificClass = await subjectCollection.findOne(query);
      res.send(specificClass);
    });
    // Getting user details based on email
    app.get("/get-approved-user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await approvedUserCollection.findOne(query);
      res.send(result);
    });

    // Getting all approved students
    app.get("/approved-students", async (req, res) => {
      const result = await ApprovedStudents.aggregate([
        {
          $group: {
            _id: { $toLower: "$className" },
            students: { $push: "$$ROOT" },
          },
        },
      ]).toArray();

      const groupedData = {};
      result.forEach((item) => {
        groupedData[item._id] = item.students;
      });
      res.send(groupedData);
    });

    // Getting all students request
    app.get("/students-request", async (req, res) => {
      const result = await studentsRequest
        .aggregate([
          {
            $group: {
              _id: { $toLower: "$className" },
              students: { $push: "$$ROOT" },
            },
          },
        ])
        .toArray();

      const groupedData = {};
      result.forEach((item) => {
        groupedData[item._id] = item.students;
      });
      res.send(groupedData);
    });

    // Getting all instructors request
    app.get("/instructors-request", async (req, res) => {
      const requests = await instructorRequests.find().toArray();
      res.send(requests);
    });

    // Getting all the current students
    app.get("/get-current-students", async (req, res) => {
      const result = await currentStudentsCollection
        .aggregate([
          {
            $sort: { roll: 1 },
          },
          {
            $group: {
              _id: { $toLower: "$class" },
              students: { $push: "$$ROOT" },
            },
          },
        ])
        .toArray();

      const groupedData = {};
      result.forEach((item) => {
        groupedData[item._id] = item.students;
      });
      res.send(groupedData);
    });

    // Getting Instructor Stats
    app.get("/get-instructor-stats", async (req, res) => {
      const collectionNames = [
        "current-students",
        "student-requests",
        "approved-students",
        "rejected-students",
      ];
      const collectionStats = {};

      const promises = collectionNames.map(async (collectionName) => {
        const collection = database.collection(collectionName);
        const count = await collection.countDocuments();
        collectionStats[collectionName] = count;
      });

      try {
        await Promise.all(promises);
        res.send(collectionStats);
      } catch (error) {
        console.error("Error counting documents:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Getting Admin Stats 
    app.get('/get-admin-stats', async(req, res) => {
      const collectionNames = ["instructor-requests", "approved-instructors", "rejected-instructors"];
      const collectionStats = {};

      const promises = collectionNames.map(async (collectionName) => {
        const collection = database.collection(collectionName);
        const count = await collection.countDocuments();
        collectionStats[collectionName] = count;
      });
      
      try {
        await Promise.all(promises);
        res.send(collectionStats);
      } catch (error) {
        console.error("Error counting documents:", error);
        res.status(500).send("Internal Server Error");
      }
    })

    // Getting all approved instructors
    app.get("/approved-instructors", async (req, res) => {
      const result = await approvedInstructors.find().toArray();
      res.send(result);
    });
     // Getting all rejected instructors
     app.get("/rejected-instructors", async (req, res) => {
      const result = await rejectedInstructors.find().toArray();
      res.send(result);
    });

     // Getting all rejected Students
     app.get("/rejected-students", async (req, res) => {
      const result = await RejectedStudents.find().toArray();
      res.send(result);
    });

    // ----------- POST ----------- POST ----------- POST ----------- POST ----------- //
    // Storing Instructors Sign Up request
    app.post("/store-instructor-request", async (req, res) => {
      const data = req.body;
      const result = await instructorRequests.insertOne(data);
      res.send(result);
    });

    // storing students Sign Up request
    app.post("/store-student-request", async (req, res) => {
      const data = req.body;
      const result = await studentsRequest.insertOne(data);
      res.send(result);
    });

    // Storing approved students
    app.post("/store-approved-student/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await studentsRequest.updateOne(query, {
        $set: { status: "approved" },
      });
      const student = await studentsRequest.findOne(query);
      const result1 = await approvedUserCollection.insertOne(student);
      const result2 = await ApprovedStudents.insertOne(student);
      const result3 = await studentsRequest.deleteOne(query);
      res.send(result3);
    });

    // Storing Current Students
    app.post("/store-current-student", async (req, res) => {
      const studentInfo = req.body;
      const result = await currentStudentsCollection.insertOne(studentInfo);
      res.send(result);
    });

    // Store Approved Instructor
    app.post("/store-approved-instructor", async (req, res) => {
      const { instructorID } = req.body;
      const query = { _id: new ObjectId(instructorID) };
      const result = await instructorRequests.updateOne(query, {
        $set: { status: "approved" },
      });
      const instructor = await instructorRequests.findOne(query);
      const result1 = await approvedUserCollection.insertOne(instructor);
      const result2 = await approvedInstructors.insertOne(instructor);
      const result3 = await instructorRequests.deleteOne(query);
      res.send(result2);
    });

    // ----------- PUT ----------- PUT ----------- PUT ----------- PUT ----------- //

    // ----------- PATCH ----------- PATCH ----------- PATCH ----------- PATCH ----------- //

    // Updating current student info
    app.patch('/update-current-student/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const data = req.body;
      const updateDoc = {
        $set: { ...data }
      };
      const result = await currentStudentsCollection.updateMany(query, updateDoc);
      res.send(result);
    })

    // ----------- DELETE ----------- DELETE ----------- DELETE ----------- DELETE ----------- //

    // Rejecting Student Request
    app.delete("/reject-student-request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = await studentsRequest.updateOne(query, {
        $set: { status: "rejected" },
      });
      const student = await studentsRequest.findOne(query);
      const storeStudent = await RejectedStudents.insertOne(student);
      const result = await studentsRequest.deleteOne(query);
      res.send(result);
    });

    // Deleting instructor Request
    app.delete("/delete-instructor-request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await instructorRequests.updateOne(query, {
        $set: { status: "rejected" },
      });
      const instructor = await instructorRequests.findOne(query);
      const result1 = await rejectedInstructors.insertOne(instructor);
      const result2 = await instructorRequests.deleteOne(query);
      res.send(result2);
    });

    // Deleting Rejected Student from database for forever
    app.delete('/delete-rejected-student/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await RejectedStudents.deleteOne(query);
      res.send(result);
    })

    // Deleting Approved Student from database for forever
    app.delete('/delete-approved-student/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email : email};
      const result1 = await approvedUserCollection.deleteOne(query);
      const result = await ApprovedStudents.deleteOne(query);
      res.send(result);
    })

    // Deleting current Students for forever
    app.delete('/delete-current-student/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await currentStudentsCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("School Management Server is running");
});

app.listen(port, () => {
  console.log("Server is running on port", port);
});
