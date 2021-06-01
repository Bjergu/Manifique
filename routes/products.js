const router = require("express").Router();
const express = require("express");
const app = express();
const MongoClient = require('mongodb').MongoClient
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const daaa = console.log("router on!");

router.get("/api/products", (req, res) => {
    
    res.send(daaa);
});

module.exports = {
    router
};