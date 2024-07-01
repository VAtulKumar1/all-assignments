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
app.post('/users/signup', async(req, res) => {
  const {userName,password} = {...req.body};
  const existingUser = await User.findOne({userName});
  if(existingUser){
    res.status(403).Json({message:"user already exists"});
  }  

  const user = new User({userName,password});
  await user.save();

  let token = generateJwtUser({userName});
  res.status(201).Json({message :"user created succcesfully",token});
});

app.post('/users/login', async(req, res) => {
  const {userName,password} = {...req.body};
  const existingUser = await User.findOne({userName,password});
  if(!existingUser){
    res.send(404).Json({message:"user not found"});
  }

  let token = generateJwtUser({userName});
  res.status(200).Json({message: "user logged in succesFully",token});
  

});

app.get('/users/courses',authenticateJwtUser, async(req, res) => {
    const courses  = await Course.find({published:true});
    res.status(200).Json(courses);

});

app.post('/users/courses/:courseId',authenticateJwtUser,async (req, res) => {
  // logic to purchase a course
  const courseId = req.params.courseId;
  const course = await Course.findById(courseId);
  if(!course){
    res.status(404).Json({message:"course not found"});
  }
  const userName = req.user.userName;
  const user = await User.findOne(userName);  
  if(!user){
    res.status(404).Json({message:"user not found"});
  }
  user.purchasedCourses.push(course);
  await user.save();
  res.status(200).Json("course purchased succesfully");
});

app.get('/users/purchasedCourses',authenticateJwtUser, async(req, res) => {
  const userName = req.user.userName;
  const user = await User.findOne({userName}).populate("purchasedCourses");
  if(user){
    res.status(200).Json({purchasedCourses: user.purchasedCourses||[]});
  }
  else{
    res.status(404).Json({message:"user not found"});
  }
  
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});




