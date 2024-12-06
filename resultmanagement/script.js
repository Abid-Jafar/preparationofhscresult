const API_KEY = "AIzaSyAUHa8cGjpHDEnfwsE-l5Vx2-k7fRsh7_A";
const SPREADSHEET_ID = "1mHdnccmmZcgWf-Fe0JVA79ojnAXgqxNErclYu6aVJ2A";

// Fetch data from a specific sheet
async function fetchData(sheetName) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch data from Google Sheets.");
    }
    const data = await response.json();
    return data.values;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    alert("Error fetching data. Please check your network or API configuration.");
    return [];
  }
}

// Login logic for a student
async function loginStudent(phone, password) {
  const students = await fetchData("students");
  if (!students || students.length === 0) {
    console.error("No student data found.");
    alert("Failed to load student data. Please try again later.");
    return null;
  }

  for (let i = 1; i < students.length; i++) {
    const [
      roll_id,
      name,
      college_name,
      batch,
      batch_time,
      ,
      studentPhone,
      studentPassword
    ] = students[i];

    if (studentPhone === phone && studentPassword === password) {
      return { roll_id, name, college_name, batch, batch_time };
    }
  }
  return null;
}

// Display welcome section with fetched student details
async function displayWelcomeSection(student) {
  const welcomeSection = document.getElementById("welcome-section");
  if (!student) return;

  welcomeSection.innerHTML = `
    <h2 style="color: #007BFF;">Welcome, ${student.name}!</h2>
    <p><strong>Roll ID:</strong> ${student.roll_id}</p>
    <p><strong>College:</strong> ${student.college_name}</p>
    <p><strong>HSC Batch:</strong> ${student.batch}</p>
    <p><strong>Batch Time:</strong> ${student.batch_time}</p>
    <hr>
    <h3 style="color: #4CAF50;">Your Results:</h3>
  `;
}

// Fetch and filter student-specific results
async function getStudentResults(roll_id) {
  const exams = await fetchData("exams");
  const results = [];
  if (!exams || exams.length === 0) {
    alert("No exam data available.");
    return results;
  }

  exams.forEach((exam) => {
    if (exam[0] === roll_id) {
      for (let i = 2; i < exam.length; i += 9) {
        if (exam[i]) {
          const examName = exam[i];
          const examDate = exam[i + 1];
          const mcqMarks = parseFloat(exam[i + 2]);
          const cqMarks = parseFloat(exam[i + 3]);
          const totalMarks = parseFloat(exam[i + 4]);
          const obtainedMarks = parseFloat(exam[i + 5]);
          const rank = exam[i + 6];
          const highestMarks = exam[i + 7];
          const percentage = exam[i + 8];

          results.push({
            examName,
            examDate,
            mcqMarks,
            cqMarks,
            totalMarks,
            obtainedMarks,
            rank,
            highestMarks,
            percentage
          });
        }
      }
    }
  });
  return results;
}

// Render results in a table format
function renderResults(student, results) {
  displayWelcomeSection(student);

  const tableBody = document.getElementById("results-table").getElementsByTagName('tbody')[0];
  tableBody.innerHTML = "";

  results.forEach((result, index) => {
    const rowClass = index % 2 === 0 ? "gray-row" : "";
    const row = `
      <tr class="${rowClass}">
        <td>${result.examName}</td>
        <td>${result.examDate}</td>
        <td>${result.mcqMarks}</td>
        <td>${result.cqMarks}</td>
        <td>${result.totalMarks}</td>
        <td>${result.obtainedMarks}</td>
        <td>${result.rank}</td>
        <td>${result.highestMarks}</td>
        <td>${result.percentage}%</td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });

  const performanceData = results.map(result => result.percentage);
  renderProgressChart(performanceData);
}

// Render a progress chart
function renderProgressChart(performanceData) {
  const ctx = document.getElementById("progress-chart").getContext("2d");
  if (window.progressChart) {
    window.progressChart.destroy();
  }
  window.progressChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Array.from({ length: performanceData.length }, (_, i) => `Exam ${i + 1}`),
      datasets: [
        {
          label: "Performance (%)",
          data: performanceData,
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          fill: true,
          borderWidth: 2,
          pointBackgroundColor: "#FF5722",
          pointBorderColor: "#FF5722",
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          grid: { color: "#e9e9e9" },
          ticks: { color: "#333" }
        },
        y: {
          grid: { color: "#e9e9e9" },
          ticks: { color: "#333" },
          max: 100,
          beginAtZero: true
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw.toFixed(2)}%`
          }
        }
      }
    }
  });
}

// Event listener for login
document.getElementById("login-btn").addEventListener("click", async () => {
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();

  // Validate input fields
  if (!phone || !password) {
    alert("Phone and password cannot be empty.");
    return;
  }

  const student = await loginStudent(phone, password);

  if (student) {
    // Hide the login section
    document.getElementById("login-section").classList.add("hidden");

    // Show the dashboard section
    document.getElementById("dashboard").classList.remove("hidden");

    // Fetch and display results
    const results = await getStudentResults(student.roll_id);
    renderResults(student, results);
  } else {
    alert("Invalid phone number or password!");
  }
});

// Logout event listener
document.getElementById("logout-btn").addEventListener("click", () => {
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("phone").value = "";
  document.getElementById("password").value = "";
  window.location.reload();
});
