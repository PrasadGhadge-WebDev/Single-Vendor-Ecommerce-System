const express = require("express");
const { getReplacementPolicy } = require("../controllers/policyController");

const router = express.Router();

router.get("/replacement", getReplacementPolicy);

module.exports = router;
