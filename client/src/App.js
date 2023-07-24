import axios from "axios";
import "./App.css";
import stubs from "./defaultStubs";
import React, { useState, useEffect } from "react";
import moment from "moment";

function App() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);

  useEffect(() => {
    setCode(stubs[language]);
  }, [language]);

  useEffect(() => {
    const defaultLang = localStorage.getItem("default-language") || "cpp";
    setLanguage(defaultLang);
  }, []);

  let pollInterval;

  const handleSubmit = async () => {
    const payload = {
      language,
      code,
    };
    try {
      setOutput("");
      setStatus(null);
      setJobId(null);
      setJobDetails(null);
      const { data } = await axios.post(process.env.REACT_APP_BASE_URL+"/run", payload);
      if (data.jobId) {
        setJobId(data.jobId);
        setStatus("Submitted.");

        // poll here
        pollInterval = setInterval(async () => {
          const { data: statusRes } = await axios.get(
            process.env.REACT_APP_BASE_URL+"/status",
            {
              params: {
                id: data.jobId,
              },
            }
          );
          const { success, newJob, error } = statusRes;
          console.log(statusRes);
          if (success) {
            const { status: jobStatus, output: jobOutput } = newJob;
            setStatus(jobStatus);
            setJobDetails(newJob);
            if (jobStatus === "pending") return;
            setOutput(jobOutput);
            clearInterval(pollInterval);
          } else {
            console.error(error);
            setOutput(error);
            setStatus("Bad request");
            clearInterval(pollInterval);
          }
        }, 1000);
      } else {
        setOutput("Retry again.");
      }
    } catch ({ response }) {
      if (response) {
        const errMsg = response.data.err.stderr;
        setOutput(errMsg);
      } else {
        setOutput("Please retry submitting.");
      }
    }
  };

  const setDefaultLanguage = () => {
    localStorage.setItem("default-language", language);
    console.log(`${language} set as default!`);
  };

  const renderTimeDetails = () => {
    if (!jobDetails) {
      return "";
    }
    let { submittedAt, startedAt, completedAt } = jobDetails;
    let result = "";
    submittedAt = moment(submittedAt).toString();
    result += `Job Submitted At: ${submittedAt}  `;
    if (!startedAt || !completedAt) return result;
    const start = moment(startedAt);
    const end = moment(completedAt);
    const diff = end.diff(start, "seconds", true);
    result += `Execution Time: ${diff}s`;
    return result;
  };

  return (
    <div className="App">
      <h1 className="tagline">Online Code Compiler</h1>
      <div>
        <label className="lang-label"> Choose Language:</label>
        <select
          value={language}
          onChange={(e) => {
            const shouldSwitch = window.confirm(
              "Are you sure you want to change language? WARNING: Your current code will be lost."
            );
            if (shouldSwitch) {
              setLanguage(e.target.value);
            }
          }}
        >
          <option value="cpp">C++</option>
          <option value="py">Python</option>
        </select>
        <button className="button-33" onClick={setDefaultLanguage}>Set Default</button>

      </div >

      <br />
      {/* <Editor /> */}
      <div className="grid-container">
        <div><textarea
          className="textBox"
          rows="23"
          cols="100"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
          }}
        ></textarea>
        </div>
        <div>
        <div className="code-status">
          <p>Code Execution : {status}</p>
          <p>{jobId ? `Job ID: ${jobId}` : ""}</p>
          <p>{renderTimeDetails()}</p>
          <p>Output :-</p>
          <p>{output}</p>
        </div>
        </div>
      </div>
      <button className="button-85" onClick={handleSubmit}>Submit</button>

    </div>
  );
}

export default App;