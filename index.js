const express = require('express');
const app = express();
// const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET);
const port = process.env.PORT || 5000;
const { ObjectId } = require('mongodb');


// middlewares
app.use(cors());
app.use(express.json());


// // Routes
// // SET TOKEN .
// const verifyJWT = (req, res, next) => {
//   const authorization = req.headers.authorization;
//   if (!authorization) {
//       return res.status(401).send({ error: true, message: 'Unauthorize access' })
//   }
//   const token = authorization?.split(' ')[1]
//   jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
//       if (err) {
//           return res.status(403).send({ error: true, message: 'forbidden user or token has expired' })
//       }
//       req.decoded = decoded;
//       next()
//   })
// }



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@foodie-cluster.e2b4b.mongodb.net/?retryWrites=true&w=majority&appName=foodie-cluster`;

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


    const classesCollection = client.db("yogaDb").collection("classes");
    const userCollection = client.db("yogaDb").collection("users");
    const cartCollection = client.db("yogaDb").collection("cart");
    const enrolledCollection = client.db("yogaDb").collection("enrolled");
    const paymentCollection = client.db("yogaDb").collection("payments");
    const appliedCollection = client.db("yogaDb").collection("applied");

    app.get('/applied', async (req, res) => {
        const result = await appliedCollection.find().toArray();
        res.send(result);
    })


// UPDATE USER ROLE TO INSTRUCTOR

// Assuming you have express and mongoose setup

app.patch('/user/role/:email', async (req, res) => {
    try {
      const { email } = req.params;  // Get the email from the URL
      const { role } = req.body;  // Get the role (e.g., 'instructor') from the request body
  
      // Check if role is provided
      if (!role) {
        return res.status(400).json({ message: 'Role is required' });
      }
  
      // 1. Find the user in UserCollection by email
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // 2. Update the user's role
      await userCollection.updateOne({ email }, { $set: { role } });
  
      // 3. Find the application in AppliedCollection and remove it
      await appliedCollection.deleteOne({ email });
  
      // 4. Send a success response
      res.status(200).json({ message: 'Role updated and application removed' });
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  
  
  //   // Verify admin
  //   const verifyAdmin = async (req, res, next) => {
  //     const email = req.decoded.email;
  //     const query = { email: email };
  //     const user = await userCollection.findOne(query);
  //     if (user.role === 'admin') {
  //         next()
  //     }
  //     else {
  //         return res.status(401).send({ error: true, message: 'Unauthorize access' })
  //     }
  // }

  // const verifyInstructor = async (req, res, next) => {
  //     const email = req.decoded.email;
  //     const query = { email: email };
  //     const user = await userCollection.findOne(query);
  //     if (user.role === 'instructor' || user.role === 'admin') {
  //         next()
  //     }
  //     else {
  //         return res.status(401).send({ error: true, message: 'Unauthorize access' })
  //     }
  // }


  app.post('/new-user', async (req, res) => {
      const newUser = req.body;
      const query = {email: newUser.email}
    // const existingUser = await userCollection.findOne(query)
    // if (existingUser) {
    //     return res.send({message: 'User already exists', insertedId: null})
    // }
      const result = await userCollection.insertOne(newUser);
      res.send(result);
  });
  // app.post('/api/set-token', (req, res) => {
  //     const user = req.body;
  //     const token = jwt.sign(user, process.env.ACCESS_SECRET, { expiresIn: '24h' })
  //     res.send({ token })
  // })


//   app.post('/users', async (req, res) => {
//     const user = req.body;
//     const query = {email: user.email}
//     const existingUser = await userCollection.findOne(query)
//     if (existingUser) {
//         return res.send({message: 'User already exists', insertedId: null})
//     }
//     const result = await userCollection.insertOne(user)
//     res.send(result)
//   })

  // GET ALL USERS
  app.get('/users', async (req, res) => {
      const users = await userCollection.find({}).toArray();
      res.send(users);
  })
  // GET USER BY ID
  app.get('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await userCollection.findOne(query);
      res.send(user);
  })
  // GET USER BY EMAIL
  app.get('/user/:email',  async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
  })
  // Delete a user

  app.delete('/delete-user/:id',  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
  })
  // UPDATE USER
  app.put('/update-user/:id',  async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
          $set: {
              name: updatedUser.name,
              email: updatedUser.email,
              role: updatedUser.option,
              address: updatedUser.address,
              phone: updatedUser.phone,
              about: updatedUser.about,
              photoUrl: updatedUser.photoUrl,
              skills: updatedUser.skills ? updatedUser.skills : null,
          }
      }
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
  })

 

  // ! CLASSES ROUTES


  app.post('/new-class', async (req, res) => {
      const newClass = req.body;
      newClass.availableSeats = parseInt(newClass.availableSeats)
      const result = await classesCollection.insertOne(newClass);
      res.send(result);
  });

  // GET ALL CLASSES ADDED BY INSTRUCTOR
  app.get('/classes/:email', async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
  })


  

  // GET ALL CLASSES
  app.get('/classes', async (req, res) => {
      const query = { status: 'approved' };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
  })
  app.get('/classes-manage', async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
  })

  // Change status of a class
  app.put('/change-status/:id',  async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      console.log(req.body)
      const reason = req.body.reason;
      const filter = { _id: new ObjectId(id) };
      console.log("🚀 ~ file: index.js:180 ~ app.put ~ reason:", reason)
      const options = { upsert: true };
      const updateDoc = {
          $set: {
              status: status,
              reason: reason
          }
      }
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
  })
  // * GET APPROVED CLASSES
  app.get('/approved-classes', async (req, res) => {
      const query = { status: 'approved' };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
  })

//    all approved classes by email
  app.get('/approved-classes/:email', async (req, res) => {
    const email = req.params.email;

    try {
        // Query for approved classes that match the email
        const query = { status: 'approved', instructorEmail: email };
        const result = await classesCollection.find(query).toArray();

        if (!result || result.length === 0) {
            return res.status(404).send({ message: "No approved classes found for this email." });
        }

        res.status(200).send(result);
    } catch (error) {
        console.error("Error fetching approved classes:", error);
        res.status(500).send({ message: "Failed to fetch approved classes." });
    }
});

//    all pending classes by email
  app.get('/pending-classes/:email', async (req, res) => {
    const email = req.params.email;

    try {
        // Query for approved classes that match the email
        const query = { status: 'pending', instructorEmail: email };
        const result = await classesCollection.find(query).toArray();

        if (!result || result.length === 0) {
            return res.status(404).send({ message: "No pending classes found for this email." });
        }

        res.status(200).send(result);
    } catch (error) {
        console.error("Error fetching pending classes:", error);
        res.status(500).send({ message: "Failed to fetch approved classes." });
    }
});



  // GET ALL INSTRUCTORS
  app.get('/instructors', async (req, res) => {
      const query = { role: 'instructor' };
      const result = await userCollection.find(query).toArray();
      res.send(result);
  })

  // Update a class
  app.put('/update-class/:id',  async (req, res) => {
      const id = req.params.id;
      const updatedClass = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
          $set: {
              name: updatedClass.name,
              description: updatedClass.description,
              price: updatedClass.price,
              availableSeats: parseInt(updatedClass.availableSeats),
              videoLink: updatedClass.videoLink,
              status: 'pending'
          }
      }
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
  })


  // Get single class by id for details page
  app.get('/class/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
  })
  // ! CART ROUTES

  // ADD TO CART
  app.post('/add-to-cart', async (req, res) => {
      const newCartItem = req.body;
      const result = await cartCollection.insertOne(newCartItem);
      res.send(result);
  })
  // Get cart item id for checking if a class is already in cart
  app.get('/cart-item/:id', async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const query = { classId: id, userMail: email };
      const projection = { classId: 1 };
      const result = await cartCollection.findOne(query, { projection: projection });
      res.send(result);
  })

  app.get('/cart/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userMail: email };
      const projection = { classId: 1 };
      const carts = await cartCollection.find(query, { projection: projection }).toArray();
      const classIds = carts.map(cart => new ObjectId(cart.classId));
      const query2 = { _id: { $in: classIds } };
      const result = await classesCollection.find(query2).toArray();
      res.send(result);
  })

  // Delete a item form cart
  app.delete('/delete-cart-item/:id',  async (req, res) => {
      const id = req.params.id;
      const query = { classId: id };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
  })
  // PAYMENT ROUTES
  app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price) * 100;
      const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card']
      });
      res.send({
          clientSecret: paymentIntent.client_secret
      });
  })
  // POST PAYMENT INFO 
  app.post('/payment-info', async (req, res) => {
      const paymentInfo = req.body;
      const classesId = paymentInfo.classesId;
      const userEmail = paymentInfo.userEmail;
      const singleClassId = req.query.classId;
      let query;
      // const query = { classId: { $in: classesId } };
      if (singleClassId) {
          query = { classId: singleClassId, userMail: userEmail };
      } else {
          query = { classId: { $in: classesId } };
      }
      const classesQuery = { _id: { $in: classesId.map(id => new ObjectId(id)) } }
      const classes = await classesCollection.find(classesQuery).toArray();
      const newEnrolledData = {
          userEmail: userEmail,
          classesId: classesId.map(id => new ObjectId(id)),
          transactionId: paymentInfo.transactionId,
      }
      const updatedDoc = {
          $set: {
              totalEnrolled: classes.reduce((total, current) => total + current.totalEnrolled, 0) + 1 || 0,
              availableSeats: classes.reduce((total, current) => total + current.availableSeats, 0) - 1 || 0,
          }
      }
      // const updatedInstructor = await userCollection.find()
      const updatedResult = await classesCollection.updateMany(classesQuery, updatedDoc, { upsert: true });
      const enrolledResult = await enrolledCollection.insertOne(newEnrolledData);
      const deletedResult = await cartCollection.deleteMany(query);
      const paymentResult = await paymentCollection.insertOne(paymentInfo);
      res.send({ paymentResult, deletedResult, enrolledResult, updatedResult });
  })


  app.get('/payment-history/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await paymentCollection.find(query).sort({ date: -1 }).toArray();
      res.send(result);
  })


  app.get('/payment-history-length/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const total = await paymentCollection.countDocuments(query);
      res.send({ total });
  })


  // ! ENROLLED ROUTES

  app.get('/popular_classes', async (req, res) => {
      const result = await classesCollection.find().sort({ totalEnrolled: -1 }).limit(6).toArray();
      res.send(result);
  })

  app.get('/enrolled-classes/:email', async (req, res) => {
    const email = req.params.email;
    const query = { userEmail: email };
    const pipeline = [
        {
            $match: query
        },
        {
            $lookup: {
                from: "classes",
                localField: "classesId",
                foreignField: "_id",
                as: "classes"
            }
        },
        {
            $unwind: "$classes"
        },
        {
            $lookup: {
                from: "users",
                localField: "classes.instructorEmail",
                foreignField: "email",
                as: "instructor"
            }
        },
        {
            $project: {
                _id: 0,
                classes: 1,
                instructor: {
                    $arrayElemAt: ["$instructor", 0]
                }
            }
        }

    ]
    const result = await enrolledCollection.aggregate(pipeline).toArray();
    // const result = await enrolledCollection.find(query).toArray();
    res.send(result);
})


// Admins stats 
app.get('/admin-stats',  async (req, res) => {
  // Get approved classes and pending classes and instructors 
  const approvedClasses = (await classesCollection.find({ status: 'approved' }).toArray()).length;
  const pendingClasses = (await classesCollection.find({ status: 'pending' }).toArray()).length;
  const instructors = (await userCollection.find({ role: 'instructor' }).toArray()).length;
  const totalClasses = (await classesCollection.find().toArray()).length;
  const totalEnrolled = (await enrolledCollection.find().toArray()).length;
  // const totalRevenue = await paymentCollection.find().toArray();
  // const totalRevenueAmount = totalRevenue.reduce((total, current) => total + parseInt(current.price), 0);
  const result = {
      approvedClasses,
      pendingClasses,
      instructors,
      totalClasses,
      totalEnrolled,
      // totalRevenueAmount
  }
  res.send(result);

})

// !GET ALL INSTrUCTOR  

app.get('/instructors', async (req, res) => {
  const result = await userCollection.find({ role: 'instructor' }).toArray();
  res.send(result);
})




app.get('/enrolled-classes/:email',  async (req, res) => {
  const email = req.params.email;
  const query = { userEmail: email };
  const pipeline = [
      {
          $match: query
      },
      {
          $lookup: {
              from: "classes",
              localField: "classesId",
              foreignField: "_id",
              as: "classes"
          }
      },
      {
          $unwind: "$classes"
      },
      {
          $lookup: {
              from: "users",
              localField: "classes.instructorEmail",
              foreignField: "email",
              as: "instructor"
          }
      },
      {
          $project: {
              _id: 0,
              classes: 1,
              instructor: {
                  $arrayElemAt: ["$instructor", 0]
              }
          }
      }

  ]
  const result = await enrolledCollection.aggregate(pipeline).toArray();
  // const result = await enrolledCollection.find(query).toArray();
  res.send(result);
})

// Applied route 
app.post('/as-instructor', async (req, res) => {
  const data = req.body;
  const result = await appliedCollection.insertOne(data);
  res.send(result);
})
app.get('/applied-instructors/:email',   async (req, res) => {
  const email = req.params.email;
  const result = await appliedCollection.findOne({email});
  res.send(result);
});

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req,res) => {
    res.send('master is siting')
});

app.listen(port, () => {
    console.log(`Yoga Master is sitting on port ${port}`)
})
