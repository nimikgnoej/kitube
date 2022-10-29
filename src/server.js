import express from "express";

const PORT = 4000;
const app = express();


const logger = (req, res, next) => {
    console.log(`${req.method} : ${req.url}`);
    next();
}


app.use(logger);

app.get("/", (req, res) => {
    return res.send("I love you..");
})

const handleListening = () => console.log(`Server listening on port http://localhost:${PORT}!`)
app.listen(PORT, handleListening);
