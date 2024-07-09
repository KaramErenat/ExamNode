const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applicationSchema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userTechSkills: { type: [String], required: true },
  userSoftSkills: { type: [String], required: true },
  userResume: { type: String, required: true } // Store Cloudinary URL for the resume
});

module.exports = mongoose.model('Application', applicationSchema);
