import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
  },
  techStack: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
  ],
  impactMetric: {
    type: String,
    default: '',
  },
  githubUrl: {
    type: String,
    default: '',
  },
  liveUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress',
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;