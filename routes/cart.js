const router = require("express").Router();

router.get("/api/cart", (req, res) => {
    res.send({ cart });
});

module.exports = {
    router
};