import mongoose from "mongoose"

const skillSchema =new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    name:{
        type:String,
        required:[true,'name is required']

    },
    proficiency:{
        type:String,
        enum:['Beginner', 'Intermediate', 'Advanced'],
        required:true,



    },
    status:{
        type:String,
        enum:['Learning', 'Comfortable', 'Strong'],
        required:true

    },
    isVisible:{
        type:Boolean,
        default:true,


    },
    certificateUrl:{
        type:String,
        default:''

    },
    resourceUrl:{
        type:String,
        default:''


    },
    linkedProjects:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Project'

    },],

    
},{timestamps:true})


const Skill=mongoose.model('Skill',skillSchema);

export default Skill;