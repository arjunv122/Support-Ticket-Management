const Organization = require('../Models/organizationModel');

exports.createOrganization = async (req, res) => {
    try {
        const org = await Organization.create(req.body);
        res.status(201).json(org);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create organization' });
    }
};

exports.getOrganizations = async (req, res) => {
    try {
        const orgs = await Organization.find().sort('-createdAt');
        res.status(200).json(orgs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch organizations' });
    }
};

exports.deleteOrganization = async (req, res) => {
    try {
        await Organization.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Organization deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete organization' });
    }
};
