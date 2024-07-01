const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

let secret = "Tn9Qx2Ks7Mf3Jw4Pz6Rv";
let secretUser = "Tn9Qx2Ks7Mf3Jw4Pz6Rv";
let token = "";
function generateJwt(payload){
    token = jwt.sign(payload,secret,{expiresIn:'1h'});
    return token;
}

let tokenUser = "";
function generateJwtUser(payload){
  tokenUser = jwt.sign(payload,secretUser,{expiresIn:'1h'});
    return tokenUser;
}

function authenticateJwt(req,res,next){
  const token = req.headers.split(" ")[1];
  if(!token){
    res.status(401).Json({message: "Please provide a valid token"});
  }
  jwt.verify(token,secret,(err,user)=>{
    if(err){
      res.status(403).Json({message: "unauthorized"});
    }else{
      req.user = user;
      next();
    }
    
  });
}



function authenticateJwtUser(req,res,next){
  const token = req.headers.split(" ")[1];
  if(!token){
    res.status(401).Json({message: "Please provide a valid token"});
  }
  jwt.verify(token,secretUser,(err,user)=>{
    if(err){
      res.status(403).Json({message: "unauthorized"});
    }else{
      req.user = user;
      next();
    }
    
  });
}




const adminSchema = mongoose.Schema({
  userName:{ type:String, required:true, unique:true},
  password:{ type:String ,required:true}
});

const userSchema =mongoose.Schema({
  userName:{ type:String, required:true, unique:true},
  password:{ type:String ,required:true},
  purchasedCourses: { type: mongoose.Schema.Types.ObjectId, ref:"Course"}
})

const courseSchema = mongoose.Schema({
    title: {type:String, required:true},
    description: String,
    price: Number,
    imageLink: String,
    published: {type:Boolean,default:true}
});


const User = mongoose.model("User",userSchema);
const Admin = mongoose.model("Admin",adminSchema);
const Course = mongoose.model("Course",courseSchema);


mongoose.connect("mongodb://127.0.0.1:27017/CourseApp");




app.post('/admin/signup', async (req, res) => {
  const {userName,password} = {...req.body}

  const existingUser = await Admin.findOne({userName});
  if(existingUser){
    res.status(409).json({message : "user already exisits"});
  }

  const admin = new Admin({userName,password});
  await admin.save(user);


  let token = await generateJwt({userName});
  res.status(201).json({message:"Admin Created Successfully",
    token}
  );

});

app.post('/admin/login',async (req, res) => {

  const {userName,password} = req.body;

  const existingUser = await Admin.findOne({userName,password});
  if(!existingUser){
    res.status(403).Json({message:"unauthorized access"});
  }

  let token = await generateJwt({userName});
  res.status(200).Json({message: "admin logged in successfuly",token});

});

app.post('/admin/courses',authenticateJwt, async(req, res) => {
  const course = new Course(req.body);
  await course.save(course);
  res.status(201).json({message:"course created successfully"});
  
});

app.put('/admin/courses/:courseId', authenticateJwt, async(req, res) => {
  const courseId = req.params.courseId;
  const updatedCourse = new Course(req.body);
  const course =await Course.findByIdAndUpdate(courseId,updatedCourse,{new:true},(err,course)=>{
    if(err){
      res.status(404).Json({message:"course not found"});
    }
    res.status(200).Json(course);

  }) 
});

app.get('/admin/courses',authenticateJwt, async (req, res) => {
  const courses = await Course.find({});
  res.status(200).Json(courses);
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
});

app.post('/users/login', (req, res) => {
  // logic to log in user
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});




