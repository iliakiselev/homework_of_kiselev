const tokenEl = document.getElementById("apiToken");
const loadBtn = document.getElementById("loadBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const reviewEl = document.getElementById("review");
const resultEl = document.getElementById("result");
let reviews = [];
let currentReview = "";

async function loadReviews() {
    try {
        const response = await fetch("reviews_test.tsv");
        const tsvText = await response.text();
        Papa.parse(tsvText, {
            header: true,
            delimiter: "\t",
            complete: function (results) {
                reviews = results.data.map(r => r.text).filter(Boolean);
                if (reviews.length > 0) {
                    reviewEl.textContent = "Reviews loaded. Click 'Select Random Review'.";
                } else {
                    reviewEl.textContent = "No reviews found in file.";
                }
            },
            error: function () {
                reviewEl.textContent = "Error parsing TSV file.";
            }
        });
    } catch (err) {
        reviewEl.textContent = "Error loading reviews_test.tsv";
    }
}

function getRandomReview() {
    if (reviews.length === 0) {
        reviewEl.textContent = "Reviews not loaded yet.";
        return;
    }
    currentReview = reviews[Math.floor(Math.random() * reviews.length)];
    reviewEl.textContent = currentReview;
    resultEl.innerHTML = "";
}

async function analyzeReview() {
    if (!currentReview) {
        resultEl.textContent = "Please select a review first.";
        return;
    }
    resultEl.textContent = "Analyzing...";
    try {
        const headers = { "Content-Type": "application/json" };
        const token = tokenEl.value.trim();
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch("https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english", {
            method: "POST",
            headers,
            body: JSON.stringify({ inputs: currentReview })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("API raw response:", data);

        if (data.error) {
            throw new Error(data.error);
        }

        if (!Array.isArray(data) || !Array.isArray(data[0]) || !data[0][0]) {
            throw new Error("Unexpected API response format");
        }

        const result = data[0][0];
        let icon = '<i class="fa-solid fa-question"></i>';

        if (result.label === "POSITIVE" && result.score > 0.5) {
            icon = '<i class="fa-solid fa-thumbs-up"></i>';
        } else if (result.label === "NEGATIVE" && result.score > 0.5) {
            icon = '<i class="fa-solid fa-thumbs-down"></i>';
        }

        resultEl.innerHTML = `
            <p>Review: ${currentReview}</p>
            <p>Sentiment: ${icon}</p>
        `;
    } catch (err) {
        console.error("Analysis error:", err);
        resultEl.textContent = "Error analyzing sentiment. Check console for details.";
    }
}

loadBtn.addEventListener("click", getRandomReview);
analyzeBtn.addEventListener("click", analyzeReview);

loadReviews();
