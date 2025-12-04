const Medicine = require('../Models/medicine.model');

// Get all medicines
const getAllMedicines = async (req, res) => {
  try {
    console.log('Getting all medicines...');
    const medicines = await Medicine.find();
    console.log('Fetched medicines:', medicines);
    res.status(200).json({ 
      success: true,
      medicines: medicines || [] 
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch medicines' 
    });
  }
}; // ← ADDED missing closing brace

// Search medicines by query
const searchMedicines = async (req, res) => {
  try {
    const { query } = req.query;
    console.log('Search query:', query);
    
    if (!query) {
      const medicines = await Medicine.find();
      return res.status(200).json({ 
        success: true,
        medicines: medicines || [] 
      });
    } // ← ADDED missing closing brace for if block

    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { manufacturer: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
      ],
    });

    console.log('Search results:', medicines);
    res.status(200).json({ 
      success: true,
      medicines: medicines || [] 
    });
  } catch (error) {
    console.error('Error searching medicines:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search medicines' 
    });
  }
}; // ← ADDED missing closing brace

module.exports = { getAllMedicines, searchMedicines };
