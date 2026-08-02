import Skill from "../models/skill.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import Project from "../models/project.model.js";

export const addSkill=asyncHandler(async(req,res)=>{
    const {name,proficiency,status,certificateUrl,resourceUrl}=req.body;
    const skillExist=await Skill.findOne({user:req.user._id,name});
    if(skillExist){
        throw new ApiError(401,'Skill already exists');
    }
    const skill =await Skill.create({
        user:req.user._id,
        name,
        proficiency,
        status,
        certificateUrl,
        resourceUrl

    })

    return res.status(201).json(new ApiResponse(201,skill,'skill added successfully'))
})

export const getSkill=asyncHandler(async(req,res)=>{
    const Skills=await Skill.find({user:req.user._id}).populate('linkedProjects','name status')
    
    return res.status(200).json(new ApiResponse(200,Skills,'skills fetched successfully '))



})
export const updateSkill=asyncHandler(async(req,res)=>{
  const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
  if (!skill) throw new ApiError(404, 'Skill not found');

  const { name, proficiency, status, isVisible, notes, certificateUrl, resourceUrl } = req.body;

  skill.name = name ?? skill.name;
  skill.proficiency = proficiency ?? skill.proficiency;
  skill.status = status ?? skill.status;
  skill.isVisible = isVisible ?? skill.isVisible;
  skill.notes = notes ?? skill.notes;
  skill.certificateUrl = certificateUrl ?? skill.certificateUrl;
  skill.resourceUrl = resourceUrl ?? skill.resourceUrl;

  await skill.save();

  res.json(new ApiResponse(200, skill, 'Skill updated successfully'));
})

export const deleteSkill=asyncHandler(async(req,res)=>{
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
  if (!skill) throw new ApiError(404, 'Skill not found');

  await Project.updateMany(
    {techStack:skill._id},{$pull:{techStack:skill._id}}
 )

  await skill.deleteOne();

  res.json(new ApiResponse(200, {}, 'Skill deleted successfully'));
})


export const addProject = asyncHandler(async (req, res) => {
  const { name, description, techStack, impactMetric, githubUrl, liveUrl, status } = req.body;

  const project = await Project.create({
    user: req.user._id,
    name,
    description,
    techStack,
    impactMetric,
    githubUrl,
    liveUrl,
    status,
  });

  // link this project to each skill in techStack
  if (techStack && techStack.length > 0) {
    await Skill.updateMany(
      { _id: { $in: techStack }, user: req.user._id },
      { $addToSet: { linkedProjects: project._id } }
      
    );
  }
  res.status(201).json(new ApiResponse(201, project, 'Project added successfully'));
  
})

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ user: req.user._id })
    .populate('techStack', 'name proficiency status');

  res.json(new ApiResponse(200, projects, 'Projects fetched successfully'));
});

export const updateProject =asyncHandler(async(req,res)=>{
    const project=await Project.findOne({user:req.user._id,_id:req.params.id})
    if(!project){
        throw new ApiError(400,'no project exist')


    }
    const {name, description, techStack, impactMetric, githubUrl, liveUrl, status, isVisible, notes}=req.body

    project.name=name??project.name;
    project.description=description??project.description
    project.techStack = techStack ?? project.techStack;
    project.impactMetric = impactMetric ?? project.impactMetric;
    project.githubUrl = githubUrl ?? project.githubUrl;
    project.liveUrl = liveUrl ?? project.liveUrl;
    project.status = status ?? project.status;
    project.isVisible = isVisible ?? project.isVisible;
    project.notes = notes ?? project.notes;

    await project.save();
    return res.json(new ApiResponse(200,project,'project updated successfully'))

});

export const deleteProject=asyncHandler(async(req,res)=>{
    const project=await Project.findOne({_id:req.params.id,user:req.user._id});
    if(!project){
        throw new ApiError(400,'no project exist')

    }
    await Skill.updateMany(
        {linkedProjects: project._id},
        {$pull:{linkedProjects: project._id }})
    await project.deleteOne();

    res.json(new ApiResponse(200, {}, 'Project deleted successfully'));    

})
