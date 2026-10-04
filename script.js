const resumeFileInput = document.getElementById("resumeFile");
const resumeTextArea = document.getElementById("resumeText");
const uploadStatus = document.getElementById("uploadStatus");

const skillBank = [
  "Python","Java","JavaScript","HTML","CSS","Tailwind","React","Node.js","Express",
  "MongoDB","MySQL","SQL","Git","GitHub","PHP","C","C++","FastAPI","REST API",
  "API","Machine Learning","Deep Learning","TensorFlow","PyTorch","OpenCV",
  "Docker","AWS","Azure","Power BI","Excel","Figma","Firebase","JWT"
];

const analyzeBtn = document.getElementById("analyzeBtn");


resumeFileInput.addEventListener("change", async function () {
  const file = this.files[0];

  if (!file) {
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB

  if (file.size > maxSize) {
    uploadStatus.textContent = "File is too large. Maximum size is 5 MB.";
    uploadStatus.className = "mt-3 text-sm font-semibold text-red-600";
    this.value = "";
    return;
  }

  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".txt") && !fileName.endsWith(".pdf")) {
    uploadStatus.textContent = "Please upload a PDF or TXT file.";
    uploadStatus.className = "mt-3 text-sm font-semibold text-red-600";
    this.value = "";
    return;
  }

  uploadStatus.textContent = "Reading resume...";
  uploadStatus.className = "mt-3 text-sm font-semibold text-amber-600";

  try {
    if (fileName.endsWith(".txt")) {
      const text = await file.text();

      resumeTextArea.value = text;

      uploadStatus.textContent =
        `✓ ${file.name} uploaded successfully`;

      uploadStatus.className =
        "mt-3 text-sm font-semibold text-green-600";
    }

    if (fileName.endsWith(".pdf")) {
      const pdfjsLib = await import(
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs"
      );

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
      }).promise;

      let extractedText = "";

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);

        const content = await page.getTextContent();

        const pageText = content.items
          .map(item => item.str)
          .join(" ");

        extractedText += pageText + "\n";
      }

      resumeTextArea.value = extractedText.trim();

      uploadStatus.textContent =
        `✓ ${file.name} uploaded and text extracted`;

      uploadStatus.className =
        "mt-3 text-sm font-semibold text-green-600";
    }

  } catch (error) {
    console.error(error);

    uploadStatus.textContent =
      "Unable to read this file. Please try another resume.";

    uploadStatus.className =
      "mt-3 text-sm font-semibold text-red-600";
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectSkills(text) {
  return skillBank.filter(skill => {
    const pattern = new RegExp(`(^|\\W)${escapeRegExp(skill)}(\\W|$)`, "i");
    return pattern.test(text);
  });
}

function calculateResumeScore(text) {
  let score = 0;
  const rules = [
    [/experience|internship|work/i, 15],
    [/education|degree|b\.?e\.?|b\.?tech/i, 15],
    [/project|projects/i, 15],
    [/skills|technical skills/i, 15],
    [/github|linkedin/i, 10],
    [/email|@/i, 10],
    [/summary|objective/i, 5],
    [/achievement|certification/i, 5],
    [/responsib|developed|implemented|created|designed/i, 10]
  ];
  rules.forEach(([regex, points]) => { if (regex.test(text)) score += points; });
  return Math.min(score, 100);
}

function calculateMatch(skills, jobText) {
  if (!jobText.trim()) return null;
  const jobSkills = detectSkills(jobText);
  if (!jobSkills.length) return Math.min(100, 35 + skills.length * 4);
  const matched = jobSkills.filter(skill => skills.includes(skill));
  return Math.round((matched.length / jobSkills.length) * 100);
}

function getSuggestions(text, skills, match) {
  const suggestions = [];
  if (text.length < 500) suggestions.push("Add more measurable detail to your experience and project descriptions.");
  if (!/summary|objective/i.test(text)) suggestions.push("Add a short career objective or professional summary tailored to the role.");
  if (!/github|linkedin/i.test(text)) suggestions.push("Add relevant LinkedIn and GitHub links so recruiters can verify your work.");
  if (!/experience|internship|work/i.test(text)) suggestions.push("Include internship, training, freelance, or practical experience where applicable.");
  if (!/project|projects/i.test(text)) suggestions.push("Add 2–3 relevant projects with technologies and measurable outcomes.");
  if (skills.length < 5) suggestions.push("Mention more relevant technical skills that you can confidently demonstrate.");
  if (match !== null && match < 60) suggestions.push("Tailor your resume keywords to the target job description.");
  if (!suggestions.length) suggestions.push("Good structure detected. Focus on quantified achievements and role-specific keywords.");
  return suggestions.slice(0, 5);
}

analyzeBtn.addEventListener("click", () => {
  const text = document.getElementById("resumeText").value.trim();
  const jobText = document.getElementById("jobText").value.trim();
  const status = document.getElementById("status");

  if (!text) {
    status.textContent = "Please paste your resume text first.";
    status.className = "mt-3 text-center text-sm font-semibold text-red-600";
    return;
  }

  status.textContent = "Analyzing...";
  const skills = detectSkills(text);
  const score = calculateResumeScore(text);
  const match = calculateMatch(skills, jobText);
  const suggestions = getSuggestions(text, skills, match);

  document.getElementById("resumeScore").textContent = `${score}%`;
  document.getElementById("matchScore").textContent = match === null ? "—" : `${match}%`;

  const badge = document.getElementById("scoreBadge");
  badge.textContent = score >= 75 ? "Strong resume" : score >= 55 ? "Needs improvement" : "Needs work";
  badge.className = "rounded-full px-3 py-1 text-sm font-bold " +
    (score >= 75 ? "bg-green-100 text-green-700" : score >= 55 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700");

  const skillsBox = document.getElementById("skills");
  skillsBox.innerHTML = skills.length
    ? skills.map(skill => `<span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-navy">${skill}</span>`).join("")
    : '<span class="text-sm text-slate-500">No common skills detected.</span>';

  document.getElementById("suggestions").innerHTML =
    suggestions.map(item => `<li class="rounded-xl bg-slate-50 p-3">• ${item}</li>`).join("");

  status.textContent = "Analysis complete.";
  status.className = "mt-3 text-center text-sm font-semibold text-green-600";
});
