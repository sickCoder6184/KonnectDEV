function buildFiltersResponse({ skills, minAge, maxAge, gender }) {
  return {
    skills: skills || null,
    minAge: minAge ? parseInt(minAge) : null,
    maxAge: maxAge ? parseInt(maxAge) : null,
    gender: gender !== 'all' ? gender : null
  };
}

function handleFeedError(err, res) {
  const errorResponse = { success: false, error: "Failed to fetch feed users" };

  if (err.name === 'ValidationError') {
    errorResponse.error = "Invalid filter parameters";
    errorResponse.details = err.message;
    return res.status(400).json(errorResponse);
  }

  if (err.name === 'CastError') {
    errorResponse.error = "Invalid query parameters";
    return res.status(400).json(errorResponse);
  }

  errorResponse.details = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
  res.status(500).json(errorResponse);
}

module.exports = {
  buildFiltersResponse,
  handleFeedError
};
