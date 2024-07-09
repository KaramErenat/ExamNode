const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Joi = require('joi');

// Add a new job
exports.addJob = async (req, res) => {
  const { jobTitle, jobLocation, workingTime, seniorityLevel, jobDescription, technicalSkills, softSkills } = req.body;
  const addedBy = req.user.userId; // From authentication middleware

  // Validate request body
  const schema = Joi.object({
    jobTitle: Joi.string().required(),
    jobLocation: Joi.string().valid('onsite', 'remotely', 'hybrid').required(),
    workingTime: Joi.string().valid('part-time', 'full-time').required(),
    seniorityLevel: Joi.string().valid('Junior', 'Mid-Level', 'Senior', 'Team-Lead', 'CTO').required(),
    jobDescription: Joi.string().required(),
    technicalSkills: Joi.array().items(Joi.string()).required(),
    softSkills: Joi.array().items(Joi.string()).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Create new job
    const newJob = new Job({
      jobTitle,
      jobLocation,
      workingTime,
      seniorityLevel,
      jobDescription,
      technicalSkills,
      softSkills,
      addedBy
    });

    // Save job to database
    await newJob.save();

    res.status(201).json({ message: 'Job added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update job details
exports.updateJob = async (req, res) => {
  const { jobId } = req.params;
  const updateFields = req.body;

  // Validate request body
  const schema = Joi.object({
    jobTitle: Joi.string(),
    jobLocation: Joi.string().valid('onsite', 'remotely', 'hybrid'),
    workingTime: Joi.string().valid('part-time', 'full-time'),
    seniorityLevel: Joi.string().valid('Junior', 'Mid-Level', 'Senior', 'Team-Lead', 'CTO'),
    jobDescription: Joi.string(),
    technicalSkills: Joi.array().items(Joi.string()),
    softSkills: Joi.array().items(Joi.string())
  }).min(1); // At least one field is required to update

  const { error } = schema.validate(updateFields);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the authenticated user is the owner of the job
    const company = await Company.findOne({ companyHR: req.user.userId });
    if (!company || job.addedBy.toString() !== company.companyHR.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update job fields
    Object.assign(job, updateFields);

    // Save updated job data
    await job.save();

    res.status(200).json({ message: 'Job updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete job and related applications
exports.deleteJob = async (req, res) => {
  const { jobId } = req.params;

  try {
    // Find job by ID
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the authenticated user is the owner of the job
    const company = await Company.findOne({ companyHR: req.user.userId });
    if (!company || job.addedBy.toString() !== company.companyHR.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete related applications
    await Application.deleteMany({ jobId });

    // Delete job
    await job.remove();

    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all jobs with their company's information
exports.getAllJobs = async (req, res) => {
  try {
    // Fetch all jobs
    const jobs = await Job.find().populate('addedBy', 'companyName'); // Populate company details

    res.status(200).json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all jobs for a specific company
exports.getJobsByCompany = async (req, res) => {
  const { companyHR } = req.user;

  try {
    // Find company by HR ID
    const company = await Company.findOne({ companyHR });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Fetch all jobs for the company
    const jobs = await Job.find({ addedBy: companyHR });

    res.status(200).json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Filter jobs by criteria (workingTime, jobLocation, seniorityLevel, jobTitle, technicalSkills)
exports.filterJobs = async (req, res) => {
  const { workingTime, jobLocation, seniorityLevel, jobTitle, technicalSkills } = req.query;

  try {
    // Build filter object based on provided query parameters
    const filter = {};
    if (workingTime) filter.workingTime = workingTime;
    if (jobLocation) filter.jobLocation = jobLocation;
    if (seniorityLevel) filter.seniorityLevel = seniorityLevel;
    if (jobTitle) filter.jobTitle = { $regex: jobTitle, $options: 'i' }; // Case-insensitive search
    if (technicalSkills) filter.technicalSkills = { $all: technicalSkills }; // Match all provided technical skills

    // Fetch jobs matching the filter
    const jobs = await Job.find(filter);

    res.status(200).json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Apply to a job
exports.applyToJob = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.user.userId; // From authentication middleware
  const { userTechSkills, userSoftSkills, userResume } = req.body;

  // Validate request body
  const schema = Joi.object({
    jobId: Joi.string().required(),
    userTechSkills: Joi.array().items(Joi.string()).required(),
    userSoftSkills: Joi.array().items(Joi.string()).required(),
    userResume: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Create new application
    const newApplication = new Application({
      jobId,
      userId,
      userTechSkills,
      userSoftSkills,
      userResume
    });

    // Save application to database
    await newApplication.save();

    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
