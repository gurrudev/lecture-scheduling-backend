const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv').config()
const cors = require('cors')
// const MONGO_URI = require('./env')

// Connect to MongoDB
mongoose.connect(`${process.env.MONGO_URI}@cluster0.8wdm4gd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/lecture-scheduler`, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
});


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(bodyParser.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));


// Define Mongoose Schemas
const instructorSchema = new mongoose.Schema({
  name: String,
  username: String,
  password : String
});

const courseSchema = new mongoose.Schema({
  name: String,
  level: String,
  description: String,
  image: String,
  batch: String,
  lectures: [
    {
      instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
      date: Date,
    },
  ],
});

const Instructor = mongoose.model('Instructor', instructorSchema);
const Course = mongoose.model('Course', courseSchema);

app.get('/',(req, res)=>{
  res.json('ok')
})

// Admin Login API
// app.post('/api/admin/login', (req, res) => {
//   // Implement admin login logic
//   // For simplicity, you can check hardcoded credentials
//   const { username, password } = req.body;
//   if (username === 'admin' && password === 'adminpassword') {
//     req.session.admin = true;
//     return res.json({ message: 'Admin login successful' });
//   } else {
//     return res.status(401).json({ message: 'Invalid credentials' });
//   }
// });

app.get('/api/istructor/all',async(req, res)=>{
  try{
    const instructors = await Instructor.find()
    return res.status(200).json({instructors})
  }catch(e){
    return res.send(401).json({message: 'Internal Server Error' })
  }
})


// Instructor Sign-up API
app.post('/api/instructor/signup', async (req, res) => {
    try {
      const { name, username, password } = req.body;
  
      // Check if the username is already taken
      const existingInstructor = await Instructor.findOne({ username });
      if (existingInstructor) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
  
      // Create a new instructor
      const newInstructor = new Instructor({ name, username, password });
      await newInstructor.save();
  
      return res.json({ message: 'Instructor signed up successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Instructor Sign-in API
  app.post('/api/instructor/signin', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Find the instructor by username and password
      const instructor = await Instructor.findOne({ username, password });
  
      if (!instructor) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Set the user session
      req.session.instructorId = instructor._id;
  
      return res.json({ message: 'Instructor signed in successfully', instructor });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Instructor Panel - Get scheduled details with authentication
  app.get('/api/instructor/schedule', async (req, res) => {
    try {
      const { instructorId } = req.session;
  
      if (!instructorId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      const scheduledDetails = await Course.find({
        'lectures.instructor': instructorId,
      }).populate('lectures.instructor', 'name');
  
      return res.json({ scheduledDetails });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

// Add Instructor API
app.post('/api/admin/add-instructor', async (req, res) => {
  // Implement adding instructors logic
  const { name, username, password } = req.body;
//   const instructor = new Instructor({ name });
  const existingInstructor = await Instructor.findOne({ username });
      if (existingInstructor) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
  // Create a new instructor
  const newInstructor = new Instructor({ name, username, password });
  await newInstructor.save();

  return res.json({ message: 'Instructor added successfully', newInstructor });
});

// Add Course API
// Add Course API
app.post('/api/admin/add-course', async (req, res) => {
    try {
      const { name, level, description, image, instructorId, batch, date } = req.body;
  
      // Check if the instructor is available on the given date
      const isAvailable = await Course.findOne({
        'lectures.instructor': instructorId,
        'lectures.date': date,
      });
  
      if (isAvailable) {
        return res.status(400).json({ message: 'Instructor is not available on this date' });
      }
  
      // Check if the instructor is already scheduled for the same date
      const existingCourse = await Course.findOne({
        'lectures.instructor': instructorId,
        'lectures.date': date,
      });
  
      if (existingCourse) {
        return res.status(400).json({ message: 'Lecture is already scheduled for this date and instructor' });
      }
  
      // Add the course
      const course = new Course({
        name,
        level,
        description,
        image,
        batch,
        lectures: [{ instructor: instructorId, date }],
      });
  
      await course.save();
  
      return res.json({ message: 'Course added successfully', course });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

// Instructor Panel - Get assigned lectures
app.get('/api/instructor/lectures:id', async (req, res) => {
  try {
    const { id } = req.params;

    const lectures = await Course.find({
      'lectures.instructor': id,
    }).populate('lectures.instructor', 'name');

    return res.json({ lectures });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Instructor Panel - Get scheduled details
app.get('/api/instructor/schedule/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      const scheduledDetails = await Course.find({
        'lectures.instructor': id,
      }).populate('lectures.instructor', 'name');
  
      return res.json({ scheduledDetails });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

app.listen(PORT, () => {
  console.log(`Server is running on: ${PORT}`);
});
