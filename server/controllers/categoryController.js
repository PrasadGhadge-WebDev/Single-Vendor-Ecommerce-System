const Category = require("../models/Category");
const Product = require("../models/Product");

const generateSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

exports.addCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, status, featured, seo } = req.body;
    let { slug } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    if (!slug) slug = generateSlug(name);

    // Validate slug uniqueness
    const existingSlug = await Category.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const parsedSeo = seo ? (typeof seo === 'string' ? JSON.parse(seo) : seo) : undefined;
    
    // Parse parentCategory: if empty string or "none", set to null
    let parentId = parentCategory && parentCategory !== "none" && parentCategory !== "" ? parentCategory : null;

    const category = await Category.create({
      name,
      slug,
      description,
      parentCategory: parentId,
      status: status || 'active',
      featured: featured === 'true' || featured === true,
      seo: parsedSeo,
      image: req.file ? req.file.filename : null,
      subCategories: req.body.subCategories ? (typeof req.body.subCategories === 'string' ? JSON.parse(req.body.subCategories) : req.body.subCategories) : [],
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parentCategory', 'name slug').sort({ name: 1 }).lean();
    
    // Get product counts per category
    const productCounts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    
    const countMap = {};
    productCounts.forEach(pc => {
      countMap[pc._id] = pc.count;
    });

    // Subcategories child lookup (to dynamically calculate how many subcategories a parent has via parentCategory)
    const childMap = {};
    categories.forEach(cat => {
      if (cat.parentCategory) {
        if (!childMap[cat.parentCategory._id]) childMap[cat.parentCategory._id] = [];
        childMap[cat.parentCategory._id].push(cat);
      }
    });

    const enrichedCategories = categories.map(cat => ({
      ...cat,
      productCount: countMap[cat.name] || 0,
      childCategories: childMap[cat._id] || []
    }));

    res.status(200).json(enrichedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).populate('parentCategory', 'name slug').lean();
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get children
    const childCategories = await Category.find({ parentCategory: category._id }).lean();
    
    // Get products
    const products = await Product.find({ category: category.name }).select('name sku price stock status images').lean();
    const productCount = products.length;

    res.status(200).json({
      ...category,
      childCategories,
      products,
      productCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parentCategory, status, featured, seo } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const oldName = category.name;
    
    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (status) category.status = status;
    if (featured !== undefined) category.featured = featured === 'true' || featured === true;
    
    if (parentCategory !== undefined) {
      category.parentCategory = parentCategory && parentCategory !== "none" && parentCategory !== "" ? parentCategory : null;
    }

    if (seo) {
      category.seo = typeof seo === 'string' ? JSON.parse(seo) : seo;
    }

    if (req.file) category.image = req.file.filename;
    
    if (req.body.subCategories) {
      category.subCategories = typeof req.body.subCategories === 'string' ? JSON.parse(req.body.subCategories) : req.body.subCategories;
    }

    await category.save();

    if (name && oldName !== name) {
      await Product.updateMany({ category: oldName }, { $set: { category: name } });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Reassign products to Uncategorized
    await Product.updateMany({ category: category.name }, { $set: { category: "Uncategorized" } });

    // Detach children
    await Category.updateMany({ parentCategory: category._id }, { $set: { parentCategory: null } });

    await Category.findByIdAndDelete(id);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkActionCategories = async (req, res) => {
  try {
    const { action, categoryIds } = req.body;
    if (!categoryIds || categoryIds.length === 0) {
      return res.status(400).json({ message: "No categories selected" });
    }

    if (action === "delete") {
      const categories = await Category.find({ _id: { $in: categoryIds } });
      const categoryNames = categories.map(c => c.name);
      
      // Reassign products
      await Product.updateMany({ category: { $in: categoryNames } }, { $set: { category: "Uncategorized" } });
      
      // Detach children
      await Category.updateMany({ parentCategory: { $in: categoryIds } }, { $set: { parentCategory: null } });
      
      await Category.deleteMany({ _id: { $in: categoryIds } });
      
    } else if (action === "activate") {
      await Category.updateMany({ _id: { $in: categoryIds } }, { $set: { status: 'active' } });
    } else if (action === "deactivate") {
      await Category.updateMany({ _id: { $in: categoryIds } }, { $set: { status: 'inactive' } });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    res.status(200).json({ message: `Bulk action '${action}' completed successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.ensureCategoryExists = async (categoryName) => {
  if (!categoryName) return null;

  let category = await Category.findOne({ name: categoryName });
  if (!category) {
    category = await Category.create({ 
      name: categoryName,
      slug: generateSlug(categoryName)
    });
  }
  return category;
};
