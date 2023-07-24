const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');

const { generateFile } = require('./generateFile');
const { addJobToQueue } = require('./jobQueue');
const Job = require('./models/job');

mongoose.connect(
  'mongodb+srv://uttam9435:Uttam123@cluster0.1nt4lav.mongodb.net/test'
).then(() => {
  console.log('Successfully connected to MongoDB database!');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/status", async (req, res) => {
  const jobId = req.query.id;
  console.log("status requested", jobId);
  if (jobId == undefined) {
    return res.status(400).json({ success: false, error: "missing id query param" });
  }
  try {
    const newJob = await Job.findById(jobId);

    if (!newJob) { // Check if newJob is null (not found)
      return res.status(404).json({ success: false, error: "invalid job id" });
    }

    return res.status(200).json({success: true, newJob});
  } catch (err) {
    return res.status(400).json({ success: false, error: JSON.stringify(err) });
  }
});


app.post("/run", async (req, res) => {
  const { language = "cpp", code } = req.body;
  console.log(language, code.length);

  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Empty code body!" });
  }

  let newJob;
   
  try {
    // need to generate a c++ file with content from the request
    const filepath = await generateFile(language, code);
    // console.log(language, filepath);
    newJob = await new Job({ language, filepath }).save();
    // newJob = await Job.insertOne({language: language, filepath: filepath});
    const jobId = newJob["_id"];
    addJobToQueue(jobId);
    // console.log(newJob);

    res.status(201).json({success: true, jobId});

    // we need to run the file and send the response
    

  }catch(err){
    return res.status(500).json({success: false, err: JSON.stringify(err)});
  }
});

app.listen(5000, () => {
  console.log("Listening on port 5000!");
});
