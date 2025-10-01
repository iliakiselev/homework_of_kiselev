// app.js (исправленный для week1)
let reviews = [];

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
    .catch(err => console.error('Error loading TSV:', err));

const reviewTextEl = document.getElementById('reviewText');
const sentimentEl = document.getElementById('sentimentIcon');
const errorEl = document.getElementById('error');
const spinnerEl = document.getElementById('spinner');
const tokenEl = document.getElementById('apiToken');

// Можно задать токен по умолчанию прямо в app.js (если не хотите ставить в HTML)
tokenEl.value = tokenEl.value || "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";

document.getElementById('analyzeBtn').addEventListener('click', async () => {
    if (reviews.length === 0) {
        errorEl.textContent = 'Reviews not loaded yet.';
        return;
    }

    const reviewText = reviews[Math.floor(Math.random() * reviews.length)];
    reviewTextEl.textContent = reviewText;
    sentimentEl.className = '';
    errorEl.textContent = '';

    const headers = {'Content-Type': 'application/json'};
    const token = tokenEl.value.trim();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    spinnerEl.style.display = 'block';
    try {
        const response = await fetch(
            'https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english',
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({inputs: reviewText})
            }
        );

        if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);

        const result = await response.json();

        let sentiment = 'neutral';
        if (Array.isArray(result) && Array.isArray(result[0]) && result[0][0]) {
            const {label, score} = result[0][0];
            if (label === 'POSITIVE' && score > 0.5) sentiment = 'positive';
            else if (label === 'NEGATIVE' && score > 0.5) sentiment = 'negative';
        }

        if (sentiment === 'positive') sentimentEl.className = 'fa-solid fa-thumbs-up';
        else if (sentiment === 'negative') sentimentEl.className = 'fa-solid fa-thumbs-down';
        else sentimentEl.className = 'fa-solid fa-question';
    } catch (err) {
        console.error('Error analyzing sentiment:', err);
        errorEl.textContent = `Error analyzing sentiment: ${err.message}`;
    } finally {
        spinnerEl.style.display = 'none';
    }
});
