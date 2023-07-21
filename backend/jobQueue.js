const Queue = require('bull');

const jobQueue = new Queue('job-Queue');
const NUM_WORKERS = 5;
const Job = require('./models/job');
const { executeCpp } = require('./executeCpp');
const { executePy } = require('./executePy');


jobQueue.process(NUM_WORKERS, async ({ data }) => {
    console.log(data);
    const { id: jobId } = data;
    const newJob = await Job.findById(jobId); // Corrected variable name
  
    if (!newJob) { // Check if newJob is null (not found)
      throw new Error("Job not found");
    }
  
    console.log("Fetched Job", newJob); // Corrected variable name
   try{

    Job["startedAt"] = new Date();
    if (newJob.language === "cpp") {
      output = await executeCpp(newJob.filepath);
    } else {
      output = await executePy(newJob.filepath);
    }

    newJob["completedAt"]= new Date(); 
    newJob["status"] = "success";
    newJob["output"] = output;
    await newJob.save();
    // return res.json({ filepath, output });
  } catch (err) {
    newJob["completedAt"] = new Date();
    newJob["status"] = "error";
    newJob["output"] = JSON.stringify(err);
    await newJob.save();
    // res.status(500).json({ err });
  }

    return true;
  });
  

  jobQueue.on('failed', (error) =>{
    console.log(error.data.id,"failed",error.failedReason);
  })

const addJobToQueue = async(jobId) => {
    await jobQueue.add({id: jobId}) ; 
};

module.exports = {
    addJobToQueue
}