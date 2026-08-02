import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"name is required"],
        lowercase:true


    },
    email:{
        type:String ,
        required:[true,"email is required"],
        unique:true,
        lowercase:true,
    },
    password:{
        type:String,
        required:true,
        minlength:true,


    },
    phone: {
     type: String,
     default: '',
   },
    linkedin: {
     type: String,
     default: '',
   },
    github: {
     type: String,
     default: '',
   },
    portfolio: {
     type: String,
     default: '',
   },
    education: [
    {
     degree: String,
     field: String,
     institution: String,
     startYear: Number,
     endYear: Number,
     cgpa: Number,
    }
   ],
   experience: [
    {
    title: String,
    company: String,
    startYear: Number,
    endYear: Number,
    description: String,
    }
   ],
    college:{
        type:String,
        

    },
    cgpa:{
        type:Number

    },
    refreshToken: {
     type: String,
     default: null,
   }
    
},{timestamps:true})

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword=async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);

}
const User =mongoose.model('User',userSchema)

export default User;