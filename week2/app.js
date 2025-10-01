// app.js
let reviews = [];
let currentReview = "";
const tokenEl = document.getElementById("apiToken");
const reviewEl = document.getElementById("review");
const resultEl = document.getElementById("result");
const spinnerEl = document.getElementById("spinner");
const randomBtn = document.getElementById("randomBtn");
const sentimentBtn = document.getElementById("sentimentBtn");
const nounsBtn = document.getElementById("nounsBtn");

fetch("reviews_test.tsv")
  .then(res => res.text())
  .then(tsv => Papa.parse(tsv, { header:true, delimiter:"\t", complete: r => {
    reviews = r.data.map(x=>x.text).filter(Boolean);
    reviewEl.textContent = reviews.length ? "Reviews loaded." : "No reviews found.";
  }}))
  .catch(e=>reviewEl.textContent="Error loading TSV");

function showSpinner(show){ spinnerEl.style.display = show ? "block" : "none"; }

function getRandomReview(){
  if(!reviews.length){ reviewEl.textContent="Reviews not loaded yet."; return; }
  currentReview = reviews[Math.floor(Math.random()*reviews.length)];
  reviewEl.textContent = currentReview;
  resultEl.innerHTML = "";
}

async function callApi(prompt, text){
  showSpinner(true);
  resultEl.textContent = "";
  try {
    const headers = {'Content-Type':'application/json'};
    const token = tokenEl.value.trim();
    if(token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch("https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",{
      method:"POST", headers, body:JSON.stringify({inputs: prompt + text})
    });
    if(!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if(!data || !data[0]?.generated_text) throw new Error("Invalid API response");
    return data[0].generated_text.split("\n")[0].toLowerCase();
  } catch(e){ resultEl.textContent=e.message; return ""; }
  finally{ showSpinner(false); }
}

async function analyzeSentiment(){
  if(!currentReview){ resultEl.textContent="Select a review first."; return; }
  const resp = await callApi("Classify this review as positive, negative, or neutral: ", currentReview);
  let icon = '<i class="fa-solid fa-question"></i>';
  if(resp.includes("positive")) icon='<i class="fa-solid fa-thumbs-up"></i>';
  else if(resp.includes("negative")) icon='<i class="fa-solid fa-thumbs-down"></i>';
  resultEl.innerHTML = `<p>Sentiment: ${icon}</p>`;
}

async function countNouns(){
  if(!currentReview){ resultEl.textContent="Select a review first."; return; }
  const resp = await callApi("Count the nouns in this review and return only High (>15), Medium (6-15), or Low (<6): ", currentReview);
  let icon = "🟢";
  if(resp.includes("medium")) icon="🟡";
  else if(resp.includes("low")) icon="🔴";
  resultEl.innerHTML = `<p>Noun count level: ${icon}</p>`;
}

randomBtn.addEventListener("click", getRandomReview);
sentimentBtn.addEventListener("click", analyzeSentiment);
nounsBtn.addEventListener("click", countNouns);
