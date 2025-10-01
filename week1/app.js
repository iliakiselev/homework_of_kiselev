// app.js
let reviews = [];

fetch('reviews_test.tsv')
    .then(response => response.text())
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

document.getElementById('analyzeBtn').addEventListener('click', async () => {
    if (reviews.length === 0) {
        alert('Reviews not loaded yet.');
        return;
    }

    const reviewText = reviews[Math.floor(Math.random() * reviews.length)];
    document.getElementById('reviewText').textContent = reviewText;
    document.getElementById('sentimentIcon').className = '';

    const token = document.getElementById('apiToken').value.trim();
    const headers = {'Content-Type': 'application/json'};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({inputs: reviewText})
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const result = await response.json();
        let sentiment = 'neutral';

        if (Array.isArray(result) && Array.isArray(result[0]) && result[0][0]) {
            const {label, score} = result[0][0];
            if (label === 'POSITIVE' && score > 0.5) sentiment = 'positive';
            else if (label === 'NEGATIVE' && score > 0.5) sentiment = 'negative';
        }

        const icon = document.getElementById('sentimentIcon');
        if (sentiment === 'positive') icon.className = 'fa-solid fa-thumbs-up';
        else if (sentiment === 'negative') icon.className = 'fa-solid fa-thumbs-down';
        else icon.className = 'fa-solid fa-question';
    } catch (err) {
        console.error('Error analyzing sentiment:', err);
        alert('Error analyzing sentiment. Check console for details.');
    }
});
