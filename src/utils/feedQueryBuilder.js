const ConnectionRequest = require('../models/connectionRequest'); 

// Main query builder function
async function buildFeedQuery(userId, queryParams) {
  // Get all user IDs to exclude (self + connections)
  const connectionRequests = await ConnectionRequest.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }]
  }).select("fromUserId toUserId");

  const excludedUserIds = [userId.toString()];
  connectionRequests.forEach(req => {
    excludedUserIds.push(req.fromUserId.toString(), req.toUserId.toString());
  });

  // Base query
  const searchQuery = { _id: { $nin: excludedUserIds } };

  // Apply filters
  addSkillsFilter(searchQuery, queryParams.skills);
  addAgeFilter(searchQuery, queryParams.minAge, queryParams.maxAge);
  addGenderFilter(searchQuery, queryParams.gender);

  return searchQuery;
}

// Filter helper functions
function addSkillsFilter(query, skills) {
  if (!skills?.trim()) return;
  
  const skillsArray = skills.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  if (skillsArray.length > 0) {
    query.skills = {
      $elemMatch: { $regex: new RegExp(skillsArray.join('|'), 'i') }
    };
  }
}

function addAgeFilter(query, minAge, maxAge) {
  const ageFilter = {};
  if (minAge && !isNaN(parseInt(minAge))) {
    ageFilter.$gte = Math.max(18, parseInt(minAge));
  }
  if (maxAge && !isNaN(parseInt(maxAge))) {
    ageFilter.$lte = Math.min(100, parseInt(maxAge));
  }
  if (Object.keys(ageFilter).length > 0) {
    query.age = ageFilter;
  }
}

function addGenderFilter(query, gender) {
  if (!gender || gender.toLowerCase() === 'all') return;
  
  const validGenders = ['male', 'female', 'others'];
  if (validGenders.includes(gender.toLowerCase())) {
    query.gender = gender.toLowerCase();
  }
}

module.exports = {
  buildFeedQuery,
  addSkillsFilter,
  addAgeFilter,
  addGenderFilter
};
