const User = require('../Models/userModel');
const Ticket = require('../Models/ticketModel');

class RoutingService {
    /**
     * Determines the optimal agent for a new ticket using Workload Balancing.
     * It queries the current open ticket count for all agents and picks the one 
     * with the lowest active workload to prevent bottlenecks.
     * 
     * @param {string} category - The category of the ticket (for future skill-based routing expansion)
     * @returns {Promise<ObjectId|null>} Processed agent ID or null if no agents exist
     */
    static async getBestAgentForTicket(category = 'GENERAL') {
        const agents = await User.find({ role: 'AGENT' });
        if (!agents || agents.length === 0) return null;

        // If there's only one agent, assign immediately
        if (agents.length === 1) return agents[0]._id;

        // Calculate workload: count of OPEN or IN_PROGRESS tickets per agent
        const workloadStats = await Ticket.aggregate([
            { $match: { status: { $in: ['OPEN', 'IN_PROGRESS'] } } },
            { $group: { _id: '$assignedAgentId', count: { $sum: 1 } } }
        ]);

        const loadMap = {};
        workloadStats.forEach(stat => {
            if (stat._id) loadMap[stat._id.toString()] = stat.count;
        });

        // Find the agent with the lowest active ticket count
        let bestAgent = agents[0];
        let lowestLoad = loadMap[bestAgent._id.toString()] || 0;

        for (let i = 1; i < agents.length; i++) {
            const agentLoad = loadMap[agents[i]._id.toString()] || 0;
            if (agentLoad < lowestLoad) {
                lowestLoad = agentLoad;
                bestAgent = agents[i];
            }
        }

        return bestAgent._id;
    }
}

module.exports = RoutingService;
