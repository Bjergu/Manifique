const router = require("express").Router();



router.post("/api/contact", (req, res) => {
    
    
    res.redirect("/")
});

module.exports = {
    router
};