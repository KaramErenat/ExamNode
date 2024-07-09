const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/companyController');
// const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/companies/add
 * @desc    Add a new company
 * @access  Private (Company_HR role required)
 * 
 * 
 */


router.post('/add', CompanyController.addCompany);

/**
 * @route   PUT /api/companies/update/:companyId
 * @desc    Update company data
 * @access  Private (Company_HR role required, owner only)
 */
router.put('/update/:companyId', CompanyController.updateCompany);

/**
 * @route   DELETE /api/companies/delete/:companyId
 * @desc    Delete company and related jobs
 * @access  Private (Company_HR role required, owner only)
 */
router.delete('/delete/:companyId', CompanyController.deleteCompany);

/**
 * @route   GET /api/companies/details/:companyId
 * @desc    Get company details and related jobs
 * @access  Private (User or Company_HR role required)
 */
router.get('/details/:companyId', CompanyController.getCompanyDetails);

/**
 * @route   GET /api/companies/search
 * @desc    Search for companies by name
 * @access  Private (User or Company_HR role required)
 */
router.get('/search', CompanyController.searchCompanyByName);

/**
 * @route   GET /api/companies/applications/:jobId
 * @desc    Get all applications for a specific job
 * @access  Private (Company_HR role required, owner only)
 */
router.get('/applications/:jobId', CompanyController.getApplicationsForJob);

module.exports = router;


