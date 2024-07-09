const express = require('express');
const router = express.Router();
const JobController = require('../controllers/jobController');


/**
 * @route   POST /api/jobs/add
 * @desc    Add a new job
 * @access  Private (Company_HR role required)
 */
router.post('/add', JobController.addJob);

/**
 * @route   PUT /api/jobs/update/:jobId
 * @desc    Update job details
 * @access  Private (Company_HR role required, owner only)
 */
router.put('/update/:jobId', JobController.updateJob);

/**
 * @route   DELETE /api/jobs/delete/:jobId
 * @desc    Delete job
 * @access  Private (Company_HR role required, owner only)
 */
router.delete('/delete/:jobId', JobController.deleteJob);

/**
 * @route   GET /api/jobs/all
 * @desc    Get all jobs with their company's information
 * @access  Private (User or Company_HR role required)
 */
router.get('/all', JobController.getAllJobs);

/**
 * @route   GET /api/jobs/by-company
 * @desc    Get all jobs for a specific company
 * @access  Private (User or Company_HR role required)
 */
router.get('/by-company', JobController.getJobsByCompany);

/**
 * @route   GET /api/jobs/filter
 * @desc    Filter jobs by criteria (workingTime, jobLocation, seniorityLevel, jobTitle, technicalSkills)
 * @access  Private (User or Company_HR role required)
 */
router.get('/filter', JobController.filterJobs);

/**
 * @route   POST /api/jobs/apply
 * @desc    Apply to a job
 * @access  Private (User role required)
 */
router.post('/apply', JobController.applyToJob);

module.exports = router;
