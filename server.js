const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const app = express();
const axios = require('axios'); // This could be line 3

app.use(cors());
app.use(express.json());


app.post("/run-code", (req, res) => {
  const { language, code } = req.body;

  let command = "";
  switch (language) {
    case "python":
      command = `python -c "${code.replace(/"/g, '\\"')}"`;
      break;
    case "java":
      // Java code execution requires more setup
      command = `echo '${code}' > Main.java && javac Main.java && java Main`;
      break;
    case "cpp":
      command = `echo '${code}' > main.cpp && g++ main.cpp -o main && ./main`;
      break;
    case "c":
      command = `echo '${code}' > main.c && gcc main.c -o main && ./main`;
      break;
    case "golang":
      command = `echo '${code}' > main.go && go run main.go`;
      break;
    case "csharp":
      command = `echo '${code}' > Program.cs && mcs Program.cs && mono Program.exe`;
      break;
    default:
      res.status(400).json({ error: "Unsupported language" });
      return;
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ error: stderr });
    } else {
      res.json({ output: stdout });
    }
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
