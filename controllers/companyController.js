const Company = require('../models/Company');
const Job = require('../models/Job');
const Joi = require('joi');

// Add a new company
exports.addCompany = async (req, res) => {
  const { companyName, description, industry, address, numberOfEmployees, companyEmail } = req.body;
  const companyHR = req.user.userId; // From authentication middleware

  // Validate request body
  const schema = Joi.object({
    companyName: Joi.string().required(),
    description: Joi.string().required(),
    industry: Joi.string().required(),
    address: Joi.string().required(),
    numberOfEmployees: Joi.string().required(),
    companyEmail: Joi.string().email().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Check if company already exists with the same name
    const existingCompany = await Company.findOne({ companyName });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this name already exists' });
    }

    // Create new company
    const newCompany = new Company({
      companyName,
      description,
      industry,
      address,
      numberOfEmployees,
      companyEmail,
      companyHR
    });

    // Save company to database
    await newCompany.save();

    res.status(201).json({ message: 'Company added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update company data
exports.updateCompany = async (req, res) => {
  const { companyId } = req.params;
  const updateFields = req.body;

  // Validate request body
  const schema = Joi.object({
    companyName: Joi.string(),
    description: Joi.string(),
    industry: Joi.string(),
    address: Joi.string(),
    numberOfEmployees: Joi.string(),
    companyEmail: Joi.string().email()
  }).min(1); // At least one field is required to update

  const { error } = schema.validate(updateFields);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if the authenticated user is the owner of the company
    if (company.companyHR.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update company fields
    Object.assign(company, updateFields);

    // Save updated company data
    await company.save();

    res.status(200).json({ message: 'Company updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete company and related jobs
exports.deleteCompany = async (req, res) => {
  const { companyId } = req.params;

  try {
    // Find company by ID
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if the authenticated user is the owner of the company
    if (company.companyHR.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete related jobs
    await Job.deleteMany({ addedBy: company.companyHR });

    // Delete company
    await company.remove();

    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get company details and related jobs
exports.getCompanyDetails = async (req, res) => {
  const { companyId } = req.params;

  try {
    // Find company by ID
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Populate related jobs
    const jobs = await Job.find({ addedBy: company.companyHR });

    // Return company details with related jobs
    res.status(200).json({ company, jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search for companies by name
exports.searchCompanyByName = async (req, res) => {
  const { companyName } = req.query;

  try {
    // Search for companies by name
    const companies = await Company.find({ companyName });

    res.status(200).json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all applications for a specific job
exports.getApplicationsForJob = async (req, res) => {
  const { jobId } = req.params;

  try {
    // Find job by ID
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the authenticated user is the owner of the job's company
    const company = await Company.findOne({ companyHR: req.user.userId });
    if (!company || job.addedBy.toString() !== company.companyHR.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Populate applications with user data (limited fields)
    const applications = await Application.find({ jobId }).populate('userId', 'firstName lastName email');

    res.status(200).json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
