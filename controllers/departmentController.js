const { Lsdc } = require('../models/lsdc');

/**
 * Get unique departments from users
 * Returns: [{ deptID, deptName }]
 */
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Lsdc.aggregate([
      {
        $match: {
          deptID: { $ne: null },
          deptName: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            deptID: "$deptID",
            deptName: "$deptName"
          }
        }
      },
      {
        $project: {
          _id: 0,
          deptID: "$_id.deptID",
          deptName: "$_id.deptName"
        }
      },
      {
        $sort: { deptName: 1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments
    });

  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
};
