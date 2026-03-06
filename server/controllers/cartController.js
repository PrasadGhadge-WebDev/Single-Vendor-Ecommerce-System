const Cart = require("../models/Cart");
const Product = require("../models/Product");

const extractProductId = (raw) => {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw._id) return String(raw._id);
  return null;
};

const formatCart = (cart) => {
  if (!cart) {
    return {
      items: [],
      subtotal: 0,
      totalItems: 0,
    };
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const itemPrice = item.productId?.price || 0;
    return sum + itemPrice * item.quantity;
  }, 0);

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    userId: cart.userId,
    items: cart.items,
    subtotal,
    totalItems,
  };
};

exports.addToCart = async (req, res) => {
  try {
    const normalizedProductId = extractProductId(req.body.productId);
    const { quantity = 1 } = req.body;
    const userId = req.user._id;

    if (!normalizedProductId) return res.status(400).json({ message: "productId is required" });

    const product = await Product.findById(normalizedProductId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const qty = Math.max(1, Number(quantity));

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId: normalizedProductId, quantity: qty }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === normalizedProductId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += qty;
      } else {
        cart.items.push({ productId: normalizedProductId, quantity: qty });
      }
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate("items.productId");

    res.status(200).json(formatCart(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");
    res.status(200).json(formatCart(cart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const normalizedProductId = extractProductId(req.body.productId);
    const { quantity } = req.body;

    if (!normalizedProductId || quantity === undefined) {
      return res.status(400).json({ message: "productId and quantity are required" });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((entry) => entry.productId.toString() === normalizedProductId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    item.quantity = qty;

    await cart.save();
    const populated = await Cart.findById(cart._id).populate("items.productId");

    res.status(200).json(formatCart(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();

    const populated = await Cart.findById(cart._id).populate("items.productId");
    res.status(200).json(formatCart(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
