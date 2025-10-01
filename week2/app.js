// app.js
let reviews = [];
let currentReview = '';

fetch('reviews_test.tsv')
    .then(response => {
        if (!response.ok) throw new Error(`TSV file not found: ${response.status}`);
        return response.text();
    })
    .then(tsv => {
        Papa.parse(tsv, {
            header: true,
            delimiter: '\t',
            complete: function(results) {
                reviews = results.data.map(r => r.text).filter(Boolean);
            }
        });
    })
    .catch(err => console.error(err));

const reviewTextEl = document.getElementById('reviewText');
const sentimentEl = document.getElementById('sentimentIcon');
const nounEl = document.getElementById('nounIcon');
const errorEl = document.getElementById('error');
const spinnerEl = document.getElementById('spinner');
const tokenEl = document.getElementById('apiToken');

function showSpinner(show) { spinnerEl.style.display = show ? 'block' : 'none'; }

async function callApi(prompt, text) {
    showSpinner(true);
    errorEl.textContent = '';
    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = tokenEl.value.trim();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('https://api-inference.huggingface.co/models/tiiuae/Falcon3-7B-Base', {
            method: 'POST',
            headers,
            body: JSON.stringify({ inputs: prompt + text })
        });
        if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        // модель может возвращать result либо generated_text или другой ключ — нужно проверить структуру ответа
        // допустим, она возвращает { generated_text: "…" }
        if (!data || typeof data.generated_text !== 'string') {
            throw new Error('Invalid response from API');
        }
        showSpinner(false);
        return data.generated_text.split('\n')[0].toLowerCase();
    } catch (e) {
        showSpinner(false);
        errorEl.textContent = e.message;
        return '';
    }
}



document.getElementById('randomBtn').addEventListener('click', () => {
    if(reviews.length===0){errorEl.textContent='Reviews not loaded yet.'; return;}
    currentReview = reviews[Math.floor(Math.random()*reviews.length)];
    reviewTextEl.textContent = currentReview;
    sentimentEl.textContent = '';
    nounEl.textContent = '';
    errorEl.textContent = '';
});

document.getElementById('sentimentBtn').addEventListener('click', async () => {
    if(!currentReview){errorEl.textContent='Select a review first.'; return;}
    const res = await callApi('Classify this review as positive, negative, or neutral: ', currentReview);
    if(!res) return;
    if(res.includes('positive')) sentimentEl.innerHTML='👍';
    else if(res.includes('negative')) sentimentEl.innerHTML='👎';
    else sentimentEl.innerHTML='❓';
});

document.getElementById('nounBtn').addEventListener('click', async () => {
    if(!currentReview){errorEl.textContent='Select a review first.'; return;}
    const res = await callApi('Count the nouns in this review and return only High (>15), Medium (6-15), or Low (<6): ', currentReview);
    if(!res) return;
    if(res.includes('high')) nounEl.innerHTML='🟢';
    else if(res.includes('medium')) nounEl.innerHTML='🟡';
    else if(res.includes('low')) nounEl.innerHTML='🔴';
});
