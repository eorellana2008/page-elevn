const Request = require('../models/Request');

const requestService = {
    create: async (userId, type, message) => {
        return await Request.create(userId, type, message);
    },
    respond: async (requestId, response) => {
        return await Request.respondAndResolve(requestId, response);
    }
};
module.exports = requestService;